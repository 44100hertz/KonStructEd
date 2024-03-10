use crate::lexer::Token;
use crate::tree::*;

// Consider updating append:
// 1. All nodes should have "append" function on them
// 2. Every "append" should either fail with status, or pass and return (rest, new_tree)
// 3. Pass in the token slice instead of just one token
// 4. Tokens are peeked at until a valid/complete pattern is found

pub fn block_from_tokens<'a>(tokens: &'a [Token<'a>]) -> Block {
    fn parse<'a>(tokens: &'a [Token<'a>], expr: Expression<'a>) -> Expression<'a> {
        if tokens.len() == 0 {
            expr
        } else {
            // Either append result or skip
            match expr.append_tokens(tokens) {
                Ok((t,o)) => parse(t,o),
                Err(o) => parse(&tokens[1..], o),
            }
        }
    }
    let expr = parse(tokens, Expression::Placeholder);
    Block{
        body: vec![Statement::Call{
            args: vec![Expression::Ident("print"), expr]
        }]
    }
}

// ParseResult type.
// Result is either an updated token stream, or simply returning Self.
type PResult<'a, T> = Result<(&'a [Token<'a>], T), T>;

trait Node<'a> {
    fn append_tokens(self, t: &'a [Token<'a>]) -> PResult<'a, Expression<'a>>;
}

impl<'a> Node<'a> for Expression<'a> {
    fn append_tokens(self, tokens: &'a [Token<'a>]) -> PResult<'a, Self> {
        match tokens {
            [Token::Number(s), rest @ ..] => Ok((rest, self.append_value(Expression::Number(s)))),
            [Token::Bool(b), rest @ ..] => Ok((rest, self.append_value(Expression::Bool(*b)))),
            [Token::String(s), rest @ ..] => Ok((rest, self.append_value(Expression::String(s)))),
            [Token::Ident(s), rest @ ..] => Ok((rest, self.append_value(Expression::Ident(s)))),
            // Disambiguate Minus token using the simple rule that, if there is
            // nothing on the rightmost part of the tree, then it must be unary
            // because there is no left value. Otherwise, it is binary.
            [Token::Minus, rest @ ..] => if self.test_rightmost(
                |v|
                match v {
                    Expression::Placeholder => true,
                    _ => false
                })
            {
                Ok((rest,
                self.append_value(Expression::Operator {
                    op: Operator::Neg,
                    args: vec![Expression::Placeholder]
                })))
            } else {
                Ok((rest,
                self.append_binary_op(Operator::Sub)))
            },

            [Token::Operator(op), rest @ ..] => if op.is_unary() {
                Ok((rest,
                 self.append_value(Expression::Operator {
                     op: *op,
                     args: vec![Expression::Placeholder]
                 })))
            } else {
                Ok((rest,
                 self.append_binary_op(*op)))
            }
            // TODO: handle parenthesis
            // TODO: handle comma list. Comma should be operator?
            // TODO: handle dot. Dot should be operator?
            // TODO: handle square bracket indexing
            // TODO: handle Table
            // TODO: handle function definition
            [Token::DotDotDot, rest @ ..] => Ok((rest, self.append_value(Expression::DotDotDot))),
            _ => Err(self),
        }
    }

}

impl<'a> Expression<'a> {
    fn append_value(self, value: Expression<'a>) -> Self {
        match self {
            Expression::Placeholder => value,
            Expression::Nil
            | Expression::Bool(_)
            | Expression::Number(_)
            | Expression::String(_)
            | Expression::DotDotDot => {
                // TODO: Reject this parse
                // If right value is prefixp or "local", assume that it's an assignment.
                // Else, create unknown / implied operator
                self
            },
            Expression::Operator{op, args} => {
                // Recurse on last argument of operator
                Expression::Operator{
                    op,
                    args: replace_last(args, |expr| expr.append_value(value)),
                }
            },
            _ => self,
        }
    }

    fn append_binary_op(self, new_op: Operator) -> Self {
        if let Expression::Operator{op, mut args} = self {
            if op == new_op {
                // match same operation
                // Allows appending to same operator repeatedly.
                // 1 + 2 + 3 basically translates to (+ 1 2 3)
                args.push(Expression::Placeholder);
                Expression::Operator{
                    op,
                    args,
                }
            } else if let Expression::Operator{..} = args.last().unwrap() {
                // Recurse on right part of tree
                Expression::Operator{
                    op,
                    args: replace_last(args, |expr| expr.append_binary_op(new_op)),
                }
            } else if new_op.precedence() > op.precedence() {
                // Operator precedence is higher than tree,
                // so create a new binop expression and place it at end.
                Expression::Operator{
                    op,
                    // place rightmost leaf on left on new binop
                    args: replace_last(args, |last| Expression::Operator{
                        op: new_op,
                        args: vec![last, Expression::Placeholder]
                    }),
                }
            } else {
                Expression::Operator{op, args}.wrapped_in_op(new_op)
            }
        } else {
            self.wrapped_in_op(new_op)
        }
    }

    fn wrapped_in_op(self, op: Operator) -> Self {
        Expression::Operator{
            op,
            args: vec![self, Expression::Placeholder],
        }
    }

    // Check something about the rightmost child of this expression
    fn test_rightmost(&self, test: impl FnOnce(&Self) -> bool) -> bool {
       match self {
           Expression::Operator{args, ..} => args.last().unwrap().test_rightmost(test),
           _ => test(self),
       }
    }
}


fn replace_last<T>(mut args: Vec<T>, func: impl FnOnce(T) -> T) -> Vec<T> {
    let last = args.pop().unwrap();
    args.push(func(last));
    args
}
