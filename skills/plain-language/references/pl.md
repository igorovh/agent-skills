# Polish guide

Use this guide together with the core rules in [SKILL.md](../SKILL.md). It is based on the principles of plain Polish ("prosta polszczyzna", Pracownia Prostej Polszczyzny, University of Wrocław) and on ISO 24495-1.

## Sentences

- Aim for 10-15 words per sentence and keep most sentences under 20. Polish packs grammar into word endings, so the same idea needs fewer words than in English.
- Use the normal word order: subject, verb, object. "Skrypt usuwa stare pliki", not "Stare pliki usuwane są przez skrypt".
- Avoid long chains of subordinate clauses joined with "który", "że", "ponieważ". Split them into separate sentences.
- Avoid adverbial participles ("-ąc", "-wszy"). "Uruchamiając skrypt, pojawia się błąd" is also a grammar error. Write "Gdy uruchamiasz skrypt, pojawia się błąd".
- Avoid long chains of nouns in the genitive case: "w celu zapewnienia poprawności działania mechanizmu walidacji danych". Use a verb: "żeby walidacja danych działała poprawnie".

## Voice and register

- Use the active voice. Prefer "zmieniłem", "dodałem", "usunąłem" over "zostało zmienione", "został dodany".
- Address the user as "ty" in chat, unless they write formally ("Pan", "Pani"). Then match their register.
- Use the impersonal "-no/-to" forms ("zmieniono", "dodano") only when the actor does not matter, for example in a changelog.

## Words to replace

| Instead of | Write |
| - | - |
| dokonać weryfikacji / przeprowadzić weryfikację | sprawdzić |
| dokonać zmiany | zmienić |
| dokonać aktualizacji | zaktualizować |
| przeprowadzić analizę | przeanalizować, sprawdzić |
| w związku z powyższym | dlatego |
| w związku z tym, że | bo, ponieważ |
| celem / w celu + noun | żeby + verb |
| na chwilę obecną / w chwili obecnej | teraz |
| w przypadku gdy / w sytuacji, gdy | gdy, jeśli |
| posiadać | mieć |
| stanowić | być |
| umożliwiać dokonanie | pozwalać + verb |
| niniejszy | ten |
| powyższy / wyżej wymieniony | ten (or name the thing) |
| należy zwrócić uwagę, że | uwaga: (or delete it) |
| warto zauważyć, że / warto podkreślić, że | (delete it) |
| jak najbardziej | tak |
| ewentualnie (meaning "or") | albo, lub |
| poprzez | przez |
| implementacja + verb ("dokonać implementacji") | zaimplementować, dodać |

## Technical terms

- Keep the English terms Polish developers use: commit, branch, merge, pull request, build, deploy, endpoint, hook, cache.
- Inflect them as Polish developers do: "w tym commicie", "na branchu", "zrób merge'a". Do not force native replacements such as "zatwierdzenie" or "gałąź" when the user writes "commit" and "branch".
- Follow the user's choice. If the user writes "gałąź", write "gałąź".
- At the "very plain" level, explain each term once in parentheses: "cache (zapisana kopia danych, żeby nie pobierać ich drugi raz)".

## Hedges

Keep the strength of the original hedge.

| Original | Keep as |
| - | - |
| może, prawdopodobnie | może, prawdopodobnie |
| zwykle, najczęściej | zwykle |
| na pewno, zawsze | only if it is true |

Do not stack hedges: "być może prawdopodobnie mogłoby" becomes "może".
