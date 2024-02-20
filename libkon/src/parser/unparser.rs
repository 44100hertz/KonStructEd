use wasm_bindgen::prelude::*;
use crate::cst::Operator;

#[wasm_bindgen]
pub fn operator_to_string(op: Operator) -> String {
    op.to_symbol().to_string()
}

impl Operator {
    fn to_symbol(&self) -> &str {
        match self {
            Operator::Or => "or",
            Operator::And => "and",
            Operator::Eq => "==",
            Operator::Neq => "~=",
            Operator::Le => "<=",
            Operator::Ge => ">=",
            Operator::Lt => "<",
            Operator::Gt => ">",
            Operator::Concat => "..",
            Operator::Add => "+",
            Operator::Sub => "-",
            Operator::Mul => "*",
            Operator::Div => "/",
            Operator::Mod => "%",
            Operator::Not => "not",
            Operator::Len => "#",
            Operator::Neg => "-",
            Operator::Pow => "^",
        }
    }
}
