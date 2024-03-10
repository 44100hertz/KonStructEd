import { string_to_tree, type Operator } from 'libkon';

export type Expression =
    { kind: "Placeholder" }
    | { kind: "Unknown" }
    | { kind: "Nil" }
    | { kind: "Bool", value: boolean }
    | { kind: "Number", value: string }
    | { kind: "String", value: string }
    | { kind: "DotDotDot" }
//    | { kind: "FunDef", value: FunDef }
//    | { kind: "Table", value: Table }
    | { kind: "Op", value: { op: Operator, args: Expression[] }};

export type Block = Statement[];

export type Statement =
    { kind: "Declare",
      value: { list: [string, Expression][] }
    }
    | { kind: "Assign",
        value: { list: [Expression, Expression][] }
    }
    | { kind: "Break" }
    | { kind: "DoBlock", value: { block: Block }}
    | { kind: "WhileBlock",
        value: { exp: Expression,
                 block: Block,
                 repeat_until: boolean }
    }
    | { kind: "ForRangeBlock",
        value: { var: string,
                 lower: Expression,
                 upper: Expression,
                 step?: Expression,
                 block: Block }
    }
    | { kind: "ForIterBlock",
        value: { namelist: string[],
                 explist: Expression[],
                 block: Block }
    }
    | { kind: "IfBlock",
        value: { branches: [Expression, Block][],
                 elsebranch: Block | null }
    }
    | { kind: "RetList", value: { list: Expression[] }}
    | { kind: "Call", value: { args: Expression[] }}
    | { kind: "Goto", value: { label: string }}
    | { kind: "GotoLabel", value: { label: string }}

export function stringToTree(str: string): Expression {
    return string_to_tree(str);
}

// Various useful bits from dismantled parser //

// // Call parenthesize function
// const expr = parseExpression(tokens, {...flags, parenthesized: true});
// if ('parenthesized' in expr) expr.parenthesized = true;
// tree = appendParenthesized(tree, expr);
//
// // Put something in parens at the end of the tree
// function appendParenthesized(tree: Expression, value: Expression): Expression {
//     // Find likely function call
//     const [leaf, parent] = getRightEdge(tree);
//     const target = (parent && isCallable(parent)) ? parent : (leaf && isCallable(leaf)) ? leaf : null;
//     const args = value.kind == "op" && value.op == "," && value.args;
//     if (target && args) {
//         // Function call on argument list
//         const func = makeExpr.binop("funCall", target, ...args);
//         return replaceLastLeaf(tree, func, target);
//     } else if (target) {
//         // Function call on single value
//         if (value.kind == "op") value.parenthesized = false;
//         return replaceLastLeaf(tree, makeExpr.binop("funCall", target, value), target);
//     }

//     // Not function call; treat as plain value
//     if (args) {
//         // Comma list not allowed, must be converted to placeholder funCall
//         value = makeExpr.binop("funCall", makeExpr.placeholder(), ...args);
//     }
//     if (value.kind !== "placeholder") {
//         return appendValue(tree, value);
//     }
//     return tree;
// }
