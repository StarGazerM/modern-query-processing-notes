# Conversational course notes

These notes use a small Markdown convention to produce a Friedman-style,
two-speaker dialogue. The renderer has no package dependencies; it uses the
Node.js already available in the development environment.

## Start a note

Copy `template.md`, change its front matter, and replace the sample dialogue:

```text
cp doc/notes/template.md doc/notes/01-cq-meaning.md
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
`input road/2;` declares a relation named `road` with arity two.
:::
```

## Render

```text
node doc/notes/render.mjs doc/notes/01-cq-meaning.md
```

The command writes `doc/notes/build/01-cq-meaning.html`. Open that file in a
browser. The output is self-contained except for MathJax, which is loaded from
a CDN when mathematical notation is present.

During editing, rebuild automatically after each save:

```text
node doc/notes/render.mjs --watch doc/notes/01-cq-meaning.md
```

The browser layout uses two columns on wide screens and stacks Alice's turn
under Ada's on narrow screens. Browser printing uses a white, page-friendly
layout.

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
