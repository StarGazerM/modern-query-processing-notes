---
title: The Arithmetic That Ran Before the Program
subtitle: Rust Conversation R.2 — From a Syn Expression Tree to Compile-Time Evaluation
author: Modern Query Processing
date: Fall 2026
status: Work in progress
layout: dialogue
left_speaker: Ada
right_speaker: Alice
previous: [Rust Conversation R.1 · The Code That Became a Value](rust-01-the-code-that-became-a-value.html)
next: [Rust Conversation R.3 · The Program Left Behind](rust-03-the-program-left-behind.html)
---

:::ada
Our first macro preserves the written form:

```rust
code_string!(2 + 3 * 4)
```
:::alice
It expands to the string-literal expression `"2 + 3 * 4"`. We kept the
spelling, not the arithmetic structure.
:::

:::ada
A first attempt at evaluation might simply return its input:

```rust
#[proc_macro]
pub fn eval_integer(input: TokenStream) -> TokenStream {
    input
}
```
:::alice
Then `2 + 3 * 4` still evaluates to `14`, but ordinary Rust does that after
expansion. The macro has not evaluated anything.
:::

:::ada
What must the expansion contain to prove that the macro performed the work?
:::alice
One integer literal: `14`. If `+` or `*` remains, the later program can still
be doing the arithmetic.
:::

:::source examples/rust-02-compile-time/demo/src/main.rs | The caller we will make compile

:::ada
The public `TokenStream -> TokenStream` boundary is unchanged from R.1. Inside
the helper, add one new line:

```rust
let expression: syn::Expr = syn::parse2(input)?;
```
:::alice
`parse2` and `Expr` are new. Does this turn the token stream into a Rust value
that represents the expression's structure?
:::

:::ada
Yes. Rustc has already turned the source into tokens. Syn already knows the
shape of a Rust expression. `parse2` maps those tokens into the requested type,
`syn::Expr`; if they do not have that shape, it returns a `syn::Error`, which
`?` propagates.

We use that library boundary and study the `Expr` value it produces. We do not
implement the recognition process inside Syn.
:::alice
So unlike the `String` in R.1, `expression` has variants and fields we can
inspect. Choosing `Expr` also determines which token shapes are accepted.
:::

:::ada
For `2 + 3 * 4`, Syn constructs a value with this simplified shape. I am
supplying Syn's exact variant names; spans and punctuation fields are omitted:

```text
Expr::Binary Add
├── left:  Expr::Lit 2
└── right: Expr::Binary Mul
    ├── left:  Expr::Lit 3
    └── right: Expr::Lit 4
```
:::alice
The multiplication node is inside the right field of the addition node.
Precedence has become nesting in ordinary data; our evaluator does not need to
rediscover it from the punctuation.
:::

:::definition Abstract syntax tree
An abstract syntax tree is typed data representing the structure of code. A
fixed sequence maps naturally to a struct, alternative shapes map to enum
variants, and nested syntax becomes fields containing more syntax values.
:::

:::ada
Now give three of those shapes arithmetic meaning. Ignoring Syn's field-access
plumbing, the recursive rules are:

```text
Lit(n)                  -> n
Binary(left, +, right)  -> evaluate(left) + evaluate(right)
Binary(left, *, right)  -> evaluate(left) * evaluate(right)
```

The exact `ExprLit`, `ExprBinary`, `Lit::Int`, and `BinOp` spellings come from
Syn; I will supply them while live-coding. Unsupported variants become compiler
errors.
:::alice
A literal is the base case. A binary node contains two more `Expr` values, so
we recursively evaluate both children and then apply this node's operator.

For the tree above, the inner node produces `12`, and the root produces the
ordinary `i64` value `14`.
:::

:::source examples/rust-02-compile-time/compile-time-macros/src/integer.rs#arithmetic_cases | The literal and binary match arms

:::ada
Finish the helper with the Quote operation from R.1:

```rust
let value = evaluate(&expression)?;
Ok(quote! { #value })
```
:::alice
The path is `tokens -> syn::Expr -> i64 -> literal code`. The new step is
interpreting the typed expression as an `i64` by walking the tree.
:::

:::source examples/rust-02-compile-time/compile-time-macros/src/integer.rs#expression_expansion | Typed input, evaluation, and emission

:::ada
With the notes folder open in VS Code, expand `eval_integer!(2 + 3 * 4)` using
**rust-analyzer: Expand macro recursively at caret**.
:::alice
The expansion is `14i64`. No arithmetic operator remains. Does the `i64` suffix
come from the type of the value we interpolated?
:::

:::ada
Yes. `evaluate` returned an `i64`, and Quote emitted a literal carrying that
type. Now run the caller:

```console
cargo run --manifest-path examples/rust-02-compile-time/Cargo.toml --package compile-time-demo
```

```text
14
```
:::alice
The executable prints the value of the generated literal. The expansion itself
is the evidence that the macro performed the arithmetic.
:::

:::ada
Now extend the small language with one deliberately expensive form:

```rust
eval_integer!(fib(40))
```
:::alice
It looks like an ordinary function call. I expect a call node with `fib` as its
callee and `40` as its one argument, although I do not know Syn's exact names
for those parts.
:::

:::ada
Syn represents that shape as:

```text
Expr::Call
├── func: Expr::Path fib
└── args: Expr::Lit 40
```

The demo defines no runtime `fib` function. Our `evaluate_call` helper gives
this syntax meaning during expansion: it accepts exactly the path `fib` with
one argument, recursively evaluates that argument, and passes the resulting
integer to our Fibonacci helper. Other call shapes become compiler errors.
:::alice
So `evaluate_call` interprets call-shaped syntax during macro expansion. It
does not invoke a `fib` function from the later executable.
:::

:::source examples/rust-02-compile-time/compile-time-macros/src/integer.rs#interpreter | The expression cases and their recursive evaluation

:::source examples/rust-02-compile-time/compile-time-macros/src/integer.rs#slow_computation | The intentionally slow compile-time helper

:::source examples/rust-02-compile-time/demo/examples/slow.rs | Runtime only prints the generated constant

:::ada
On macOS or Linux, compare rebuilding that target with rerunning its executable.
The `slow-example` flag keeps this intentional delay out of ordinary editor
builds.

```console
cargo build --manifest-path examples/rust-02-compile-time/Cargo.toml --package compile-time-macros
cargo clean --manifest-path examples/rust-02-compile-time/Cargo.toml --package compile-time-demo
time cargo run --manifest-path examples/rust-02-compile-time/Cargo.toml --quiet --locked --package compile-time-demo --example slow --features slow-example
time ./examples/rust-02-compile-time/target/debug/examples/slow
```

Where is the pause?
:::alice
The rebuild pauses before printing `102334155`; rerunning the executable prints
the same value immediately. The Fibonacci recursion happened during macro
expansion. Runtime only formats and prints the emitted constant.
:::

:::definition Compile time and runtime
Compile time is when tools translate and transform the program, including
procedural-macro expansion. Runtime is when the resulting executable runs.
Moving work earlier can reduce repeated runtime work while increasing build and
editor-analysis cost.
:::

:::ada
Our evaluator still rejects this expression:

```rust
let x = 7;
eval_integer!(fib(20) + x)
```
:::alice
`fib(20)` is known during expansion, but `x` belongs to the later program. Can
the macro compute the known part now and return code containing the part that
must wait?
:::
