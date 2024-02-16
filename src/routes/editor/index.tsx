import { createSignal, onMount, onCleanup } from "solid-js";
import { stringToTree, type Expression } from "~/parser/parser";
import { handleKey } from "~/editor/keys"
import { Tree } from "~/editor/tree";
import ExpressionNode from "~/components/ExpressionNode";
import "./style.css";

export default function Editor() {
    const tree = new Tree();

    function reparse(ev: any) {
      const content = ev.target.value;
      tree.setTree(stringToTree(content));
    }
    const placeholder = "10 * math.max(200, 5^5)";
    tree.setTree(stringToTree(placeholder));

    const _handleKey = (ev: KeyboardEvent) => tree.handleKey(ev);
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
        <ExpressionNode path={[]} tree={tree} node={tree.tree()}/>
      </div>
      <pre />
    </div>
    )
}
