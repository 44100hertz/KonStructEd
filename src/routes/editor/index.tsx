import { createContext, createSignal, type Accessor, type Setter, type Context } from "solid-js";
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

    function reparse() {
        setTree(stringToTree(`1+2*${Math.floor(10*Math.random())}`));
    }

    return (
        <TreeContext.Provider value={{
            tree,
            selection,
            setSelection,
        }}>
            <textarea onKeyUp={reparse}/>
            <ExpressionNode path={[]} context={TreeContext}/>
            <pre />
        </TreeContext.Provider>
    )
}
