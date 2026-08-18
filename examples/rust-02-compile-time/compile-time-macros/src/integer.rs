use proc_macro2::TokenStream;
use quote::quote;
use syn::punctuated::Punctuated;
use syn::{Expr, Ident, LitInt, Token, token};

// ANCHOR: integer_choice
#[derive(syn_derive::Parse, syn_derive::ToTokens)]
enum IntegerExpr {
    #[parse(peek = LitInt)]
    Literal {
        value: LitInt,
    },
    Call(IntegerCall),
}
// ANCHOR_END: integer_choice

// ANCHOR: integer_call
#[derive(syn_derive::Parse, syn_derive::ToTokens)]
struct IntegerCall {
    function: Ident,
    #[syn(parenthesized)]
    paren_token: token::Paren,
    #[syn(in = paren_token)]
    #[parse(Punctuated::parse_terminated)]
    arguments: Punctuated<IntegerExpr, Token![,]>,
}
// ANCHOR_END: integer_call

// ANCHOR: comparison_syntax
#[derive(syn_derive::Parse, syn_derive::ToTokens)]
struct EvalAndCompare {
    known_expression: IntegerExpr,
    eq_eq_token: Token![==],
    outside_expression: Expr,
}
// ANCHOR_END: comparison_syntax

// ANCHOR: expression_expansion
pub(crate) fn expand_expression(input: TokenStream) -> syn::Result<TokenStream> {
    let expression: IntegerExpr = syn::parse2(input)?;
    let value = evaluate(&expression)?;
    Ok(quote! { #value })
}
// ANCHOR_END: expression_expansion

// ANCHOR: staged_expansion
pub(crate) fn expand_compare(input: TokenStream) -> syn::Result<TokenStream> {
    let comparison: EvalAndCompare = syn::parse2(input)?;
    let known_expression = comparison.known_expression;
    let eq_eq_token = comparison.eq_eq_token;
    let outside_expression = comparison.outside_expression;

    let residual: Expr = syn::parse2(quote! {
        eval_integer!(#known_expression) #eq_eq_token #outside_expression
    })?;

    Ok(quote! { #residual })
}
// ANCHOR_END: staged_expansion

// ANCHOR: interpreter
// ANCHOR: expression_dispatch
fn evaluate(expression: &IntegerExpr) -> syn::Result<i64> {
    match expression {
        IntegerExpr::Literal { value } => value.base10_parse(),
        IntegerExpr::Call(call) => evaluate_call(call),
    }
}
// ANCHOR_END: expression_dispatch

fn evaluate_call(call: &IntegerCall) -> syn::Result<i64> {
    match (call.function.to_string().as_str(), call.arguments.len()) {
        // ANCHOR: arithmetic_meaning
        ("add", 2) => Ok(evaluate(&call.arguments[0])? + evaluate(&call.arguments[1])?),
        ("multiply", 2) => Ok(evaluate(&call.arguments[0])? * evaluate(&call.arguments[1])?),
        // ANCHOR_END: arithmetic_meaning
        _ => Err(syn::Error::new_spanned(
            call,
            "expected add(left, right) or multiply(left, right)",
        )),
    }
}
// ANCHOR_END: interpreter

#[cfg(test)]
mod tests {
    use super::*;
    use quote::{ToTokens, quote};

    #[test]
    fn arithmetic_syntax_round_trips() {
        let input = quote! { add(2, multiply(3, 4)) };
        let expression: IntegerExpr = syn::parse2(input.clone()).unwrap();
        assert_eq!(expression.to_token_stream().to_string(), input.to_string());
    }

    #[test]
    fn folds_arithmetic_before_emission() {
        let output = expand_expression(quote! { add(2, multiply(3, 4)) }).unwrap();
        assert_eq!(output.to_string(), "14i64");
    }

    #[test]
    fn comparison_expansion() {
        let output = expand_compare(quote! {
            add(2, multiply(3, 4)) == x
        })
        .unwrap();

        println!("{output}");

        let residual: Expr = syn::parse2(output).unwrap();
        let Expr::Binary(comparison) = residual else {
            panic!("expected a residual comparison");
        };
        assert!(matches!(comparison.op, syn::BinOp::Eq(_)));

        let Expr::Macro(known) = *comparison.left else {
            panic!("expected the left side to remain an eval_integer! invocation");
        };
        assert!(known.mac.path.is_ident("eval_integer"));
        assert_eq!(known.mac.tokens.to_string(), "add (2 , multiply (3 , 4))");
        assert_eq!(comparison.right.to_token_stream().to_string(), "x");
    }
}
