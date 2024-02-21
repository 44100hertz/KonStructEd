use serde::Serialize;
use crate::cst::Operator;

// Potential optimizations:
// DONE: 1. Reduce heap allocation on strings, prefer &str
// DONE: 2. Deal with line endings instead of just replacing them (dubious)
// 3. Only try to replace idents with keywords, instead of scanning for all keywords
//
// Missing features:
// 1. Guess that string ends at line, return custom type for incomplete strings
// 2. Trim off windows line endings in multiline strings

use nom::{
    IResult,
    bytes::complete::{
        tag,
        is_not,
        take_until,
    },
    character::complete::{
        char as nom_char,
        one_of,
        satisfy,
        digit0,
        digit1,
        hex_digit0,
        hex_digit1,
        line_ending,
    },
    multi::{many0, many_m_n},
    branch::alt,
    sequence::{preceded, delimited, terminated, pair, tuple},
    combinator::{map, value, opt, recognize, all_consuming},
};

#[derive(Clone, Serialize)]
pub enum Token<'a> {
    Unknown(&'a str),
    Number(&'a str),
    Bool(bool),
    String(&'a str),
    Ident(&'a str),
    Operator(Operator),
    GotoLabel(&'a str),
    Nil,

    // CST specific
    LineBreak,
    Comment(&'a str),

    // Keywords
    Break,
    Do,
    Else,
    ElseIf,
    End,
    For,
    Function,
    Goto,
    If,
    In,
    Local,
    Repeat,
    Return,
    Then,
    Until,
    While,

    // Other Symbols
    LParen,
    RParen,
    LCurly,
    RCurly,
    LSquare,
    RSquare,
    Equals,
    Colon,
    Comma,
    Dot,
    DotDotDot,
}

pub fn lex_tokens(input: &str) -> Vec<Token> {
    let space = || many0(satisfy(|c| c.is_whitespace() && c != '\n'));
    let mut lex = all_consuming(many0(delimited(space(), lex_token, space())));
    match lex(input) {
        Ok((_, tokens)) => tokens,
        Err(_) => vec![Token::Unknown(input)],
    }
}

pub fn lex_token(input: &str) -> IResult<&str, Token> {
    alt((
        value(Token::LineBreak, line_ending),
        lex_multiline_comment,
        lex_multiline_string,
        lex_goto_label,
        lex_comment,
        lex_hexnum,
        lex_decimal,
        lex_string,
        lex_operator,
        lex_symbol,
        lex_keyword,
        lex_ident,
//        lex_unknown,
    ))(input)
}

fn lex_keyword(input: &str) -> IResult<&str, Token> {
    alt((
        value(Token::Break,    tag("break")),
        value(Token::Do,       tag("do")),
        value(Token::Else,     tag("else")),
        value(Token::ElseIf,   tag("elseif")),
        value(Token::End,      tag("end")),
        value(Token::For,      tag("for")),
        value(Token::Function, tag("function")),
        value(Token::Goto,     tag("goto")),
        value(Token::If,       tag("if")),
        value(Token::In,       tag("in")),
        value(Token::Local,    tag("local")),
        value(Token::Nil,      tag("nil")),
        value(Token::Repeat,   tag("repeat")),
        value(Token::Return,   tag("return")),
        value(Token::Then,     tag("then")),
        value(Token::Until,    tag("until")),
        value(Token::While,    tag("while")),
        value(Token::Bool(true),tag("true")),
        value(Token::Bool(false),tag("false")),
    ))(input)
}

fn lex_operator(input: &str) -> IResult<&str, Token> {
    alt((
        value(Token::Operator(Operator::Or),  tag("or")),
        value(Token::Operator(Operator::And), tag("and")),
        value(Token::Operator(Operator::Eq),  tag("==")),
        value(Token::Operator(Operator::Neq), tag("~=")),
        value(Token::Operator(Operator::Le),  tag("<=")),
        value(Token::Operator(Operator::Ge),  tag(">=")),
        value(Token::Operator(Operator::Lt),  tag("<")),
        value(Token::Operator(Operator::Gt),  tag(">")),
        value(Token::Operator(Operator::Concat), tag("..")),
        value(Token::Operator(Operator::Add), tag("+")),
        value(Token::Operator(Operator::Sub), tag("-")),
        value(Token::Operator(Operator::Mul), tag("*")),
        value(Token::Operator(Operator::Div), tag("/")),
        value(Token::Operator(Operator::Mod), tag("%")),
        value(Token::Operator(Operator::Not), tag("not")),
        value(Token::Operator(Operator::Len), tag("#")),
        value(Token::Operator(Operator::Pow), tag("^")),
    ))(input)
}

fn lex_symbol(input: &str) -> IResult<&str, Token> {
    alt((
        value(Token::LParen,    tag("(")),
        value(Token::RParen,    tag(")")),
        value(Token::LCurly,    tag("{")),
        value(Token::RCurly,    tag("}")),
        value(Token::LSquare,   tag("[")),
        value(Token::RSquare,   tag("]")),
        value(Token::Equals,    tag("=")),
        value(Token::Colon,     tag(":")),
        value(Token::Comma,     tag(",")),
        value(Token::Dot,       tag(".")),
        value(Token::DotDotDot, tag("...")),
    ))(input)
}

fn lex_comment(input: &str) -> IResult<&str, Token> {
    map(
        preceded(tag("--"), is_not("\n")),
        |s: &str| Token::Comment(s)
    )(input)
}

fn lex_multiline_comment(input: &str) -> IResult<&str, Token> {
    map(
        delimited(
            tag("--[["),
            take_until("]]"),
            tag("]]"),
        ),
        |s: &str| Token::Comment(s)
    )(input)
}

pub fn name(input: &str) -> IResult<&str, &str> {
    recognize(pair(
        satisfy(|c| c.is_alphabetic() || c == '_'),
        many0(satisfy(|c| c.is_alphanumeric() || c == '_')),
    ))(input)
}

fn lex_ident(input: &str) -> IResult<&str, Token> {
    map(name, |s| Token::Ident(s))(input)
}

fn lex_decimal(input: &str) -> IResult<&str, Token> {
    map(
    recognize(pair(
        alt((
            tuple((digit1, alt((tag("."), tag(""))), digit0)),
            tuple((digit0, tag("."), digit1))
        )),
        opt(lex_exponent("eEpP")),
    )),
        |s| Token::Number(s)
    )(input)
}

fn lex_hexnum(input: &str) -> IResult<&str, Token> {
    map(
    recognize(tuple((
        tag("0x"),
        alt((
            tuple((hex_digit1, alt((tag("."), tag(""))), hex_digit0)),
            tuple((hex_digit0, tag("."), hex_digit1))
        )),
        opt(lex_exponent("pP")),
    ))),
        |s: &str| Token::Number(s)
    )(input)
}

fn lex_exponent<'a>(letters: &'a str) -> impl FnMut(&'a str) -> IResult<&'a str, &'a str> {
    recognize(tuple((
        one_of(letters),
        alt((tag("+"), tag("-"), tag(""))),
        digit1,
    )))
}

fn lex_string(input: &str) -> IResult<&str, Token> {
    one_of("'\"")(input).and_then(
        |(rest, delim)| {
            let inner_char = satisfy(|c: char| c != delim && c != '\\' && c != '\n');
            map(
                terminated(
                    recognize(many0(alt((
                        recognize(inner_char),
                        //lex_decimal_string_escape,
                        lex_hex_string_escape,
                        lex_unicode_string_escape,
                        lex_string_escape,
                        lex_z_escape,
                    )))),
                    nom_char(delim)
                ),
                |s: &str| Token::String(s)
            )(rest)
        })
}

fn lex_multiline_string(input: &str) -> IResult<&str, Token> {
    // Must match same number of '=' on opening and closing delims
    tuple((tag("["), recognize(many0(nom_char('='))), tag("["), opt(line_ending)))(input)
        .and_then(|(rest, (_, equ, _, _)): (&str, (_, &str, _, _))| {
            let ending = || format!("]{}]", equ);
            map(
                terminated(
                    recognize(take_until(ending().as_str())),
                    tag(ending().as_str())
                ),
                |s: &str| Token::String(s)
            )(rest)
        })
}


fn lex_string_escape(input: &str) -> IResult<&str, &str> {
    alt((
        tag("\\a"),
        tag("\\b"),
        tag("\\f"),
        tag("\\n"),
        tag("\\r"),
        tag("\\t"),
        tag("\\v"),
        tag("\\'"),
        tag("\\\""),
        tag("\\\\"),
    ))(input)
}

fn lex_z_escape(input: &str) -> IResult<&str, &str> {
    map(pair(
        tag("\\z"),
        many0(satisfy(|c| c.is_whitespace() || c == '\n'))
    ), |_| "\\z\n")(input)
}

// // Not needed, since the char code is not actually parsed
// fn lex_decimal_string_escape(input: &str) -> IResult<&str, String> {
//     map(
//         pair(
//             tag("\\"),
//             many_m_n(1, 3, satisfy(|c| c.is_digit(10)))
//         ), |(_, s): (&str, Vec<char>)| "\\".to_string() + &s.iter().collect::<String>()
//     )(input)
// }

fn lex_hex_string_escape(input: &str) -> IResult<&str, &str> {
    recognize(
        pair(
            tag("\\x"),
            many_m_n(2, 2, satisfy(|c| c.is_digit(16)))
        )
    )(input)
}

fn lex_unicode_string_escape(input: &str) -> IResult<&str, &str> {
    recognize(
        tuple((
            tag("\\u{"),
            hex_digit1,
            tag("}"),
        ))
    )(input)
}

fn lex_goto_label(input: &str) -> IResult<&str, Token> {
    map(
        delimited(
            tag("::"),
            name,
            tag("::"),
        ),
        |s: &str| Token::GotoLabel(s)
    )(input)
}

// fn lex_unknown(input: &str) -> IResult<&str, Token> {
//     map(
//         recognize(many0(satisfy(|w| !w.is_whitespace()))),
//         |c: &str| Token::Unknown(c.to_string())
//     )(input)
// }
