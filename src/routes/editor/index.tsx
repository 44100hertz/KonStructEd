import { createContext, createSignal, createEffect,
         type Accessor, type Setter, type Context } from "solid-js";
import { stringToTree, type Expression } from "~/parser/parser";
import ExpressionNode from "~/components/ExpressionNode";

export type TreeState = {
    tree: Accessor<Expression>,
    selection: Accessor<number[]>,
    setSelection: Setter<number[]>,
};

export default function Editor() {
    const [tree, setTree] = createSignal<Expression>({kind: "placeholder"});
    const [selection, setSelection] = createSignal<number[]>([])

    const TreeContext: Context<TreeState> = createContext({tree, selection, setSelection});

    function reparse(ev: KeyboardEvent) {
        const content = ev.target.value;
        setTree(stringToTree(content));
    }
    const placeholder = "10 * math.max(200, 5^5)";
    setTree(stringToTree(placeholder));

    return (
        <TreeContext.Provider value={{
            tree,
            selection,
            setSelection,
        }}>
            <textarea onKeyUp={reparse}>
                {placeholder}
            </textarea>
            <ExpressionNode path={[]} context={TreeContext} node={tree()}/>
            <pre />
        </TreeContext.Provider>
    )
}
