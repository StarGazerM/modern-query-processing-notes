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
I understand: do not just print strings; compute the actual result.
:::

:::ada
```rust
println("{}", eval_integer!(add(2, multiply(3, 4))));
```
:::alice
14

Based on your description, the `eval_integer` macro needs to expand into code
containing the literal `14`.
:::

:::ada
Can it expand into
```
2 + (3 * 4)
```
?
:::alice
I would say no. Although they are equal, that is not the same code as `14`.
:::

:::ada
Yes. In the macro logic, you are not just creating code; you must also complete
the arithmetic. To do that, we need some way to convert the Rust code into
actual Rust values. We begin by designing a type that can hold these
expressions. In compiler theory, this is usually called an **abstract syntax
tree**.
:::alice
I would use:
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
:::

:::definition Abstract syntax tree
An abstract syntax tree is ordinary typed data representing the structure of
code. Alternative shapes become enum variants, each fixed sequence becomes a
struct, and nested code becomes fields containing more syntax values.
:::

:::ada
Very close, but there is an important distinction between an AST type and an
ordinary data type. An AST type must be defined either as an atomic AST type,
such as the number `2`, or as a struct or enum whose fields are themselves AST
types.
:::alice
Suppose I want to store the code `2`. What is its atomic AST type?
:::

:::ada
It is `LitInt`. You have already seen the AST type for a string: `LitStr`.
Revise your definition.
:::alice
```rust
enum IntegerExpr {
    Literal { value: LitInt },
    Call(IntegerCall),
}

struct IntegerCall {
    function: LitStr,
    arguments: Vec<IntegerExpr>,
}
```

How can we convert written code into this AST?
:::

:::ada
Ask Syn to produce the type named on the left:

```rust
let expression: IntegerExpr = syn::parse2(input)?;
```
:::alice
It does not compile:

```text
the trait `Parse` is not implemented for `IntegerExpr`
```

The Rust type exists, but Syn does not yet know how to map the input into it.
Do we have to write a parser ourselves?
:::

:::ada
Not for these regular shapes. We use `syn_derive`, a helper crate whose
procedural macros generate the mappings from our type definitions. Our project
usually requests both directions:

```rust
#[derive(syn_derive::Parse, syn_derive::ToTokens)]
```

`Parse` maps tokens into our value. `ToTokens` lets a later compiler stage put
that value back into code.
:::alice
So while we build `eval_integer!`, another procedural macro generates part of
its implementation. A macro inside our macro project!
:::

:::ada
Exactly. `syn_derive::Parse` runs when this macro crate is compiled and
generates ordinary Rust code. Later, `eval_integer!` calls that generated code
when it receives tokens from its caller.
:::alice
For a struct, the generated mapping can read its fields in order. But the input
contains neither the word `Literal` nor the word `Call`. How can it choose an
enum variant?
:::

:::ada
It cannot infer that choice. We mark the first alternative with a rule:

```rust
enum IntegerExpr {
    #[parse(peek = LitInt)]
    Literal { value: LitInt },
    Call(IntegerCall),
}
```

`#[parse(peek = LitInt)]` asks whether the next token has the `LitInt` shape
without consuming it. If it does, select `Literal`. If it does not, continue to
`Call`.
:::alice
Then I can simulate it:

```text
input 2          -> peek sees LitInt -> choose Literal -> value consumes 2
input add(...)   -> next token is not LitInt -> continue to Call
```

So `peek` only chooses the alternative. The selected variant's fields still
consume and store the input.
:::

:::source examples/rust-02-compile-time/compile-time-macros/src/integer.rs#integer_choice | Evolve the ordinary enum into a parseable syntax choice

:::ada
Exactly. `Call` has no `peek` annotation because it is the final fallback. Its
fields must still match the remaining input. For example, input beginning with
`+` reaches `Call` but then fails because its first field expects an identifier.

This one-token distinction is enough because we deliberately designed the two
forms to begin differently. If two alternatives began the same way, we would
need a different or more detailed selection rule. That general theory is
outside this tutorial.
:::alice
The `Call(IntegerCall)` variant delegates the remaining tokens to
`IntegerCall`. My current version begins with `function: LitStr`, but the input
contains `add`, not `"add"`. Are those the same syntax shape?
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

:::ada
No. `LitStr` represents a quoted Rust string literal. A bare name such as `add`
is an identifier, represented by Syn's `Ident`:

```rust
function: Ident,
```

After that field consumes `add`, the remaining input is `(2, 3)`. Does
`Vec<IntegerExpr>` say where that list begins or which token separates its
elements?
:::alice
No. `Vec` can store the expressions after they have been found, but it does not
describe the written parentheses or commas.
:::

:::ada
Then evolve that field into a syntax-aware, comma-separated list:

```rust
#[syn(parenthesized)]
paren_token: token::Paren,
#[syn(in = paren_token)]
#[parse(Punctuated::parse_terminated)]
arguments: Punctuated<IntegerExpr, Token![,]>,
```

```text
parenthesized                         recognize (...) and keep its delimiter
in = paren_token                     read the next field from inside (...)
Punctuated<IntegerExpr, Token![,]>   keep expressions separated by commas
parse_terminated                     use Syn's existing list mapping
```

Unlike `Vec`, `Punctuated` retains the separators so `ToTokens` can write the
same call shape back into code.
:::alice
Let me trace `add(2, 3)` from left to right:

```text
add       -> function: Ident
(2, 3)    -> paren_token opens the nested input
2, 3      -> arguments: Punctuated<IntegerExpr, Token![,]>
```

Each argument is mapped as another `IntegerExpr`. Now every written part has a
destination.
:::

:::source examples/rust-02-compile-time/compile-time-macros/src/integer.rs#integer_call | Map the pieces inside one call

:::ada
Both `IntegerExpr` and `IntegerCall` now derive the two mappings. Try the line
that failed before:

```rust
let expression: IntegerExpr = syn::parse2(input)?;
```
:::alice
Now it works. `parse2` invokes the generated `Parse` implementation, which
selects a variant and fills each syntax-aware field. Tokens have become our
`IntegerExpr`.
:::

:::ada
Now the input is an `IntegerExpr`. How would you define its value from the two
enum alternatives?
:::alice
A literal produces the integer it represents. A call first evaluates its
arguments, then applies the named operation:

```text
Literal(n)                 -> n
Call add(left, right)      -> evaluate(left) + evaluate(right)
Call multiply(left, right) -> evaluate(left) * evaluate(right)
```

The call cases are recursive because their arguments are themselves
`IntegerExpr` values.
:::

:::ada
Write only that enum dispatch first.
:::alice
`value.base10_parse()` is new. Does it turn the stored `LitInt` syntax into the
ordinary integer value needed by evaluation, while the `Call` case delegates
to a helper?
:::

:::source examples/rust-02-compile-time/compile-time-macros/src/integer.rs#expression_dispatch | Dispatch on our two AST alternatives

:::ada
Yes. `base10_parse()` is Syn's conversion from an integer-literal syntax value
to a Rust integer. For calls, the helper renders the stored `Ident` as text,
pairs it with `arguments.len()`, and matches the supported name-and-arity
combination. Which two combinations should have meaning?
:::alice
`("add", 2)` should evaluate its two children and add them. `("multiply", 2)`
should evaluate its two children and multiply them. Any other name or argument
count should be rejected.

So the derived mapping accepts the general **shape** of a call, while our
evaluator decides which call names and arities have **meaning**.
:::

:::source examples/rust-02-compile-time/compile-time-macros/src/integer.rs#arithmetic_meaning | Give add and multiply their meaning

:::ada
We now have the token-to-`IntegerExpr` mapping, the evaluator, and Quote from
R.1. How should `expand_expression` connect them?
:::alice
```rust
let expression: IntegerExpr = syn::parse2(input)?;
let value = evaluate(&expression)?;
Ok(quote! { #value })
```

Tokens become our `IntegerExpr`, ordinary Rust evaluates it to an `i64`, and
Quote turns that value back into code.
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
