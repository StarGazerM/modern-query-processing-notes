---
title: The Arithmetic That Ran Before the Program
subtitle: Rust Conversation R.2 — From Our Syntax Object to Compile-Time Evaluation
author: Modern Query Processing
date: Fall 2026
status: Work in progress
layout: dialogue
left_speaker: Ada
right_speaker: Alice
previous: [Rust Conversation R.1 · The Code That Became a Value](rust-01-the-code-that-became-a-value.html)
next: [Rust Conversation R.3 · The Program Left Behind](rust-03-the-program-left-behind.html)
---

:::ada
Our first macro can preserve this new piece of code as text:

```rust
code_string!(add(2, multiply(3, 4)))
```
:::alice
It would produce the string-literal expression
`"add(2, multiply(3, 4))"`. The macro would still know nothing about the
arithmetic.
:::

:::ada
This time we want an **integer evaluator**. Its language will be deliberately
small:

```text
integer literal
add(expression, expression)
multiply(expression, expression)
```

Every accepted input must become one `i64` literal. `eval_integer!` does not
promise to evaluate an arbitrary Rust expression.
:::alice
Understand, don't just print strings, but compute the actual result
:::

:::ada
Then this is the caller we will make work:

:::source examples/rust-02-compile-time/demo/src/main.rs | The caller we will make compile

:::alice
The macro invocation must eventually become an `i64` expression for the
constant. The later executable only prints that value.
:::

:::ada
Exactly. Before writing the evaluator, we must answer: **how should this code be
represented as a Rust value?**

Look only at the code inside `eval_integer!`. How many different shapes must
that value represent?
:::alice
Two. `2`, `3`, and `4` are integer literals. `add(...)` and `multiply(...)`
have a name followed by parenthesized, comma-separated children.

The second shape is recursive because its children can have either shape
again.
:::

:::ada
So we define the program value we want the macro to receive:

```text
Call add
├── Literal 2
└── Call multiply
    ├── Literal 3
    └── Literal 4
```

How could we represent this code in Rust?
:::alice
I propose:

```rust
enum IntegerExpr {
    Literal { value: i64 },
    Call(IntegerCall),
}

struct IntegerCall {
    function: String,
    arguments: Vec<IntegerExpr>,
}
```

I will store the name of each primitive operation in `function`.
:::

:::definition Abstract syntax tree
An abstract syntax tree is ordinary typed data representing the structure of
code. Alternative shapes become enum variants, each fixed sequence becomes a
struct, and nested code becomes fields containing more syntax values.
:::

:::ada
Good. This can represent the code we want. But the macro still needs a way to
convert its input code into this value.

We want to write:

```rust
let expression = syn::parse2::<IntegerExpr>(input)?;
```
:::alice
What is `syn::parse2`?

This function seems smart: once we give it `IntegerExpr` as its generic type
argument, it appears to just work.
:::

:::ada
`syn::parse2` is a Rust library function that turns a token stream into a
chosen Rust type. It is indeed smart, but not that smart: our current
`IntegerExpr` does not yet tell `parse2` how to construct it. We need to put a
magic hat on the definition:

```rust
#[derive(syn_derive::Parse, syn_derive::ToTokens)]
enum IntegerExpr {
    ...
}
```
:::alice
Two more new names have appeared. What do `syn_derive::Parse` and
`syn_derive::ToTokens` do?
:::

:::ada
When something in Rust appears to add behavior to ordinary Rust code as if by
magic, it is often another procedural macro. Here, one derive generates the
mapping from a token stream into the struct or enum we defined; the other
generates the mapping back into tokens.
:::alice
A macro to build another macro!
:::

:::source examples/rust-02-compile-time/compile-time-macros/src/integer.rs#integer_choice | Select one alternative syntax shape

:::ada
Try to remember this pattern and get used to it. It is a common technique that
we will use repeatedly. Now look at the code above: we still need to explain a
few pieces.
:::alice
My version stored the literal as an `i64`, but this version stores a `LitInt`.
Why?
:::

:::ada
`IntegerExpr` is supposed to represent the structure of the code. `LitInt` is
Syn's type for an integer literal as written in that code; `i64` is the integer
value we will compute later.
:::alice
Then `LitInt` belongs in the syntax object. But the input contains neither the
word `Literal` nor the word `Call`. How does the generated mapping choose a
variant?
:::

:::ada
`#[parse(peek = LitInt)]` asks whether the next token has the `LitInt` shape
without consuming it. If it does, select `Literal`. If it does not, continue to
`Call`.
:::alice
Then I can simulate it:

```text
input 2          -> peek sees LitInt -> choose Literal -> value consumes 2
input add(...)   -> peek sees Ident  -> continue to Call
```

So `peek` only chooses the alternative. The selected variant's fields still
consume and store the input.
:::

:::ada
Exactly. `Call` has no `peek` annotation because it is the final fallback. Its
own fields still check that the remaining input really has call shape. For
example, input beginning with `+` reaches `Call` but fails when its first field
expects an identifier.

This one-token distinction is enough because we deliberately designed the two
forms to begin differently. If two alternatives began the same way, we would
need a different or more detailed selection rule. That general theory is
outside this tutorial.
:::

*Optional theory.* The general study of choosing a top-down grammar alternative
with bounded lookahead is called `LL(k)` parsing. See Rosenkrantz and Stearns,
[*Properties of Deterministic Top-Down Grammars*](https://doi.org/10.1016/S0019-9958(70)90446-8)
(1970).

:::definition peek
`peek` asks whether the next token has a requested shape without consuming it.
Here the generated `Parse` implementation uses that answer to select an enum
variant; the selected variant then reads its own fields.
:::

:::alice
The `Call(IntegerCall)` variant delegates the remaining work to
`IntegerCall`. How do its fields describe `add(2, 3)`?
:::

:::ada
A call has two different kinds of pieces:

```text
add        one identifier
(2, 3)     a parenthesized region containing a repeated list
```

The fields follow that shape:

```rust
function: Ident,
#[syn(parenthesized)]
paren_token: token::Paren,
#[syn(in = paren_token)]
#[parse(Punctuated::parse_terminated)]
arguments: Punctuated<IntegerExpr, Token![,]>,
```
:::alice
`Ident` is the syntax-aware version of our earlier `String`. My `Vec` already
represented the repeated arguments. Is `Punctuated` its syntax-aware version,
while `paren_token` represents the region around that list?
:::

:::ada
For this purpose, yes:

```text
parenthesized                         recognize (...) and store its delimiter
in = paren_token                     read this field from inside that group
Punctuated<IntegerExpr, Token![,]>   store expressions and their commas
parse_terminated                      use Syn's existing list routine
```

Unlike `Vec`, `Punctuated` retains the separators so `ToTokens` can write the
same call shape back into code.
:::

:::source examples/rust-02-compile-time/compile-time-macros/src/integer.rs#integer_call | Map the pieces inside one call

:::alice
Let me pause and trace one call from left to right:

```text
add       -> function: Ident
(...)     -> paren_token: token::Paren
2, 3      -> arguments: Punctuated<IntegerExpr, Token![,]>
```

`IntegerCall` derives the same two mappings, so the `Call` variant can delegate
to it. Every written piece now has a field or a selection rule. Is the mapping
ready to use?
:::

:::ada
Yes. Invoke the generated mapping once at the macro boundary:

```rust
let expression: IntegerExpr = syn::parse2(input)?;
```
:::alice
This fills the missing middle: tokens become **our** `IntegerExpr`. If variant
selection or any selected field fails, `?` propagates the error.
:::

:::ada
Once code is an `IntegerExpr`, start with three ordinary recursive rules:

```text
Literal(n)                 -> n
Call add(left, right)      -> evaluate(left) + evaluate(right)
Call multiply(left, right) -> evaluate(left) * evaluate(right)
```
:::alice
A literal ends the recursion. A call contains more `IntegerExpr` values, so the
evaluator recursively obtains their values before applying `add` or
`multiply`.
:::

:::ada
Write only that enum dispatch first.
:::

:::source examples/rust-02-compile-time/compile-time-macros/src/integer.rs#expression_dispatch | Dispatch on our two AST alternatives

:::alice
`value.base10_parse()` is new. Does it turn the stored `LitInt` syntax into the
ordinary integer value needed by evaluation, while the `Call` case delegates
to a helper?
:::

:::ada
Yes. `base10_parse()` is Syn's conversion from an integer-literal syntax value
to a Rust integer. For calls, the helper renders the stored `Ident` as text,
pairs it with `arguments.len()`, and matches the supported name-and-arity
combinations. Begin with these two cases.
:::

:::source examples/rust-02-compile-time/compile-time-macros/src/integer.rs#arithmetic_meaning | Give add and multiply their meaning

:::alice
The two match arms recursively evaluate their indexed children. So the derived
mapping accepts the general **shape** of a call, while our evaluator decides
which call names and arities have **meaning**.
:::

:::ada
The complete expansion is now the same three-pass shape used by our compiler:

```rust
let expression: IntegerExpr = syn::parse2(input)?;
let value = evaluate(&expression)?;
Ok(quote! { #value })
```
:::alice
Now the missing middle is concrete: tokens become our `IntegerExpr` before
ordinary Rust evaluates it to an `i64`. Quote turns that value back into code.
:::

:::source examples/rust-02-compile-time/compile-time-macros/src/integer.rs#expression_expansion | Map, evaluate, and emit

:::ada
With the notes folder open in VS Code, expand
`eval_integer!(add(2, multiply(3, 4)))` using
**rust-analyzer: Expand macro recursively at caret**.
:::alice
The expansion is `14i64`. The call-shaped arithmetic has disappeared; only the
computed literal remains.
:::

:::ada
Now run the caller:

```console
cargo run --manifest-path examples/rust-02-compile-time/Cargo.toml --package compile-time-demo
```

```text
14
```
:::alice
The executable prints the value of the generated literal. The expansion—not
only the printed result—is the evidence that the macro performed the
arithmetic.
:::

*Optional experiment.* [The Build That Waited](rust-02-the-build-that-waited.html)
makes the compile-time/runtime boundary physically observable with an
intentionally slow computation.

:::ada
Our complete evaluator rejects this input:

```rust
let x = 7;
eval_integer!(add(add(2, multiply(3, 4)), x))
```
:::alice
`add(2, multiply(3, 4))` fits our compile-time `IntegerExpr`, but the runtime
name `x` does not. This macro promises to turn the whole input into one integer.

Can we compute the known expression now while returning Rust code that still
contains `x` for later?
:::
