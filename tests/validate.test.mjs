// Run with: node --test tests/
// Part 1 checks the repository against the Agent Skills spec (https://agentskills.io/specification).
// Part 2 exercises the real Skills CLI (npx skills) against this checkout using a throwaway HOME.

import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative, resolve, sep } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SKILLS_DIR = join(ROOT, "skills");
const SPEC_FIELDS = new Set(["name", "description", "license", "compatibility", "metadata", "allowed-tools"]);
const NAME_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const MAX_SKILL_LINES = 500;
const AGENTS = ["codex", "claude-code", "opencode"];
const AGENT_LABELS = ["Codex", "Claude Code", "OpenCode"];

function listSkillDirs() {
  return readdirSync(SKILLS_DIR)
    .filter((entry) => statSync(join(SKILLS_DIR, entry)).isDirectory())
    .sort();
}

function unquote(value) {
  const trimmed = value.trim();
  if (/^".*"$/.test(trimmed) || /^'.*'$/.test(trimmed)) return trimmed.slice(1, -1);
  return trimmed;
}

// Supports the subset of YAML a skill needs: `key: value` and one level of nested `key:` maps.
function parseFrontmatter(text) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/.exec(text);
  assert.ok(match, "SKILL.md must start with a `---` frontmatter block");
  const data = {};
  let openMap = null;
  for (const line of match[1].split(/\r?\n/)) {
    if (!line.trim() || line.trim().startsWith("#")) continue;
    const top = /^([A-Za-z][\w-]*):(?:\s+(.*))?$/.exec(line);
    const nested = /^\s+([^:\s][^:]*):\s*(.*)$/.exec(line);
    if (top) {
      const [, key, value] = top;
      if (value === undefined || value === "") {
        data[key] = {};
        openMap = key;
      } else {
        data[key] = unquote(value);
        openMap = null;
      }
    } else if (nested && openMap) {
      data[openMap][nested[1].trim()] = unquote(nested[2]);
    } else {
      assert.fail(`Unsupported frontmatter line (keep frontmatter to simple key: value pairs): ${line}`);
    }
  }
  return { data, body: match[2] };
}

function markdownLinks(text) {
  const links = [];
  for (const match of text.matchAll(/\]\(([^)\s]+)\)/g)) {
    const target = match[1];
    if (/^(https?:|mailto:|#)/.test(target)) continue;
    links.push(target.split("#")[0]);
  }
  return links;
}

function walk(dir, skip = new Set()) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    if (skip.has(entry)) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full, skip));
    else out.push(full);
  }
  return out;
}

describe("repository layout", () => {
  test("skills/ contains only skill directories, each with a SKILL.md", () => {
    const entries = readdirSync(SKILLS_DIR);
    assert.ok(entries.length > 0, "skills/ must contain at least one skill");
    for (const entry of entries) {
      const full = join(SKILLS_DIR, entry);
      assert.ok(statSync(full).isDirectory(), `skills/${entry} must be a directory`);
      assert.ok(existsSync(join(full, "SKILL.md")), `skills/${entry}/SKILL.md is missing`);
    }
  });

  test("no SKILL.md exists outside skills/<name>/", () => {
    const skip = new Set([".git", "node_modules", ".agents", ".claude", ".opencode"]);
    const strays = walk(ROOT, skip)
      .filter((file) => file.endsWith(`${sep}SKILL.md`))
      .map((file) => relative(ROOT, file))
      .filter((rel) => !/^skills[\\/][^\\/]+[\\/]SKILL\.md$/.test(rel));
    assert.deepEqual(strays, [], "A SKILL.md outside skills/<name>/ changes how the CLI discovers skills");
  });

  test("skill names are unique", () => {
    const names = listSkillDirs().map((dir) => parseFrontmatter(readFileSync(join(SKILLS_DIR, dir, "SKILL.md"), "utf8")).data.name);
    assert.equal(new Set(names).size, names.length, `Duplicate skill names: ${names.join(", ")}`);
  });
});

for (const dir of listSkillDirs()) {
  describe(`skill: ${dir}`, () => {
    const skillDir = join(SKILLS_DIR, dir);
    const skillMd = readFileSync(join(skillDir, "SKILL.md"), "utf8");
    const { data, body } = parseFrontmatter(skillMd);

    test("frontmatter uses only Agent Skills spec fields", () => {
      const unknown = Object.keys(data).filter((key) => !SPEC_FIELDS.has(key));
      assert.deepEqual(unknown, [], `Unknown frontmatter fields: ${unknown.join(", ")}`);
    });

    test("name is valid and matches the directory", () => {
      assert.equal(typeof data.name, "string", "name is required");
      assert.match(data.name, NAME_PATTERN, "name must be lowercase kebab-case");
      assert.ok(data.name.length <= 64, "name must be at most 64 characters");
      assert.equal(data.name, dir, "name must match the directory name");
    });

    test("description is present and within limits", () => {
      assert.equal(typeof data.description, "string", "description is required");
      assert.ok(data.description.trim().length > 0, "description must not be empty");
      assert.ok(data.description.length <= 1024, `description is ${data.description.length} chars; max 1024`);
    });

    test("optional fields are well-formed", () => {
      if (data.compatibility !== undefined) {
        assert.equal(typeof data.compatibility, "string");
        assert.ok(data.compatibility.length <= 500, "compatibility must be at most 500 characters");
      }
      if (data.metadata !== undefined) {
        assert.equal(typeof data.metadata, "object", "metadata must be a map");
        for (const [key, value] of Object.entries(data.metadata)) {
          assert.equal(typeof value, "string", `metadata.${key} must be a string`);
        }
      }
    });

    test(`SKILL.md body is non-empty and under ${MAX_SKILL_LINES} lines`, () => {
      assert.ok(body.trim().length > 0, "SKILL.md must have instructions after the frontmatter");
      const lines = skillMd.split(/\r?\n/).length;
      assert.ok(lines <= MAX_SKILL_LINES, `SKILL.md has ${lines} lines; move detail into references/`);
    });

    test("every relative link in the skill resolves to a file", () => {
      const broken = [];
      for (const file of walk(skillDir).filter((f) => f.endsWith(".md"))) {
        for (const link of markdownLinks(readFileSync(file, "utf8"))) {
          if (!existsSync(resolve(dirname(file), link))) broken.push(`${relative(skillDir, file)} -> ${link}`);
        }
      }
      assert.deepEqual(broken, [], `Broken links:\n${broken.join("\n")}`);
    });

    test("every supporting file is linked from SKILL.md", () => {
      const linked = new Set(markdownLinks(skillMd).map((link) => resolve(skillDir, link)));
      const orphans = walk(skillDir)
        .filter((file) => file !== join(skillDir, "SKILL.md") && !linked.has(file))
        .map((file) => relative(skillDir, file));
      assert.deepEqual(orphans, [], `Files not referenced from SKILL.md (keep references one level deep): ${orphans.join(", ")}`);
    });
  });
}

describe("Skills CLI (npx skills)", () => {
  const skillNames = listSkillDirs();
  let home;
  let project;

  function stripAnsi(text) {
    return text.replace(/\x1b\[[0-9;?]*[A-Za-z]/g, "");
  }

  function quoteForCmd(arg) {
    return /[\s"&|<>^]/.test(arg) ? `"${arg.replace(/"/g, '""')}"` : arg;
  }

  function skills(args, cwd) {
    const env = { ...process.env, HOME: home, USERPROFILE: home, DISABLE_TELEMETRY: "1", DO_NOT_TRACK: "1" };
    const options = { cwd, env, encoding: "utf8", timeout: 180_000 };
    const argv = ["npx", "--yes", "skills", ...args];
    // Windows: npx is a .cmd shim and can only be spawned through a shell.
    const result = process.platform === "win32"
      ? spawnSync(argv.map(quoteForCmd).join(" "), { ...options, shell: true })
      : spawnSync(argv[0], argv.slice(1), options);
    const stdout = stripAnsi(result.stdout ?? "");
    const stderr = stripAnsi(result.stderr ?? "");
    assert.equal(result.status, 0, `npx skills ${args.join(" ")} failed:\n${stdout}\n${stderr}`);
    return { stdout, stderr, output: `${stdout}\n${stderr}` };
  }

  function parseJson({ stdout }) {
    const start = stdout.indexOf("[");
    assert.ok(start >= 0, `Expected JSON on stdout, got:\n${stdout}`);
    return JSON.parse(stdout.slice(start));
  }

  before(() => {
    home = mkdtempSync(join(tmpdir(), "agent-skills-home-"));
    project = mkdtempSync(join(tmpdir(), "agent-skills-project-"));
  });

  after(() => {
    rmSync(home, { recursive: true, force: true });
    rmSync(project, { recursive: true, force: true });
  });

  test("discovers every skill with --list", { timeout: 240_000 }, () => {
    const { output } = skills(["add", ROOT, "--list"], project);
    for (const name of skillNames) assert.match(output, new RegExp(`\\b${name}\\b`), `${name} not listed`);
  });

  test("installs a single skill globally for Codex, Claude Code, and OpenCode", { timeout: 240_000 }, () => {
    const [name] = skillNames;
    const agentFlags = AGENTS.flatMap((agent) => ["-a", agent]);
    const results = parseJson(skills(["add", ROOT, "--skill", name, "-g", ...agentFlags, "-y", "--json"], project));
    const installed = results.find((entry) => entry.name === name);
    assert.ok(installed, `No result for ${name}: ${JSON.stringify(results)}`);
    assert.equal(installed.status, "installed");
    assert.equal(installed.scope, "global");
    assert.deepEqual([...installed.agents].sort(), [...AGENT_LABELS].sort());
    assert.ok(existsSync(join(installed.path, "SKILL.md")), `SKILL.md missing at ${installed.path}`);
    // Codex and OpenCode read ~/.agents/skills; Claude Code reads ~/.claude/skills.
    assert.ok(existsSync(join(home, ".agents", "skills", name, "SKILL.md")));
    assert.ok(existsSync(join(home, ".claude", "skills", name, "SKILL.md")));
  });

  test("lists globally installed skills", { timeout: 240_000 }, () => {
    const listed = parseJson(skills(["ls", "-g", "--json"], project)).map((entry) => entry.name);
    assert.ok(listed.includes(skillNames[0]), `Expected ${skillNames[0]} in: ${listed.join(", ")}`);
  });

  test("removes a globally installed skill", { timeout: 240_000 }, () => {
    const [name] = skillNames;
    skills(["remove", name, "-g", "-y"], project);
    assert.ok(!existsSync(join(home, ".agents", "skills", name)), "canonical copy should be removed");
    assert.ok(!existsSync(join(home, ".claude", "skills", name)), "Claude Code link should be removed");
  });

  test("installs every skill project-locally with --skill '*'", { timeout: 240_000 }, () => {
    const agentFlags = AGENTS.flatMap((agent) => ["-a", agent]);
    const results = parseJson(skills(["add", ROOT, "--skill", "*", ...agentFlags, "-y", "--json"], project));
    for (const name of skillNames) {
      const installed = results.find((entry) => entry.name === name);
      assert.ok(installed && installed.status === "installed", `${name} not installed: ${JSON.stringify(results)}`);
      assert.equal(installed.scope, "project");
      assert.ok(existsSync(join(project, ".agents", "skills", name, "SKILL.md")));
      assert.ok(existsSync(join(project, ".claude", "skills", name, "SKILL.md")));
    }
    assert.ok(existsSync(join(project, "skills-lock.json")), "project install should write skills-lock.json");
  });
});
