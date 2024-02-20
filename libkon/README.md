# LibKon
KonStructEd is based on the bedrock Rust library LibKon, which is used to parse
Lua CST!! (not AST) for the purpose of structure editing. Why should this exist?
Read on...

# Parser Design
Conventional parsers must be modified to create an effective structure editor.

Most parsers create an AST (abstract syntax tree), but structure parsers create
a CST (concrete syntax tree). This is because the parser must take note of
things that affect the code appearance and not just the code output.

It can also skip over the entire parsing phase where the AST is turned into a
computer program, and all parts of parsing geared exclusively towards those
ends. Things such as parsing numbers or unescaping strings are totally optional.
The parser will never evaluate the code in question, but it can possibly be
integrated with "smart" features in an IDE-like way, by translating from CST
into AST or text.

The parser should provide error feedback, but should almost NEVER give up when
creating structure. Instead, it should use sane fallbacks as to always create an
editable CST, within reason. Every CST should correspond almost 1:1 with
corresponding code, whether that code is valid or invalid.

## Special CST Nodes/Properties
The CST has nodes and properties of nodes that wouldn't reasonably exist in an
AST, for the reasons above. These include, but are not limited to:
 - Comments: All comments are editable text nodes.
 - Parens: Even when parens have no functional purpose, they should be preserved
   to some extent for clarity.
 - Placeholder: A node for anything that should be there, but isn't.
 - Whitespace: Newlines and line breaks should be taken note of. Every
   expression/subexpression is either written vertically or horizontally.
 - Implied operator: When two values are next to each other, a placeholder
   "implied operator" sits between them.
 - Unmatched: Unmatched parens should find the nearest valid implied paren, but
   never fail unless it's totally impossible. The CST must take note of the fact
   that it is unmatched.
 - Unknown: Any region of code that can't be reasonably solved is "Unknown" and
   can be edited as text.
 - Extension nodes: Common patterns exist within code that can be defined in a
   special structure-only node. These would likely be created using plugins, and
   could appear in many ways in the structure editing UI, marked either by
   special comments or by a specific structure match.
   
## Editor
LibKon also provides features for editing the CST, ideally for integration with
an Editor UI, such as the one currently built around it. This enables
modifications to the CST such as adding or removing nodes in a way that
preserves an essential axiom of KonStructEd: the CST and source text must have a
1:1 mapping between each other.

## Unparser
The "unparser" or serializer is used to write the edited structure back to
source text. In practice, it has to act much like a prettifier.
