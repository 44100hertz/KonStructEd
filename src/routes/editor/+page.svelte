<script lang="ts">
 import ExpressionNode from './ExpressionNode.svelte';
 import { stringToTree, type ParseNode } from "./parser.ts";
 import { treeToString } from "./unparser.ts";
 let text = "10 * math.max(2000, 5^5)";
 let unparsed = text;
 let tree: ParseNode;

 function reparse() {
     tree = stringToTree(text);
     unparsed = treeToString(tree);
 }

 reparse();

</script>

<div class="center">
    <textarea on:keyup={reparse} bind:value={text} />
    <ExpressionNode bind:root={tree} />
    <pre>{unparsed}</pre>
</div>

<style>
 textarea {
     background: black;
     color: white;
     font-size: 20px;
     width: 100%;
     margin-bottom: 2em;
     border: 1px solid white;
     padding: 0.5em;
 }

 .center {
     max-width: 600px;
     margin: 0 auto;
 }
</style>
