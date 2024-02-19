mod lexer;
mod parser;

use crate::cst::{Node, Operator};

pub fn text_to_tree(text: &str) -> Node {
    Node::Operator {
        op: Operator::Add,
        args: vec![
            Node::Number(10.0),
            Node::Number(20.0),
        ],
    }
}
