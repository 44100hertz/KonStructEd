import { type Expression, getPrecedence } from "./parser";

export function treeToString(tree: Expression): string {
    switch (tree.kind) {
        case "placeholder":
            return "";
        case "number":
        case "ident":
        case "unknown":
            return String(tree.value);
        case "operator": {
            if (tree.children.length == 1) {
                const firstborn = tree.children[0];
                const space = firstborn.kind == "operator"
                    && getPrecedence(firstborn.op, firstborn.children.length > 1) > getPrecedence(tree.op, false)
                    ? ' ' : '';
                return parenthesize(tree, tree.op + space + treeToString(tree.children[0]));
            }
            const op = tree.op == "unknown" ? " " :
                tree.op == "." || tree.op == "^" ? tree.op :
                ` ${tree.op} `;
            return parenthesize(tree, tree.children.map(treeToString).join(op));
        }
        case "funCall": {
            const [func, ...args] = tree.value;
            return `${treeToString(func)}(${args.map(treeToString).join(', ')})`
        }
    }
}

function parenthesize(node: Expression, text: string) {
    if ('parenthesized' in node && node.parenthesized) {
        return `(${text})`;
    }
    return text;
}
