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

:::definition Query hypergraph and atom graph (course terms/adaptations)
For this course, the **query hypergraph** has variables as vertices and one
labeled hyperedge for each body-atom occurrence, containing that occurrence's
variables.

The course **atom graph** is undirected: it has one vertex for each body-atom
occurrence and an edge exactly when two occurrences share a variable.
:::

:::reading
**Course term/adaptation; book basis.** Abiteboul, Hull, and Vianu,
[*Foundations of Databases*, Chapter 6](http://webdam.inria.fr/Alice/pdfs/Chapter-6.pdf),
§6.4,
pp. 130–131, defines schema hypergraphs, not this direct CQ hypergraph. Section
6.1, pp. 112–114, defines sip graphs and strategies, not this undirected atom
graph.
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
That path is a warm-up: every atom is binary, and each adjacency has one
obvious explanation. Now consider a query whose atoms overlap in several ways:

```text
trip(from, to) :-
    leg(from, hub, carrier),
    partner(carrier, partner),
    leg(hub, to, partner),
    open(from, day),
    open(to, day).
```

Call the five body-atom occurrences `L1`, `P`, `L2`, `O1`, and `O2`. Using the
definition above, what query hypergraph do you draw?
:::

:::alice
Its vertices are the variables

```text
{from, hub, carrier, partner, to, day}.
```

Each body-atom occurrence contributes one labeled hyperedge:

```text
L1 = {from, hub, carrier}
P  = {carrier, partner}
L2 = {hub, to, partner}
O1 = {from, day}
O2 = {to, day}.
```

My drawing is:

![The trip query hypergraph, with variables as vertices and body-atom occurrences as labeled hyperedges.](assets/04-trip-hypergraph.svg "The trip query hypergraph.")
:::

:::ada
Using only those five hyperedges, what atom graph do you draw?
:::

:::alice
The five occurrences become vertices. Six pairs share at least one variable:

```text
L1 -- P
L1 -- L2
L1 -- O1
P  -- L2
L2 -- O2
O1 -- O2
```

So the graph is

```text
        P
       / \
     L1---L2
     |     |
     O1---O2
```
:::

:::ada
In the `L1`–`P`–`L2` triangle, which variable accounts for each side, and does
one variable occur in all three atoms?
:::

:::alice
`L1`–`P` shares `carrier`, `P`–`L2` shares `partner`, and `L1`–`L2` shares
`hub`. No variable occurs in all three.
:::

:::ada
If only the unlabeled atom graph remained, could you reconstruct the five
hyperedges exactly?
:::

:::alice
No. The atom graph records that two occurrences overlap, but not which variable
caused each overlap. Its triangle cannot distinguish these three different
shared variables from one variable common to all three atoms. The query
hypergraph retains that atom-variable incidence information.
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

:::definition Join planning (course umbrella term/adaptation)
For this course, **join planning** chooses a binary natural-join expression
whose denotation is the complete body-valuation relation. A simple source-tied
planner orders atoms by the connected graph traversal above and folds that
order into a left-deep tree.

A cost-based planner may choose another start, another connected order, or a
bushy binary tree. Correctness requires the chosen body expression to retain
that body denotation; after the unchanged output construction, the full
expression must have the CQ's output schema and result.
:::

:::reading
**Course term/adaptation; book basis.** Abiteboul, Hull, and Vianu,
*Foundations of Databases*, Chapter 6, §6.1, pp. 112–114,
discusses sip strategies, System R join orderings, and arbitrary binary join
trees. **Join planning** and the source-tied traversal are course terminology
and policy.
:::

:::ada
Apply the source-tied rule to `trip`, starting at `L1`. Give the available
adjacent choices at each tie and the resulting order.
:::alice
After `L1`, the choices are `P`, `L2`, and `O1`, so source order picks `P`.
Then `L2` and `O1` are available, so it picks `L2`. Finally both `O1` and `O2`
are adjacent to the chosen set, and it picks `O1` first. The order is

```text
L1, P, L2, O1, O2.
```
:::

:::ada
Suppose `O1` has ten rows while `P` has ten million. Does the atom graph show
which next choice is likely to produce the smaller intermediate?
:::alice
No. It records overlap, not relation sizes or how selective a join will be. A
cost-based planner needs statistics beyond this graph and may choose `O1`
before `P` without changing the query's result.
:::

:::ada
Return to `three_hop` so the first binary tree stays easy to inspect. Starting
from `E1`, the path forces `E2` before `E3`. What expression results?
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
For this course's chosen atom order, let \(T_i\) be the intermediate after the
first \(i\) atoms. Retain

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

:::reading
**Derived here from the book.** The required-schema formula and its single
backward-pass implementation are course constructions derived from Abiteboul,
Hull, and Vianu, *Foundations of Databases*, Chapter 6, §6.1, pp. 112–114,
especially Examples 6.1.1–6.1.3, together with Exercise 6.4. The book does not
state this formula or algorithm.
:::

:::ada
Transfer the backward analysis to the chosen `trip` order
`L1, P, L2, O1, O2`. Which schema is required after each atom, and which
variable survives only because a later atom needs it?
:::alice

```text
after L1: {from, hub, carrier}
after P:  {from, hub, partner}    // carrier's last use was P
after L2: {from, to}              // hub and partner are finished
after O1: {from, to, day}
after O2: {from, to}              // day is now finished
```

`day` is not in the head, but it must survive `O1` so that `O2` can require the
same day at both endpoints. This is why projecting only to head variables at
every step would be wrong.
:::

:::ada
For the earlier `on_triangle`, the same analysis produces:

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
In this course's staged account, only after the logical plan exists do we
choose a hash table, index, or another physical technique. A physical operator implements the set-theoretic contract
of a join, semijoin, projection, or another plan node.

The CQ-to-RA proof establishes \([\![E_q]\!]_I=q(I)\). A separate
implementation proof shows that executing each physical operator produces the
relation denoted by its algebraic node.
:::alice
So the data structure changes how a plan node runs, not what relation that node
denotes.
:::

:::reading
**Course term/adaptation; book basis.** This staged logical-plan/physical-
operator boundary is course framing derived from Abiteboul, Hull, and Vianu,
*Foundations of Databases*, Chapter 6, §6.1, pp. 112–114, especially its
planning examples and alternative physical implementations, together with
Exercise 6.4. The book does not present it as a named definition or theorem.
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

Join planning makes that choice. The query hypergraph preserves each
atom-variable incidence; its undirected atom graph keeps only whether two atoms
overlap. The latter is useful but lossy: even a triangle can arise from three
different shared variables. Neither graph contains the statistics needed to
rank intermediate sizes.

A simple planner traverses connected atoms and folds the resulting order into a
left-deep binary expression. A cost-based planner may select another order or a
bushy tree.

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
