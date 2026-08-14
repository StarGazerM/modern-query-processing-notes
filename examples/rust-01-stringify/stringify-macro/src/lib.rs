use proc_macro::TokenStream;
use proc_macro2::{Span, TokenStream as TokenStream2};
use quote::quote;
use syn::LitStr;

#[proc_macro]
pub fn code_string(input: TokenStream) -> TokenStream {
    let input = TokenStream2::from(input);
    let written_input = input.to_string();
    let output_literal = LitStr::new(&written_input, Span::call_site());
    quote! { #output_literal }.into()
}
