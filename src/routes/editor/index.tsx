import { createSignal, onMount, onCleanup } from "solid-js";
import { stringToTree, type Expression } from "~/parser/parser";
import { handleKey } from "~/editor/keys"
import { type TreeState, TreeSelection } from "~/editor/tree";
import ExpressionNode from "~/components/ExpressionNode";
import "./style.css";

export default function Editor() {
    const [tree, setTree] = createSignal<Expression>({kind: "placeholder"});
    const selection = new TreeSelection();
    const treeState: TreeState = { tree, selection };

    function reparse(ev: any) {
      const content = ev.target.value;
      setTree(stringToTree(content));
    }
    const placeholder = "10 * math.max(200, 5^5)";
    setTree(stringToTree(placeholder));

    const _handleKey = (ev: KeyboardEvent) => handleKey(treeState, ev);
    onMount(() => {
      window.addEventListener('keydown', _handleKey);
    })
    onCleanup(() => {
      window.removeEventListener('keydown', _handleKey);
    })

  return (
    <div>
      <h1>Structure Editor</h1>
      <textarea onKeyUp={reparse}>
        {placeholder}
      </textarea>
      <div style={{border: "1px solid white", padding: "2em"}}>
        <ExpressionNode path={[]} tree={treeState} node={tree()}/>
      </div>
      <pre />
    </div>
    )
}
