import { lexString, type Token, type TokenKind } from './lexer';
import { unaryOps, binaryOps, type UnaryOp, type BinaryOp, type Symbol, FUNCALL_PRECEDENCE } from './defs';

export type Operator = UnaryOp | BinaryOp | "unknown";

const UNKNOWN_PRECEDENCE = 4; // for implied binops, what precedence to use

export type Expression =
    | {kind: "placeholder"}
    | {kind: "number", value: number}
    | {kind: "ident", value: string}
    | {kind: "unknown", value: string}
    | {kind: "operator", op: Operator, children: Expression[], parenthesized: boolean }
    | {kind: "funCall", value: Expression[] }

export type ExpressionKind = Expression["kind"];
export type EKind<T> = Extract<Expression, {kind: T}>;

export function stringToTree(str: string): Expression {
    try {
        const tokens = new TokenIter(lexString(str));
        const tree = parseExpression(tokens);
        return tree;
    } catch (err) {
        return makeExpr.ident(String(err));
    }
}

type ParseExprFlags = {
    parenthesized?: true,
    list?: true,
}

function parseExpression(tokens: TokenIter, flags: ParseExprFlags = {}): Expression {
    let tree: Expression = makeExpr.placeholder();

    let token;
    while ((token = tokens.next())) {
        const leaf = getLastLeaf(tree);
        switch (token.kind) {
            case "symbol": {
                if (token.text == '(') {
                    // Make sure function call binds more tightly
                    const isLowerPrio = (node: Expression) =>
                        node.kind !== "operator" ||
                        getPrecedence(node.op, node.children.length > 1) < FUNCALL_PRECEDENCE;
                    const leaf = getLastLeaf(tree, isLowerPrio);
                    if (isCallable(leaf)) {
                        // Function call
                        const args = parseFunCallArgs(tokens);
                        const node = makeExpr.funCall(leaf, ...args);
                        tree = replaceLastLeaf(tree, node, isLowerPrio);
                    } else {
                        // Standard expression
                        const expr = parseExpression(tokens, {...flags, parenthesized: true});
                        if ('parenthesized' in expr) expr.parenthesized = true;
                        tree = appendValue(tree, expr);
                    }
                } else if (('parenthesized' in flags || 'list' in flags) && token.text == ')') {
                    return tree;
                } else if ('list' in flags && token.text == ',') {
                    return tree;
                } else {
                    throw new Error(`Unexpected symbol ${token.text}`);
                }
            }
            break;
            case "number":
            case "ident":
                tree = appendValue(tree, makeExpr[token.kind](token.text));
                break;
            case "operator": {
                // Resolve ambiguous operators like '-' with the simple rule
                // that, if the rightmost subtree (the only subtree active in
                // parsing) is empty, it follows that there is no left value,
                // therefore the operator is unary.
                if (token.text in unaryOps && leaf.kind == "placeholder") {
                    const node = makeExpr.operator(token.text as Operator, makeExpr.placeholder());
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

function parseFunCallArgs(tokens: TokenIter) {
    const args: Expression[] = [];

    let token;
    while ((token = tokens.peek(-1))) {
        if (token.kind == 'symbol') {
            if (token.text == ')') {
                if (args.length == 1 && args[0].kind == "placeholder") return [];
                return args;
            }
        }
        args.push(parseExpression(tokens, {list: true}));
    }

    throw new Error("Function args not terminated");
}

// Put some arbitrary thing on the end of the tree, if possible
function appendValue(tree: Expression, value: Expression): Expression {
    if (value.kind == "placeholder") {
        return tree;
    }
    const leaf = getLastLeaf(tree);
    if (leaf.kind == "placeholder") {
        return replaceLastLeaf(tree, value);
    } else {
        // Two values in a row, assume unknown operator between
        return appendValue(appendBinaryOp(tree, "unknown"), value);
    }
}

// Try to fit a binary op into the tree
function appendBinaryOp(tree: Expression, op: Operator): Expression {
    const children = getChildren(tree);
    if (children && tree.kind == "operator") {
        // ^ redundant check, satisfies TS...
        if (tree.op == op) {
            // Allowing appending to same operator repeatedly...associativity be damned
            // 1 + 2 + 3 basically translates to (+ 1 2 3)
            return {
                ...tree,
                children: [...children, makeExpr.placeholder()],
            }
        }

        // Recurse on right part of tree, if needed
        const last = children.length - 1;
        if (children[last] && children[last].kind == "operator") {
            return replaceLastChild(tree, appendBinaryOp(children[last], op));
        }
        // Operator precedence is higher than tree node...
        // Must wrap it into the tree
        if (getPrecedence(op, true) > getPrecedence(tree.op, children.length > 1)) {
            const inner = makeExpr.operator(op, children[last], makeExpr.placeholder());
            return replaceLastChild(tree, inner);
        }
    }
    // Default: Wrap entire tree into operator
    return makeExpr.operator(op, tree, makeExpr.placeholder());
}

function replaceLastChild(tree: Expression, node: Expression): Expression {
    const c = getChildren(tree);
    if (c) {
        return {
            ...tree as EKind<"operator">,
            children: [...c.slice(0, -1), node],
        }
    }
    throw new Error("Attempt to replace child of non-inner node...");
}


type NodeFilter = (e: Expression) => boolean;

function replaceLastLeaf(tree: Expression, node: Expression, cond?: NodeFilter): Expression {
    const c = getChildren(tree);
    if (c && !(cond && !cond(tree))) {
        return replaceLastChild(tree, replaceLastLeaf(c[c.length-1], node, cond))
    }
    return node;
}

// Return the right-most leaf at the bottom of the tree
function getLastLeaf(tree: Expression, cond?: NodeFilter): Expression {
    const c = getChildren(tree);
    if (c && !(cond && !cond(tree))) {
        return getLastLeaf(c[c.length-1], cond);
    } else {
        return tree;
    }
}

function getChildren(tree: Expression): Expression[] | null {
    return ('children' in tree && !tree.parenthesized) ?
        tree.children : null;
}

export function getPrecedence(op: Operator, isBinary: boolean): number {
    return isBinary ? (op == "unknown" ? UNKNOWN_PRECEDENCE : binaryOps[op as BinaryOp]?.p)
        : unaryOps[op as UnaryOp]?.p ?? Infinity;
}

function isCallable(node: Expression): boolean {
    return node.kind == "ident"
        || node.kind == "funCall"
        || ('parenthesized' in node && node.parenthesized)
        || (node.kind == "operator" && node.op == ".")
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
    operator: (op: Operator, ...children: Expression[]): EKind<"operator"> => ({
        kind: "operator",
        op,
        children,
        parenthesized: false,
    }),
    funCall: (...value: Expression[]): EKind<"funCall"> => ({
        kind: "funCall",
        value,
    }),
    unknown: (text: string): EKind<"unknown"> => ({
        kind: "unknown",
        value: text,
    }),
}

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
