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

async function main() {
  await part03();
  await part04();

  if (failures.length > 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Smoke test crashed:", error);
  process.exit(1);
});
