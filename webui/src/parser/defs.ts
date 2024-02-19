type Op = {
    p: number,
};

export const unaryOps = {
    'not': { p: 11 },
    '#': { p: 11 },
    '-': { p: 11 },
    '~': { p: 11 },
} as const satisfies Record<string, Op>

export const binaryOps = {
    ",": { p: 0 },
    'or': { p: 1 },
    'and': { p: 2 },
    '<': { p: 3 },
    '>': { p: 3 },
    '<=': { p: 3 },
    '>=': { p: 3 },
    '~=': { p: 3 },
    '==': { p: 3 },
    '|': { p: 4 },
    '~': { p: 5 },
    '&': { p: 6 },
    '<<': { p: 7 },
    '>>': { p: 7 },
    '..': { p: 8 },
    '+': { p: 9 },
    '-': { p: 9 },
    '*': { p: 10 },
    '/': { p: 10 },
    '//': { p: 10 },
    '%': { p: 10 },
    '^': { p: 12 },
    '.': { p: 13 },
} as const satisfies Record<string, Op>;

export const symbols = {
    '(': true,
    ')': true,
    '[': true,
    ']': true,
    '{': true,
    '}': true,
    '=': true,
} as const;

export const keywords = {
    'function': true,
    'return': true,

    'local': true,

    'if': true,
    'then': true,
    'elseif': true,
    'else': true,
    //'goto': true,

    'while': true,
    'for': true,
    'in': true,
    'repeat': true,
    'until': true,
    'break': true,
    'do': true,

    'end': true,
}

export type UnaryOp = keyof typeof unaryOps;
export type BinaryOp = keyof typeof binaryOps;
export type Symbol = keyof typeof symbols;
export type Keyword = keyof typeof keywords;
