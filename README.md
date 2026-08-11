# Conversational course notes

These notes use a small Markdown convention to produce a Friedman-style,
two-speaker dialogue. The renderer has no package dependencies; it uses the
Node.js already available in the development environment.

Read the published notes at
[pldi.me/modern-query-processing-notes](https://pldi.me/modern-query-processing-notes/).
`index.md` is the landing page; numbered conversations and `aside-*` files are
rendered as individual pages.

## Start a note

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

Use a notation block when the dialogue reaches syntax students will type in a
homework. It is visually distinct from definitions and laws:

```text
:::notation MiniLinq homework notation
`relation road(City, City);` declares a host-supplied relation named `road`
with two ordered `City` columns; it inserts no tuples.
:::
```

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
- Reuse a small cast of queries instead of inventing a new example for every
  question.
