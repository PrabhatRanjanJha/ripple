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

async function main() {
  await part03();

  if (failures.length > 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Smoke test crashed:", error);
  process.exit(1);
});
