import type { TreeState } from "./tree";

export function handleKey(tree: TreeState, ev: KeyboardEvent) {
    const action = keymap[ev.code];
    if (action) {
        actions[action](tree);
    }
}

export const keymap: Record<KeyboardEvent["code"], Action> = {
    "ArrowLeft":  "MoveUp",
    "ArrowRight": "MoveDown",
    "ArrowUp":    "MoveOut",
    "ArrowDown":  "MoveIn",
};

export const actions = {
    "MoveUp":   (tree) => { tree.selection.moveUp(tree.tree());   tree.selection.updatePath() },
    "MoveDown": (tree) => { tree.selection.moveDown(tree.tree()); tree.selection.updatePath() },
    "MoveOut":  (tree) => { tree.selection.moveOut();             tree.selection.updatePath() },
    "MoveIn":   (tree) => { tree.selection.moveIn(tree.tree());   tree.selection.updatePath() },
} as const satisfies Record<string, (tree: TreeState) => void>;

export type Action = keyof typeof actions;
