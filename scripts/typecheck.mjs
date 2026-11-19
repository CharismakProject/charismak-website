// Type-check the website's own code. Errors inside third-party TypeScript source under
// node_modules (Pascal's editor ships raw .tsx with looser settings) are reported as a count
// but do not fail the build; any error in our code does.
import { spawnSync } from "node:child_process";

const result = spawnSync("npx", ["tsc", "--noEmit", "-p", "."], {
  encoding: "utf8",
  env: { ...process.env, NODE_OPTIONS: `${process.env.NODE_OPTIONS ?? ""} --max-old-space-size=6144`.trim() },
  maxBuffer: 64 * 1024 * 1024,
});
const lines = `${result.stdout}${result.stderr}`.split("\n");
const errorStarts = lines.map((line, i) => (/^\S.*\(\d+,\d+\): error TS\d+/.test(line) ? i : -1)).filter((i) => i >= 0);
const ours = [];
let thirdParty = 0;
errorStarts.forEach((start, k) => {
  const block = lines.slice(start, errorStarts[k + 1] ?? lines.length).join("\n").trimEnd();
  if (lines[start].startsWith("node_modules/")) thirdParty += 1;
  else ours.push(block);
});
if (result.status !== 0 && errorStarts.length === 0) {
  console.error(lines.join("\n"));
  process.exit(result.status ?? 1);
}
if (ours.length) {
  console.error(ours.join("\n"));
  console.error(`\nType check failed: ${ours.length} error(s) in this project.`);
  process.exit(1);
}
console.log(`Type check passed for project code${thirdParty ? ` (${thirdParty} error(s) inside third-party source ignored)` : ""}.`);
