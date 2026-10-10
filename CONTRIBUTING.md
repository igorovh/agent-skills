# Contributing

Clone the repository only if you are developing skills. To use the skills, see the [README](README.md).

```bash
git clone https://github.com/igorovh/agent-skills.git
cd agent-skills
```

## Add a skill

1. Scaffold it with the Skills CLI:

   ```bash
   npx skills init skills/<skill-name>
   ```

2. Edit `skills/<skill-name>/SKILL.md`. Follow the [Agent Skills specification](https://agentskills.io/specification):

   - `name`: lowercase kebab-case, 1-64 characters, identical to the directory name.
   - `description`: 1-1024 characters. Say what the skill does, then when to use it and when not to. Put the key triggers first; some agents truncate long descriptions.
   - Only spec fields in the frontmatter: `name`, `description`, `license`, `compatibility`, `metadata`, `allowed-tools`. Agent-specific fields would break portability across Codex, Claude Code, and OpenCode.
   - Keep the frontmatter to simple `key: value` lines (one level of nesting for `metadata`). The validator parses only that subset.

3. Keep `SKILL.md` short and directive. Put detail in `references/` and link every file from `SKILL.md` with a relative link. Unlinked files fail validation.

4. Write for agent behavior, not for readers. Each instruction should change what the agent does. Prefer rules with a stated exception over blanket bans.

## Validate

```bash
node --test "tests/*.test.mjs"
```

This checks the spec constraints above, link integrity, name uniqueness, and then runs the real `npx skills` CLI against your checkout in a throwaway home directory: discovery with `--list`, a global install for Codex, Claude Code, and OpenCode, `ls`, `remove`, and a project-local install of every skill. Node 22 or newer is required; there are no dependencies to install.

Test a skill in your own agent before opening a pull request:

```bash
npx skills add ./ --skill <skill-name> -g -a codex -a claude-code -a opencode
```

## Pull requests

- One skill or one focused change per pull request.
- Explain which agent behavior the change improves and how you checked it.
- CI runs the same validation as above.
