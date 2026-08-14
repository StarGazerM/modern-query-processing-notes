# Compile-time arithmetic and residual Rust

This workspace contains the runnable checkpoints for Rust Conversations R.2 and
R.3.

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

Arithmetic uses Rust's existing expression AST:

```text
tokens
  -> syn::parse2::<syn::Expr>
  -> evaluate literals, +, *, and fib(n)
  -> i64
  -> quote! { #value }
  -> integer-literal Rust syntax
```

The staged example introduces one course-defined source shape:

```rust
partial_integer! {
    known compiled = fib(20);
    residual x + compiled;
}
```

`PartialInteger` derives `syn_derive::Parse`; no token cursor or hand-written
`Parse` implementation is present. The first pass evaluates the known
expression, constructs a typed `syn::Block`, and emits:

```rust
residual_integer!({
    let compiled: i64 = 6765i64;
    x + compiled
})
```

The second macro parses that block and releases it as ordinary Rust. The value
`6765i64` was carried forward; `x` remains a runtime hole.
