use proc_macro2::TokenStream;
use quote::quote;
use syn::{BinOp, Expr, ExprBinary, ExprCall, ExprLit, ExprPath, Ident, Lit, Token};

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
    known_expression: Expr,
    known_semi_token: Token![;],
    residual_token: kw::residual,
    residual_expression: Expr,
    residual_semi_token: Token![;],
}
// ANCHOR_END: partial_syntax

// ANCHOR: expression_expansion
pub(crate) fn expand_expression(input: TokenStream) -> syn::Result<TokenStream> {
    let expression: Expr = syn::parse2(input)?;
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
fn evaluate(expression: &Expr) -> syn::Result<i64> {
    match expression {
        // ANCHOR: arithmetic_cases
        Expr::Lit(ExprLit {
            lit: Lit::Int(literal),
            ..
        }) => literal.base10_parse(),
        Expr::Binary(ExprBinary {
            left, op, right, ..
        }) => {
            let left = evaluate(left)?;
            let right = evaluate(right)?;
            match op {
                BinOp::Add(_) => Ok(left + right),
                BinOp::Mul(_) => Ok(left * right),
                _ => Err(syn::Error::new_spanned(
                    op,
                    "the integer interpreter supports only + and *",
                )),
            }
        }
        // ANCHOR_END: arithmetic_cases
        Expr::Call(call) => evaluate_call(call),
        _ => Err(syn::Error::new_spanned(
            expression,
            "expected integer arithmetic or fib(n)",
        )),
    }
}
// ANCHOR_END: interpreter

fn evaluate_call(call: &ExprCall) -> syn::Result<i64> {
    let Expr::Path(ExprPath {
        qself: None, path, ..
    }) = call.func.as_ref()
    else {
        return Err(syn::Error::new_spanned(
            &call.func,
            "the integer interpreter recognizes only fib(n)",
        ));
    };

    if !path.is_ident("fib") || call.args.len() != 1 {
        return Err(syn::Error::new_spanned(
            call,
            "the integer interpreter recognizes exactly one call shape: fib(n)",
        ));
    }

    let argument = evaluate(&call.args[0])?;
    if !(0..=40).contains(&argument) {
        return Err(syn::Error::new_spanned(
            &call.args[0],
            "fib(n) requires 0 <= n <= 40 in this teaching example",
        ));
    }

    Ok(fibonacci(argument as u32))
}

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
    fn folds_arithmetic_before_emission() {
        let output = expand_expression(quote! { 2 + 3 * 4 }).unwrap();
        assert_eq!(output.to_string(), "14i64");
    }

    #[test]
    fn partial_expansion() {
        let output = expand_partial(quote! {
            known compiled = fib(20);
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
            "{ let compiled : i64 = 6765i64 ; x + compiled }"
        );
    }
}
