import process from "node:process";

const baseUrl = process.env.SMOKE_URL || "http://localhost:5055";
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

function readSetCookie(response) {
  const rawCookie = response.headers.get("set-cookie");

  if (!rawCookie) {
    return;
  }

  const [cookiePair] = rawCookie.split(";");
  const [name, ...valueParts] = cookiePair.split("=");

  if (name && valueParts.length > 0) {
    cookieJar.set(name, valueParts.join("="));
  }
}

async function api(path, options = {}) {
  const headers = new Headers(options.headers || {});
  const cookies = Array.from(cookieJar.entries())
    .map(([name, value]) => `${name}=${value}`)
    .join("; ");

  if (cookies) {
    headers.set("Cookie", cookies);
  }

  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers,
  });

  readSetCookie(response);
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
      Origin: "http://localhost:5173",
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
      registerResponse.headers.get("access-control-allow-origin") === "http://localhost:5173" &&
      registerResponse.headers.get("access-control-allow-credentials") === "true",
  );

  const loginResponse = await api("/users/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: "http://localhost:5173",
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
      loginResponse.headers.get("access-control-allow-origin") === "http://localhost:5173" &&
      loginResponse.headers.get("access-control-allow-credentials") === "true",
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

  if (failures.length > 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Smoke test crashed:", error);
  process.exit(1);
});
