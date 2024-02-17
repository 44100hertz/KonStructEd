import { createSignal, createEffect, on, type Accessor, type Setter } from "solid-js";
import { unaryOps, binaryOps } from "../parser/defs";
import { type Expression, makeExpr } from "../parser/parser";
import { keymap } from "./keymap";

type TreePath = number[];

export const actions = {
    "MoveUp":   (tree) => { tree.selection.moveUp();   tree.selection.updatePath() },
    "MoveDown": (tree) => { tree.selection.moveDown(); tree.selection.updatePath() },
    "MoveOut":  (tree) => { tree.selection.moveOut();  tree.selection.updatePath() },
    "MoveIn":   (tree) => { tree.selection.moveIn();   tree.selection.updatePath() },
    "Delete":   (tree) => { tree.deleteSubtree(); }
} as const satisfies Record<string, (tree: Tree) => void>;

export type Action = keyof typeof actions;

export class Tree {
    tree: Accessor<Expression>;
    setTree: Setter<Expression>;
    selection: TreeSelection;

    constructor () {
        [this.tree, this.setTree] = createSignal<Expression>({kind: "placeholder"});
        this.selection = new TreeSelection(this.tree);
    }

    handleKey(ev: KeyboardEvent) {
        const action = keymap[ev.code];
        if (action) {
            actions[action](this);
        }
    }

    deleteSubtree() {
        this.setTree(deleteSubtreeAtPath(this.tree(), this.selection.getPath()));
    }

}

export class TreeSelection {
    // Path and PathLen is Used so that when moving inward after moving outward,
    // you move inward back to the same node that you moved outward from.
    _path: TreePath = [];
    _pathLen: number = 0;
    // NavDepth is used so that when moving left and right, the cursor will try
    // to stay at approximately the same depth. This is similar to how
    // navigating to the end of a text editor line will cause the text editor to
    // remember that position, yet only go as far as it can.
    _navDepth: number = 0;

    path: Accessor<TreePath>;
    _setPath: Setter<TreePath>;

    constructor(
        public tree: Accessor<Expression>
    ) {
        [this.path, this._setPath] = createSignal<TreePath>([]);
        createEffect(on(tree, () => this.updateTree()));
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
    setPath(path: TreePath) {
        // Only update internal path if it's different.
        // This preserves predictable navigation.
        if (!path.every((v,i) => v == this._path[i])) {
            this._path = path;
        }
        this._pathLen = path.length;
        this._navDepth = path.length;
        this.updatePath();
    }

    // Keep selection from breaking in case of tree deletions
    updateTree() {
        while (!this.getNode()) {
            if (this._path[this._pathLen-1] > 0) {
                // First move to previous sibling
                this._path[this._pathLen-1]--;
            } else {
                // If not, move up
                --this._pathLen;
            }
        }
        this.updatePath();
    }

    // Move to previous sibling or cousin
    moveUp() {
        this._path[this._pathLen-1]--;
        this._path = this.getPath(); // Truncate path
        while (!this.getNode()) {
            // End of the road: Move to neighbor
            this._pathLen--;
            this._path[this._pathLen-1]--;
            this._path.pop();
        }
        // Try to go back as deep as before (but also move to last)
        while (this._pathLen < this._navDepth && this.moveIn()) {
            this.moveToLast();
        };
    }

    // Move to next sibling or cousin
    moveDown() {
        this._path[this._pathLen-1]++;
        this._path = this.getPath(); // Truncate path
        while (!this.getNode()) {
            // End of the road: Move to neighbor
            this._pathLen--;
            this._path[this._pathLen-1]++;
            this._path.pop();
        }
        // Try to go back as deep as before
        while (this._pathLen < this._navDepth && this.moveIn());
    }

    // Move to last sibling
    moveToLast() {
        this._path = this.getPath(); // Truncate path
        // Keep on going until there's nothing
        do {
            this._path[this._pathLen-1]++;
        } while (this.getNode());
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
    moveIn(): boolean {
        this._pathLen++;
        if (this._pathLen >= this._path.length) {
            this._path.push(0);
        }
        if (!this.getNode()) {
            this._pathLen--;
            return false;
        }
        this._navDepth = Math.max(this._navDepth, this._pathLen);
        return true;
    }

    getNode() {
        return getNodeAtPath(this.tree(), this.getPath());
    }

}

export function getNodeAtPath(tree: Expression, path: TreePath): Expression | null {
    if (path.length == 0) {
        return tree;
    }
    const [phead, ...ptail] = path;
    if (tree.kind == "op") {
        return getNodeAtPath(tree.args[phead], ptail);
    }

    return null;
}


function deleteSubtreeAtPath(tree: Expression, path: TreePath): Expression {
    // Return true if a node can be removed from the arg list, false if placeholder
    function canRemoveNode(tree: Expression, point: number): boolean {
        if (tree.kind == "op") {
            return tree.op == "." || tree.op == ","
                || (tree.op in binaryOps && tree.args.length > 2)
                || (tree.op in unaryOps && tree.args.length > 1)
                || (tree.op == "funCall" && point > 0 && tree.args.length > 2)
        }
        return true;
    }

    function delSubtree(tree: Expression, path: TreePath): Expression {
        if (path.length == 0) {
            return makeExpr.placeholder();
        }

        if (!tree || tree.kind !== "op") {
            throw new Error("Attempt to delete nonexisting node");
        }
        if (path.length == 1) {
            const replacement = canRemoveNode(tree, path[0]) ? [] : [makeExpr.placeholder()];
            return {
                ...tree,
                args: tree.args.toSpliced(path[0], 1, ...replacement),
            }
        } else {
            const [phead, ...ptail] = path;
            return {
                ...tree,
                args: tree.args.toSpliced(phead, 1, delSubtree(tree.args[phead], ptail)),
            }
        }
    }

    function fixTree(tree: Expression): Expression {
        if (tree.kind == "op") {
            // Function w/o params
            if (tree.op == "funCall" && tree.args[0].kind == "placeholder") {
                if (tree.args.length > 1) {
                    return fixTree(makeExpr.pop(",", ...tree.args.slice(1)));
                } else {
                    return makeExpr.placeholder();
                }
            } else if (tree.args.length == 0 && (tree.op == "." || tree.op == ",")) {
                return makeExpr.placeholder();
            } else if (tree.args.length == 1 && (tree.op == "." || tree.op == ",")) {
                return fixTree(tree.args[0]);
            } else {
                return {
                    ...tree,
                    args: tree.args.map(fixTree),
                }
            }
        }
        return tree;
    }

    return fixTree(delSubtree(tree, path));
}
