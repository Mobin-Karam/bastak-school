import { readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const groups = [
  ["agents", ".github/agents", (name) => name.endsWith(".agent.md")],
  ["skills", ".github/skills", () => true],
  ["prompts", ".github/prompts", (name) => name.endsWith(".prompt.md")],
  ["instructions", ".github/instructions", (name) => name.endsWith(".instructions.md")],
];

for (const [label, relativeDirectory, include] of groups) {
  const absoluteDirectory = path.join(projectRoot, relativeDirectory);
  const entries = await readdir(absoluteDirectory, { withFileTypes: true });
  const files = entries
    .filter((entry) => entry.isFile() && include(entry.name))
    .map((entry) => path.posix.join(relativeDirectory, entry.name))
    .sort();
  const directories = entries
    .filter((entry) => entry.isDirectory() && label === "skills")
    .map((entry) => path.posix.join(relativeDirectory, entry.name, "SKILL.md"))
    .sort();
  console.log(`${label} (${files.length + directories.length})`);
  for (const file of [...files, ...directories]) console.log(`- ${file}`);
}
