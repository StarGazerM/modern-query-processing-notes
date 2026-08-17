# Modern Query Processing course site

> **Status:** Work in progress. The syllabus, schedule, project contract, and
> notes are public so students can read the course as it develops.

This repository is the canonical public website for the Fall 2026 Modern Query
Processing course. A dependency-free Node.js renderer builds ordinary course
pages, Friedman-style dialogues, and side-by-side reference pages into one
site with shared navigation and visual language.

Read the published course site at
[pldi.me/modern-query-processing-notes](https://pldi.me/modern-query-processing-notes/).

## Site structure

- `index.md` is the course homepage.
- `syllabus.md`, `schedule.md`, and `project.md` are the canonical course
  documents.
- Numbered files are conversational notes.
- `rust-*` files are the Rust conversation sequence.
- `aside-*` files are quick-reference pages such as the Python-to-Rust
  phrasebook.

Each source selects its presentation without changing the Markdown authoring
model:

```text
layout: home
layout: prose
layout: dialogue
layout: comparison
```

Use a card grid on the homepage or another course-level page as follows:

```text
:::cards
[Read the syllabus](syllabus.html) | Outcomes, assessment, and policies.
[Follow the schedule](schedule.html) | Topics, readings, and release dates.
:::
```

## Start a conversational note

Copy `template.md`, change its front matter, and replace the sample dialogue:

```text
cp template.md 01-cq-meaning.md
```

Write each exchange as:

```text
:::ada
What does this query return?
:::alice
The set of tuples that satisfy every body atom under one valuation.
:::
```

When several exchanges review a prerequisite rather than advance the database
argument, wrap them in an optional review path:

```text
::::review Rust ownership and borrowing
:::ada
Can the caller use `roads` again after passing `&roads`?
:::alice
Yes. The caller lent a shared reference and kept ownership.
:::
::::
```

The renderer presents two visible routes: a reader who already knows the Rust
feature can continue with the main conversation, while another reader can open
the closed feature conversation. This is suitable for local prerequisites such
as borrowing here or macros later. Optional exchanges receive local labels such
as `R1.1` and `R1.2`, so the main dialogue keeps consecutive numbers.

The branch contains only the feature review; it does not replace the next
database question with a different one. Both routes rejoin at the exact same
main-dialogue cell, which states every fact needed later. Printing always
includes the full feature conversation.

The visible speaker names come from the note's front matter:

```text
left_speaker: Ada
right_speaker: Alice
```

`:::ada` opens Ada's turn; `:::alice` begins Alice's reply. Either speaker may
ask a question. Both bodies accept headings, paragraphs, lists, fenced code,
tables, block quotes, inline `$...$` mathematics, and display `$$...$$`
mathematics.
Use a law block only after the dialogue has earned the rule:

```text
:::law The Semantic Anchor
A physical plan may change execution order and work, but not the result set.
:::
```

Use a definition block when the dialogue is ready to freeze an exact meaning:

```text
:::definition Valuation
A valuation assigns one database value to every variable in the query.
:::
```

Keep source guidance outside the speakers' turns. A reading note renders as a
small hint beneath the preceding exchange, with the AHV textbook linked
automatically:

```text
:::reading
Chapter 4, p. 37 - queries and query mappings.
:::
```

Use a notation block only after the dialogue has exercised the forms it
summarizes. It is visually distinct from definitions and laws:

```text
:::notation Forms earned so far
`relation road(City, City);` declares relation `road` with two ordered `City`
positions; it inserts no tuples.
:::
```

End a developed conversation with a recap when its examples have accumulated
into a coherent formal account. A recap leaves the dialogue voice: it states
the earned objects, notation, semantics, and consequences directly and
compactly.

```text
:::recap The formal picture
For a schema $S$, an instance $I$ assigns a relation of the declared arity and
types to every relation name in $S$.

A conjunctive query denotes a mapping from permitted input instances to result
relations. Its answers are the head tuples obtained from valuations satisfying
all body atoms.
:::
```

A recap may consolidate earlier definitions and laws, but it must not introduce
a concept required to understand the preceding conversation. Prefer connected
formal prose over another sequence of questions.

Link adjacent conversations through front matter. The renderer places these as
accessible navigation cards after the conversation and hides them when printing:

```text
previous: [Conversation 1.1 · What's in a Name?](01-a-little-database-a-few-questions.html)
next: [Conversation 1.2 · By Indirections Find Directions Out](02-the-relation-that-wasnt-stored.html)
```

## Embed runnable source without copying it

Keep teaching examples under `examples/` and include the real file in a note
with a single-line source directive:

```text
:::source examples/rust-01-stringify/Cargo.toml | The workspace manifest
```

The directive has no closing marker, so it can appear between exchanges or
inside either speaker's turn. The renderer reads the current file, displays its
physical line numbers, and links the caption to those exact lines on GitHub.
The complete-site build fails if the file disappears or the excerpt becomes
invalid. A local build labels the excerpt as local rather than pretending its
uncommitted line numbers already exist on GitHub; the published build links to
the exact commit used by the site.

For a longer file, mark a stable region with comments appropriate to that file:

```rust
// ANCHOR: entry
#[proc_macro]
pub fn code_string(input: TokenStream) -> TokenStream {
    // ...
}
// ANCHOR_END: entry
```

Then request only that region:

```text
:::source examples/rust-01-stringify/stringify-macro/src/lib.rs#entry | The macro entry point
```

The marker comments remain part of the runnable file but are omitted from the
rendered excerpt. Each marker name must appear exactly once, the end must follow
the start, and an excerpt may contain at most 120 lines.

The dependency-free [`reading-rust` example](examples/rust-00-reading-rust/)
is the repaired endpoint of R.0.0's short readiness route through block values,
structs, enums, shared access, `Result`, and `?`.

## Procedural-macro code style

Keep the exported macro function as a thin `rustc` boundary. It accepts and
returns `proc_macro::TokenStream`, converts once to
`proc_macro2::TokenStream`, and converts once back on return. Inside that
boundary, use Syn major version 2 for typed syntax and `syn::parse2` when tokens
must become a typed value. Emit Rust with `quote! { ... }` so the generated
language remains visible as Rust code.

For a course-defined fixed syntax shape, derive `syn_derive::Parse` instead of
writing `ParseStream` code by hand. Derive `syn_derive::ToTokens` when the syntax
value also needs a structural mapping back to tokens. Struct fields state
sequential product shapes; enum variants state alternative shapes. The
compile-time examples begin with our derived `IntegerExpr`, extend that into a
derived staged source shape, and then deliberately embed a typed Rust block as
the residual language.

Do not hand-assemble `TokenTree` output in ordinary course examples. Reserve
that lower-level style for a lesson whose subject is token mechanics. The
runnable [`code_string!` example](examples/rust-01-stringify/) demonstrates the
boundary. The next workspace moves through a derived `IntegerExpr`, a derived
`PartialInteger`, and a residual `syn::Block` before the same method is applied
to `RelationDecl`.

## Separate denotation from evaluation

In a conceptual conversation, show bare query forms in a `text` fence. They are
the language being investigated, not Rust that can compile by itself. A
conversation may stop after the notation and its denotation are understood.

Do not jump directly from a conjunctive query to a hand-written Rust loop and
present that loop as its implementation. The space between them is course
content. Later conversations should make each intermediate account necessary:
first relational algebra, then a pull-oriented iterator or Volcano account,
and then a push-oriented account. Students should help derive each account and
test it against the denotation already established.

Only after a Rust-shaped operational account has been earned should a guided
`lab-*` note introduce the host-language envelope—the implementation name,
macro invocation, generated item name, callable API, ownership choices, and
materialization format. Every later implementation must preserve the earlier
denotation, but it need not resemble the query syntax or perform the same
sequence of operations.

## Render

```text
node render.mjs 01-cq-meaning.md
```

The command writes `build/01-cq-meaning.html`. Open that file in a
browser. The output is self-contained except for MathJax, which is loaded from
a CDN when mathematical notation is present.

Build the complete published site with:

```text
node build-site.mjs
```

This also formats, compiles, runs, and checks the expected output of every
runnable teaching example. In VS Code, **Terminal → Run Build Task** runs the
same complete build through the default **Notes: Build entire site** task.

Open this notes directory—not only an individual Markdown or Rust file—as the
folder in VS Code. The checked-in workspace settings link rust-analyzer to all
Rust workspaces under `examples/`, and the extension recommendations identify
the rust-analyzer extension needed for code analysis and macro expansion. Add
each future independent Rust example workspace to
`rust-analyzer.linkedProjects` in `.vscode/settings.json`.

Validate every generated internal link and anchor with:

```text
node check-site.mjs
```

During editing, rebuild automatically after each save:

```text
node render.mjs --watch 01-cq-meaning.md
```

The browser layout uses two columns on wide screens and stacks Alice's turn
under Ada's on narrow screens. Browser printing uses a white, page-friendly
layout.

## Build a side-by-side phrasebook

Use a neutral comparison block when two columns show equivalent notation rather
than a conversation:

````text
:::compare Test one candidate
```python
present = candidate in roads
```
:::rust
```rust
let present = roads.contains(&candidate);
```
:::notice
Both expressions read the set and produce a Boolean.
:::
````

The left and right labels still come from `left_speaker` and `right_speaker` in
the front matter. Comparison cards have equal width and aligned tops; the notice
spans both columns. See `aside-a-little-rust-side-by-side.md` for a complete
Python-to-Rust example.

## Authoring discipline

- One `:::ada` / `:::alice` exchange should make one intellectual move.
- Keep each turn short enough that the next speaker carries part of the
  explanation.
- Put exact tuples, bindings, probes, intermediates, or deltas on the page.
- Ask for a prediction before naming the abstraction.
- Use `:::definition` for stipulated vocabulary and semantics.
- Introduce a `:::law` only after examples and a counterexample support it.
- Use one terminal `:::recap` to compress what the dialogue earned; introduce no
  new dependency there.
- Reuse a small cast of queries instead of inventing a new example for every
  question.
