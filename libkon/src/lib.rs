mod tree;
mod lexer;
mod parser;
mod unparser;
mod utils;

use wasm_bindgen::prelude::*;

pub use tree::operator::Operator;
pub use lexer::Token;
pub use lexer::name;

use parser::block_from_tokens;

#[wasm_bindgen]
pub fn is_ident(input: &str) -> bool {
    name(input).is_ok()
}

#[wasm_bindgen]
pub fn operator_to_string(op: Operator) -> String {
    op.to_symbol().to_string()
}

#[wasm_bindgen]
pub fn get_precedence(op: Operator) -> u8 {
    op.precedence()
}

#[wasm_bindgen]
pub fn string_to_tree(input: &str) -> Result<JsValue, JsValue> {
    let tokens = lexer::lex_tokens(input);
    let tree = block_from_tokens(tokens.as_slice());
    Ok(serde_wasm_bindgen::to_value(&tree)?)
}

// #[wasm_bindgen]
// pub fn text_to_tree(text: &str) -> Result<JsValue, JsValue> {
//     let tree = parser::text_to_tree(text);
//     Ok(serde_wasm_bindgen::to_value(&tree)?)
// }
