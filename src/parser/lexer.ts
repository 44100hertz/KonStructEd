import { unaryOps, binaryOps, symbols, keywords } from './defs';

export type TokenKind = 'unknown' | 'white' | 'number' | 'string' | 'operator' | 'ident' | 'keyword' | 'symbol';

export type Token = {
    kind: TokenKind,
    text: string,
}

const symbolsFromLongest = Object.keys({...unaryOps, ...binaryOps, ...symbols})
    .sort((a, b) => b.length - a.length);

const matchAll = (cond: (c: string, i: number) => boolean) =>
    (str: string) =>
    (str !== '') && str.split('').every(cond);

const tokenKinds: Record<Extract<TokenKind, 'white' | 'number' | 'ident'>, (s: string) => boolean> = {
    white: (s) => s.trim() === '',
    number: matchAll((c) => c >= '0' && c <= '9'),
    ident: matchAll((c: string, i: number) =>
        (c >= 'a' && c <= 'z')
        || (c >= 'A' && c <= 'Z')
        || (c == '_')
        || (i > 0 && c >= '0' && c <= '9')),
}

export function lexString(text: string, position = 0): Token[] {
    let matchKind: TokenKind = "unknown";
    if (position >= text.length) {
        return [];
    }
    if (text.charAt(position) == "'" || text.charAt(position) == '"') {
        const str = munchString(text, position);
        return [{kind: "string", text: str}, ...lexString(text, position + str.length + 2)]
    }
    for (let end = position+1;; ++end) {

        let token = text.slice(position, end);
        const maybeKind = (
            Object.entries(tokenKinds).find(([, match]) => match(token))
        )?.[0] as TokenKind | undefined;

        matchKind = maybeKind ?? matchKind;

        if (!maybeKind || end > text.length) {
            // Check for other symbols
            const maybeSym = (
                symbolsFromLongest.find((name) =>
                    name === text.slice(position, position + name.length))
            );
            if (maybeSym) {
                return [{kind: maybeSym in symbols ? "symbol" : "operator",
                         text: maybeSym},
                        ...lexString(text, position + maybeSym.length)]
            }

            // Default behavior: push last found token
            if (matchKind === "unknown") {
                throw new Error(`Unknown Token: ${token}`);
            }
            if (end <= text.length) token = token.slice(0, -1);

            if (matchKind === "ident" && token in keywords) matchKind = "keyword";
            if (matchKind !== 'white') {
                const parsedToken = {
                    kind: matchKind,
                    text: token,
                };
                return [parsedToken, ...lexString(text, end-1)];
            } else {
                return lexString(text, end-1);
            }
        }
    }
}

function munchString(text: string, position: number): string {
    let end = position+1;
    let opening = text.charAt(position);
    while (text.charAt(end) !== opening) {
        if (end >= text.length) {
            throw new Error("Unclosed quote");
        }
        ++end;
    }
    return text.slice(position+1, end);
}
