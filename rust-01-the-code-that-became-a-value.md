---
title: The Code That Became a Value
subtitle: Rust Conversation R.1 — From Macro Input to a Typed Syntax Value
author: Modern Query Processing
date: Fall 2026
status: Work in progress
layout: dialogue
left_speaker: Ada
right_speaker: Alice
previous: [Rust Conversation R.0.0 · The Tree We Could Read Twice](rust-00-the-tree-we-could-read-twice.html)
next: [Rust Conversation R.2 · The Arithmetic That Ran Before the Program](rust-02-the-arithmetic-that-ran-before-the-program.html)
---

:::qa
```rust
stringify!(1);
```
:::answer
What is `stringify`?
:::

:::qa
It takes a Rust expression as input and turns it into a string.
:::answer
"1"
:::

:::qa
```rust
stringify!(1+1);
```
:::answer
"2"
:::

:::qa
No, it actually gives you something like `"1 + 1"`.
:::answer
Ooooh—it turns the **expression itself** into a string.
:::

:::qa
```rust
let x = 1 + 1;
stringify!(x);
```
:::answer
"x"
:::

:::qa
Sweet. Why is there a `!` after `stringify`?
:::answer
The Rust Book says this is because `stringify!` is not a function; it is a
**macro**.
:::

:::qa
What is a **macro**?
:::answer
Hmm. It seems to be a function that takes an expression as input.
:::

:::qa
Let us test that model. If a macro were a function, what would this function
return?
:::answer
I don't know, but my guess is that it returns expressions.
:::

:::qa
Exactly. `stringify!` takes the tokens spelling `1 + 1` as input and returns new
tokens spelling another expression—`"1 + 1"`.

What is a compiler?
:::answer
A compiler turns code into a binary.
:::

:::qa
Roughly, but not quite. A compiler translates code written in one language into
code in another language. The target might be another source language,
assembly, or machine code.

So, conceptually, we can begin with:

```text
Compiler : Code -> Code
```
:::answer
Wait. `stringify!` also takes code as input and returns code. But it is a macro,
not a compiler.
:::

:::qa
Who said that a macro cannot be a compiler?
:::answer
What? Then, what's the difference between a compiler and a macro?
:::

:::qa
What kind of code does `stringify!` return?
:::answer
Rust code: a string-literal expression.
:::

:::qa
`macro` and `compiler` answer different questions. Calling something a macro
tells us its expansion mechanism. Calling it a compiler describes a semantic
job: translating a program from one language or stage into another. A macro can
implement a compiler stage; not every macro is usefully understood as a
compiler.

One way to build a compiler is to chain a series of macro calls. Each expansion
makes one small change to the syntax and produces the next stage. After several
rounds of expansion, our query has become ordinary Rust. The Rust compiler can
then continue from Rust to assembly and machine code.

In this course, we will use this idea to build a compiler for a database query
language. It will compile a database query into Rust code.
:::answer
Okay. That sounds strange. Why use macro to build the compiler?
:::

:::qa
At the end of database Conversation 1.2, we had a query \(q\), a database
instance \(I\), and the result relation \(q(I)\). Earlier, we represented each
relation instance in Rust as a `HashSet`.

What would a `HashSet` look like in assembly?
:::answer
Okay, I see. We do not need to implement the database instance's `HashSet`
representation in assembly ourselves.

Our macro can transform \(q\) into ordinary Rust code that accepts the
`HashSet`s representing \(I\) and computes \(q(I)\). Then `rustc` can compile
that Rust, and we can reuse Rust's types, standard library, and build system,
Cargo.
:::

:::qa
Before we learn how to write the whole database-query compiler, let us learn how
a macro works.

Try to implement `stringify!`.
:::answer
Wait—I do not know how to write a macro. What is the first step? Do I define a
function named `stringify` and mark it as a macro?
:::

:::qa
Almost. Rust already has a built-in macro named `stringify!`, so we will give
ours the distinct name `code_string!`. If its import ever breaks, the compiler
must report an error instead of silently using Rust's version.

Before we write the function, look at the files Cargo uses in the runnable
example:

```text
examples/rust-01-stringify/
├── Cargo.toml
├── stringify-macro/
│   ├── Cargo.toml
│   └── src/
│       └── lib.rs
└── demo/
    ├── Cargo.toml
    └── src/
        └── main.rs
```
:::answer
Why are there three `Cargo.toml` files? I expected one program to have one.
:::

:::qa
Rust requires the procedural macro and the code using it to be in different
**crates**. The macro crate must already be compiled before rustc can run it
while compiling the demo crate.

This example gives each crate its own directory and manifest:

```text
stringify-macro/Cargo.toml   the procedural-macro crate
demo/Cargo.toml              the executable crate that uses it
```

The top `Cargo.toml` merely groups them so one Cargo command can build both. It
is not a third program.
:::answer
So the important fact is not “three manifests.” It is that the procedural macro
must stay in its own crate.
:::

:::qa
Exactly. Now run the project:

```console
cargo run --manifest-path examples/rust-01-stringify/Cargo.toml --package stringify-demo
```

```text
1 + 1
x
relation road(City, City);
2
```
:::answer
The first two lines are textual renderings of the code, not its value. Even
`relation road(City, City);` survived as code although it is not a Rust
expression. The last line is the value computed by the executable.
:::

:::qa
Did `code_string!` run at the same time as the four `println!` calls?
:::answer
No. `cargo run` bundled two phases into one command. During **compile time**,
Cargo built the macro crate and rustc ran `code_string!` while compiling the
demo. During **runtime**, the resulting executable ran `main` and printed the
four lines.
:::

:::source examples/rust-01-stringify/demo/src/main.rs | The executable that invokes the macro

:::qa
Match the four `println!` calls above to the four lines you observed. Which
output did the macro not produce?
:::answer
The three `code_string!` invocations produced the first three strings. The last
`println!` printed the value of `x`, which is `2`; the macro did not produce that
line.

The strange case is now visible in the source: the third invocation contains
`relation road(City, City);`, which is not a Rust expression.
:::

:::qa
You already ran this program once. Now the surprising third line has a sharper
meaning: the macro received `relation road(City, City);` before Rust tried to
interpret the surrounding invocation as an expression.
:::answer
So a macro's input is not necessarily an expression. It is syntax inside the
invocation's delimiters.
:::

:::qa
Now we are ready to build the function you first imagined. Rust supplies the
compiler-facing crate `proc_macro`.

Which imports match our four jobs: the compiler boundary, the internal token
stream and source context, an emitter for Rust code, and a typed string-literal
syntax value?
:::answer
```rust
use proc_macro::TokenStream;
use proc_macro2::{Span, TokenStream as TokenStream2};
use quote::quote;
use syn::LitStr;
```

`proc_macro::TokenStream` is the type `rustc` requires at the public boundary.
We rename `proc_macro2::TokenStream` to `TokenStream2` so both representations
remain visible. `Span` carries source-location context, `LitStr` is Syn's typed
representation of Rust string-literal syntax, and `quote` is the macro that
will emit our replacement Rust code.
:::

:::qa
From the required boundary `TokenStream -> TokenStream`, write the function
header. Remember that the demo must import it and that Rust needs to register it
as a function-like macro.

```rust
#[proc_macro]
pub fn code_string(input: TokenStream) -> TokenStream
```

:::answer
I get the two lines above. `#[proc_macro]` registers a function-like macro named
`code_string`; `pub` makes it exportable; and the signature expresses the
tokens-in, tokens-out boundary.
:::

:::qa
More exactly, why must the function be `pub`?
:::answer
The demo is a different crate. The attribute exports this name into the macro
namespace, and `pub` makes that exported macro available for another crate to
import. The function also lives in `src/lib.rs`, the root source file of this
library crate, because a `#[proc_macro]` function must be defined at the crate
root.
:::

:::qa
The path dependency made the macro crate available to the demo. Did that alone
make the unqualified call `code_string!(...)` visible in `main.rs`?
:::answer
No. The first line, `use stringify_macro::code_string;`, brings that exported
macro name into the demo's scope. The dependency and the `use` statement do two
different jobs.
:::

:::qa
The exported function must accept the compiler's token stream, but our course
style uses `proc_macro2` inside the implementation. What does this first line
do?

```rust
let input = TokenStream2::from(input);
```
:::answer
It changes the representation of the incoming tokens, not the tokens
themselves. From this line until the final return, the implementation uses the
token type shared by Syn and Quote.
:::

:::qa
The macro now needs the written form of its input without evaluating it. Which
method gives us that, and is the resulting line evaluating an input expression?

```rust
let written_input = input.to_string();
```
:::answer
I would write the line above. No evaluation happens: `input` is code represented
as a sequence of tokens. `to_string()` asks for a textual rendering of those
tokens. That is why `x` stays `x` rather than becoming `2`.
:::

:::qa
It is also why the result is only *like* the spelling we wrote. Token streams do
not preserve comments or exact whitespace, and their textual rendering may
insert spaces needed to separate tokens.

We must return Rust syntax, not the runtime `String` stored in `written_input`.
What typed syntax value should we construct for the output?
:::answer
A `syn::LitStr`: a Rust value representing one Rust string literal. If
`written_input` contains `1 + 1`, this value represents the source expression
`"1 + 1"`:

```rust
let output_literal = LitStr::new(&written_input, Span::call_site());
```

`LitStr::new` takes care of constructing valid string-literal syntax, including
any escaping the contents need. `Span::call_site()` gives the generated literal
the macro invocation's source context. That context matters to the compiler and
its diagnostics; it is not a runtime value inside the string.
:::

:::qa
Now finish the function:

```rust
quote! { #output_literal }.into()
```

What do the `#`, `quote!`, and `.into()` each do?
:::answer
Inside `quote!`, `#output_literal` interpolates the `LitStr` value into the Rust
syntax template. `quote!` emits that template as a
`proc_macro2::TokenStream`. The final `.into()` converts it back to the
compiler-facing `proc_macro::TokenStream` required by our public signature.
:::

:::source examples/rust-01-stringify/stringify-macro/src/lib.rs | The complete procedural macro

:::qa
Compare the runnable file above with the function we just constructed. Is any
line still unexplained?
:::answer
No. The attribute and public signature establish the compiler boundary. The
body then moves through four visible representations:

```text
proc_macro::TokenStream
    -> proc_macro2::TokenStream
    -> String
    -> syn::LitStr
    -> proc_macro2::TokenStream
    -> proc_macro::TokenStream
```

The important new fact is that `syn::LitStr` is ordinary Rust data whose meaning
is a piece of Rust syntax. `quote!` turns that typed syntax value back into code.
:::

:::qa
Could we instead assemble the returned `TokenTree`s by hand?
:::answer
Yes, but that is not our normal compiler style. In this course, use
`proc_macro::TokenStream` only at the exported boundary, use `proc_macro2`
inside, represent syntax with Syn 2 types, and emit Rust with
`quote! { ... }`. We will construct token trees manually only when token
mechanics themselves are the lesson.
:::

:::qa
Open the notes repository root as the folder in VS Code. In our teaching
checkout, that folder is `doc/notes`; in a standalone clone, it is simply the
clone's top directory. Its workspace settings link rust-analyzer to both
runnable Rust workspaces, so the editor loads their macro and demo crates even
though the notes root has no `Cargo.toml`. If VS Code offers the recommended
rust-analyzer extension, install it.

Now open `examples/rust-01-stringify/demo/src/main.rs`, put the caret on
`code_string!(1 + 1)`, open the Command Palette, and run **rust-analyzer: Expand
macro recursively at caret**. What should the expansion window contain?
:::answer
The string-literal expression `"1 + 1"`. That window shows the replacement
syntax produced during compilation; it is not output printed while the program
runs.
:::

:::qa
We can now account for the whole event:

```text
compile time
  tokens inside code_string!(1 + 1)
        ↓ rustc calls the already-compiled macro
  proc_macro::TokenStream
        ↓ convert once at the boundary
  proc_macro2::TokenStream
        ↓ to_string()
  String containing "1 + 1"
        ↓ LitStr::new(...)
  syn::LitStr representing the syntax "1 + 1"
        ↓ quote! { #output_literal }
  proc_macro2::TokenStream containing "1 + 1"
        ↓ .into() and return to rustc
  "1 + 1"

runtime
  println! prints the resulting string value
```

Can the macro ever observe the value assigned to `x`?
:::answer
No. It only sees the token `x` during macro expansion. Computing a value for the
demo's `x` belongs to the later compiled program, regardless of whether the
compiler optimizes that particular arithmetic before the executable runs.
:::

:::definition Function-like procedural macro
A function-like procedural macro is a `#[proc_macro]` public Rust function
defined at the root of a procedural-macro crate with the boundary
`TokenStream -> TokenStream`. During compilation, the compiler runs that
function on the tokens inside a macro invocation and replaces the invocation
with the tokens the function returns. The resulting Rust code is then compiled
normally and may execute later at runtime.
:::

:::qa
Why did `code_string!(relation road(City, City);)` work even though its input was
not a Rust expression?
:::answer
The compiler only had to recognize a macro invocation and form token trees from
the balanced contents inside its delimiters. Our macro then replaced those
tokens with a valid Rust string literal before the surrounding position was
checked as an expression.
:::

:::qa
Does our macro yet understand that `road` is a relation name, that it has arity
two, or that both positions have type `City`?
:::answer
No. It has a typed `syn::LitStr` for the **output** string literal, but it still
treats the **input** relation declaration as an opaque token stream and then as
text. It has no value with fields for the name `road` or its two `City`
positions.

That is the missing object: a typed syntax tree that turns the relation
declaration itself into a Rust value we can inspect and transform.

Before defining `RelationDecl`, we will use integer arithmetic as a smaller
training language. Syn already knows its grammar, so we can observe the mapping
from written expression to enum-shaped AST, interpret that AST during
compilation, and then use the same tools to define our own source shape without
writing a parser by hand.
:::
