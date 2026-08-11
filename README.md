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
:::qa
What does this query return?
:::answer
The set of tuples that satisfy every body atom under one valuation.
:::
```

When several exchanges review a prerequisite rather than advance the database
argument, wrap them in an optional review path:

```text
::::review Rust ownership and borrowing
:::qa
Can the caller use `roads` again after passing `&roads`?
:::answer
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

The markers identify the left and right turns; either speaker may ask a
question. Both bodies accept headings, paragraphs, lists, fenced code, tables,
block quotes, inline `$...$` mathematics, and display `$$...$$` mathematics.
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

Keep source guidance outside the speakers' turns. An Alice note renders as a
small hint beneath the preceding exchange, with the book title linked
automatically:

```text
:::alice
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

## Separate meaning from Rust wiring

In a conceptual conversation, show bare query forms in a `text` fence. They are
the language being investigated, not Rust that can compile by itself. When an
executable account of their meaning is needed, show a separate ordinary Rust
function in a `rust` fence and compile-check that function.

Delay the host-language envelope—the implementation name, macro invocation,
generated item name, callable API, ownership choices, and materialization
format—to a guided `lab-*` note. That lab should make each piece necessary by
first trying to give the already-understood query notation a home in Rust.
The conversation establishes what a query denotes; the lab later constructs
machinery that must preserve that meaning.

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

- One `:::qa` block should make one intellectual move.
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
