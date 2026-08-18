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
At the end of R.2, we expanded:

```rust
eval_integer!(add(2, multiply(3, 4)))
```

What ordinary Rust did rust-analyzer show after recursive macro expansion?
:::alice

```rust
14i64
```

`eval_integer!` parsed the arithmetic, evaluated it during expansion, and emitted
one integer-literal expression.
:::

:::ada
Now place that known arithmetic beside a value that will exist only when a Rust
function runs:

```rust
fn matches(x: i64) -> bool {
    eval_and_compare!(add(2, multiply(3, 4)) == x)
}
```

After every macro invocation has expanded, what ordinary Rust expression do you
expect inside `matches`?
:::alice

```rust
14i64 == x
```

R.2 accounts for the left side. The parameter `x` cannot be known during macro
expansion, so the comparison must remain for the function call.
:::

:::ada
That predicts the end of the expansion chain. It does not yet tell us what
`eval_and_compare!` itself emits first: one macro may emit another macro
invocation.

Before constructing that first output, divide the written input into the three
syntax regions that the outer macro must preserve.
:::alice

```text
add(2, multiply(3, 4))   ==   x
known arithmetic         token outside Rust expression
```

The left region has our `IntegerExpr` grammar. The middle is the equality token.
The right region is ordinary Rust syntax.
:::

:::source examples/rust-02-compile-time/compile-time-macros/src/integer.rs#comparison_syntax | Store the three regions of the mixed input

:::ada
The source gives those regions the types:

```text
IntegerExpr, Token![==], Expr
```

Why is the final field an `Expr` rather than an `i64`?
:::alice
The macro receives the token `x`, not the value of the function parameter.
Syn's `Expr` stores that Rust expression so the macro can return it as code.
:::

:::ada
Give the two macros separate responsibilities. `eval_and_compare!` owns this
mixed boundary, but it does not evaluate `IntegerExpr`. Which already-established
macro can turn the stored left syntax into a Rust expression?
:::alice
`eval_integer!` already accepts that syntax and expands it into an `i64`
expression.
:::

:::ada
You have assigned the known arithmetic to `eval_integer!`. The outer macro must
return one valid Rust expression without evaluating that arithmetic itself.
What exact first expansion satisfies both responsibilities?
:::alice

```rust
eval_integer!(add(2, multiply(3, 4))) == x
```

The outer macro has constructed a Rust comparison, but it has delegated the left
expression to another macro invocation.
:::

:::ada
Inspect only this first expansion. Which part is already ordinary Rust, and
which part still awaits expansion?
:::alice
`== x` is already the surrounding Rust comparison. This invocation remains:

```rust
eval_integer!(add(2, multiply(3, 4)))
```

The literal `14i64` does not appear yet.
:::

:::definition Typed local hole
In this course, a **typed local hole** is a position in otherwise constructed
syntax occupied by a macro invocation whose later expansion must produce syntax
valid at that position. Here Rust requires an expression on the left of `==`, so
`eval_integer!` must fill that position with an expression.
:::

:::ada
Use the expansion already established in R.2 to fill this hole. What complete
residual expression remains?
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

That recovers the prediction we made before distinguishing the two expansion
steps.
:::

:::ada
Now verify the implementation. Does `expand_compare` call the arithmetic
`evaluate` function, or does it construct the intermediate program we predicted?
:::

:::source examples/rust-02-compile-time/compile-time-macros/src/integer.rs#staged_expansion | Construct a comparison containing the evaluator invocation

:::alice
It constructs the intermediate program:

```rust
eval_integer!(known_expression) eq_eq_token outside_expression
```

It quotes the stored arithmetic back inside `eval_integer!`. There is no call to
`evaluate` in `expand_compare`.
:::

:::ada
The implementation parses the quoted result back into `syn::Expr` before
returning it. What error can that catch at this boundary?
:::alice
It catches an output that is not syntactically a Rust expression. The outer
stage checks the shape of the residual comparison without needing the future
value of `x` or the arithmetic result.
:::

:::ada
The crate exposes both stages as procedural macros. Which entry point runs on
the source invocation, and which entry point is named only in its output?
:::

:::source examples/rust-02-compile-time/compile-time-macros/src/lib.rs#staged_entrypoints | The outer procedural-macro entry point

:::alice
`eval_and_compare` runs on the source invocation. Its output names
`eval_integer`, whose entry point runs later when rustc continues expanding the
returned code.
:::

:::ada
Run the focused unit test for `expand_compare`:

```console
cargo test --manifest-path examples/rust-02-compile-time/Cargo.toml --package compile-time-macros comparison_expansion -- --nocapture
```
:::alice
It prints the first expansion:

```text
eval_integer ! (add (2 , multiply (3 , 4))) == x
```

Spacing differs because token streams do not preserve source formatting, but the
same nested invocation and comparison remain.
:::

:::ada
Why does this unit test stop at `eval_integer!(...) == x`, while
**rust-analyzer: Expand macro recursively at caret** reaches `14i64 == x`?
:::alice
The unit test calls only the ordinary helper for the outer expansion and prints
its returned tokens. Rustc and rust-analyzer repeatedly recognize and expand
macro invocations inside returned code, so they continue through
`eval_integer!`.
:::

:::ada
At the first boundary, has the integer value `14` passed from one macro to the
other?
:::alice
No. The outer macro returns syntax containing another invocation. The value
`14` is computed only when the evaluator macro later receives the retained
arithmetic syntax.
:::

:::ada
State the ownership boundary now visible in the expansion chain.
:::alice
`eval_and_compare!` owns the mixed input and the surrounding comparison.
`eval_integer!` owns the meanings of `add` and `multiply`. Ordinary Rust owns
`==` and supplies `x` when `matches` runs.
:::

:::ada
Suppose the integer language later gains `subtract(left, right)`. Which stage
must learn its arithmetic meaning, and what must change in `expand_compare`?
:::alice
The evaluator behind `eval_integer!` must learn `subtract`. Nothing in
`expand_compare` must change: it retains any accepted `IntegerExpr` inside the
same evaluator invocation.
:::

:::definition Partial evaluation and residual program
**Partial evaluation** uses information available to an earlier stage and
produces a **residual program** for work left to a later stage. Here the first
expansion only constructs the hole. The later `eval_integer!` expansion reduces
the known arithmetic to `14i64`; the comparison that depends on `x` remains as
residual Rust.
:::

:::law Macro composition
A macro may construct ordinary code around a typed local hole and leave an
independently defined macro to lower the syntax it owns. Repeated expansion
composes those stages by filling such holes until only ordinary Rust remains.
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

Why do two calls execute different results after both compile from the same
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

:::recap The program left behind
Do not collapse the expansion stages into one ambiguous “result”:

| Stage | Exact syntax |
|---|---|
| Source invocation | `eval_and_compare!(add(2, multiply(3, 4)) == x)` |
| First, outer expansion | `eval_integer!(add(2, multiply(3, 4))) == x` |
| Output of the nested invocation | `14i64` |
| Final residual after replacement | `14i64 == x` |
| Runtime observations | `matches(14) == true`; `matches(15) == false` |

The first expansion builds ordinary Rust around a typed local hole. No integer
value passes between macros at that point; the returned syntax still contains
`eval_integer!`. The later expansion computes `14i64`, leaving a residual Rust
comparison for the unknown function parameter.

Macro composition is the mechanism. Partial evaluation is the later effect.
`eval_and_compare!` owns the mixed-language boundary, `eval_integer!` owns
arithmetic meaning, and ordinary Rust owns the remaining equality.
:::
