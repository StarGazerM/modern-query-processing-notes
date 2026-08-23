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
Now let's add an equality check to our arithmetic:

```rust
fn matches(x: i64) -> bool {
    eval_and_compare!(add(2, multiply(3, 4)) == x)
}
```

After every macro invocation has expanded, what ordinary Rust expression do you
expect inside `matches`?
:::alice
R.2 tells us that I can fold the entire arithmetic expression on the left into
a constant. However, `x` is a Rust variable whose value can be known only when
the program runs. So I expect:

```rust
14i64 == x
```
:::

:::ada
What AST struct would you construct for this input?
:::alice
One question first. In R.2, we stored the parentheses in the AST. Here we also
need to store the `==` token. How can I represent it?
:::

:::ada
Syn represents it as:

```rust
Token![==]
```
:::

:::alice
Then I would construct:

```rust
#[derive(syn_derive::Parse, syn_derive::ToTokens)]
struct EvalAndCompare {
    known_expression: IntegerExpr,
    eq_eq_token: Token![==],
    outside_expression: Expr,
}
```
:::

:::ada
Great. How would you write the logic that walks over this value and generates
the expanded code?
:::alice
We already wrote the `evaluate` function. I can call it and then quote the
result:

```rust
pub(crate) fn expand_compare(input: TokenStream) -> syn::Result<TokenStream> {
    let comparison: EvalAndCompare = syn::parse2(input)?;
    let known_value = evaluate(&comparison.known_expression)?;
    let eq_eq_token = comparison.eq_eq_token;
    let outside_expression = comparison.outside_expression;

    Ok(quote! {
        #known_value #eq_eq_token #outside_expression
    })
}
```
:::

:::ada
That is a good observation. Reusing a function is one of the most important
ways to avoid reinventing the same wheel.

However, functions are not the only things we can reuse in macro code.
:::alice
I see. We can also reuse a macro. I have seen this pattern before, but how can we
apply it here?
:::

:::ada
One way to structure generated code is to place the part whose behavior is
already settled behind a boundary and leave the remaining computation as a
hole.

Here, `eval_and_compare!` is a slightly misleading name for this stage, because
its own work is only to construct the comparison. It can leave the arithmetic
intact inside `quote!` for another macro to expand. What would that version look
like?
:::alice
Perhaps like this:

```rust
pub(crate) fn expand_compare(input: TokenStream) -> syn::Result<TokenStream> {
    let comparison: EvalAndCompare = syn::parse2(input)?;
    let known_expression = comparison.known_expression;
    let eq_eq_token = comparison.eq_eq_token;
    let outside_expression = comparison.outside_expression;

    let residual: Expr = syn::parse2(quote! {
        todo!{} #eq_eq_token #outside_expression
    })?;

    Ok(quote! { #residual })
}
```
:::

:::ada
Good, very very close, your `todo!{}` is a macro call, you should use another macro call.
:::alice
I see.
```rust
eval_integer!{#known_expression} == x
```
:::


:::definition Typed local hole
In this course, a **typed local hole** is a position in otherwise constructed
syntax occupied by a macro invocation whose later expansion must produce syntax
valid at that position. Here Rust requires an expression on the left of `==`, so
`eval_integer!` must fill that position with an expression.
:::

:::ada
Let's double check if this expand to the same thing as using normal function reuse.
:::alice
The nested invocation expands first:

```rust
eval_integer!(add(2, multiply(3, 4)))
// becomes
14i64
```

Therefore the complete residual expression is:

```rust
14i64 == x
```

Same. So why we use macro composition instead of just call `evaluate` function?
Macro in macro is something try to overflow my brain stack.
:::

:::source examples/rust-02-compile-time/compile-time-macros/src/integer.rs#staged_expansion | Reuse the evaluator by returning its invocation

:::law Macro composition
A macro reuses another macro by returning its invocation as syntax. Rustc
composes the stages through repeated expansion until only ordinary Rust remains.
:::

:::ada
The caller imports both macros:

```rust
use compile_time_macros::{eval_and_compare, eval_integer};
```

But its source explicitly invokes only `eval_and_compare!`. Which import appears
unnecessary?
:::alice
May I remove `eval_integer`s?
:::

:::ada
Remove it and check the example again.
:::alice
Compilation fails:

```text
error: cannot find macro `eval_integer` in this scope
note: this error originates in the macro `eval_and_compare`
```

So `eval_and_compare!` expanded successfully, but its returned program still
needed the consumer to bind `eval_integer!`.
:::

:::ada
Would the direct function-reuse version have needed that import?
:::alice
No. Calling `evaluate` would bind the evaluator inside the upper pass and emit
`14i64 == x` immediately.

Macro reuse instead emits the unqualified name `eval_integer!`, so the consumer
selects the lower pass.
:::

:::ada
Then what happens if the consumer imports another compatible macro under that
name?

```rust
use another_evaluator::fold_integer as eval_integer;
```
:::alice
`expand_compare` remains unchanged. Its returned syntax names only
`eval_integer!`; the consumer decides which independently compiled lower pass
that name denotes.
:::

:::definition Partial evaluation and residual program
**Partial evaluation** performs work using information known at an earlier
stage and leaves a **residual program** for the unknown work.

Here `eval_integer!` reduces the known arithmetic to `14i64`, while the
comparison depending on `x` remains:

```rust
14i64 == x
```
:::

:::ada
Run the complete caller:

```console
cargo run --manifest-path examples/rust-02-compile-time/Cargo.toml --package compile-time-demo --example compare
```

```text
true
false
```

Why do the two calls return different results after both compile from the same
residual expression?
:::alice
Both calls execute:

```rust
14i64 == x
```

The arithmetic was fixed during expansion, but `x` was not. `matches(14)` makes
the residual comparison true; `matches(15)` makes it false.
:::

:::source examples/rust-02-compile-time/demo/examples/compare.rs | One residual program receives two runtime values

:::recap Reuse across expansion stages
We produced the same residual program in two ways.

With **function reuse**, `expand_compare` calls `evaluate` while it is running.
The known arithmetic becomes `14i64` before the outer expansion returns:

```rust
14i64 == x
```

With **macro reuse**, the outer stage does not compute the arithmetic. It returns
syntax containing another macro invocation:

```rust
eval_integer!(add(2, multiply(3, 4))) == x
```

That invocation is a typed local hole: it occupies a Rust expression position,
so its later expansion must produce an expression. Rustc expands it to `14i64`,
leaving the same residual program:

```rust
14i64 == x
```

No value passes from one macro to another at the first boundary. The outer macro
hands rustc syntax. `eval_and_compare!` owns the comparison shape,
`eval_integer!` owns arithmetic meaning, and ordinary Rust later supplies `x`
and performs `==`.

**Macro composition** is the mechanism: one stage emits another stage's
invocation. **Partial evaluation** is the effect: known arithmetic disappears
while the comparison depending on `x` remains.
:::
