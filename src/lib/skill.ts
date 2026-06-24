import { readFile, readdir } from "fs/promises";
import path from "path";

const SKILL_DIR = path.join(process.cwd(), "skills", "site-seo-audit");

let cachedSkill: string | null = null;

export async function loadSkillText(): Promise<string> {
  if (cachedSkill) return cachedSkill;

  const skillPath = path.join(SKILL_DIR, "SKILL.md");
  const skill = await readFile(skillPath, "utf-8");

  const refsDir = path.join(SKILL_DIR, "references");
  const files = await readdir(refsDir);
  const mdFiles = files
    .filter((f) => f.endsWith(".md"))
    .sort((a, b) => a.localeCompare(b));

  const references: string[] = [];
  for (const file of mdFiles) {
    const content = await readFile(path.join(refsDir, file), "utf-8");
    references.push(`\n\n--- REFERENCE: ${file} ---\n\n${content}`);
  }

  cachedSkill = `${skill}\n\n--- REFERENCES ---${references.join("\n")}`;
  return cachedSkill;
}

export function clearSkillCache() {
  cachedSkill = null;
}
