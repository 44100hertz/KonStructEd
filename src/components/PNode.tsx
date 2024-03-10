import { For, Show, Dynamic } from "solid-js";
import { Expression, Statement } from '~/parser/parser';
import { JSX } from 'solid-js';

export interface PNode {
    path: number[];
    node: Expression | Statement;
    render(): JSX.Element;
    childNodes(): PNode[] | null;
}

function renderNode(props: {node: PNode}) {
    return (
        <div style={{"--depth": props.node.path.length}}
             classList={{nodeWrapper: true}}>
            {/* classList={{nodeWrapper: true, selected: selected()}}
                onClick={onClick}> */}
            <Dynamic component={props.node.render()}>
                <Show when={props.node.childNodes() !== null}>
                    <For each={props.node.childNodes()}>
                        {(child: PNode) => child.render()}
                    </For>
                </Show>
            </NodeContent>
        </div>
    )
}
