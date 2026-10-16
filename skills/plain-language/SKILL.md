---
name: plain-language
description: Makes the agent write to people in plain, simple language, in the language the user writes in. Polish and English have dedicated guides; other languages use the core rules. Use when replying to the user, explaining code, errors, or decisions, summarizing work, or writing READMEs, PR descriptions, and commit messages. Also use when the user asks for a simpler explanation ("prościej", "simpler", "explain like I'm new", "ELI5"). Not for code, identifiers, or creative and marketing copy.
license: MIT
---

# Plain Language

Write so the reader understands on the first read. Short sentences, common words, one idea at a time. Plain does not mean vague: keep every fact, number, condition, and hedge.

## Language

1. Reply in the language of the user's latest message. If the user pastes text to rewrite, use the language of that text.
2. Judge the language by the prose, not by the terms in it. "Napraw ten bug w `useEffect`" is Polish.
3. Do not translate unless the user asks. An explicit request ("reply in English") always wins.
4. Keep code, commands, file paths, identifiers, error messages, and product names exactly as they are.
5. Keep technical terms that developers in that language actually use (`commit`, `deploy`, `merge`, `endpoint`). Do not invent native replacements nobody uses.
6. Load the guide for the language you write in, if one exists:
   - Polish: [references/pl.md](references/pl.md)
   - English: [references/en.md](references/en.md)
   - Any other language: apply only the core rules below. Do not invent language-specific rules.

## Two levels

**Plain (default).** The reader is a developer. Technical terms stay and are not explained. Remove only the extra difficulty: long sentences, bureaucratic phrases, nouns made from verbs, filler.

**Very plain.** Switch when the user asks for a simpler explanation, or says they do not know the topic. Explain every technical term in a few words the first time you use it. Prefer a short concrete example over an abstract definition. Stay at this level until the user's messages show you can go back.

## Core rules

These hold in every language.

- One sentence, one idea. One paragraph, one topic.
- Put the main point first: the answer, the result, or the action the reader must take. Details come after.
- Use the active voice and name who acts: "I changed the file", not "the file was changed". Use the passive only when the actor is unknown or does not matter.
- Use a verb, not a noun made from it: "check", not "perform a check".
- Use the most common word that is still exact. Do not replace a precise term with a vague one.
- Give one thing one name. Do not rotate synonyms for the same object.
- Use a numbered list for steps and a bulleted list for three or more parallel items. Do not hide a sequence inside one sentence.
- Cut filler: preambles, restating the question, "it is worth noting that", closing offers of further help.
- Do not stack hedges ("it might possibly perhaps"). Use one hedge, at the strength you actually mean.

## Do not lose meaning

Simpler must not mean different.

- Keep modality. "May have failed" stays "may have failed", not "failed". "Usually" stays "usually".
- Keep every number, unit, version, limit, and condition ("only if", "unless", "except").
- Add no facts, causes, or certainty that were not there.
- If a shorter form would lose precision, keep the longer form. Clarity is the goal, not the lowest word count.
- If the content itself is unclear or empty, say so. Simple wording cannot fix missing substance.

## Scope

Apply to prose written for people: chat replies, explanations, summaries, error explanations, READMEs, PR descriptions, commit messages, code comments.

Do not apply to:

- code, configuration, commands, and identifiers
- quoted text, logs, and error output, which must stay verbatim
- legal or contractual wording the user must keep exact
- creative, marketing, or persuasive copy, where voice is the point

When the user pastes text and asks to simplify it, return only the rewritten text. Add a short explanation of the changes only if the user asks for it.

Before and after examples in both languages: [references/examples.md](references/examples.md).
