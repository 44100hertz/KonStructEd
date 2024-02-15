import { useContext, For, Switch, Match, type Context, type Accessor } from "solid-js";
import type { Expression, EKind } from "~/parser/parser";
import { getNodePath } from "~/parser/structEdit";
import "./ExpressionNode.css";

import { type TreeState } from "~/routes/editor/index";

type NodeProps = {
  context: Context<TreeState>,
  path: number[],
}

type NodePropsLimitedTo<T> = Omit<NodeProps, 'node'> & { node: EKind<T> };

export default function Node(props: NodeProps) {
  return (
    <div style={{"--depth": props.path.length}}>
      <NodeContent {...props} />
    </div>
  )
}

export function NodeContent(props: NodeProps) {
  const context = useContext(props.context);
  const node = () => getNodePath(context.tree(), props.path);

  return (
    <Switch fallback={<Placeholder />}>
      <Match when={node().kind == "operator"}>
        <Operator {...props} node={node() as any}/>
      </Match>
      <Match when={node().kind == "funCall"}>
        <FunCall {...props} node={node() as any}/>
      </Match>
      <Match when={node().kind == "ident" || node().kind == "number" || node().kind == "unknown"}>
        <Value {...props} node={node() as any}/>
      </Match>
    </Switch>
  );
}

const Placeholder = () => <div class="node leaf placeholder"></div>;

function Value(props: NodePropsLimitedTo<'number' | 'ident' | 'unknown'>) {
  return (
    <div class="node leaf {props.kind}">{props.node.value}</div>
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
          {(_, index) =>
            <>
              <Node {...props} path={[...props.path, index()]} />
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
      <Node {...props} path={[...props.path, 0]} />
      (
      <div class="args">
        <For each={props.node.value.slice(1)}>
          {(_,index) =>
            <Node {...props} path={[...props.path, index()+1]} />
          }
        </For>
      </div>
      )
    </div>
  )
}
