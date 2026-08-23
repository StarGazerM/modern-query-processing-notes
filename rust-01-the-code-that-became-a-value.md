---
title: The Code That Became a Value
subtitle: Rust Conversation R.1 — From Macro Input to a Typed Syntax Value
author: Modern Query Processing
date: Fall 2026
status: Work in progress
layout: dialogue
left_speaker: Ada
right_speaker: Alice
previous: [Rust Guide R.0.0 · The Rust We Need](rust-00-the-tree-we-could-read-twice.html)
next: [Rust Conversation R.2 · The Arithmetic That Ran Before the Program](rust-02-the-arithmetic-that-ran-before-the-program.html)
---

:::ada
```rust
stringify!(1);
```
:::alice
What is `stringify`?
:::

:::ada
It takes a Rust expression as input and turns it into a string.
:::alice
"1"
:::

:::ada
```rust
stringify!(1+1);
```
:::alice
"2"
:::

:::ada
No, it actually gives you something like `"1 + 1"`.
:::alice
Ooooh—it turns the **expression itself** into a string.
:::

:::ada
```rust
let x = 1 + 1;
stringify!(x);
```
:::alice
"x"
:::

:::ada
What does this macro receive and return?
:::alice
It did not receive the value of `x`; it received the written code. Does a macro
take code and return replacement code?
:::

:::ada
Exactly. `stringify!` takes the tokens spelling `1 + 1` as input and returns new
tokens spelling another expression—`"1 + 1"`.

```rust
stringify!(relation edge(src: i32, dst: i32);)
```
:::alice
"relation edge(src: i32, dst: i32);"

But `relation edge(src: i32, dst: i32);` is our database language, not a Rust
expression. Why did `stringify!` accept it?
:::

:::ada
Because `stringify!` runs before Rust checks whether the tokens inside its
invocation form a Rust expression. At first, Rust only needs to tokenize the
contents and find balanced delimiters.
:::alice
So the macro can define what its input tokens mean, even when they are not an
ordinary Rust expression.
:::

:::ada
Right. What is a compiler?
:::alice
A compiler turns code into a binary.
:::

:::ada
Roughly, but not quite. A compiler translates code written in one language into
code in another language. The target might be another source language,
assembly, or machine code.

So, conceptually, we can begin with:

```text
Compiler : Code -> Code
```
:::alice
Wait. `stringify!` also takes code as input and returns code. But it is a macro,
not a compiler.
:::

:::ada
Who said that a macro cannot be a compiler?
:::alice
What? Then, what's the difference between a compiler and a macro?
:::

:::ada
What kind of code does `stringify!` return?
:::alice
Rust code: a string-literal expression.
:::

:::ada
`macro` and `compiler` answer different questions. Calling something a macro
tells us its expansion mechanism. Calling it a compiler describes a semantic
job: translating a program from one language or stage into another. A macro can
implement a compiler stage; not every macro is usefully understood as a
compiler.

One way to build a compiler is to chain a series of macro calls. Each expansion
makes one small change to the syntax and produces the next stage. After several
rounds of expansion, our query has become ordinary Rust. The Rust compiler can
then continue from Rust to assembly and machine code.

In this course, we will use this idea to build a compiler for a database query
language. It will compile a database query into Rust code.
:::alice
Okay. That sounds strange. Why use macro to build the compiler?
:::

:::ada
At the end of database Conversation 1.2, we had a query \(q\), a database
instance \(I\), and the result relation \(q(I)\). Earlier, we represented each
relation instance in Rust as a `HashSet`.

What would a `HashSet` look like in assembly?
:::alice
Okay, I see. We do not need to implement the database instance's `HashSet`
representation in assembly ourselves.

Our macro can transform \(q\) into ordinary Rust code that accepts the
`HashSet`s representing \(I\) and computes \(q(I)\). Then `rustc` can compile
that Rust, and we can reuse Rust's types, standard library, and build system,
Cargo.
:::

:::ada
Before we learn how to write the whole database-query compiler, let us learn how
a macro works.

Try to implement `stringify!`.
:::alice
Wait—I do not know how to write a macro. What is the first step? Do I define a
function named `stringify` and mark it as a macro?
:::

:::ada
Almost. Rust already has a built-in macro named `stringify!`, so we will give
ours the distinct name `code_string!`.

Before we write the function, look at the files Cargo uses in the runnable
example:

```text
examples/rust-01-stringify/
├── Cargo.toml
├── stringify-macro/
│   ├── Cargo.toml
│   └── src/
│       └── lib.rs
└── demo/
    ├── Cargo.toml
    └── src/
        └── main.rs
```
:::alice
Why are there three `Cargo.toml` files? I expected one program to have one.
:::

:::ada
Rust requires the procedural macro and the code using it to be in different
**crates**. The macro crate must already be compiled before rustc can run it
while compiling the demo crate.

The two nested manifests describe those two crates. The top manifest only groups
them so one command can build both; it is not a third program.
:::alice
So the important fact is not “three manifests.” It is that the procedural macro
must stay in its own crate.
:::

:::ada
Exactly. I prepare that shell before the meeting. We will read the caller, then
write the macro; the checked-in source is the recovery copy. Begin with
`main.rs`.
:::alice
We will treat it as the target behavior, not evidence that the macro works.
:::

:::source examples/rust-01-stringify/demo/src/main.rs | The caller we will make compile

:::ada
What behavior is this caller asking `code_string!` to provide?
:::alice
The first three calls should become strings preserving the written code. The
last `println!` is ordinary Rust and should print `2`. We cannot run this yet
because `code_string!` does not exist.
:::

:::ada
Now open `stringify-macro/src/lib.rs`. Rust fixes the compiler-facing type, so
write the boundary first and leave its body open:

```rust
use proc_macro::TokenStream;

#[proc_macro]
pub fn code_string(input: TokenStream) -> TokenStream {
```
:::alice
The signature says `TokenStream -> TokenStream`, like our `Code -> Code` model.
Is `TokenStream` Rust's type for code? And what do `#[proc_macro]` and `pub` add?
:::

:::ada
`TokenStream` stores code as an ordered sequence of identifiers, literals,
punctuation, and delimited groups—not as evaluated values. It is called a
**stream** because macro code reads that sequence from left to right, one item
at a time. A delimited group contains another token stream.

`#[proc_macro]` registers the function as a function-like macro; `pub` exports
that entry point to the demo crate. Rust requires the function at the root of
the macro crate.

:::alice
So for `code_string!(x)`, `input` receives the token `x`, not the value `2`, and
the returned Rust tokens replace the complete invocation. Later, a reader can
walk a larger input by inspecting and consuming its next item in order.
:::

:::ada
Raw `proc_macro` token trees are tedious. Procedural-macro code normally uses
`proc_macro2` for preprocessing code token, Syn for turning code into rust object,
and Quote for converting rust object back into rust code tokens.

```rust
use proc_macro2::TokenStream as TokenStream2;

let input = TokenStream2::from(input);
```
:::alice
Why do we now have two `TokenStream` types? Does this conversion change the
code?
:::

:::ada
No. `proc_macro::TokenStream` is rustc's boundary type;
`proc_macro2::TokenStream` is the type used by the helper libraries. The
conversion changes the representation, not the tokens.

Since we need text for output, we can convert rust code into text:

```rust
let written_input = input.to_string();
```
:::alice
Does `to_string()` render the tokens without evaluating them?
:::

:::ada
Yes. It produces `x` and something like `1 + 1` as text, without preserving
comments or exact whitespace.

For `code_string!(x)`, we must return the Rust string-literal expression `"x"`,
not the `String` stored in `written_input`. Add Syn's typed representation:

```rust
use proc_macro2::{Span, TokenStream as TokenStream2};
use syn::LitStr;

let output_literal = LitStr::new(&written_input, Span::call_site());
```
:::alice
Why can we not return the `String` directly? What do `LitStr` and `Span` add?
:::

:::ada
The macro must return Rust syntax, not a runtime string value. `LitStr` is a
typed value representing valid Rust string-literal syntax and handles escaping.
`Span::call_site()` attaches the invocation's source context for the compiler
and its diagnostics.
:::alice
So `written_input` contains `x` as text, while `output_literal` describes the
Rust expression `"x"`.
:::

:::ada
Exactly. Quote emits that typed syntax as code:

```rust
use quote::quote;

quote! { #output_literal }
```
:::alice
What does `#output_literal` mean inside `quote!`?
:::

:::ada
`quote!` treats its body as a Rust-code template. `#output_literal` inserts the
syntax represented by that value. The result is a
`proc_macro2::TokenStream` containing the string-literal expression `"x"`.

The complete line also closes the compiler boundary:

```rust
quote! { #output_literal }.into()
}
```
:::alice
Quote already produced tokens. What does `.into()` do?
:::

:::ada
Quote returns `proc_macro2::TokenStream` not `proc_macro::TokenStream`. `into` did
the conversion.

:::alice
Now the function returns the tokens spelling `"x"`, and rustc can replace the
original invocation with that expression.
:::

:::source examples/rust-01-stringify/stringify-macro/src/lib.rs | The complete procedural macro

:::ada
Now the implementation exists. Run the project and compare the result with the
target we wrote before it:

```console
cargo run --manifest-path examples/rust-01-stringify/Cargo.toml --package stringify-demo
```

```text
1 + 1
x
relation road(src: City, dst: City);
2
```
:::alice
It matches. All four `println!` calls ran in `main`, but the macro must have
inserted the first three string expressions earlier.
:::

:::ada
Exactly. The macro ran at **compile time**; `main` ran later at **runtime**.

To inspect the boundary, put the caret on `code_string!(1 + 1)` in
`examples/rust-01-stringify/demo/src/main.rs`, and run
**rust-analyzer: Expand macro recursively at caret**. What should the expansion
window contain?
:::alice
The string-literal expression `"1 + 1"`: the replacement code produced during
compilation, not a line printed while the program runs.
:::

:::ada
The complete path is now compact:

```text
input tokens -> TokenStream2 -> String -> LitStr -> quoted output tokens
```

Can the macro ever observe the value assigned to `x`?
:::alice
No. It receives the token `x`; it never runs `main` or reads the value stored in
that variable.
:::

:::definition Function-like procedural macro
A function-like procedural macro is a public `#[proc_macro]` function at the
root of a procedural-macro crate with the boundary `TokenStream -> TokenStream`.
During compilation, rustc runs it on an invocation's input tokens and replaces
that invocation with the returned tokens.
:::

:::ada
Are you ready to write a query compiler using macro?
:::alice
No, its definitely not. This is just take code in produce string out. But query
compiler must be way more complicated.
:::

:::ada
The missing object is a typed syntax tree for the **input**. R.2 first builds
that object for a small integer language: we define its enum-shaped AST, derive
its token mapping, and interpret the resulting Rust value. The same method will
later give `relation` declaration its source shape.
:::alice
So the next step maps input code into data with variants and fields.
:::
