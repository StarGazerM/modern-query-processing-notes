# R.0.0: the Rust we need

This one-package program is the repaired endpoint of the five small experiments
in Rust Guide R.0.0. It uses ordinary runtime values throughout. From
the notes repository root, run:

```console
cargo run --manifest-path examples/rust-00-reading-rust/Cargo.toml
```

The root `[workspace]` table, with no additional members, keeps this package
independent from an enclosing checkout. It does not create another package.
