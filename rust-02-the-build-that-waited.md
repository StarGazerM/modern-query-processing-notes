---
title: The Build That Waited
subtitle: Optional Rust Experiment R.2A — Making Compile Time Observable
author: Modern Query Processing
date: Fall 2026
status: Work in progress
layout: dialogue
left_speaker: Ada
right_speaker: Alice
previous: [Rust Conversation R.2 · The Arithmetic That Ran Before the Program](rust-02-the-arithmetic-that-ran-before-the-program.html)
next: [Rust Conversation R.3 · The Program Left Behind](rust-03-the-program-left-behind.html)
---

:::ada
R.2 proved that the macro performed the arithmetic by inspecting its expansion.
But `add` and `multiply` finish too quickly for us to feel when the work happens.
How could we make the compile-time/runtime boundary physically observable?
:::alice
Give the evaluator one intentionally expensive operation. If the build pauses
but the resulting executable does not, we know which stage performed the work.
:::

:::ada
We will use naive Fibonacci only as that timing probe:

```rust
eval_integer!(fib(40))
```

Does this require another syntax shape?
:::alice
No. It is still a `Call` containing one `Literal`. The derived token mapping is
unchanged; only the evaluator needs to give the name `fib` a meaning.
:::

:::source examples/rust-02-compile-time/compile-time-macros/src/integer.rs#fibonacci_meaning | Give the existing call shape an expensive meaning

:::ada
The bound keeps this deliberately inefficient classroom example from consuming
unbounded build time. After checking it, the evaluator calls this ordinary Rust
helper while the macro is expanding.
:::alice
Then the recursion runs before the executable exists. Its result becomes the
integer literal emitted by the macro.
:::

:::source examples/rust-02-compile-time/compile-time-macros/src/integer.rs#slow_computation | The intentionally slow helper

:::source examples/rust-02-compile-time/demo/examples/slow.rs | Runtime only prints the generated constant

:::ada
On macOS or Linux, compare a clean rebuild of the target with rerunning the
executable. The feature keeps this intentional delay out of ordinary editor
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
the same value immediately. Fibonacci ran during macro expansion. Runtime only
formats and prints the emitted constant.
:::

:::definition Compile time and runtime
Compile time is when tools translate and transform the program, including
procedural-macro expansion. Runtime is when the resulting executable runs.
Moving work earlier can reduce repeated runtime work while increasing build and
editor-analysis cost.
:::

