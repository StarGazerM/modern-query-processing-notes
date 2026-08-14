mod integer;

use proc_macro::TokenStream;

// ANCHOR: arithmetic_entrypoints
#[proc_macro]
pub fn eval_integer(input: TokenStream) -> TokenStream {
    match integer::expand_expression(input.into()) {
        Ok(output) => output.into(),
        Err(error) => error.into_compile_error().into(),
    }
}
// ANCHOR_END: arithmetic_entrypoints

// ANCHOR: staged_entrypoints
#[proc_macro]
pub fn partial_integer(input: TokenStream) -> TokenStream {
    match integer::expand_partial(input.into()) {
        Ok(output) => output.into(),
        Err(error) => error.into_compile_error().into(),
    }
}

#[proc_macro]
pub fn residual_integer(input: TokenStream) -> TokenStream {
    match integer::expand_residual(input.into()) {
        Ok(output) => output.into(),
        Err(error) => error.into_compile_error().into(),
    }
}
// ANCHOR_END: staged_entrypoints
