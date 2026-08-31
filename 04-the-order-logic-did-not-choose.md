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
Conversation 1.3 translated each body-atom occurrence into a relation-valued
SPJR leaf. For a fixed CQ, every full binary tree \(T\) over those leaves gives
an equivalent expression \(E_{q,T}\). The conversation proved their common
denotation but did not choose \(T\). It also established that natural join over
disjoint sorts is Cartesian product, with \(|I\times J|=|I|\,|J|\).
:::

:::ada
Before choosing an algebraic tree, consider a delivery service.

Four drivers report to two depots:

```text
Lin  -> north
Moe  -> north
Nia  -> south
Omar -> south
```

The depots stock different items:

```text
north -> bolt
south -> nut
```

Four jobs need those items:

```text
job1 -> bolt
job2 -> bolt
job3 -> nut
job4 -> nut
```

A driver is eligible for a job when the driver's depot stocks the item that the
job needs. Is Lin eligible for `job1`?
:::alice
Yes. Lin reports to `north`, `north` stocks `bolt`, and `job1` needs `bolt`.
Those three facts connect Lin to `job1`.
:::

:::ada
Is Lin eligible for `job3`?
:::alice
No. `job3` needs `nut`, but Lin's depot stocks `bolt`.
:::

:::ada
Now find every eligible driver–job pair. If you begin with the drivers, how
would you organize the reasoning?
:::alice
For each driver, find the driver's depot, then the items stocked there, and
finally the jobs needing those items:

```text
Lin, Moe  -> north -> bolt -> job1, job2
Nia, Omar -> south -> nut  -> job3, job4
```
:::

:::ada
Could you solve the same problem starting from the jobs?
:::alice
Yes. For each job, find its required item, then the depot stocking that item,
and finally the drivers based at that depot. The reasoning runs in the opposite
direction but produces the same eight driver–job pairs.
:::

:::ada
Consider a third correct method: first pair every driver with every job, and
only afterward check whether the driver's depot stocks the required item. How
many pairs exist before that check?
:::alice
There are four drivers and four jobs, so it begins with sixteen pairs. Eight
survive after the depot and item facts are checked.
:::

:::ada
Write the eligibility condition as a conjunctive query.
:::alice
```text
eligible(driver, job) :-
    based_at(driver, depot),
    stocks(depot, item),
    needs(job, item).
```
:::

:::ada
Let \(D,S,N\) be the local atom expressions for `based_at`, `stocks`, and
`needs`. Their schemas are

```text
D = {driver, depot}
S = {depot, item}
N = {job, item}.
```

Translate the driver-first reasoning into relational algebra. How many tuples
does each join produce on this instance, and what do they mean?
:::alice
The expression is

$$
(D\bowtie S)\bowtie N.
$$

The first join produces four `(driver, depot, item)` tuples: one stocked item
for each driver. Joining `needs` produces eight complete valuation tuples, one
for each eligible driver–job pair. The join-output sizes are therefore `4, 8`.
:::

:::ada
And the job-first reasoning?
:::alice
It is

$$
D\bowtie(S\bowtie N).
$$

The first join produces four `(depot, item, job)` tuples: one supplying depot
for each job. Joining `based_at` produces the same eight complete valuations.
Its join-output sizes are also `4, 8`.
:::

:::ada
Now translate the method that begins with every driver–job pair.
:::alice
Because \(D\) and \(N\) have disjoint schemas, it begins with

$$
(D\times N)\bowtie S.
$$

The product produces sixteen `(driver, depot, job, item)` tuples. They pair
every driver's depot with every job's required item before checking `stocks`.
The final join removes the unsupported pairs and leaves the same eight complete
valuations. Its join-output sizes are `16, 8`.
:::

:::ada
What information did those extra product tuples lack?
:::alice
They had a driver, that driver's depot, a job, and that job's item, but no fact
yet established that the depot stocked the item. The product carried all
sixteen possibilities until `stocks` could reject eight of them.
:::

:::definition Logical row-volume proxy (course approximation)
For a logical plan \(P\) and input instance \(I\), let
\(\operatorname{JoinNodes}(P)\) be its set of natural-join expression nodes and
define

$$
W_0(P,I)=
\sum_{M\in\operatorname{JoinNodes}(P)}
|[\![M]\!]_I|.
$$

This proxy counts the tuples produced by all logical join nodes; a Cartesian-
product node is included as the disjoint-sort case of natural join.
:::

:::reading
**Course approximation; book basis.** Abiteboul, Hull, and Vianu,
*Foundations of Databases*, Chapter 6, §6.1, pp. 112–114, uses expected
intermediate sizes to motivate join-order heuristics. The formula \(W_0\) is a
course proxy, not the book's cost model.
:::


:::ada
Compute the proxy for the three plans.
:::alice
The two shared-variable plans each give

$$
W_0=4+8=12,
$$

while the Cartesian-first plan gives

$$
W_0=16+8=24.
$$
:::

:::ada
Does \(24\) mean that the Cartesian-first plan takes exactly twice as long?
:::alice
No. The proxy ignores tuple widths, indexes, join algorithms, pipelining,
memory, and I/O. It only records that this logical plan passes more tuples
through its join nodes on this input.
:::

:::ada
If correctness were the only requirement, source order could choose a binary
tree without any graph. This first planner adopts an additional rule instead of
a complete cost model: when extending its current intermediate, it chooses a
shared-variable atom if one is available and defers Cartesian product to a
connected-component boundary.
:::alice
Then the planner needs a way to expose which atoms share variables with the
current intermediate.
:::

:::reading
**Book facts; course policy.** Abiteboul, Hull, and Vianu, *Foundations of
Databases*, Chapter 4, §4.4, pp. 57–58, identifies natural join on disjoint sorts
with Cartesian product. Chapter 6, §6.1, pp. 112–114, defines sip graphs and sip
strategies from shared variables. Deferring Cartesian products while a
shared-variable extension is available is the course's rule-based policy, not a
cost theorem from the book.
:::


:::definition Query hypergraph, atom graph, and frontier (course terms/adaptations)
For this course, the **query hypergraph** has variables as vertices and one
labeled hyperedge for each body-atom occurrence, containing that occurrence's
variables.

The course **atom graph** has one vertex for each body-atom occurrence and an
undirected edge exactly when two occurrences share a variable. For a chosen set
of atom vertices, its **frontier** contains the unchosen vertices adjacent to
that set.
:::

:::reading
**Course terms/adaptations; book basis.** Abiteboul, Hull, and Vianu,
[*Foundations of Databases*, Chapter 6](http://webdam.inria.fr/Alice/pdfs/Chapter-6.pdf),
§6.4, pp. 130–131, defines schema hypergraphs, not this direct CQ hypergraph.
Section 6.1, pp. 112–114, defines a sip graph with relation atoms as vertices
and shared-variable edges, while also marking atoms containing constants. The
course atom graph is that graph restricted to the relational-atom overlap used
here; **frontier** is course terminology.
:::


:::ada
For `eligible`, the query hypergraph has four variable vertices and three
labeled hyperedges:

```text
D = {driver, depot}
S = {depot, item}
N = {job, item}.
```

Its atom graph is the path

```text
D -- S -- N.
```

The query hypergraph records that the first overlap is `depot` and the second is
`item`.

Where do the three algebraic plans appear in this graph?
:::alice
The driver-first plan begins with the edge `D -- S`. The job-first plan begins
with `S -- N`. Both first joins follow a shared variable.

The Cartesian-first plan begins with the nonadjacent endpoints `D` and `N`.
There is no atom-graph edge between them, so their schemas are disjoint. The
middle atom `S` supplies the bridge only afterward.
:::


:::ada
Construct both representations for a query with less path-like overlap:

```text
trip(from, to) :-
    leg(from, hub, carrier),
    partner(carrier, partner),
    leg(hub, to, partner),
    open(from, day),
    open(to, day).
```

Call the body-atom occurrences `L1`, `P`, `L2`, `O1`, and `O2`.
:::

:::alice
The query-hypergraph vertices are

```text
{from, hub, carrier, partner, to, day}.
```

Its labeled hyperedges are

```text
L1 = {from, hub, carrier}
P  = {carrier, partner}
L2 = {hub, to, partner}
O1 = {from, day}
O2 = {to, day}.
```

![The trip query hypergraph, with variables as vertices and body-atom occurrences as labeled hyperedges.](assets/04-trip-hypergraph.svg "The trip query hypergraph.")

The atom-graph edges are

```text
L1 -- P
L1 -- L2
L1 -- O1
P  -- L2
L2 -- O2
O1 -- O2
```

so the atom graph is

```text
        P
       / \
     L1---L2
     |     |
     O1---O2
```
:::

:::ada
In the `L1`–`P`–`L2` triangle, which variable accounts for each edge? Could the
unlabeled atom graph recover that information by itself?
:::alice
`L1`–`P` shares `carrier`, `P`–`L2` shares `partner`, and `L1`–`L2` shares
`hub`. No variable occurs in all three atoms. The atom graph preserves overlap
and frontiers, but only the query hypergraph preserves the full atom-variable
incidence.
:::

:::ada
The atom graph now exposes connected choices. To compare binary tree shapes, use
a four-atom path:

```text
four_hop(from, to) :-
    road(from, w),
    road(w, x),
    road(x, y),
    road(y, to).
```

Write its four atom expressions as

```text
E1 = {from, w}
E2 = {w, x}
E3 = {x, y}
E4 = {y, to},
```

whose atom graph is `E1 -- E2 -- E3 -- E4`. First grow one subexpression from
`E1`, adding one frontier atom at a time.
:::alice
That gives

$$
((E_1\bowtie E_2)\bowtie E_3)\bowtie E_4.
$$
:::

:::ada
Now construct the two ends independently before combining them.
:::alice
That gives

$$
(E_1\bowtie E_2)\bowtie(E_3\bowtie E_4).
$$
:::

:::definition Left-deep and bushy expressions (course terminology)
A binary join-expression tree is **left-deep** when every right child of a join
node is an atom-expression leaf. It is **bushy** when some join node has two
non-leaf children.
:::

:::reading
**Course terminology; book basis.** Abiteboul, Hull, and Vianu,
*Foundations of Databases*, Chapter 6, §6.1, pp. 112–114, discusses System R
join orderings. Exercise 6.4, p. 137, uses left-to-right join processing;
Exercise 6.5, p. 137, generalizes it to an arbitrary binary tree. The terms
**left-deep** and **bushy**, and their graph interpretations here, are course
terminology.
:::


:::ada
How do the two `four_hop` expressions use the path differently?
:::alice
The left-deep expression grows one connected chosen set by one frontier vertex
at a time. The bushy expression grows two connected sets, `{E1, E2}` and
`{E3, E4}`, and then combines them. The bushy construction is a recursive
decomposition of the graph, not one traversal order.
:::

:::definition Join planning (course umbrella term/adaptation)
For this course, **join planning** chooses a binary natural-join expression
whose denotation is the complete body-valuation relation. A left-deep atom order
\(B_1,\ldots,B_n\) is **prefix-connected** within a query component when

$$
\operatorname{vars}(B_k)\cap
\bigcup_{i<k}\operatorname{vars}(B_i)\neq\varnothing
\qquad(2\leq k\leq n).
$$

Each new leaf then shares at least one variable with the accumulated left
operand. Disconnected components ultimately require a Cartesian product.
Correctness still requires the full expression to have the CQ's output schema
and result.
:::

:::reading
**Course term/adaptation; book basis.** Abiteboul, Hull, and Vianu,
*Foundations of Databases*, Chapter 4, §4.4, pp. 57–58, supplies natural join
and its Cartesian-product case on disjoint sorts. Chapter 6, §6.1, pp. 112–114,
defines sip strategies in which each later relational atom is adjacent to an
earlier one, subject also to its constant and constraint cases; Exercise 6.5,
p. 137, permits arbitrary binary trees. **Prefix-connected** is the course name
for the relational-atom restriction used here; **join planning** and the
connected-operand policy are course terminology.
:::



:::ada
We will now implement that policy as one source-tied left-deep plan. The
algorithm uses source order; it does not optimize \(W_0\) or consult cardinality
estimates.

**Algorithm**!!!

**Course algorithm: source-tied frontier scan.**

1. Start the plan with the earliest unplanned atom \(A\).
2. Set \(J=E_A\) and \(S=\operatorname{vars}(A)\).
3. Scan the remaining atoms in source order and choose the first \(B\) with
   \(\operatorname{vars}(B)\cap S\neq\varnothing\).
4. Replace \(J\) by \(J\bowtie E_B\), replace \(S\) by
   \(S\cup\operatorname{vars}(B)\), and repeat step 3.
5. If unplanned atoms remain but none intersects \(S\), choose the earliest one
   as \(B\), replace \(J\) by \(J\bowtie E_B\), and add its variables to \(S\).
   This boundary join is Cartesian; repeat step 3 in the new component.
:::alice
Each frontier scan is prefix-connected within its component. Every replacement
of \(J\), including a component-boundary product, adds one right-hand leaf, so
the complete expression remains left-deep.
:::

:::reading
**Course construction; book basis.** Abiteboul, Hull, and Vianu,
*Foundations of Databases*, Chapter 6, §6.1, pp. 112–114, discusses join
orderings, and Exercise 6.4, p. 137, explicitly uses left-to-right join
processing. The source-order frontier scan above is a course algorithm, not an
algorithm stated in the book.
:::


:::ada
Apply the algorithm to `trip`, beginning at `L1`.
:::alice
After `L1`, the frontier contains `P`, `L2`, and `O1`, so source order chooses
`P`. The frontier still contains `L2` and `O1`, so source order chooses `L2`;
`O1` and `O2` follow. The order is

```text
L1, P, L2, O1, O2.
```

Using the occurrence labels for their atom expressions, the plan is

$$
(((L_1\bowtie P)\bowtie L_2)\bowtie O_1)\bowtie O_2.
$$
:::

:::ada
For any chosen order \(B_1,\ldots,B_n\), expose the left-deep subexpressions.
:::alice
$$
T_1=E_{B_1},
\qquad
T_i=T_{i-1}\bowtie E_{B_i}\quad(2\leq i\leq n).
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
For the chosen order \(B_1,\ldots,B_n\), let \(T_i\) be the intermediate
after \(B_1,\ldots,B_i\). Retain

$$
\operatorname{schema}(T_i)\cap
\left(
  \operatorname{vars}(\operatorname{head}(q))
  \cup\bigcup_{j>i}\operatorname{vars}(B_j)
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
`L1, P, L2, O1, O2`. Which schema is required after each atom? In particular,
why must `day` survive `O1`?
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
The CQ fixes the atom relations and their common result but not a binary tree.
The `eligible` plans returned the same answers while producing different logical
row volumes. That observation motivates the rule-based defer-product policy; it
does not supply a complete runtime cost model.

A first join fixes an intermediate schema, which exposes a frontier of
shared-variable choices. The query hypergraph preserves the incidences, the
atom graph exposes the frontier, and join planning chooses how connected
subplans grow and combine. Physical operators implement the chosen algebraic
tree.
:::

:::reading
**Reading trail.** Abiteboul, Hull, and Vianu,
[*Foundations of Databases*, Chapter
6](http://webdam.inria.fr/Alice/pdfs/Chapter-6.pdf):

- §6.1, pp. 112–114: sip graphs and strategies, System R join orderings,
  projection of no-longer-needed variables, and alternative physical
  implementations; see especially Examples 6.1.1–6.1.3.
- Exercises 6.4–6.5, p. 137: left-to-right join processing and its
  generalization to arbitrary binary trees.
- §6.4, pp. 130–131: schema hypergraphs.

The names **join planning**, **atom graph**, **frontier**,
**prefix-connected**, **left-deep**, and **bushy**, the direct CQ query
hypergraph, the logical row-volume proxy, the defer-product policy, the
source-tied algorithm, the explicit required-schema formula, and its
backward-pass implementation are course
constructions derived from those definitions and examples, not named
definitions or algorithms in the book.
:::

:::recap The order logic did not choose
Conversation 1.3 supplied an equivalence class of binary relational-algebra
expressions and established that a natural join over disjoint sorts is Cartesian
product. Correctness alone could choose source order without constructing a
graph.

On the `eligible` instance, the two shared-variable plans have logical row
volume \(12\), while the Cartesian-first plan has row volume \(24\); all three
return the same eight answers. This proxy is not runtime cost.

The rule-based planner therefore adopts an additional policy: while its current
intermediate has a shared-variable extension, it defers Cartesian product. This
is not a theorem that every Cartesian product is slower.

A first join fixes an intermediate schema. When a plan grows by adding one atom,
that schema determines the frontier of atoms sharing a variable with the chosen
prefix. The query hypergraph preserves the complete atom-variable incidence;
the atom graph exposes overlap and frontiers but loses the identities of the
shared variables.

Within each connected component, the source-tied algorithm adds one frontier
leaf at a time. At a component boundary, it adds the earliest unplanned leaf by
Cartesian product. Every step adds a right-hand leaf, so the complete expression
remains left-deep. A bushy expression instead constructs subplans separately and
combines them. The source-tied algorithm uses no row-count estimates.

If \(T_i\) denotes the intermediate after \(B_1,\ldots,B_i\), it need retain
only

$$
\operatorname{schema}(T_i)\cap
\left(
  \operatorname{vars}(\operatorname{head}(q))
  \cup\bigcup_{j>i}\operatorname{vars}(B_j)
\right).
$$

A backward pass over the chosen plan uses the query hypergraph to place these
projections. The plan remains mathematical; physical operators later implement
its algebraic contracts without changing the logical result.
:::
