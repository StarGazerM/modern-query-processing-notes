---
title: The Tree We Could Read Twice
subtitle: Rust Conversation R.0.0 — Reading Values, Choices, Borrows, and Results
author: Modern Query Processing
date: Fall 2026
status: Work in progress
layout: dialogue
left_speaker: Ada
right_speaker: Alice
next: [Rust Conversation R.1 · The Code That Became a Value](rust-01-the-code-that-became-a-value.html)
---

:::qa
Before asking Rust to transform programs, let us make sure we can read the
ordinary Rust that will perform those transformations. Keep the
[Rust cheat sheet](aside-a-little-rust-side-by-side.html) nearby for basic
spellings, and run this program from the notes repository root:

```console
cargo run --manifest-path examples/rust-00-reading-rust/Cargo.toml
```

```text
folder 0, first read: Ok(42)
folder 0, second read: Ok(42)
blocked: Err(Unreadable)
```
:::answer
It printed two successful reads of the same folder and one failed read. I do not
yet know how Rust represents those outcomes or why the same folder remains
available for the second read.
:::

:::source examples/rust-00-reading-rust/src/main.rs#data_shapes | The data carried by the program

:::qa
The program later constructs values with these three forms. What does each form
make?

```text
Folder { id: 0, entries: ... }
Entry::File(40)
vec![Entry::File(40), ...]
```
:::answer
`Folder { ... }` constructs a struct value by naming every field.
`Entry::File(40)` selects the `File` enum variant and stores `40` inside it.
`vec![...]` constructs a `Vec` containing the listed values.

Here `u64` is a nonnegative integer type, and `Vec<Entry>` is a growable sequence
whose elements are `Entry` values.
:::

:::qa
What structural difference do you see between `Folder` and `Entry`?
:::answer
Every `Folder` has both fields: one `id` and one sequence of `entries`. An
`Entry` has only one selected form: `File`, `Subfolder`, or `Unreadable`.

Because the recursive entries live inside a `Vec`, which stores its elements
separately, a `Folder` can contain nested folders while every individual
`Folder` value still has a finite size.
:::

:::definition Product and tagged sum
A Rust `struct` gives one fixed product shape: all of its fields occur together.
A data-carrying Rust `enum` gives a tagged sum: each value selects exactly one
variant and carries only that variant's fields.

`Entry` is the tagged choice in this example. `ReadError` also uses enum syntax,
but currently needs only one error tag.
:::

:::source examples/rust-00-reading-rust/src/main.rs#traversal | Read the folder tree without taking it

:::qa
Decode the outside of `total_bytes` before considering its three cases. What do
`mut`, `for`, and `+= match ...` do?
:::answer
`let mut total = 0` creates a local total that may change. The `for` loop visits
each borrowed entry. On every iteration, the selected `match` arm produces a
number, and `+=` adds that number to `total`.

The `match` is therefore an expression with a value, not merely a control-flow
statement.
:::

:::qa
What does each `match` arm do with its selected `Entry` shape?
:::answer
```text
File(bytes)       -> read the stored number
Subfolder(child)  -> recursively total the child
Unreadable        -> return an error
```

Matching both checks the tag and gives a name to the selected variant's field.
For `File`, `bytes` is a borrowed number, so `*bytes` reads and copies its `u64`
value.
:::

:::qa
Temporarily remove the `Unreadable` arm and build again. Why does Rust reject a
function that never receives an unreadable entry in our first folder?
:::answer
`Entry` is a closed set of possible shapes, and the function accepts any
`Folder`, not only the first example. Rust therefore requires the `match` to
cover every `Entry` variant. Restore the arm before continuing.
:::

:::source examples/rust-00-reading-rust/src/main.rs#program | Two reads and one failed read

:::qa
Why does `total_bytes` receive `folder: &Folder` rather than `folder: Folder`?
:::answer
`&Folder` means the function receives temporary read access to a folder rather
than taking ownership of it. The caller writes `total_bytes(&folder)` and keeps
its `Folder`. The two consecutive calls in `main` consequently read the same
tree and both produce `Ok(42)`.

The recursive call receives the child through the same kind of shared access.
:::

:::qa
Read the return type:

```rust
Result<u64, ReadError>
```

What are the possible shapes of the returned value?
:::answer
`Result<T, E>` is itself an enum. Here it is either `Ok(u64)`, containing the
total, or `Err(ReadError)`, explaining why no total was produced.

That is why `Unreadable` should not become the fabricated number `0`: failure
and a successful zero-byte folder are different results.

`return Err(...)` leaves the function immediately. If every entry succeeds, the
final expression `Ok(total)` becomes the function's result.
:::

:::qa
What does the `?` after the recursive call abbreviate?
:::answer
This line:

```rust
let value = total_bytes(child)?;
```

has the same control-flow idea as:

```rust
let value = match total_bytes(child) {
    Ok(value) => value,
    Err(error) => return Err(error),
};
```

`?` extracts the successful value or immediately propagates the error from the
current function. It does not ignore the error.
:::

:::qa
Why do the first two lines include `Ok(...)`, while the blocked line includes
`Err(...)`?
:::answer
`main` keeps each complete `Result` rather than extracting it. The `{:?}` output
therefore shows which enum variant was returned as well as its payload.
:::

:::qa
That printing depends on this line:

```rust
#[derive(Debug)]
```

Temporarily remove it from `ReadError` and build again. What did the derive
supply?
:::answer
The three `Result` prints fail because printing a `Result<u64, ReadError>` with
`{:?}` requires both possible payload types to implement the `Debug` behavior.
`u64` already does; `#[derive(Debug)]` generated that implementation for our
`ReadError` type.

Restore the attribute before continuing. We use its generated behavior here,
but deliberately postpone how such an attribute generates code.
:::

:::recap What this program established
A struct gives one product shape. An enum gives a closed choice of tagged
shapes, and `match` exposes the fields of the selected shape. A shared reference
`&T` lets a function inspect a value without taking it. `Result<T, E>` represents
success or failure, while `?` propagates failure.

We also used three generated-looking spellings—`#[derive(Debug)]`, `vec!`, and
`println!`—without explaining their expansion mechanism. The folder and its
results were ordinary values manipulated by the executable. The next
conversation makes function-like macro invocation observable; the other macro
forms can wait until we need them.
:::
