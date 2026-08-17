---
title: The Rust We Need
subtitle: Rust Guide R.0.0 — A Hands-on Route Through Ordinary Rust
author: Modern Query Processing
date: Fall 2026
status: Work in progress
layout: prose
next: [Rust Conversation R.1 · The Code That Became a Value](rust-01-the-code-that-became-a-value.html)
---

This page is not a compressed Rust textbook. It is a route through the small
part of Rust that this course needs. At each checkpoint, predict what a small
program will do, ask the compiler, make one repair, and state what changed.

The exit test is being able to read this signature:

```rust
fn departure(
    train: &Train,
) -> Result<u32, DepartureError>
```

You do not need to memorize every spelling. You need to recognize the values
and control flow well enough to reason with them.

# Three resources, three different jobs

- The course [Rust cheat sheet](aside-a-little-rust-side-by-side.html) tells you
  how a familiar operation is spelled.
- [Comprehensive Rust](https://google.github.io/comprehensive-rust/) explains an
  unfamiliar idea.
- [Rustlings](https://rustlings.rust-lang.org/usage/) gives you small broken
  programs to repair.

The compiler supplies evidence. It tests your explanation; it does not replace
the explanation afterward.

Follow the official [Rustlings setup](https://rustlings.rust-lang.org/setup/)
once. Before the five experiments below, repair only this bootstrap set:
[`intro2`](https://github.com/rust-lang/rustlings/blob/v6.5.0/exercises/00_intro/intro2.rs),
[`variables1`](https://github.com/rust-lang/rustlings/blob/v6.5.0/exercises/01_variables/variables1.rs),
and [`functions1`, `functions4`, and `functions5`](https://github.com/rust-lang/rustlings/tree/v6.5.0/exercises/02_functions).
They establish the edit–run loop, `let`, function calls, return types, and block
values.

Read only the matching explanation when an idea is new:

1. [Functions](https://google.github.io/comprehensive-rust/control-flow-basics/functions.html)
   and [blocks](https://google.github.io/comprehensive-rust/control-flow-basics/blocks-and-scopes.html)
   before experiment 1.
2. [User-defined types](https://google.github.io/comprehensive-rust/user-defined-types.html)
   before experiments 2–3.
3. [Shared references](https://google.github.io/comprehensive-rust/references/shared.html)
   before experiment 4.
4. [`Result`](https://google.github.io/comprehensive-rust/std-types/result.html)
   and [the `?` operator](https://google.github.io/comprehensive-rust/error-handling/try.html)
   before experiment 5.

Later Rustlings exercises often combine methods, mutation, strings, loops, and
tests. Use them after these meetings rather than as prerequisites. Completing
the rest can be a low-pressure semester practice lane. Its declarative-macro
exercises can wait until after R.1–R.3.

# How to use the meeting

Before each run:

1. predict silently: compile, error, or output;
2. compare with one neighbor;
3. vote.

After the run, find the decisive line, make one repair, and state one rule.
Everyone arrives at the run with a concrete claim, so participation does not
depend on someone volunteering a question.

# Five small experiments

The checked-in file is the runnable, repaired program. During the meeting, its
source excerpts and a few temporary fragments isolate one idea at a time. The
short fragments in experiments 3–4 are comparisons with the final file, not
standalone programs to paste beside it.

## 1 · A semicolon changes the result

:::source examples/rust-00-reading-rust/src/main.rs#block_value | The starting function

**Predict.** Add a semicolon after `scheduled + delay`. Will the program
compile?

**Observe.** The function promises a `u32`, but the semicolon discards the final
expression's value and makes the body produce `()`.

**Repair.** Remove the semicolon.

**Rule.** A block's final expression, when it has no semicolon, is the value of
that block.

## 2 · Structs and enums describe different shapes

:::source examples/rust-00-reading-rust/src/main.rs#data_shapes | The train and status shapes

The declarations give every `Train` two fields, `scheduled` and `status`.
`Status` declares three alternatives: `OnTime`, `Late(u32)`, and `Cancelled`.

Start from this construction:

```rust
let late = Train {
    scheduled: 60,
    status: Status::Late(5),
};
```

**Predict.** Delete the `status: Status::Late(5)` line. Will Rust invent a
default value?

**Observe.** The compiler reports a missing field.

**Repair.** Restore the field. Constructing a struct requires every field unless
the code explicitly supplies another source for the omitted fields.

**Rule.** A struct contains all of its fields together. An enum value selects
exactly one of its declared variants.

## 3 · Match every possible shape

Start with this ordinary function:

```rust
fn delay(status: Status) -> u32 {
    match status {
        Status::OnTime => 0,
        Status::Late(minutes) => minutes,
        Status::Cancelled => 0,
    }
}
```

**Predict.** Remove the `Status::Cancelled` arm. The first train is late, not
cancelled. Will the function still compile?

**Observe.** It does not. `delay` accepts any `Status`, so `match` must account
for every variant in the enum's closed choice. The pattern
`Status::Late(minutes)` exposes the number stored in that variant.

**Repair.** Restore `Status::Cancelled => 0`.

**Rule.** A `match` over an enum must cover every possible variant.

The function now compiles, but it treats cancellation exactly like an on-time
train. Experiment 5 will repair that meaning.

## 4 · Borrow instead of move

Suppose we wrote:

```rust
fn scheduled(train: Train) -> u32 {
    train.scheduled
}

println!("{}", scheduled(late));
println!("{}", scheduled(late));
```

**Predict.** Which call fails?

**Observe.** The second call fails because the first moved the `Train` into the
function.

**Repair.** Change the parameter to `train: &Train` and both calls to
`scheduled(&late)`.

**Rule.** `&Train` gives shared read access. The function can inspect the train
without taking it from the caller, so both calls can use the same value.

## 5 · Give failure its own shape

:::source examples/rust-00-reading-rust/src/main.rs#fallible_read | The fallible implementation

Zero minutes is a successful on-time departure. Cancellation is not a departure
time. The final `delay` therefore returns `Result<u32, DepartureError>` instead
of using the fabricated value `0` for cancellation.

`Result<T, E>` is an enum with two shapes: `Ok(T)` for success and `Err(E)` for
failure. Here they are `Ok(u32)` and `Err(DepartureError)`. Because `delay`
borrows its `Status`, `minutes` is seen through that borrow; `*minutes` copies
the stored `u32`.

Now consider this line:

```rust
let minutes_late = delay(&train.status)?;
```

**Predict.** Remove the `?`. Why can `add_delay` no longer use
`minutes_late`?

**Observe.** Without `?`, `minutes_late` is a complete
`Result<u32, DepartureError>`, not the successful `u32`.

The `?` is the compact form of this decision:

```rust
let minutes_late = match delay(&train.status) {
    Ok(minutes) => minutes,
    Err(error) => return Err(error),
};
```

**Repair.** Restore the `?`.

**Rule.** `?` extracts the successful value or returns the error from the
current function.

# Run the repaired program

:::source examples/rust-00-reading-rust/src/main.rs#program | The repaired program uses the same train twice

From the notes repository root:

```console
cargo run \
  --manifest-path \
  examples/rust-00-reading-rust/Cargo.toml
```

The output is:

```text
leaves at minute 65
leaves at minute 65
leaves at minute 90
cancelled
```

The first two lines show that shared access preserved the same `late` train for
a second read. The last two distinguish a successful on-time departure from a
failure.

# Read the exit test

```rust
fn departure(
    train: &Train,
) -> Result<u32, DepartureError>
```

`departure` temporarily reads a `Train` and returns one `Result`: either
`Ok(minute)`, carrying a nonnegative `u32`, or `Err(error)`, carrying a
`DepartureError`. Because it borrows rather than takes the train, the caller can
use that train again.

# Ready for R.1

So far, trains, statuses, integers, and results have all been ordinary runtime
values. We used `println!(...)` as a provided output operation and learned only
to recognize the `name!(...)` macro-invocation spelling.

R.1 asks the course-specific question that these general introductions do not:
what does a macro receive and return when Rust code itself becomes its data?
