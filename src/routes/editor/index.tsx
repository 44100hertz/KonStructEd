import type { Expression } from "~/parser/parser";
import ExpressionNode from "~/components/ExpressionNode";

export default function Editor() {
    return (
        <>
            <textarea />
            <ExpressionNode root={{kind: "placeholder"}}/>
            <pre />
        </>
    )
}
