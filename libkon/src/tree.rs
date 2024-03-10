pub mod operator;

pub use operator::{Operator, Precedence};
use serde::Serialize;

#[derive(Clone, Serialize)]
pub struct Block<'a> {
    pub body: Vec<Statement<'a>>,
}

#[derive(Clone, Serialize)]
#[serde(tag = "kind", content = "value")]
pub enum Statement<'a> {
    Declare{
        list: Vec<(&'a str, Expression<'a>)>,
    },
    Assign{
        list: Vec<(Expression<'a>, Expression<'a>)>,
    },
    Break,
    DoBlock(Block<'a>),
    WhileBlock{
        exp: Expression<'a>,
        block: Block<'a>,
        repeat_until: bool,
    },
    ForRangeBlock{
        var: &'a str,
        lower: Expression<'a>,
        upper: Expression<'a>,
        step: Option<Expression<'a>>,
        block: Block<'a>,
    },
    ForIterBlock{
        namelist: Vec<&'a str>,
        explist: Vec<Expression<'a>>,
        block: Block<'a>,
    },
    IfBlock{
        branches: Vec<(Expression<'a>, Block<'a>)>,
        elsebranch: Option<Box<Block<'a>>>,
    },
    RetList{
        list: Vec<Expression<'a>>
    },
    Call{
        args: Vec<Expression<'a>>
    },
    Goto(&'a str),
    GotoLabel(&'a str),
}

#[derive(Clone, Serialize)]
pub struct FunDef<'a> {
    pub args: Vec<&'a str>,
    pub vararg: bool,
    pub body: Block<'a>,
}

#[derive(Clone, Serialize)]
#[serde(tag = "kind", content = "value")]
pub enum Expression<'a> {
    Placeholder,
    Nil,
    Bool(bool),
    Number(&'a str),
    String(&'a str),
    Ident(&'a str),
    DotDotDot,
    FunDef(FunDef<'a>),
    Table(Table<'a>),
    Operator {
        op: Operator,
        args: Vec<Expression<'a>>,
    },
}

pub type Table<'a> = Vec<Field<'a>>;

#[derive(Clone, Serialize)]
pub struct Field<'a> {
    key: Expression<'a>,
    value: Expression<'a>,
}
