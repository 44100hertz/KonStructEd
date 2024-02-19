import { tokenKinds } from "./lexer";
import { type Expression, getPrecedence } from "./parser";

export function treeToString(tree: Expression): string {
    switch (tree.kind) {
        case "placeholder":
            return "";
        case "string":
            return '"' + tree.value + '"';
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
                const space = firstborn.kind == "op"
                    && getPrecedence(firstborn.op, firstborn.args.length > 1) > getPrecedence(tree.op, false)
                    ? ' ' : '';
                return parenthesize(tree, tree.op + space + treeToString(tree.args[0]));
            }
            // Binary operator
            const op = tree.op == "unknown" ? " " :
                tree.op == "^" ? tree.op :
                tree.op == "," ? tree.op + ' ' :
                ' ' + tree.op + ' ';

            let args;
            if(tree.op == ".") {
                // For string indexes, treat them as identifiers
                args = treeToString(tree.args[0]) +
                    tree.args.slice(1).map((v,i) =>
                        (v.kind == "string" && tokenKinds.ident(v.value))
                        ? '.' + v.value
                        : '[' + treeToString(v) + ']')
                        .join('');
            } else {
                args = tree.args.map(treeToString).join(op);
            }
            return parenthesize(tree, args);
        }
    }
}

function parenthesize(node: Expression, text: string) {
    if ('parenthesized' in node && node.parenthesized) {
        return `(${text})`;
    }
    return text;
}
