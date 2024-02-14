<script lang="ts">
 import type { Expression } from "./parser";

 export let root: Expression;
 export let treePath = [];

 type NodeInfo = {
     value: string,
     children?: Expression[],
     args?: Expression[],
     extraStyle?: string,
 };

 function getNodeInfo(node: Expression): NodeInfo {
     switch (node.kind) {
         case "number":
         case "ident":
             return {value: String(node.value)};
         case "operator": {
             let value = node.op;
             let extraStyle;
             switch (node.op) {
                 case "unknown":
                     value = "";
                     extraStyle = "unknown";
                     break;
                 case ".":
                     value = "";
                     extraStyle = "indexList";
                     break;
                 default:
                     if (node.parenthesized) value = '(' + value + ')';
             }
             return {
                 value,
                 children: node.children,
                 extraStyle,
             }
         }
         case "funCall": return {
             value: "",
             children: [node.value[0]],
             args: node.value.slice(1),
         };
         case "placeholder": return {
             value: "",
         };
     }
 }

 let info;
 $: info = getNodeInfo(root);
</script>

<div style:background={`lch(${info.children ? 30 : 40}% 45 ${treePath.length*40+20}`}
     class="node {root.kind} {info.extraStyle}"
>
    <div class="value">{info.value}</div>
    {#if info.children}
        <p class="children">
        {#each info.children as child, index}
            <svelte:self root={child} treePath={[...treePath, index]}/>
            {root.op == "." && index < info.children.length-1 ? '.' : ''}
        {/each}
        {#if info.args}
            (
            <div class="args">
                {#each info.args as arg, index}
                    <svelte:self root={arg} treePath={[...treePath, index+1]}/>
                {/each}
            </div>
            )
        {/if}
        </p>
    {/if}
</div>

<style>
 @import "./ExpressionNode.css";
</style>
