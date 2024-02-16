import { createSignal, type Accessor, type Setter } from "solid-js";
import { type Expression, type EKind } from "../parser/parser";

export type TreeState = {
    tree: Accessor<Expression>,
    selection: TreeSelection,
};

export class TreeSelection {
    // Path and PathLen is Used so that when moving inward after moving outward,
    // you move inward back to the same node that you moved outward from.
    _path: number[] = [];
    _pathLen: number = 0;
    // NavDepth is used so that when moving left and right, the cursor will try
    // to stay at approximately the same depth. This is similar to how
    // navigating to the end of a text editor line will cause the text editor to
    // remember that position, yet only go as far as it can.
    _navDepth: number = 0;

    path: Accessor<number[]>;
    _setPath: Setter<number[]>;

    constructor() {
        [this.path, this._setPath] = createSignal<number[]>([]);
    }

    // Update reactive path. CALL AFTER EVERY COMPLETE OPERATION!
    updatePath() {
        this._setPath(this.getPath());
    }

    // Get a path usable by the tree itself
    getPath() {
        return this._path.slice(0, this._pathLen);
    }

    // Set tree-usable path to internal path state
    setPath(path: number[]) {
        // Only update internal path if it's different.
        // This preserves predictable navigation.
        if (!path.every((v,i) => v == this._path[i])) {
            this._path = path;
        }
        this._pathLen = path.length;
        this._navDepth = path.length;
        this.updatePath();
    }

    // Move to previous sibling or cousin
    moveUp(tree: Expression) {
        this._path[this._pathLen-1]--;
        this._path = this.getPath(); // Truncate path
        while (!getNodeAtPath(tree, this.getPath())) {
            // End of the road: Move to neighbor
            this._pathLen--;
            this._path[this._pathLen-1]--;
            this._path.pop();
        }
        // Try to go back as deep as before (but also move to last)
        while (this._pathLen < this._navDepth && this.moveIn(tree)) {
            this.moveToLast(tree);
        };
    }

    // Move to next sibling or cousin
    moveDown(tree: Expression) {
        this._path[this._pathLen-1]++;
        this._path = this.getPath(); // Truncate path
        while (!getNodeAtPath(tree, this.getPath())) {
            // End of the road: Move to neighbor
            this._pathLen--;
            this._path[this._pathLen-1]++;
            this._path.pop();
        }
        // Try to go back as deep as before
        while (this._pathLen < this._navDepth && this.moveIn(tree));
    }

    // Move to last sibling
    moveToLast(tree: Expression) {
        this._path = this.getPath(); // Truncate path
        // Keep on going until there's nothing
        do {
            this._path[this._pathLen-1]++;
        } while (getNodeAtPath(tree, this._path));
        // Go back one
        this._path[this._pathLen-1]--;
    }

    // Move to parent
    moveOut() {
        if (this._pathLen > 0) {
            this._pathLen--;
            this._navDepth = this._pathLen;
        }
    }

    // Move to child; return false if was not possible
    moveIn(tree: Expression): boolean {
        let gotPath = true;
        this._pathLen++;
        if (this._pathLen >= this._path.length) {
            this._path.push(0);
        }
        if (!getNodeAtPath(tree, this.getPath())) {
            gotPath = false;
            this._pathLen--;
        }
        this._navDepth = Math.max(this._navDepth, this._pathLen);
        return gotPath;
    }

}

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

export function getNodeAtPath(tree: Expression, path: number[]): Expression | null {
    if (path.length == 0) {
        return tree;
    }
    const [phead, ...ptail] = path;
    if (tree.kind == "operator") {
        return getNodeAtPath(tree.children[phead], ptail);
    } else if (tree.kind == "funCall") {
        return getNodeAtPath(tree.value[phead], ptail);
    }
    return null;
}
