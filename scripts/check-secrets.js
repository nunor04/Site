// Blocks commits that contain API keys, tokens or secret files. Run by .githooks/pre-commit.
const { execSync } = require("child_process");

const BAD_FILES = /(^|\/)(\.env(\..*)?|.*\.(pem|p12|pfx|key)|id_rsa.*|credentials(\..*)?|secrets?\..*|cookies?\.(json|txt|sqlite)|settings\.local\.json)$/i;
const PATTERNS = [
  [/(api[_-]?key|secret|token|passw(or)?d|auth(orization)?)["']?\s*[:=]\s*["'][^"'\s]{8,}["']/i, "key/secret/password assignment"],
  [/bearer\s+[A-Za-z0-9._-]{20,}/i, "bearer token"],
  [/-----BEGIN [A-Z ]*PRIVATE KEY-----/, "private key"],
  [/AKIA[0-9A-Z]{16}/, "AWS access key"],
  [/gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{30,}/, "GitHub token"],
  [/sk-[A-Za-z0-9_-]{20,}/, "API key (sk-...)"],
  [/AIza[0-9A-Za-z_-]{30,}/, "Google API key"],
  [/xox[baprs]-[A-Za-z0-9-]{10,}/, "Slack token"],
  [/\b(sessionid|csrftoken|ds_user_id)\s*[:=]\s*\S{8,}/i, "Instagram session cookie"],
];

const run = (c) => execSync(c, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
const problems = [];

for (const f of run("git diff --cached --name-only --diff-filter=ACMR").split("\n").filter(Boolean)) {
  if (BAD_FILES.test(f)) problems.push(`${f}: secret-looking file name`);
}
let file = "";
for (const line of run("git diff --cached -U0 --no-color").split("\n")) {
  if (line.startsWith("+++ b/")) file = line.slice(6);
  else if (line.startsWith("+") && !line.startsWith("+++") && !/package-lock\.json$/.test(file)) {
    for (const [re, name] of PATTERNS) if (re.test(line)) problems.push(`${file}: ${name}`);
  }
}

if (problems.length) {
  console.error("\nCommit blocked: possible secret(s) found:\n  " + [...new Set(problems)].join("\n  "));
  console.error("\nKeep keys in a .env file (git-ignored). If this is a false alarm, review it first.\n");
  process.exit(1);
}
