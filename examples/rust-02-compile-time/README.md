# Compile-time arithmetic and residual Rust

This workspace contains the runnable checkpoints for Rust Conversation R.2,
optional Experiment R.2A, and Rust Conversation R.3.

| Command | What expansion does | What runtime does |
| --- | --- | --- |
| `cargo run -p compile-time-demo` | Evaluate one arithmetic AST | Print `14` |
| `cargo run -p compile-time-demo --example slow --features slow-example` | Compute naïve `fib(40)` | Print the emitted constant |
| `cargo run -p compile-time-demo --example partial` | Compute known work, then emit another macro | Add runtime `x` |
| `cargo test -p compile-time-macros partial_expansion -- --nocapture` | Stop after the first staged pass | Print its residual invocation |

Run these commands from this directory. The conversations instead use
`--manifest-path` so they remain safe to copy from the notes repository root.

## Why the files have this shape

The procedural macros stay in `compile-time-macros`; the executable invocations
stay in `demo`. Within the macro crate, `lib.rs` exposes the rustc-facing entry
points and `integer.rs` contains the typed syntax and transformations. The
`slow.rs` and `partial.rs` files are runnable demonstrations, not additional
macro crates. The `slow-example` flag keeps the intentional `fib(40)` delay out
of ordinary builds and editor analysis.

## The two transformations

Arithmetic begins with a course-defined syntax object:

```text
tokens
  -> syn::parse2::<IntegerExpr>
  -> evaluate literals, add(...), multiply(...), and fib(...)
  -> i64
  -> quote! { #value }
  -> integer-literal Rust syntax
```

`IntegerExpr` and `IntegerCall` derive `syn_derive::Parse` and
`syn_derive::ToTokens`. Their variants, fields, and attributes state the syntax
mapping; there is no hand-written token cursor or precedence parser.

The staged example introduces one course-defined source shape:

```rust
partial_integer! {
    known compiled = add(2, multiply(3, 4));
    residual x + compiled;
}
```

`PartialInteger` also derives `syn_derive::Parse`. Its known field contains our
`IntegerExpr`; its residual field contains ordinary Rust `syn::Expr`. The first
pass evaluates the known expression, constructs a typed `syn::Block`, and emits:

```rust
residual_integer!({
    let compiled: i64 = 14i64;
    x + compiled
})
```

The second macro parses that block and releases it as ordinary Rust. The value
`14i64` was carried forward; `x` remains a runtime hole.
