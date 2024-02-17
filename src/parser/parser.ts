import { lexString, type Token, type TokenKind } from './lexer';
import { unaryOps, binaryOps, type UnaryOp, type BinaryOp, type Symbol, FUNCALL_PRECEDENCE } from './defs';

export type Operator = UnaryOp | BinaryOp | "funCall" | "unknown";

const UNKNOWN_PRECEDENCE = 4; // for implied binops, what precedence to use

export type Expression =
    | {kind: "placeholder"}
    | {kind: "number", value: number}
    | {kind: "ident", value: string}
    | {kind: "string", value: string}
    | {kind: "unknown", value: string, error?: any }
    | {kind: "op", op: Operator, args: Expression[], parenthesized: boolean }

export type ExpressionKind = Expression["kind"];
export type EKind<T> = Extract<Expression, {kind: T}>;

export function stringToTree(str: string): Expression {
    try {
        const tokens = new TokenIter(lexString(str));
        const tree = applyRules(parseExpression(tokens));
        return tree;
    } catch (err) {
        return makeExpr.unknown(str, err);
    }
}

type ParseExprFlags = {
    parenthesized?: true,
}

function parseExpression(tokens: TokenIter, flags: ParseExprFlags = {}): Expression {
    let tree: Expression = makeExpr.placeholder();

    let token;
    while ((token = tokens.next())) {
        const leaf = getLastLeaf(tree);
        switch (token.kind) {
            case "symbol": {
                if (token.text == '(') {
                    const expr = parseExpression(tokens, {...flags, parenthesized: true});
                    if ('parenthesized' in expr) expr.parenthesized = true;
                    tree = appendArgs(tree, expr);
                } else if (('parenthesized' in flags || 'list' in flags) && token.text == ')') {
                    return tree;
                } else {
                    throw new Error(`Unexpected symbol ${token.text}`);
                }
            }
            break;
            case "number":
            case "ident":
            case "string":
                tree = appendValue(tree, makeExpr[token.kind](token.text));
                break;
            case "operator": {
                // Resolve ambiguous operators like '-' with the simple rule
                // that, if the rightmost subtree (the only subtree active in
                // parsing) is empty, it follows that there is no left value,
                // therefore the operator is unary.
                if (token.text in unaryOps && leaf.kind == "placeholder") {
                    const node = makeExpr.op(token.text as Operator, makeExpr.placeholder());
                    tree = appendValue(tree, node);
                } else if (token.text in binaryOps) {
                    tree = appendBinaryOp(tree, token.text as Operator);
                } else {
                    throw new Error(`Could not resolve op arity '${token.text}'`);
                }
                break;
            }
            case "keyword":
                throw new Error(`Unhandled keyword '${token.text}'`);
            default:
                throw new Error(`Unhandled token '${token.text}'`);
        }
    }

    if ('parenthesized' in flags) {
        throw new Error(`Expected closing paren`);
    }
    return tree;
}

// Put some arbitrary thing on the end of the tree, if possible
function appendValue(tree: Expression, value: Expression): Expression {
    const leaf = getLastLeaf(tree);
    if (leaf.kind == "placeholder") {
        return replaceLastLeaf(tree, value);
    } else {
        // Two values in a row, assume unknown operator between
        return appendValue(appendBinaryOp(tree, "unknown"), value);
    }
}

// Put something in parens at the end of the tree
function appendArgs(tree: Expression, value: Expression): Expression {
    // Find likely function call
    const maybeCallable = (node: Expression) =>
        getNodePrecedence(node) < FUNCALL_PRECEDENCE;
    const leaf = getLastLeaf(tree, maybeCallable);
    if (isCallable(leaf)) {
        if (value.kind == "op" && value.op == ",") {
            return replaceLastLeaf(tree, makeExpr.op("funCall", leaf, ...value.args), maybeCallable);
        }
        return replaceLastLeaf(tree, makeExpr.op("funCall", leaf, value), maybeCallable);
    }

    // Not function call; treat as plain value
    return appendValue(tree, value);
}

// Try to fit a binary op into the tree
function appendBinaryOp(tree: Expression, op: Operator): Expression {
    const args = getArgs(tree);
    if (args && tree.kind == "op") {
        // ^ redundant check, satisfies TS...
        if (tree.op == op) {
            // Allowing appending to same operator repeatedly...associativity be damned
            // 1 + 2 + 3 basically translates to (+ 1 2 3)
            return {
                ...tree,
                args: [...args, makeExpr.placeholder()],
            }
        }

        // Recurse on right part of tree, if needed
        const last = args.length - 1;
        if (args[last] && args[last].kind == "op") {
            return replaceLastChild(tree, appendBinaryOp(args[last], op));
        }
        // Operator precedence is higher than tree node...
        // Must wrap it into the tree
        if (getPrecedence(op, true) > getNodePrecedence(tree)) {
            const inner = makeExpr.op(op, args[last], makeExpr.placeholder());
            return replaceLastChild(tree, inner);
        }
    }
    // Default: Wrap entire tree into operator
    return makeExpr.op(op, tree, makeExpr.placeholder());
}

function applyRules(tree: Expression): Expression {
    if (tree.kind == "op" && tree.op == ".") {
        const [root, ...indexes] = tree.args;
        tree = {
            ...tree,
            args: [root, ...indexes.map((v) => {
                if (v.kind !== "ident") {
                    throw new Error("Attempt to use non-string as index");
                }
                return makeExpr.string(v.value);
            })],
        }
    }
    if (tree.kind == "op") {
        return {
            ...tree,
            args: tree.args.map(applyRules),
        }
    }
    return tree;
}

function replaceLastChild(tree: Expression, node: Expression): Expression {
    const c = getArgs(tree);
    if (c) {
        return {
            ...tree as EKind<"operator">,
            args: [...c.slice(0, -1), node],
        }
    }
    throw new Error("Attempt to replace child of non-inner node...");
}


type NodeFilter = (e: Expression) => boolean;

function replaceLastLeaf(tree: Expression, node: Expression, cond?: NodeFilter): Expression {
    const c = getArgs(tree);
    if (c && !(cond && !cond(tree))) {
        return replaceLastChild(tree, replaceLastLeaf(c[c.length-1], node, cond))
    }
    return node;
}

// Return the right-most leaf at the bottom of the tree
function getLastLeaf(tree: Expression, cond?: NodeFilter): Expression {
    const c = getArgs(tree);
    if (c && !(cond && !cond(tree))) {
        return getLastLeaf(c[c.length-1], cond);
    } else {
        return tree;
    }
}

function getArgs(tree: Expression): Expression[] | null {
    return ('args' in tree && !tree.parenthesized) ?
        tree.args : null;
}

function getNodePrecedence(node: Expression): number {
    if (node.kind == "op" && !node.parenthesized && node.op !== "funCall") {
        return getPrecedence(node.op, node.args.length > 1);
    }
    return Infinity;
}

export function getPrecedence(op: Operator, isBinary: boolean): number {
    return op == "funCall" ? FUNCALL_PRECEDENCE :
        op == "unknown"    ? UNKNOWN_PRECEDENCE :
        isBinary           ? binaryOps[op as BinaryOp]?.p :
        unaryOps[op as UnaryOp]?.p
        ?? Infinity;
}

function isCallable(node: Expression): boolean {
    return node.kind == "ident"
        || ('parenthesized' in node && node.parenthesized)
        || (node.kind == "op" && (node.op == "." || node.op == "funCall"));
}

export const makeExpr = {
    placeholder: (): EKind<"placeholder"> => ({
        kind: "placeholder",
    }),
    number: (text: string | number): EKind<"number"> => ({
        kind: "number",
        value: Number(text),
    }),
    ident: (text: string): EKind<"ident"> => ({
        kind: "ident",
        value: text,
    }),
    string: (text: string): EKind<"string"> => ({
        kind: "string",
        value: text,
    }),
    op: (op: Operator, ...args: Expression[]): EKind<"op"> => ({
        kind: "op",
        op,
        args,
        parenthesized: false,
    }),
    pop: (op: Operator, ...args: Expression[]): EKind<"op"> => ({
        ...makeExpr.op(op, ...args),
        parenthesized: true,
    }),
    unknown: (text: string, error?: any): EKind<"unknown"> => ({
        kind: "unknown",
        value: text,
        error,
    }),
};

export class TokenIter {
    index = 0;

    constructor(public tokens: Token[]) {}

    next(): Token {
        ++this.index;
        return this.tokens[this.index-1];
    }

    peek(index = 0): Token {
        return this.tokens[this.index + index];
    }
}
