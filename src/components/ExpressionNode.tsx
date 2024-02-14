import type { Expression } from "@/parser/parser";

export default function Node({root}: {root: Expression}) {
    return (
        <div>{root.kind}</div>
    )
}
