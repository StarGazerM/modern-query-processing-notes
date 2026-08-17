---
title: The Program Left Behind
subtitle: Rust Conversation R.3 — Nested Expansion and Residual Rust
author: Modern Query Processing
date: Fall 2026
status: Work in progress
layout: dialogue
left_speaker: Ada
right_speaker: Alice
previous: [Rust Conversation R.2 · The Arithmetic That Ran Before the Program](rust-02-the-arithmetic-that-ran-before-the-program.html)
---

:::ada
Why does our interpreter reject this?

```rust
let x = 7;
eval_integer!(fib(20) + x)
```
:::alice
It can compute `fib(20)` during expansion, but it cannot know runtime `x`. Its
current contract requires the whole expression to become one compile-time
integer.
:::

:::ada
Can we state which work is known and which code must remain?
:::alice

```rust
partial_integer! {
    known compiled = fib(20);
    residual x + compiled;
}
```

The first expression can become a value now. The second must remain code because
it contains `x`.
:::

:::ada
This is our first code shape that is not already a Rust expression. If one fixed
sequence maps to a struct, which fields do we need?
:::alice

```text
known, Ident, =, Expr, ;, residual, Expr, ;
```

The keyword and punctuation fields retain the fixed outer shape. The two `Expr`
fields reuse Syn's Rust-expression grammar.
:::

:::source examples/rust-02-compile-time/compile-time-macros/src/integer.rs#partial_syntax | The written shape stated as a Rust struct

:::ada
Where is the token-by-token parser?
:::alice
There is none. The two derives generate structural mappings in opposite
directions:

```text
Parse       tokens -> PartialInteger
ToTokens    PartialInteger -> tokens
```

This pass uses `syn::parse2::<PartialInteger>` to obtain the Rust value directly.
`ToTokens` gives the same syntax type the reverse mapping when a compiler stage
needs to emit it again.

`syn::custom_keyword!(known)` and `syn::custom_keyword!(residual)` are calls to
library-provided declarative macros. They generate the two keyword-token types.
We use their result here, but deliberately do not study how to write those
declarative macros.
:::

:::ada
After evaluating `fib(20)`, the macro could emit final Rust immediately. Why
leave another macro invocation instead?
:::alice
It makes the intermediate boundary visible and independently invocable:

```rust
residual_integer!({
    let compiled: i64 = 6765i64;
    x + compiled
})
```

The known call has become a value; the code containing `x` remains.
:::

:::source examples/rust-02-compile-time/compile-time-macros/src/integer.rs#staged_expansion | A typed source stage becomes a typed Rust block

:::ada
What are the two destination types in this pass?
:::alice

```text
input tokens   -> parse2::<PartialInteger>
generated code -> parse2::<syn::Block>
```

The first type describes our small source language. The second is already a
typed Rust block. `quote!` places that block inside `residual_integer!`; the
second macro parses the same `syn::Block` and releases it as ordinary Rust.
:::

:::ada
How can we see the intermediate invocation before rustc expands it again?
:::alice

```console
cargo test --manifest-path examples/rust-02-compile-time/Cargo.toml --package compile-time-macros partial_expansion -- --nocapture
```

The focused test prints:

```text
residual_integer ! ({ let compiled : i64 = 6765i64 ; x + compiled })
```
:::

:::source examples/rust-02-compile-time/compile-time-macros/src/lib.rs#staged_entrypoints | Two compiler-visible expansion boundaries

:::ada
Do those two Rust functions call each other?
:::alice
No. `#[proc_macro]` registers each Rust function as a compiler entry point; it
does not call the function. Writing `partial_integer!(...)` invokes that
function-like macro. The earlier `#[derive(...)]` invokes a different kind of
procedural macro: one that generates implementations for `PartialInteger`.

The first function returns tokens containing `residual_integer!`; rustc sees
that new invocation and calls the second entry point. The demo imports both
macro names, so the generated name is available at the call site.
:::

:::source examples/rust-02-compile-time/demo/examples/partial.rs | Begin at the source stage or the Rust-block stage

:::ada
Run the example:

```console
cargo run --manifest-path examples/rust-02-compile-time/Cargo.toml --package compile-time-demo --example partial
```

```text
6772
6772
```

Why are the results equal?
:::alice
The first invocation computes `fib(20)` and emits the nested block stage. The
second begins directly with that block. Both finally leave:

```rust
{
    let compiled = 6765i64;
    x + compiled
}
```

Runtime supplies `x = 7` and performs only the remaining addition.
:::

:::definition Partial evaluation and residual program
Partial evaluation uses currently known information and leaves a residual
program for work that still depends on unknown information. Here `6765i64` is
carried forward, while `x` is the runtime hole.
:::

:::law Progressive macro lowering
An expansion may produce another macro invocation rather than final Rust. Each
stage can consume one typed program value and emit the next until only ordinary
Rust remains.
:::

:::ada
What is the next source shape we actually care about?
:::alice

```rust
relation road(City, City);
```

Its fixed parts map to a `RelationDecl` struct just as the partial-integer form
mapped to `PartialInteger`. `syn::parse2::<RelationDecl>` will make its name and
columns ordinary Rust data for the relation compiler we build together.
:::
