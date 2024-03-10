import { For, Show, children } from "solid-js";
import { Expression, Statement } from '~/parser/parser';
import { JSX } from 'solid-js';

export interface Node {
    path: number[];
    node: Expression | Statement;
    render(): JSX.Element;
    childNodes(): Node[] | null;
}

function renderNode(props: {node: Node}) {
    function NodeContent(props: {node: Node, children: JSX.Element}) {
        return (
            <node.root()>
                {props.children}
            </node.root>

        )
    }

    return (
        <div style={{"--depth": props.node.path.length}}
             classList={{nodeWrapper: true}}>
            {/* classList={{nodeWrapper: true, selected: selected()}}
                onClick={onClick}> */}
            <NodeContent {...props}>
                <Show when={props.node.childNodes() !== null}>
                    <For each={props.node.childNodes()}>
                        {(child: Node) => child.render()}
                    </For>
                </Show>
            </NodeContent>
        </div>
    )
}
