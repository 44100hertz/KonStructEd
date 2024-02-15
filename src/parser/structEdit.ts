import { type Expression, type EKind } from "./parser";

export function innerNodeEquals(a: Expression, b: any): boolean {
    if (a.kind == b.kind) {
        switch (a.kind) {
            case "funCall":
            case "placeholder":
                return true;
            case "operator":
                return a.op == b.op;
            default:
                return a.value == b.value;
        }
    }
    return false;
}

export function getNodePath(tree: Expression, path: number[]): Expression {
    if (path.length == 0) {
        return tree;
    }
    const [phead, ...ptail] = path;
    if (tree.kind == "operator") {
        return getNodePath(tree.children[phead], ptail);
    } else if (tree.kind == "funCall") {
        return getNodePath(tree.value[phead], ptail);
    }
    throw new Error(`Node doesn't exist at path ${path}`);
}
