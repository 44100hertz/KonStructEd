mod parser; // Error-resistent lua CST parser, unparser
mod cst; // Functions for construction and manipulation of CST
mod editor; // Tree editing functions, selection, etc.

use wasm_bindgen::prelude::*;

pub use cst::Operator;
pub use parser::lexer::Token;
pub use parser::unparser::operator_to_string;
pub use parser::lexer::name;

#[wasm_bindgen]
pub fn is_ident(input: &str) -> bool {
    name(input).is_ok()
}

#[wasm_bindgen]
pub fn lex_tokens(input: &str) -> Result<JsValue, JsValue> {
    let tokens = parser::lexer::lex_tokens(input);
    Ok(serde_wasm_bindgen::to_value(&tokens)?)
}

// #[wasm_bindgen]
// pub fn text_to_tree(text: &str) -> Result<JsValue, JsValue> {
//     let tree = parser::text_to_tree(text);
//     Ok(serde_wasm_bindgen::to_value(&tree)?)
// }
