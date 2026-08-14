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

:::qa
Our first macro gives this code a written form:

```rust
code_string!(2 + 3 * 4)
```

What does it expand to?
:::answer
The string-literal expression `"2 + 3 * 4"`. It preserves the input, but gives
it no arithmetic meaning.
:::

:::qa
Suppose our first attempt at a stronger macro simply returns its input:

```rust
#[proc_macro]
pub fn eval_integer(input: TokenStream) -> TokenStream {
    input
}
```

Would `eval_integer!(2 + 3 * 4)` appear to work?
:::answer
Yes: the resulting program would print `14`. But expanding the invocation would
still reveal `2 + 3 * 4`. The macro moved the expression unchanged; runtime Rust
did the arithmetic.
:::

:::qa
Then what expansion proves that the macro performed the work?
:::answer

```text
eval_integer!(2 + 3 * 4)  expands to  14i64
```

The checked-in implementation must leave one integer literal, not another
arithmetic expression.
:::

:::source examples/rust-02-compile-time/demo/src/main.rs | The arithmetic invocation

:::qa
Run the default target from the notes repository root:

```console
cargo run --manifest-path examples/rust-02-compile-time/Cargo.toml --package compile-time-demo
```

```text
14
```

What should rust-analyzer show when we expand the invocation?
:::answer
`14i64`. No arithmetic operator remains, so the macro—not the later running
program—performed the addition and multiplication.
:::

:::source examples/rust-02-compile-time/compile-time-macros/src/integer.rs#expression_expansion | Parse, evaluate, and emit

:::qa
Read this function as three operations. What does each one do?
:::answer

```text
syn::parse2(input)   tokens -> syn::Expr
evaluate(&expression) syn::Expr -> i64
quote! { #value }     i64 -> Rust literal syntax
```

`parse2` establishes the grammatical shape. `evaluate` gives that shape its
meaning. `quote!` makes the result code again.
:::

:::qa
What kind of Rust value did Syn construct for `2 + 3 * 4`?
:::answer

```text
Expr::Binary Add
├── left:  Expr::Lit 2
└── right: Expr::Binary Mul
    ├── left:  Expr::Lit 3
    └── right: Expr::Lit 4
```

Precedence has become ordinary nested data.
:::

:::definition Abstract syntax tree
An abstract syntax tree represents grammatical structure as typed data. A fixed
sequence of parts maps naturally to a struct; a choice among shapes maps to an
enum; nested syntax becomes fields containing more syntax values.
:::

:::source examples/rust-02-compile-time/compile-time-macros/src/integer.rs#interpreter | The deliberately small interpreter

:::qa
How much arithmetic language did we implement?
:::answer
Only integer literals, binary `+`, binary `*`, and the special call `fib(n)`.
`evaluate` is an ordinary recursive `match` over the relevant
`syn::Expr` variants. Syn supplied the Rust grammar; we supplied this tiny
language's meaning.
:::

:::qa
The slow target contains this initializer:

```rust
const FIB_40: i64 = eval_integer!(fib(40));
```

Before evaluation, what does `fib(40)` look like?
:::answer

```text
Expr::Call
├── func: Expr::Path fib
└── args: Expr::Lit 40
```

There is no runtime `fib` function in the demo. The macro recognizes this tree
and runs its own deliberately inefficient helper during expansion.
:::

:::source examples/rust-02-compile-time/compile-time-macros/src/integer.rs#slow_computation | The intentionally slow compile-time helper

:::source examples/rust-02-compile-time/demo/examples/slow.rs | Runtime only prints the generated constant

:::qa
On macOS or Linux, compare rebuilding that target with rerunning its executable:
The `slow-example` flag keeps this intentional delay out of ordinary editor
builds.

```console
cargo build --manifest-path examples/rust-02-compile-time/Cargo.toml --package compile-time-macros
cargo clean --manifest-path examples/rust-02-compile-time/Cargo.toml --package compile-time-demo
time cargo run --manifest-path examples/rust-02-compile-time/Cargo.toml --quiet --locked --package compile-time-demo --example slow --features slow-example
time ./examples/rust-02-compile-time/target/debug/examples/slow
```

Where is the pause?
:::answer
The rebuild pauses before printing `102334155`; rerunning the executable prints
the same value immediately. The Fibonacci work moved into macro expansion. The
runtime executable only formats and prints the emitted constant.
:::

:::definition Compile time and runtime
Compile time is when tools translate and transform the program, including
procedural-macro expansion. Runtime is when the resulting executable runs.
Moving work earlier can reduce repeated runtime work while increasing build and
editor-analysis cost.
:::

:::qa
Must an expansion always finish the job and return ordinary Rust?
:::answer
No. It can return another macro invocation carrying a computed value and code
that still depends on runtime information. That next experiment will also be
our first course-defined syntax shape, mapped to a struct with derived
`Parse`—still without writing a token parser.
:::
