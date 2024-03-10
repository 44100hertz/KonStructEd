import { createEffect, onMount, onCleanup } from "solid-js";
import { stringToTree } from "~/parser/parser";
//import { treeToString } from "~/parser/unparser";
import { Tree } from "~/editor/tree";
import ExpressionNode from "~/components/ExpressionNode";
import "./style.css";

export default function Editor() {
    const tree = new Tree();
    let textArea: HTMLTextAreaElement | undefined;

    function reparse(ev: any) {
      if (textArea) {
        tree.setTree(stringToTree(textArea.value));
        console.log(tree.tree());
      }
    }

  /* createEffect(() => {
   *   const t = tree.tree();
   *   if (textArea && textArea !== document.activeElement) {
   *     textArea.value = treeToString(t)
   *   }
   * }) */

    const placeholder = "1 + 2 * 3 ^ 4";
    tree.setTree(stringToTree(placeholder));

    const _handleKey = (ev: KeyboardEvent) => {
      /* if (textArea !== document.activeElement) {
       *   tree.handleKey(ev);
       * } */
    }
    onMount(() => {
      window.addEventListener('keydown', _handleKey);
    })
    onCleanup(() => {
      window.removeEventListener('keydown', _handleKey);
    })

  return (
    <div>
      <h1>Structure Editor</h1>
      <textarea onKeyUp={reparse} ref={textArea}>
        {placeholder}
      </textarea>
      <div style={{border: "1px solid white", padding: "2em"}}>
        <StatementNode path={[]} node={tree.tree()}/>
        {/* <ExpressionNode path={[]} tree={tree} node={tree.tree()}/> */}
      </div>
      <pre />
    </div>
    )
}
