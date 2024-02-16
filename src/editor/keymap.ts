import { type Action } from "./tree";

export const keymap: Record<KeyboardEvent["code"], Action> = {
    "ArrowLeft":  "MoveUp",
    "ArrowRight": "MoveDown",
    "ArrowUp":    "MoveOut",
    "ArrowDown":  "MoveIn",
};
