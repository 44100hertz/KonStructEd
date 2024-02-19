import { describe, expect, test } from 'vitest';
import { stringToTree, makeExpr, parenthesize, type Expression, type BinaryOp } from "./parser";
import { treeToString } from "./unparser";

const num = makeExpr.number;
const id = makeExpr.ident;
const ph = makeExpr.placeholder;
const binop = makeExpr.binop;
const unop = makeExpr.unop;
const p = parenthesize;
// @ts-ignore
const pop = (op: BinaryOp, ...args: Expression[]) => p(binop(op, ...args));
const str = makeExpr.string;
// @ts-ignore
const call = (...args: Expression[]) => makeExpr.binop("funCall", ...args);

describe.each([
    ["nothing", "", ph()],
    ["add", "1+1", binop("+", num(1), num(1))],
    ["addmany", "1+2+3+4", binop("+", ...[1,2,3,4].map(num))],
    ["unary minus", "-1", unop("-", num(1))],
    ["binary minus", "1-2", binop("-", num(1), num(2))],
    ["triple minus", "---1", unop("-", unop("-", unop("-", num(1))))],
    ["subtract neg", "1---2", binop("-", num(1), unop("-", unop("-", num(2))))],
    ["precedence 1", "1+2*3", binop("+", num(1), binop("*", num(2), num(3)))],
    ["precedence 2", "1*2+3", binop("+", binop("*", num(1), num(2)), num(3))],
    ["big nothing", "(())()", ph()],
    ["parens", "1*(2+3)", binop("*", num(1), pop("+", num(2), num(3)))],
    ["parens 2", "(1+2)+3", binop("+", pop("+", num(1), num(2)), num(3))],
    ["parens deep", "(1^((3+4)*2))",
     pop("^", num(1), pop("*", pop("+", num(3), num(4)), num(2)))
    ],
    ["placeholder on op", "+", binop("+", ph(), ph())],
    ["placeholder on nums", "1 2", binop("unknown", num(1), num(2))],
    ["unary precedence 1", "-1^2", unop("-", binop("^", num(1), num(2)))],
    ["unary precedence 2", "-1*2", binop("*", unop("-", num(1)), num(2))],
    ["flattening", "1+2*3+4", binop("+", num(1), binop("*", num(2), num(3)), num(4))],
    ["func", "call()", call(id("call"), ph())],
    ["func with args", "sum(1,2,3)", call(id("sum"), ...[1,2,3].map(num))],
    ["curry", "max(1)(x)", call(call(id("max"), num(1)), id("x"))],
    ["nested call and index", "a(b()).c", binop(".", call(id("a"), call(id("b"), ph())), str("c"))],
    ["index", "hello.world", binop(".", id("hello"), str("world"))],
    ["index call", "math.max(1,2)", call(binop(".", id("math"), str("max")), num(1), num(2))],
    ["chain call", "list.filter(a).flatten()",
     call(binop(".", call(
         binop(".", id("list"), str("filter")), id("a")
     ), str("flatten")), ph())],
    ["empty string 1", "''", str('')],
    ["empty string 2", '""', str('')],
    ["hello string", '"hello, world"', str('hello, world')],
])("%s", (_, str, result) => {
    test("parse", () => {
        expect(stringToTree(str)).toMatchObject(result);
    })
    test("unparse", () => {
        expect(stringToTree(str)).toMatchObject(stringToTree(treeToString(result)));
    })
})
