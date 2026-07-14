import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

// Load .env file manually
const envPath = path.join(rootDir, ".env");
const envVars = { ...process.env };

if (fs.existsSync(envPath)) {
  console.log("Loading environment variables from .env...");
  const envContent = fs.readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const firstEq = trimmed.indexOf("=");
    if (firstEq === -1) continue;
    const key = trimmed.slice(0, firstEq).trim();
    let val = trimmed.slice(firstEq + 1).trim();
    // Strip quotes if present
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    envVars[key] = val;
  }
} else {
  console.warn("No .env file found at root. Using system environment variables.");
}

// Default variables for dev environment
envVars.NODE_ENV = "development";
if (!envVars.PORT) envVars.PORT = "5001"; // Backend Port
const backendPort = envVars.PORT;

const frontendEnv = {
  ...envVars,
  PORT: "5173", // Frontend Port
  API_PORT: backendPort,
  BASE_PATH: "/",
};

console.log(`Starting backend on http://localhost:${backendPort}...`);
console.log(`Starting frontend on http://localhost:5173 (proxying /api to port ${backendPort})...`);

// Spawn backend
const backend = spawn("pnpm", ["--filter", "@workspace/api-server", "run", "dev"], {
  cwd: rootDir,
  env: envVars,
  stdio: "pipe",
});

// Spawn frontend
const frontend = spawn("pnpm", ["--filter", "@workspace/onelife-finance", "run", "dev"], {
  cwd: rootDir,
  env: frontendEnv,
  stdio: "pipe",
});

function logPrefixed(stream, prefix, colorCode) {
  stream.on("data", (data) => {
    const lines = data.toString().split("\n");
    for (const line of lines) {
      if (line.trim() === "") continue;
      console.log(`\x1b[${colorCode}m[${prefix}]\x1b[0m ${line}`);
    }
  });
}

// Prefixes: 36 = Cyan (Backend), 35 = Magenta (Frontend)
logPrefixed(backend.stdout, "Backend", "36");
logPrefixed(backend.stderr, "Backend", "36");

logPrefixed(frontend.stdout, "Frontend", "35");
logPrefixed(frontend.stderr, "Frontend", "35");

// Handle exit
let exitScheduled = false;
function exitAll(code) {
  if (exitScheduled) return;
  exitScheduled = true;
  console.log("Shutting down processes...");
  backend.kill();
  frontend.kill();
  process.exit(code);
}

backend.on("close", (code) => {
  console.log(`Backend process exited with code ${code}`);
  exitAll(code);
});

frontend.on("close", (code) => {
  console.log(`Frontend process exited with code ${code}`);
  exitAll(code);
});

process.on("SIGINT", () => exitAll(0));
process.on("SIGTERM", () => exitAll(0));
