import { describe, expect, test } from 'vitest';
import { stringToTree, makeExpr, type Expression, type Operator } from "./parser";
import { treeToString } from "./unparser";

const num = makeExpr.number;
const id = makeExpr.ident;
const ph = makeExpr.placeholder;
const op = makeExpr.operator;
const pop = (o: Operator, ...args: Expression[]) => ({...op(o,...args), parenthesized: true});
const call = makeExpr.funCall;

describe.each([
    ["nothing", "", ph()],
    ["add", "1+1", op("+", num(1), num(1))],
    ["addmany", "1+2+3+4", {kind: "operator", op: "+", children: [1,2,3,4].map(num)}],
    ["unary minus", "-1", op("-", num(1))],
    ["triple minus", "---1", op("-", op("-", op("-", num(1))))],
    ["subtract neg", "1---2", op("-", num(1), op("-", op("-", num(2))))],
    ["binary minus", "1-2", op("-", num(1), num(2))],
    ["precedence 1", "1+2*3", op("+", num(1), op("*", num(2), num(3)))],
    ["precedence 2", "1*2+3", op("+", op("*", num(1), num(2)), num(3))],
    ["big nothing", "(())()", ph()],
    ["parens", "1*(2+3)", op("*", num(1), pop("+", num(2), num(3)))],
    ["parens 2", "(1+2)+3", op("+", pop("+", num(1), num(2)), num(3))],
    ["parens deep", "(1^((3+4)*2))",
     pop("^", num(1), pop("*", pop("+", num(3), num(4)), num(2)))
    ],
    ["placeholder on op", "+", op("+", ph(), ph())],
    ["placeholder on nums", "1 2", op("unknown", num(1), num(2))],
    ["unary precedence 1", "-1^2", op("-", op("^", num(1), num(2)))],
    ["unary precedence 2", "-1*2", op("*", op("-", num(1)), num(2))],
    ["flattening", "1+2*3+4", {kind: "operator", op: "+", children: [num(1), op("*", num(2), num(3)), num(4)]}],
    ["func", "call()", call(id("call"))],
    ["func with args", "sum(1,2,3)", call(id("sum"), ...[1,2,3].map(num))],
    ["curry", "max(1)(x)", call(call(id("max"), num(1)), id("x"))],
    ["index", "hello.world", op(".", id("hello"), id("world"))],
    ["index call", "math.max(1,2)", call(op(".", id("math"), id("max")), num(1), num(2))],
    ["chain call", "list.filter(a).flatten()",
     call(op(".", call(
         op(".", id("list"), id("filter")), id("a")
     ), id("flatten")))],
])("%s", (_, str, result) => {
    test("parse", () => {
        expect(stringToTree(str)).toMatchObject(result);
    })
    test("unparse", () => {
        expect(stringToTree(str)).toMatchObject(stringToTree(treeToString(result)));
    })
})
