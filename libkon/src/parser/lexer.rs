use serde::Serialize;
use crate::cst::Operator;

// Potential optimizations:
// 1. Reduce heap allocation on strings, prefer &str
// 2. Deal with line endings instead of just replacing them (dubious)
// 3. Only try to replace idents with keywords, instead of scanning for all keywords
// 4. Use a custom lexer instead of nom
//
// Potential features:
// 1. Guess that string ends at line, return custom type

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
        alpha1,
        alphanumeric1,
        digit0,
        digit1,
        hex_digit0,
        hex_digit1,
        space0,
        multispace0,
    },
    multi::{many0, many_m_n},
    branch::alt,
    sequence::{preceded, delimited, terminated, pair, tuple},
    combinator::{map, value, opt, all_consuming},
};

#[derive(Clone, Serialize)]
pub enum Token {
    Unknown,
    Number(String),
    Bool(bool),
    String(String),
    Ident(String),
    Operator(Operator),
    GotoLabel(String),
    Nil,

    // CST specific
    LineBreak,
    Comment(String),

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
    let clean_input = input.replace("\r\n", "\n").replace("\r", "\n");
    match lex_clean(clean_input.as_str()) {
        Ok((_, tokens)) => tokens,
        Err(_) => vec![Token::Unknown],
    }
}

fn lex_clean(input: &str) -> IResult<&str, Vec<Token>> {
    let space = || alt((space0, tag(";")));
    all_consuming(many0(delimited(space(), lex_token, space())))(input)
}

pub fn lex_token(input: &str) -> IResult<&str, Token> {
    alt((
        value(Token::LineBreak, nom_char('\n')),
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
        |s: &str| Token::Comment(s.to_string())
    )(input)
}

fn lex_multiline_comment(input: &str) -> IResult<&str, Token> {
    map(
        delimited(
            tag("--[["),
            take_until("]]"),
            tag("]]"),
        ),
        |s: &str| Token::Comment(s.to_string())
    )(input)
}

pub fn name(input: &str) -> IResult<&str, String> {
    map(
        pair(
            alt((alpha1, tag("_"))),
            many0(alt((alphanumeric1, tag("_")))),
        ),
        |(s, ss): (&str, Vec<&str>)| s.to_string() + &ss.join("")
    )(input)
}

pub fn lex_ident(input: &str) -> IResult<&str, Token> {
    map(name, |n| Token::Ident(n))(input)
}

fn lex_decimal(input: &str) -> IResult<&str, Token> {
    map(
    pair(
        alt((
            tuple((digit1, alt((tag("."), tag(""))), digit0)),
            tuple((digit0, tag("."), digit1))
        )),
        opt(lex_exponent("eEpP")),
    ),|((integer, dot, decimal), exp): ((&str, &str, &str), Option<String>)|
        Token::Number(integer.to_string() + dot + decimal + &exp.unwrap_or("".to_string()))
    )(input)
}

fn lex_hexnum(input: &str) -> IResult<&str, Token> {
    map(
    tuple((
        tag("0x"),
        alt((
            tuple((hex_digit1, alt((tag("."), tag(""))), hex_digit0)),
            tuple((hex_digit0, tag("."), hex_digit1))
        )),
        opt(lex_exponent("pP")),
    )),
    |(_, (integer, dot, decimal), exp): (&str, (&str, &str, &str), Option<String>)|
        Token::Number("0x".to_string() + integer + dot + decimal + &exp.unwrap_or("".to_string()))
    )(input)
}

fn lex_exponent<'a>(letters: &'a str) -> impl FnMut(&'a str) -> IResult<&'a str, String> {
    map(
    tuple((
        one_of(letters),
        alt((tag("+"), tag("-"), tag(""))),
        digit1,
    )),
    |(exp, sign, digits): (char, &str, &str)|
        exp.to_string() + sign + digits
    )
}

fn lex_string(input: &str) -> IResult<&str, Token> {
    map(
        alt((
            lex_string_delim('"'),
            lex_string_delim('\''),
        )),
        |s: String| Token::String(s)
    )(input)
}

fn lex_multiline_string(input: &str) -> IResult<&str, Token> {
    // Must match same number of '=' on opening and closing delims
    tuple((tag("["), many0(tag("=")), tag("["), opt(nom_char('\n'))))(input)
        .and_then(|(rest, (_, equ, _, _)): (&str, (_, Vec<&str>, _, _))| {
            let ending = || format!("]{}]", equ.join(""));
            map(terminated(
                take_until(ending().as_str()),
                tag(ending().as_str())
            ), |s: &str| Token::String(s.to_string()))(rest)
        })
}

fn lex_string_delim<'a>(delim: char) -> impl FnMut(&'a str) -> IResult<&'a str, String> {
    let inner_char = satisfy(move |c: char| c != delim && c != '\\' && c != '\n');
    map(
        delimited(
            satisfy(move |c: char| c == delim),
            many0(alt((
                map(inner_char, |c: char| c.to_string()),
                //lex_decimal_string_escape,
                lex_hex_string_escape,
                lex_unicode_string_escape,
                lex_string_escape,
                lex_z_escape,
            ))),
            satisfy(move |c: char| c == delim),
        ),
        |s: Vec<String>| s.join("")
    )
}

fn lex_string_escape(input: &str) -> IResult<&str, String> {
    map(
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
        )),
        str::to_string
    )(input)
}

fn lex_z_escape(input: &str) -> IResult<&str, String> {
    map(pair(
        tag("\\z"),
        multispace0,
    ), |_| "\\z\n".to_string())(input)
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

fn lex_hex_string_escape(input: &str) -> IResult<&str, String> {
    map(
        pair(
            tag("\\x"),
            many_m_n(2, 2, satisfy(|c| c.is_digit(16)))
        ), |(_, s): (&str, Vec<char>)| "\\x".to_string() + &s.iter().collect::<String>()
    )(input)
}

fn lex_unicode_string_escape(input: &str) -> IResult<&str, String> {
    map(
    tuple((
        tag("\\u{"),
        hex_digit1,
        tag("}"),
    )), |(_, s, _): (&str, &str, &str)|
        "\\u{".to_string() + s + "}"
    )(input)
}

fn lex_goto_label(input: &str) -> IResult<&str, Token> {
    map(
        delimited(
            tag("::"),
            name,
            tag("::"),
        ),
        |s: String| Token::GotoLabel(s)
    )(input)
}
