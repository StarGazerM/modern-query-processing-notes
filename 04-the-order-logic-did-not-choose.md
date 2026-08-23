---
title: The Order Logic Did Not Choose
subtitle: Conversation 2.1 — From Equivalent Expressions to Administrative Join Plans
author: Modern Query Processing
date: Fall 2026
status: Work in progress
layout: dialogue
left_speaker: Ada
right_speaker: Alice
previous: [Conversation 1.3 · The Plan That Meant the Same Thing](03-the-plan-that-meant-the-same-thing.html)
---

# The order logic did not choose

:::recap Prerequisite
Conversation 1.3 established an SPJR expression \(E_q\) equivalent to each CQ
\(q\). Natural join is binary, associative, and commutative, so legal
regroupings and reorderings preserve the result. Body atoms carry variables,
and natural join requires tuples from atoms sharing a variable to agree on it.
:::

:::ada
The algebra licenses many equivalent parenthesizations, but it neither chooses
nor ranks them.
:::alice
Then what chooses one?
:::

:::ada
**Join planning** does. To see what it can use, which part of the rule tells us
whether two atom relations can share bindings?
:::alice
The variables occurring in each atom.
:::

:::definition Query hypergraph and atom graph
The **query hypergraph** has variables as vertices and one hyperedge for each
body atom, containing that atom's variables.

For planning, the **atom graph** is undirected: it has one vertex for each
relation atom and an edge exactly when two atoms share a variable. AHV's
sip-graph terminology and planning strategies appear in the reading trail; this
conversation uses *atom graph* for the undirected overlap graph.
:::


:::ada
For `three_hop`, the atom-variable sets are

```text
E1 = {from, x}
E2 = {x, y}
E3 = {y, to}.
```

What does the atom graph look like?
:::alice
A path:

```text
E1 -- E2 -- E3.
```

`E1` and `E3` share no variable.
:::

:::ada
The path suggests a simple source-tied algorithm:

1. Start with the first body atom.
2. Repeatedly choose the earliest unplanned atom adjacent to any chosen atom.
3. Append it to the order.
4. If no adjacent atom remains, begin another connected component; joining the
   components requires a Cartesian product.
:::alice
So the graph constrains which next atoms share bindings, while source order
breaks ties.
:::

:::definition Join planning
**Join planning** chooses an equivalent binary relational-algebra expression for
the body atoms. A simple source-tied planner orders atoms by the connected graph
traversal above and folds that order into a left-deep tree.

A cost-based planner may choose another start, another connected order, or a
bushy binary tree. Correctness requires the chosen expression to remain
equivalent to the CQ.
:::


:::ada
Starting from `E1`, the path forces `E2` before `E3`. What expression results?
:::alice
$$
(E_1\bowtie E_2)\bowtie E_3.
$$
:::

:::ada
Now expose its intermediate relations without changing its meaning.
:::alice
$$
T_1=E_1,
\qquad
T_2=T_1\bowtie E_2,
\qquad
T_3=T_2\bowtie E_3.
$$

The assignments only name subexpressions. They do not require the intermediates
to be physically stored.
:::

:::ada
Each intermediate nevertheless has a schema. Which variables must remain in
it?
:::alice
Variables needed by the head or by an atom that has not yet been joined.
:::

:::ada
Use

```text
on_triangle(a) :-
    edge(a, b),
    edge(b, c),
    edge(c, a).
```

After the first two atoms, may `b` be projected out?
:::alice
Yes. It was needed for that join, but the remaining atom uses `{c, a}` and the
head uses `{a}`. Before the first join, however, removing `b` would destroy its
join condition.
:::

:::ada
For any intermediate \(T_i\) after the first \(i\) atoms, retain

$$
\operatorname{schema}(T_i)\cap
\left(
  \operatorname{vars}(\operatorname{head}(q))
  \cup\bigcup_{j>i}\operatorname{vars}(A_j)
\right).
$$
:::alice
That formalizes the test from `on_triangle`: keep only available variables
needed by the head or a later atom.
:::

:::ada
The compiler could rescan the head and unjoined atoms at every intermediate. A
single backward pass is simpler: begin with the head requirements, traverse the
chosen atom order backward, and add variables needed by each remaining atom.
Insert a projection whenever an intermediate contains more than its required
set. The query hypergraph supplies every atom-variable incidence used by that
pass.
:::alice
So backward analysis computes the same requirement once per plan position
instead of rediscovering it independently at each one.
:::


:::ada
For `on_triangle`, that analysis produces:

```text
relational {
    e1 = rename edge {src -> a, dst -> b};
    e2 = rename edge {src -> b, dst -> c};
    e3 = rename edge {src -> c, dst -> a};

    j2 = natural_join e1 with e2;       // {a, b, c}
    p2 = project j2 keep {a, c};        // {a, c}
    j3 = semijoin p2 with e3;           // {a, c}
    p3 = project j3 keep {a};           // {a}

    derive p3 into on_triangle by union;
}
```
:::alice
Now `p2` drops `b` only after its last join use, and `j3` can be a semijoin
because `e3` adds no required attribute.
:::

:::ada
Only after the logical plan exists do we choose a hash table, index, or another
physical technique. A physical operator implements the set-theoretic contract
of a join, semijoin, projection, or another plan node.

The CQ-to-RA proof establishes \([\![E_q]\!]_I=q(I)\). A separate
implementation proof shows that executing each physical operator produces the
relation denoted by its algebraic node.
:::alice
So the data structure changes how a plan node runs, not what relation that node
denotes.
:::

:::ada
Then summarize the bridge.
:::alice
Logic leaves construction order unspecified. Relational algebra translates
conjunction into binary join and uses algebraic laws to permit equivalent
parentheses. Join planning selects one permitted binary structure. Physical
operators implement it.
:::

:::reading
**Reading trail.** Abiteboul, Hull, and Vianu,
[*Foundations of Databases*, Chapter
6](http://webdam.inria.fr/Alice/pdfs/Chapter-6.pdf):

- §6.1, pp. 112–114: sip graphs and strategies, System R join orderings,
  arbitrary binary join trees, projection of no-longer-needed variables, and
  alternative physical implementations; see especially Examples 6.1.1–6.1.3
  and Exercise 6.4.
- §6.4, pp. 130–131: schema hypergraphs.

The names **join planning** and **atom graph**, the direct CQ query hypergraph,
the explicit required-schema formula, and its backward-pass implementation are
course constructions derived from those definitions and examples, not named
definitions or algorithms in the book.
:::

:::recap The order logic did not choose
Natural join is a binary primitive, while associativity and commutativity prove
that different binary groupings preserve this denotation. Polyadic join notation
hides the parentheses; a logical plan makes them explicit. Relational algebra
therefore does not prescribe an evaluation order: it mathematically licenses an
administrative choice of order.

Join planning makes that choice. The query hypergraph records variables and
atoms; its undirected atom graph connects atoms sharing variables. A simple
planner traverses connected atoms and folds the resulting order into a left-deep
binary expression. A cost-based planner may select another order or a bushy
tree.

If \(T_i\) denotes the intermediate after the first \(i\) atoms, it need retain
only

$$
\operatorname{schema}(T_i)\cap
\left(
  \operatorname{vars}(\operatorname{head}(q))
  \cup\bigcup_{j>i}\operatorname{vars}(A_j)
\right).
$$

A backward pass over the chosen plan uses the query hypergraph to place these
projections. The plan remains mathematical; physical operators later implement
its algebraic contracts without changing the logical result.
:::
