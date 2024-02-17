import { For, Show, Switch, Match } from "solid-js";

import type { Expression, EKind } from "~/parser/parser";
import { type Tree } from "~/editor/tree";

import "./ExpressionNode.css";

export type NodeProps = {
  node: Expression,
  tree: Tree,
  path: number[],
}

type NodePropsLimitedTo<T> = Omit<NodeProps, 'node'> & { node: EKind<T> };

export default function Node(props: NodeProps) {
  const selected = () => props.tree.selection.path().length == props.path.length &&
                       props.tree.selection.path().every((v,i) => props.path[i] == v);

  const onClick = (ev: MouseEvent) => {
    props.tree.selection.setPath(props.path);
    ev.stopPropagation();
  }

  return (
    <div style={{"--depth": props.path.length}}
         classList={{nodeWrapper: true, selected: selected()}}
         onClick={onClick}>
      <NodeContent {...props} />
    </div>
  )
}

export function NodeContent(props: NodeProps) {
  return (
    <Switch fallback={<Placeholder />}>
      <Match when={props.node.kind == "op" && props.node.op == "funCall"}>
        <FunCall {...props as any}/>
      </Match>
      <Match when={props.node.kind == "op" && props.node.op != "funCall"}>
        <Operator {...props as any}/>
      </Match>
      <Match when={props.node.kind == "ident" || props.node.kind == "number" || props.node.kind == "string" || props.node.kind == "unknown"}>
        <Value {...props as any}/>
      </Match>
    </Switch>
  );
}

const Placeholder = () => <div class="node leaf placeholder"></div>;

function Value(props: NodePropsLimitedTo<'number' | 'string' | 'ident' | 'unknown'>) {
  return (
    <>
    <div classList={{node: true, leaf: true, [props.node.kind]: true}}>
      {props.node.value}
    </div>
    <Show when={'error' in props.node}>
      <div class="error">{String((props as any).node.error)}</div>
    </Show>
    </>
  )
}

function Operator(props: NodePropsLimitedTo<'op'>) {
  const extraStyle = () => ({
    unknown: "unknownOp",
    ".": "indexList",
   })[props.node.op as string] ?? "";

  const printedValue = () =>
    // Don't actually display word "unknown", this will be CSS defined
    (props.node.op == "unknown") ? "" :
    props.node.parenthesized ? '(' + props.node.op + ')' : props.node.op;

  return (
    <div classList={{node: true, op: true, [extraStyle()]: true}}>
      <div class="operator">{printedValue()}</div>
      <div class="args">
        <For each={props.node.args}>
          {(child, index) =>
            <>
              <Node {...props} path={[...props.path, index()]} node={child} />
            </>
          }
        </For>
      </div>
    </div>
  );
}

function FunCall(props: NodePropsLimitedTo<"op">) {
  return (
    // Place function itself in different position than arguments
    <div class="node funCall">
      <Node {...props} path={[...props.path, 0]} node={props.node.args[0]} />
      <div class="args">
        <For each={props.node.args.slice(1)}>
          {(child, index) =>
            <Node {...props} path={[...props.path, index()+1]} node={child} />
          }
        </For>
      </div>
    </div>
  )
}
