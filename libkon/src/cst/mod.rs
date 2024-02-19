use serde::Serialize;

#[derive(Serialize)]
pub enum Node {
    Placeholder,
    Number(f64),
    Operator {
        op: Operator,
        args: Vec<Node>,
    },
}

#[derive(Serialize)]
pub enum Operator {
    Add,
    Mul,
}
