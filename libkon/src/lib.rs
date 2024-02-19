mod parser; // Error-resistent lua CST parser, unparser
mod cst; // Functions for construction and manipulation of CST
mod editor; // Tree editing functions, selection, etc.

use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn text_to_tree(text: &str) -> Result<JsValue, JsValue> {
    let tree = parser::text_to_tree(text);
    Ok(serde_wasm_bindgen::to_value(&tree)?)
}
