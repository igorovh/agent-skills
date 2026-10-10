# agent-skills

Reusable [Agent Skills](https://agentskills.io) for AI coding agents. Install with the [Skills CLI](https://github.com/vercel-labs/skills); no cloning, no custom installer.

```bash
npx skills add igorovh/agent-skills
```

Works with OpenAI Codex CLI, Claude Code, OpenCode, and [every other agent the Skills CLI supports](https://github.com/vercel-labs/skills#supported-agents).

## Skills

| Skill | What it does |
| - | - |
| [`meaningful-testing`](skills/meaningful-testing/SKILL.md) | Makes the agent write tests that catch real bugs instead of inflating coverage: a mandatory decision process before each test, rules for mocking, determinism, and assertions, and an explicit "no new tests needed" verdict when that is the right call. On request, audits a whole test suite and fixes weak, duplicate, and flaky tests. |

## Discover

```bash
npx skills add igorovh/agent-skills --list
```

## Install

Globally, for every project on your machine:

```bash
npx skills add igorovh/agent-skills --skill meaningful-testing -g -a codex -a claude-code -a opencode
```

Project-local, committed with the repository and shared with your team (run inside the project):

```bash
npx skills add igorovh/agent-skills --skill meaningful-testing -a codex -a claude-code -a opencode
```

Every skill at once:

```bash
npx skills add igorovh/agent-skills --skill '*' -g -a codex -a claude-code -a opencode
```

Omit `-a` to let the CLI detect installed agents and prompt you. Omit `--skill` to pick skills interactively. Add `-y` to skip prompts in scripts. On Windows, add `--copy` if symlinks are not permitted on your machine.

### Where skills land

| Agent | `--agent` | Project | Global |
| - | - | - | - |
| Codex CLI | `codex` | `.agents/skills/` | `~/.agents/skills/` |
| Claude Code | `claude-code` | `.claude/skills/` | `~/.claude/skills/` |
| OpenCode | `opencode` | `.agents/skills/` | `~/.agents/skills/` |

Codex and OpenCode both read `.agents/skills/`, so the CLI installs one canonical copy there and links it into `.claude/skills/` for Claude Code.

### Use a skill

Agents load a skill automatically when a task matches its description. To invoke one explicitly:

| Agent | Syntax |
| - | - |
| Codex CLI | `$meaningful-testing` |
| Claude Code | `/meaningful-testing` |
| OpenCode | `@meaningful-testing` |

For example, to run the test-suite audit in `meaningful-testing`:

```text
/meaningful-testing audit the whole test suite
```

or just ask in plain words: "review all tests and fix the weak ones".

## Update

```bash
npx skills update            # interactive scope prompt
npx skills update -g         # global skills only
npx skills update -y         # non-interactive
```

## List installed

```bash
npx skills ls                # project
npx skills ls -g             # global
```

## Remove

```bash
npx skills remove meaningful-testing -g
npx skills remove meaningful-testing -a claude-code      # from one agent only
npx skills remove igorovh/agent-skills                   # everything installed from this repo
```

## Create a skill

Skills live in `skills/<name>/SKILL.md` with optional `references/`, `scripts/`, and `assets/` directories. Scaffold one with `npx skills init skills/<name>` and follow [CONTRIBUTING.md](CONTRIBUTING.md) for the conventions and the validation steps.

## Validate

```bash
node --test "tests/*.test.mjs"
```

Checks the Agent Skills spec constraints, link integrity, and unique names, then runs the real `npx skills` CLI against the checkout: discovery, global and project-local installation for Codex, Claude Code, and OpenCode, `ls`, and `remove`. The same run executes in [GitHub Actions](.github/workflows/validate.yml) on every push and pull request. Requires Node 22 or newer; no dependencies.

## License

[MIT](LICENSE)
