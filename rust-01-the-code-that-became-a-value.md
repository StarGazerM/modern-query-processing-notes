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
I recognize `name!(...)` as macro-invocation spelling. But what does a macro
actually receive and return?
:::alice
The Rust Book calls `stringify!` a **macro**, not a function. The spelling names
the category; now we need its meaning.
:::

:::ada
What is a **macro**?
:::alice
Hmm. It seems to be a function that takes an expression as input.
:::

:::ada
Let us test that model. If a macro were a function, what would this function
return?
:::alice
I don't know, but my guess is that it returns expressions.
:::

:::ada
Exactly. `stringify!` takes the tokens spelling `1 + 1` as input and returns new
tokens spelling another expression—`"1 + 1"`.

```rust
stringify!(relation edge(i32, i32);)
```
:::alice
"relation edge(i32, i32);"

But `relation edge(i32, i32);` is our database language, not a Rust
expression. Why did `stringify!` accept it?
:::

:::ada
Because `stringify!` runs before Rust checks whether the tokens inside its
invocation form a Rust expression. At first, Rust only needs to tokenize the
contents and find balanced delimiters.
:::alice
So a macro invocation can contain syntax from another language. The macro—not
the surrounding Rust grammar—decides what those input tokens mean.
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

This example gives each crate its own directory and manifest:

```text
stringify-macro/Cargo.toml   the procedural-macro crate
demo/Cargo.toml              the executable crate that uses it
```

The top `Cargo.toml` merely groups them so one Cargo command can build both. It
is not a third program.
:::alice
So the important fact is not “three manifests.” It is that the procedural macro
must stay in its own crate.
:::

:::ada
Exactly. The manifests are the shell I prepare before the meeting. From here,
we will read the caller and write the macro together. The checked-in example
keeps the finished version so you can recover if your live copy falls behind.

Begin with the program we want to make work.
:::alice
Then we can write the caller first and treat it as the target for the macro
implementation.
:::

:::source examples/rust-01-stringify/demo/src/main.rs | The caller we will make compile

:::ada
Read `main.rs` as our target, not as a program that already works. What behavior
is this caller asking `code_string!` to provide?
:::alice
The first three calls should eventually become the strings `"1 + 1"`, `"x"`,
and `"relation road(City, City);"`. The macro should preserve the code that was
written, so it must not look up the value of `x`.

The last `println!` uses ordinary Rust and should print `2`. But we cannot run
this caller yet because we have not implemented `code_string!`.
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
The function accepts a `TokenStream` and promises to return a `TokenStream`.
I recognize `#[proc_macro]` as the registration spelling, but I have not used it
before. Why does this function also need `pub`?
:::

:::ada
`#[proc_macro]` tells rustc to register this public function as a function-like
macro. `pub` makes that registered entry point exportable to another crate, and
Rust requires it to live at the root of the macro crate.

The demo's path dependency makes this crate available.
`use stringify_macro::code_string;` then brings the exported macro name into
`main.rs`.
:::alice
So for `code_string!(x)`, `input` receives the token `x`, not the value `2`, and
the returned Rust tokens replace the complete invocation.
:::

:::ada
Working directly with `proc_macro` token trees is tedious. Procedural-macro code
normally uses `proc_macro2` for tokens, Syn for typed syntax, and Quote for
generated code. We will use this stack throughout the tutorials and keep
`proc_macro::TokenStream` only at the rustc boundary.

Start by converting the input:

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

Next, render those tokens as text:

```rust
let written_input = input.to_string();
```
:::alice
Does `to_string()` render the tokens without evaluating them?
:::

:::ada
Yes. It produces `x` and something like `1 + 1` as text. Token streams do not
preserve comments or exact whitespace, so their rendering may insert spaces
needed to separate tokens.

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
It converts Quote's `proc_macro2::TokenStream` back to rustc's
`proc_macro::TokenStream`. The representation changes; the returned code does
not.
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
relation road(City, City);
2
```
:::alice
It matches. But the terminal puts all four lines together; it does not show me
which work happened while compiling and which happened while running.
:::

:::ada
Then reconstruct the two moments. Did `code_string!` run at the same time as
the four `println!` calls?
:::alice
No. Before the executable existed, rustc called `code_string!` and replaced its
three invocations with string-literal expressions. Later, `main` ran all four
`println!` calls; its last call read the ordinary program variable `x`.
:::

:::ada
Exactly. The first moment is **compile time**; the second is **runtime**.

We can inspect the boundary directly. Open the notes folder in VS Code, put the
caret on `code_string!(1 + 1)` in
`examples/rust-01-stringify/demo/src/main.rs`, and run
**rust-analyzer: Expand macro recursively at caret**. What should the expansion
window contain?
:::alice
The string-literal expression `"1 + 1"`: the replacement code produced during
compilation, not a line printed while the program runs.
:::

:::ada
We can now account for the whole event:

```text
compile time
  tokens inside code_string!(1 + 1)
        ↓ rustc calls the already-compiled macro
  proc_macro::TokenStream
        ↓ convert once at the boundary
  proc_macro2::TokenStream
        ↓ to_string()
  String containing "1 + 1"
        ↓ LitStr::new(...)
  syn::LitStr representing the syntax "1 + 1"
        ↓ quote! { #output_literal }
  proc_macro2::TokenStream containing "1 + 1"
        ↓ .into() and return to rustc
  "1 + 1"

runtime
  println! prints the resulting string value
```

Can the macro ever observe the value assigned to `x`?
:::alice
No. It receives the token `x`; it never runs `main` or reads the value stored in
that variable.
:::

:::definition Function-like procedural macro
A function-like procedural macro is a `#[proc_macro]` public Rust function
defined at the root of a procedural-macro crate with the boundary
`TokenStream -> TokenStream`. During compilation, the compiler runs that
function on the tokens inside a macro invocation and replaces the invocation
with the tokens the function returns. The resulting Rust code is then compiled
normally and may execute later at runtime.
:::

:::ada
Does our macro yet understand that `road` is a relation name, that it has arity
two, or that both positions have type `City`?
:::alice
No. It has a typed `syn::LitStr` for the **output** string literal, but it still
treats the **input** relation declaration as an opaque token stream and then as
text. It has no value with fields for the name `road` or its two `City`
positions.
:::

:::ada
That is the missing object: a typed syntax tree that turns the relation
declaration itself into a Rust value we can inspect and transform.

Before defining `RelationDecl`, we will use integer arithmetic as a smaller
training language. Syn already knows its grammar, so we can observe the mapping
from written expression to enum-shaped AST, interpret that AST during
compilation, and then use the same tools to define our own source shape without
writing a parser by hand.
:::alice
So the next step is not more manipulation of opaque tokens. It is to map code
into data with variants and fields that our Rust program can inspect.
:::
