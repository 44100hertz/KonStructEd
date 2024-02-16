import { type Expression, getPrecedence } from "./parser";

export function treeToString(tree: Expression): string {
    switch (tree.kind) {
        case "placeholder":
            return "";
        case "number":
        case "ident":
        case "unknown":
            return String(tree.value);
        case "op": {
            // Function call
            if (tree.op == "funCall") {
                const [func, ...args] = tree.args;
                return `${treeToString(func)}(${args.map(treeToString).join(', ')})`
            }
            // Unary operator
            if (tree.args.length == 1) {
                const firstborn = tree.args[0];
                const space = firstborn.kind == "operator"
                    && getPrecedence(firstborn.op, firstborn.args.length > 1) > getPrecedence(tree.op, false)
                    ? ' ' : '';
                return parenthesize(tree, tree.op + space + treeToString(tree.args[0]));
            }
            // Binary operator
            const op = tree.op == "unknown" ? " " :
                tree.op == "." || tree.op == "^" ? tree.op :
                ` ${tree.op} `;
            return parenthesize(tree, tree.args.map(treeToString).join(op));
        }
    }
}

function parenthesize(node: Expression, text: string) {
    if ('parenthesized' in node && node.parenthesized) {
        return `(${text})`;
    }
    return text;
}
