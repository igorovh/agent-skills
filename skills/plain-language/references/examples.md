# Before and after

Each example shows the rule it applies. Code, paths, and identifiers stay unchanged in every rewrite.

## Polish

**Bureaucratic phrases, nouns made from verbs**

> Before: W związku z powyższym należy dokonać weryfikacji poprawności konfiguracji pliku `.env` celem wyeliminowania możliwości wystąpienia błędu.
>
> After: Dlatego sprawdź, czy plik `.env` jest poprawnie skonfigurowany. Inaczej może wystąpić błąd.

**Passive voice, main point last**

> Before: Po przeprowadzeniu analizy logów zostało ustalone, że przyczyną problemu prawdopodobnie jest wygaśnięcie tokenu, w związku z czym zostały wprowadzone zmiany w `auth.ts`.
>
> After: Zmieniłem `auth.ts`. Z logów wynika, że problem prawdopodobnie powodował wygasły token.

The hedge "prawdopodobnie" stays. The rewrite does not turn a guess into a fact.

**Sequence hidden in one sentence**

> Before: Aby uruchomić projekt, trzeba najpierw zainstalować zależności, a następnie skopiować `.env.example` do `.env` i uzupełnić klucze, po czym można odpalić `npm run dev`.
>
> After: Żeby uruchomić projekt:
>
> 1. Zainstaluj zależności: `npm install`.
> 2. Skopiuj `.env.example` do `.env`.
> 3. Uzupełnij klucze w `.env`.
> 4. Uruchom `npm run dev`.

**Very plain level**

> Plain: Dodałem cache w `getUser`, więc drugie wywołanie nie idzie już do bazy.
>
> Very plain: Dodałem cache w `getUser`. Cache to zapisana kopia danych. Za pierwszym razem funkcja pobiera użytkownika z bazy i zapamiętuje wynik. Za drugim razem zwraca zapamiętany wynik i nie pyta bazy.

## English

**Nominalization, filler, hedge stack**

> Before: It should be noted that the migration could potentially perhaps result in the occurrence of data loss in the event that a backup has not been performed prior to execution.
>
> After: The migration may lose data. Back up the database before you run it.

**Dropped words, noun stack**

> Before: Requests not matching schema rejected by API gateway request validation layer.
>
> After: The validation layer in the API gateway rejects requests that do not match the schema.

**Synonym rotation**

> Before: Pass the token to the client. The client stores the key and sends the credential with every request.
>
> After: Pass the token to the client. The client stores the token and sends it with every request.

## Language choice

> User: Czemu ten test się sypie? `expect(sum(0.1, 0.2)).toBe(0.3)`
>
> Reply: Test porównuje liczby zmiennoprzecinkowe dokładnie. `0.1 + 0.2` daje `0.30000000000000004`, a nie `0.3`. Użyj `toBeCloseTo`: `expect(sum(0.1, 0.2)).toBeCloseTo(0.3)`.

The question is in Polish, so the reply is in Polish. The code and the Jest matcher names stay in English.
