const { spawnSync } = require("child_process");
const fs = require("fs");
const env = fs.readFileSync(".env", "utf8");
const vars = {};
for (const line of env.split(/\r?\n/)) {
  if (!line.trim() || line.trim().startsWith("#")) continue;
  const idx = line.indexOf("=");
  if (idx < 0) continue;
  const key = line.slice(0, idx).trim();
  let val = line.slice(idx + 1).trim();
  if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) val = val.slice(1, -1);
  vars[key] = val;
}
for (const [key, val] of Object.entries(vars)) {
  for (const envName of ["production", "preview", "development"]) {
    const r = spawnSync("vercel", ["env", "add", key, envName, "--yes"], {
      input: val + "\n",
      shell: true,
      encoding: "utf8",
    });
    if (r.status === 0 || /already exists/i.test(r.stdout || "")) {
      console.log(`ok ${key} -> ${envName}`);
    } else {
      console.log(`FAILED ${key} -> ${envName}:`, (r.stdout || r.stderr || "").trim().split("\n").pop());
    }
  }
}
console.log("env keys pushed:", Object.keys(vars).join(", "));
