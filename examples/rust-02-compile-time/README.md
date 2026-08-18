# Compile-time arithmetic and residual Rust

This workspace contains the runnable checkpoints for Rust Conversations R.2
and R.3.

| Command | What expansion does | What runtime does |
| --- | --- | --- |
| `cargo run -p compile-time-demo` | Evaluate one arithmetic AST | Print `14` |
| `cargo run -p compile-time-demo --example compare` | Emit and expand an `eval_integer!` hole | Compare with the function argument `x` |
| `cargo test -p compile-time-macros comparison_expansion -- --nocapture` | Stop after the first staged pass | Print the residual expression with its hole |

Run these commands from this directory. The conversations instead use
`--manifest-path` so they remain safe to copy from the notes repository root.

## Why the files have this shape

The procedural macros stay in `compile-time-macros`; the executable invocations
stay in `demo`. Within the macro crate, `lib.rs` exposes the rustc-facing entry
points and `integer.rs` contains the typed syntax and transformations. The
`compare.rs` file is a runnable demonstration, not another macro crate.

## The two transformations

Arithmetic begins with a course-defined syntax object:

```text
tokens
  -> syn::parse2::<IntegerExpr>
  -> evaluate literals, add(...), and multiply(...)
  -> i64
  -> quote! { #value }
  -> integer-literal Rust syntax
```

`IntegerExpr` and `IntegerCall` derive `syn_derive::Parse` and
`syn_derive::ToTokens`. Their variants, fields, and attributes state the syntax
mapping; there is no hand-written token cursor or precedence parser.

The staged example introduces one course-defined comparison shape:

```rust
eval_and_compare!(add(2, multiply(3, 4)) == x)
```

`EvalAndCompare` also derives `syn_derive::Parse`. Its left field contains our
`IntegerExpr`; its equality field contains the written `==`; and its right field
contains an ordinary Rust `syn::Expr` that can refer to the surrounding program.
The outer pass does not call the arithmetic evaluator. It preserves the
arithmetic syntax inside its existing macro and constructs a typed Rust
expression with one typed local hole:

```rust
eval_integer!(add(2, multiply(3, 4))) == x
```

Rustc expands that nested invocation to `14i64`, filling the hole. Rust's `==`
then retains its ordinary meaning, and `x` is resolved in the surrounding
program. The macros share the `IntegerExpr` syntax contract but no evaluator
implementation; they compose through emitted syntax rather than duplicating
arithmetic semantics.
