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

// ANCHOR: partial_syntax
mod kw {
    syn::custom_keyword!(known);
    syn::custom_keyword!(residual);
}

#[derive(syn_derive::Parse, syn_derive::ToTokens)]
struct PartialInteger {
    known_token: kw::known,
    binding: Ident,
    eq_token: Token![=],
    known_expression: IntegerExpr,
    known_semi_token: Token![;],
    residual_token: kw::residual,
    residual_expression: Expr,
    residual_semi_token: Token![;],
}
// ANCHOR_END: partial_syntax

// ANCHOR: expression_expansion
pub(crate) fn expand_expression(input: TokenStream) -> syn::Result<TokenStream> {
    let expression: IntegerExpr = syn::parse2(input)?;
    let value = evaluate(&expression)?;
    Ok(quote! { #value })
}
// ANCHOR_END: expression_expansion

// ANCHOR: staged_expansion
pub(crate) fn expand_partial(input: TokenStream) -> syn::Result<TokenStream> {
    let partial: PartialInteger = syn::parse2(input)?;
    let binding = partial.binding;
    let known_value = evaluate(&partial.known_expression)?;
    let residual_expression = partial.residual_expression;

    let residual: syn::Block = syn::parse2(quote! {{
        let #binding: i64 = #known_value;
        #residual_expression
    }})?;

    Ok(quote! {
        residual_integer!(#residual)
    })
}

pub(crate) fn expand_residual(input: TokenStream) -> syn::Result<TokenStream> {
    let residual: syn::Block = syn::parse2(input)?;
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
        // ANCHOR: fibonacci_meaning
        ("fib", 1) => {
            let argument = evaluate(&call.arguments[0])?;
            if !(0..=40).contains(&argument) {
                return Err(syn::Error::new_spanned(
                    &call.arguments[0],
                    "fib(n) requires 0 <= n <= 40 in this teaching example",
                ));
            }
            Ok(fibonacci(argument as u32))
        }
        // ANCHOR_END: fibonacci_meaning
        _ => Err(syn::Error::new_spanned(
            call,
            "expected add(left, right), multiply(left, right), or fib(n)",
        )),
    }
}
// ANCHOR_END: interpreter

// ANCHOR: slow_computation
fn fibonacci(n: u32) -> i64 {
    match n {
        0 => 0,
        1 => 1,
        _ => fibonacci(n - 1) + fibonacci(n - 2),
    }
}
// ANCHOR_END: slow_computation

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
    fn partial_expansion() {
        let output = expand_partial(quote! {
            known compiled = add(2, multiply(3, 4));
            residual x + compiled;
        })
        .unwrap();

        println!("{output}");

        let invocation: syn::ExprMacro = syn::parse2(output).unwrap();
        assert!(invocation.mac.path.is_ident("residual_integer"));

        let residual: syn::Block = syn::parse2(invocation.mac.tokens).unwrap();
        assert_eq!(residual.stmts.len(), 2);
        assert_eq!(
            residual.to_token_stream().to_string(),
            "{ let compiled : i64 = 14i64 ; x + compiled }"
        );
    }
}
