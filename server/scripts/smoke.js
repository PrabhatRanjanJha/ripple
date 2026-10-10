import process from "node:process";

const baseUrl = process.env.SMOKE_URL || "http://localhost:5055";
const clientOrigin = process.env.CLIENT_URL || "http://localhost:5173";
const cookieJar = new Map();
const failures = [];

function check(name, condition) {
  if (condition) {
    console.log(`PASS ${name}`);
    return;
  }

  console.log(`FAIL ${name}`);
  failures.push(name);
}

function readSetCookie(response, jar) {
  const rawCookie = response.headers.get("set-cookie");

  if (!rawCookie) {
    return;
  }

  const [cookiePair] = rawCookie.split(";");
  const [name, ...valueParts] = cookiePair.split("=");

  if (name && valueParts.length > 0) {
    jar.set(name, valueParts.join("="));
  }
}

async function api(path, options = {}, jar = cookieJar) {
  const headers = new Headers(options.headers || {});
  const cookies = Array.from(jar.entries())
    .map(([name, value]) => `${name}=${value}`)
    .join("; ");

  if (cookies) {
    headers.set("Cookie", cookies);
  }

  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers,
  });

  readSetCookie(response, jar);
  return response;
}

async function part03() {
  const healthResponse = await api("/health");
  const healthJson = await healthResponse.json();
  check(
    "part03 health endpoint responds with success",
    healthResponse.status === 200 && healthJson.success === true && healthJson.message === "ok",
  );

  const missingResponse = await api("/definitely-missing-route");
  const missingJson = await missingResponse.json();
  check(
    "part03 missing routes return a JSON 404",
    missingResponse.status === 404 && missingJson.success === false && typeof missingJson.message === "string",
  );
}

async function part04() {
  const email = `smoke_${Date.now()}_a@example.com`;
  const password = "p@ssword123";

  const registerResponse = await api("/users/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fullName: "Smoke User",
      email,
      password,
      phone: "1234567890",
    }),
  });
  const registerJson = await registerResponse.json();
  check(
    "part04 register returns 201 and hides password",
    registerResponse.status === 201 &&
      registerJson.success === true &&
      registerJson.user &&
      registerJson.user.email === email &&
      !Object.prototype.hasOwnProperty.call(registerJson.user, "password"),
  );

  const missingFieldResponse = await api("/users/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fullName: "Missing fields",
      email: "missing@example.com",
      phone: "1234567890",
    }),
  });
  const missingFieldJson = await missingFieldResponse.json();
  check(
    "part04 register validates required fields",
    missingFieldResponse.status === 400 && missingFieldJson.success === false,
  );

  const shortPasswordResponse = await api("/users/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fullName: "Short Password",
      email: "short@example.com",
      password: "12345",
      phone: "1234567890",
    }),
  });
  const shortPasswordJson = await shortPasswordResponse.json();
  check(
    "part04 register rejects short passwords",
    shortPasswordResponse.status === 400 && shortPasswordJson.success === false,
  );

  const duplicateResponse = await api("/users/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fullName: "Smoke User",
      email,
      password,
      phone: "0999999999",
    }),
  });
  const duplicateJson = await duplicateResponse.json();
  check(
    "part04 register rejects duplicates",
    duplicateResponse.status === 409 && duplicateJson.success === false,
  );

  const loginResponse = await api("/users/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const loginJson = await loginResponse.json();
  const setCookie = loginResponse.headers.get("set-cookie") || "";
  check(
    "part04 login returns user and sets HttpOnly token cookie",
    loginResponse.status === 200 &&
      loginJson.success === true &&
      loginJson.user &&
      loginJson.user.email === email &&
      setCookie.includes("token=") &&
      setCookie.toLowerCase().includes("httponly"),
  );

  const wrongPasswordResponse = await api("/users/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: "wrong-password" }),
  });
  const wrongPasswordJson = await wrongPasswordResponse.json();

  const missingUserResponse = await api("/users/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "missing-user@example.com", password }),
  });
  const missingUserJson = await missingUserResponse.json();
  check(
    "part04 login rejects missing and wrong credentials with the same message",
    wrongPasswordResponse.status === 401 &&
      wrongPasswordJson.success === false &&
      wrongPasswordJson.message === "Invalid credentials" &&
      missingUserResponse.status === 401 &&
      missingUserJson.success === false &&
      missingUserJson.message === "Invalid credentials",
  );
}

async function part05() {
  cookieJar.clear();

  const meWithoutAuthResponse = await api("/users/me");
  const meWithoutAuthJson = await meWithoutAuthResponse.json();
  check(
    "part05 me without cookie is unauthorized",
    meWithoutAuthResponse.status === 401 &&
      meWithoutAuthJson.success === false &&
      meWithoutAuthJson.message === "Unauthorized",
  );

  const email = `smoke_${Date.now()}_b@example.com`;
  const password = "p@ssword456";

  const registerResponse = await api("/users/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fullName: "Protected Smoke User",
      email,
      password,
      phone: "9876543210",
    }),
  });
  const registerJson = await registerResponse.json();
  check(
    "part05 register for protected user works",
    registerResponse.status === 201 &&
      registerJson.success === true &&
      registerJson.user &&
      registerJson.user.email === email,
  );

  const loginResponse = await api("/users/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const loginJson = await loginResponse.json();
  check(
    "part05 login for protected user works",
    loginResponse.status === 200 &&
      loginJson.success === true &&
      loginJson.user &&
      !Object.prototype.hasOwnProperty.call(loginJson.user, "password"),
  );

  const meResponse = await api("/users/me");
  const meJson = await meResponse.json();
  check(
    "part05 me returns the logged-in user without password",
    meResponse.status === 200 &&
      meJson.success === true &&
      meJson.user &&
      meJson.user.email === email &&
      !Object.prototype.hasOwnProperty.call(meJson.user, "password"),
  );

  const logoutResponse = await api("/users/logout", {
    method: "POST",
  });
  const logoutJson = await logoutResponse.json();
  const clearCookie = logoutResponse.headers.get("set-cookie") || "";
  const cookieLower = clearCookie.toLowerCase();
  check(
    "part05 logout clears the token cookie",
    logoutResponse.status === 200 &&
      logoutJson.success === true &&
      (cookieLower.includes("token=") || cookieLower.includes("expires=")),
  );

  const meAfterLogoutResponse = await api("/users/me");
  const meAfterLogoutJson = await meAfterLogoutResponse.json();
  check(
    "part05 me fails after logout",
    meAfterLogoutResponse.status === 401 &&
      meAfterLogoutJson.success === false &&
      meAfterLogoutJson.message === "Unauthorized",
  );
}

async function part08() {
  const email = `smoke_${Date.now()}_c@example.com`;
  const password = "p@ssword789";

  const registerResponse = await api("/users/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: clientOrigin,
    },
    body: JSON.stringify({
      fullName: "CORS Smoke User",
      email,
      password,
      phone: "5555555555",
    }),
  });
  const registerJson = await registerResponse.json();
  check(
    "part08 register allows the client origin and credentials",
    registerResponse.status === 201 &&
      registerJson.success === true &&
      registerResponse.headers.get("access-control-allow-origin") === clientOrigin &&
      registerResponse.headers.get("access-control-allow-credentials") === "true",
  );

  const loginResponse = await api("/users/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: clientOrigin,
    },
    body: JSON.stringify({ email, password }),
  });
  const loginJson = await loginResponse.json();
  const setCookie = loginResponse.headers.get("set-cookie") || "";
  check(
    "part08 login keeps the session cookie on the frontend origin",
    loginResponse.status === 200 &&
      loginJson.success === true &&
      setCookie.toLowerCase().includes("httponly") &&
      loginResponse.headers.get("access-control-allow-origin") === clientOrigin &&
      loginResponse.headers.get("access-control-allow-credentials") === "true",
  );
}

async function part09() {
  cookieJar.clear();
  const ownerEmail = `smoke_${Date.now()}_project_owner@example.com`;
  const password = "p@ssword123";

  const ownerRegister = await api("/users/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fullName: "Project Owner",
      email: ownerEmail,
      password,
      phone: "1234567890",
    }),
  });
  const ownerRegistered = await ownerRegister.json();
  const ownerLogin = await api("/users/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: ownerEmail, password }),
  });
  const ownerLoggedIn = await ownerLogin.json();
  check(
    "part09 owner can register and log in",
    ownerRegister.status === 201 &&
      ownerRegistered.success === true &&
      ownerLogin.status === 200 &&
      ownerLoggedIn.success === true,
  );

  const createResponse = await api("/projects", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: "Smoke Project",
      description: "Created by the project smoke checks",
      startDate: "2026-11-01",
      deadline: "2026-12-01",
    }),
  });
  const createJson = await createResponse.json();
  const projectId = createJson.project?._id;
  check(
    "part09 create project returns the project",
    createResponse.status === 201 &&
      createJson.success === true &&
      createJson.project?.title === "Smoke Project" &&
      createJson.project?.owner === ownerLoggedIn.user?._id,
  );

  const listResponse = await api("/projects");
  const listJson = await listResponse.json();
  check(
    "part09 list projects returns the owner's projects",
    listResponse.status === 200 &&
      listJson.success === true &&
      listJson.projects.some((project) => project._id === projectId),
  );

  const getResponse = await api(`/projects/${projectId}`);
  const getJson = await getResponse.json();
  check(
    "part09 get project returns the requested project",
    getResponse.status === 200 &&
      getJson.success === true &&
      getJson.project?._id === projectId,
  );

  const patchResponse = await api(`/projects/${projectId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: "Updated Smoke Project" }),
  });
  const patchJson = await patchResponse.json();
  check(
    "part09 patch project updates supplied fields",
    patchResponse.status === 200 &&
      patchJson.success === true &&
      patchJson.project?.title === "Updated Smoke Project" &&
      patchJson.project?.startDate === "2026-11-01T00:00:00.000Z",
  );

  const invalidDeadlineResponse = await api("/projects", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: "Invalid Dates", startDate: "2026-11-02", deadline: "2026-11-01" }),
  });
  const invalidDeadlineJson = await invalidDeadlineResponse.json();
  check(
    "part09 rejects deadlines before the start date",
    invalidDeadlineResponse.status === 400 &&
      invalidDeadlineJson.success === false,
  );

  const otherJar = new Map();
  const otherEmail = `smoke_${Date.now()}_project_other@example.com`;
  const otherRegister = await api(
    "/users/register",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: "Other User",
        email: otherEmail,
        password,
        phone: "0987654321",
      }),
    },
    otherJar,
  );
  const otherLogin = await api(
    "/users/login",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: otherEmail, password }),
    },
    otherJar,
  );
  const foreignResponse = await api(`/projects/${projectId}`, {}, otherJar);
  const foreignJson = await foreignResponse.json();
  check(
    "part09 another user cannot access the project",
    otherRegister.status === 201 &&
      otherLogin.status === 200 &&
      foreignResponse.status === 404 &&
      foreignJson.success === false,
  );

  const foreignListResponse = await api("/projects", {}, otherJar);
  const foreignListJson = await foreignListResponse.json();
  check(
    "part09 project list is limited to the logged-in user",
    foreignListResponse.status === 200 &&
      foreignListJson.success === true &&
      !foreignListJson.projects.some((project) => project._id === projectId),
  );

  const deleteResponse = await api(`/projects/${projectId}`, { method: "DELETE" });
  const deleteJson = await deleteResponse.json();
  const deletedGet = await api(`/projects/${projectId}`);
  check(
    "part09 delete project removes it",
    deleteResponse.status === 200 &&
      deleteJson.success === true &&
      deletedGet.status === 404,
  );
}

async function part11() {
  cookieJar.clear();
  const password = "p@ssword123";
  const ownerEmail = `smoke_${Date.now()}_task_owner@example.com`;
  const ownerRegister = await api("/users/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fullName: "Task Owner",
      email: ownerEmail,
      password,
      phone: "1234567890",
    }),
  });
  const ownerLogin = await api("/users/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: ownerEmail, password }),
  });

  const projectResponse = await api("/projects", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: "Task Smoke Project", startDate: "2026-11-01" }),
  });
  const projectJson = await projectResponse.json();
  const projectId = projectJson.project?._id;
  check(
    "part11 task owner can create a project",
    ownerRegister.status === 201 && ownerLogin.status === 200 && projectResponse.status === 201,
  );

  const taskResponse = await api(`/projects/${projectId}/tasks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: "First task",
      durationDays: 4,
      status: "doing",
      notes: "Initial notes",
      dependsOn: ["ignored-for-now"],
    }),
  });
  const taskJson = await taskResponse.json();
  const taskId = taskJson.task?._id;
  check(
    "part11 create task returns task with dependencies ignored",
    taskResponse.status === 201 &&
      taskJson.success === true &&
      taskJson.task?.project === projectId &&
      taskJson.task?.durationDays === 4 &&
      taskJson.task?.status === "doing" &&
      Array.isArray(taskJson.task?.dependsOn) &&
      taskJson.task.dependsOn.length === 0,
  );

  const invalidDurations = [0, 366, 1.5];
  const invalidResponses = await Promise.all(
    invalidDurations.map((durationDays) =>
      api(`/projects/${projectId}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Invalid duration", durationDays }),
      }),
    ),
  );
  const invalidJson = await Promise.all(invalidResponses.map((response) => response.json()));
  check(
    "part11 rejects durations outside the integer range 1 to 365",
    invalidResponses.every((response) => response.status === 400) &&
      invalidJson.every((body) => body.success === false),
  );

  const secondTaskResponse = await api(`/projects/${projectId}/tasks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: "Second task", durationDays: 2 }),
  });
  const secondTaskJson = await secondTaskResponse.json();
  const listResponse = await api(`/projects/${projectId}/tasks`);
  const listJson = await listResponse.json();
  check(
    "part11 list tasks returns tasks in creation order",
    listResponse.status === 200 &&
      listJson.success === true &&
      listJson.tasks.length === 2 &&
      listJson.tasks[0]._id === taskId &&
      listJson.tasks[1]._id === secondTaskJson.task?._id,
  );

  const projectsResponse = await api("/projects");
  const projectsJson = await projectsResponse.json();
  check(
    "part11 project list includes task counts",
    projectsResponse.status === 200 &&
      projectsJson.projects.find((project) => project._id === projectId)?.taskCount === 2,
  );

  const patchResponse = await api(`/tasks/${taskId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: "Updated first task", durationDays: 5, status: "done" }),
  });
  const patchJson = await patchResponse.json();
  check(
    "part11 patch task updates supplied fields",
    patchResponse.status === 200 &&
      patchJson.success === true &&
      patchJson.task?.title === "Updated first task" &&
      patchJson.task?.durationDays === 5 &&
      patchJson.task?.status === "done",
  );

  const foreignJar = new Map();
  const foreignEmail = `smoke_${Date.now()}_task_other@example.com`;
  const foreignRegister = await api(
    "/users/register",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: "Other Task User",
        email: foreignEmail,
        password,
        phone: "0987654321",
      }),
    },
    foreignJar,
  );
  await api(
    "/users/login",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: foreignEmail, password }),
    },
    foreignJar,
  );
  const foreignProjectTasks = await api(`/projects/${projectId}/tasks`, {}, foreignJar);
  const foreignProjectJson = await foreignProjectTasks.json();
  check(
    "part11 another user cannot access a project's tasks",
    foreignRegister.status === 201 &&
      foreignProjectTasks.status === 404 &&
      foreignProjectJson.success === false,
  );

  const deleteResponse = await api(`/tasks/${secondTaskJson.task?._id}`, { method: "DELETE" });
  const deletedListResponse = await api(`/projects/${projectId}/tasks`);
  const deletedListJson = await deletedListResponse.json();
  check(
    "part11 delete task removes it from the project task list",
    deleteResponse.status === 200 &&
      deletedListResponse.status === 200 &&
      deletedListJson.tasks.length === 1 &&
      deletedListJson.tasks[0]._id === taskId,
  );

  const cascadeProjectResponse = await api("/projects", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: "Cascade Smoke Project", startDate: "2026-11-01" }),
  });
  const cascadeProjectJson = await cascadeProjectResponse.json();
  const cascadeProjectId = cascadeProjectJson.project?._id;
  const cascadeTaskResponse = await api(`/projects/${cascadeProjectId}/tasks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: "Cascade task", durationDays: 1 }),
  });
  const cascadeTaskJson = await cascadeTaskResponse.json();
  const cascadeDeleteResponse = await api(`/projects/${cascadeProjectId}`, { method: "DELETE" });
  const cascadeTaskResponseAfterDelete = await api(`/tasks/${cascadeTaskJson.task?._id}`, {
    method: "DELETE",
  });
  check(
    "part11 deleting a project removes its tasks",
    cascadeTaskResponse.status === 201 &&
      cascadeDeleteResponse.status === 200 &&
      cascadeTaskResponseAfterDelete.status === 404,
  );
}

async function part07() {
  cookieJar.clear();

  const email = `smoke_${Date.now()}_c@example.com`;
  const password = "p@ssword789";

  const registerResponse = await api("/users/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fullName: "Home Smoke User",
      email,
      password,
      phone: "5551234567",
    }),
  });
  const registerJson = await registerResponse.json();
  check(
    "part07 register creates a user for the dashboard flow",
    registerResponse.status === 201 &&
      registerJson.success === true &&
      registerJson.user &&
      registerJson.user.email === email,
  );

  const loginResponse = await api("/users/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const loginJson = await loginResponse.json();
  check(
    "part07 dashboard login succeeds for an authenticated user",
    loginResponse.status === 200 &&
      loginJson.success === true &&
      loginJson.user &&
      loginJson.user.email === email,
  );

  const meResponse = await api("/users/me");
  const meJson = await meResponse.json();
  check(
    "part07 protected home profile is loaded from the server",
    meResponse.status === 200 &&
      meJson.success === true &&
      meJson.user &&
      meJson.user.email === email &&
      !Object.prototype.hasOwnProperty.call(meJson.user, "password"),
  );

  const logoutResponse = await api("/users/logout", {
    method: "POST",
  });
  const logoutJson = await logoutResponse.json();
  check(
    "part07 logout ends the authenticated profile session",
    logoutResponse.status === 200 && logoutJson.success === true,
  );
}

async function main() {
  await part03();
  await part04();
  await part05();
  await part07();
  await part08();
  await part09();
  await part11();

  if (failures.length > 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Smoke test crashed:", error);
  process.exit(1);
});
