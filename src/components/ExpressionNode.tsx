import { For, Switch, Match, useContext, type Context } from "solid-js";
import type { Expression, EKind } from "~/parser/parser";
import "./ExpressionNode.css";

import { type TreeState } from "~/routes/editor/index";

export type NodeProps = {
  node: Expression,
  context: Context<TreeState>,
  path: number[],
}

type NodePropsLimitedTo<T> = Omit<NodeProps, 'node'> & { node: EKind<T> };

export default function Node(props: NodeProps) {
  const context = useContext(props.context);

  const selected = () => context.selection().length == props.path.length &&
                       context.selection().every((v,i) => props.path[i] == v);

  const onClick = (ev: MouseEvent) => {
    context.setSelection(props.path);
    ev.stopPropagation();
  }

  return (
    <div style={{"--depth": props.path.length}}
         classList={{selected: selected()}}
         onClick={onClick}>
      <NodeContent {...props} />
    </div>
  )
}

export function NodeContent(props: NodeProps) {
  return (
    <Switch fallback={<Placeholder />}>
      <Match when={props.node.kind == "operator"}>
        <Operator {...props as any}/>
      </Match>
      <Match when={props.node.kind == "funCall"}>
        <FunCall {...props as any}/>
      </Match>
      <Match when={props.node.kind == "ident" || props.node.kind == "number" || props.node.kind == "unknown"}>
        <Value {...props as any}/>
      </Match>
    </Switch>
  );
}

const Placeholder = () => <div class="node leaf placeholder"></div>;

function Value(props: NodePropsLimitedTo<'number' | 'ident' | 'unknown'>) {
  return (
    <div classList={{node: true, leaf: true, [props.node.kind]: true}}>
      {props.node.value}
    </div>
  )
}

function Operator(props: NodePropsLimitedTo<'operator'>) {
  let value = props.node.op as string;
  let extraStyle: string = "";
  let between: string = "";
  switch (props.node.op) {
    case "unknown":
      value = "";
      extraStyle = "placeholder";
      break;
    case ".":
      value = "";
      extraStyle = "indexList";
      between = ".";
      break;
    default:
      if (props.node.parenthesized) value = '(' + value + ')';
  }
  return (
    <div classList={{node: true, operator: true, [extraStyle]: true}}>
      <div class="op">{value}</div>
      <div class="children">
        <For each={props.node.children}>
          {(child, index) =>
            <>
              <Node {...props} path={[...props.path, index()]} node={child} />
              {index() != props.node.children.length-1 ? between : ''}
            </>
          }
        </For>
      </div>
    </div>
  );
}

function FunCall(props: NodePropsLimitedTo<"funCall">) {
  return (
    <div class="node funCall">
      <Node {...props} path={[...props.path, 0]} node={props.node.value[0]} />
      (
      <div class="args">
        <For each={props.node.value.slice(1)}>
          {(child, index) =>
            <Node {...props} path={[...props.path, index()+1]} node={child} />
          }
        </For>
      </div>
      )
    </div>
  )
}
