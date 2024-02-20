use wasm_bindgen::prelude::*;
use serde::Serialize;
use serde_repr::*;

#[derive(Clone, Debug, Serialize_repr)]
#[wasm_bindgen]
#[repr(u8)]
pub enum Operator {
    Or,
    And,
    Eq,
    Neq,
    Le,
    Ge,
    Lt,
    Gt,
    Concat,
    Add,
    Sub,
    Mul,
    Div,
    Mod,
    Not,
    Len,
    Neg,
    Pow,
}

#[derive(Serialize)]
pub enum Node {
    Placeholder,
    Number(f64),
    String(String),
    Operator {
        op: Operator,
        args: Vec<Node>,
    },
}

