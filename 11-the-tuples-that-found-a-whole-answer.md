---
title: The Tuples That Found a Whole Answer
subtitle: Conversation 4.1 — Tracing and Justifying Yannakakis
author: Modern Query Processing
date: Fall 2026
status: Draft
layout: dialogue
left_speaker: Ada
right_speaker: Alice
previous: [Conversation 3.4 · The Rows We Did Not Need](10-the-rows-we-did-not-need.html)
next: [Conversation 4.2 · The Answers We Might Have to Write](12-the-answers-we-might-have-to-write.html)
---

# The tuples that found a whole answer

:::ada
We can now implement one semijoin. Where should we put such filters to
avoid work in a whole query?

Return to our delivery relations, including the day in stock. Request
the **full** body tuple:

```text
delivery(driver, depot, item, day, job) :-
    based_at(driver, depot),
    stocks_on(depot, item, day),
    needs(job, item).
```

Call the three local relations $D,S,N$.

| $D$: driver | depot |
|---|---|
| Ada | north |
| Bea | north |
| Cy | south |
| Di | west |

| $S$: depot | item | day |
|---|---|---|
| north | bolt | Mon |
| north | nut | Tue |
| south | nut | Mon |
| east | bolt | Tue |

| $N$: job | item |
|---|---|
| job1 | bolt |
| job2 | screw |

Start with the familiar binary plan $(D\bowtie S)\bowtie N$.
How many tuples does its first join construct?
:::alice
Five. Ada and Bea each combine with both north stock tuples, and Cy
combines with the south stock tuple. Di has no west stock.
:::

:::ada
Which of those five survive the join with $N$?
:::alice
Only Ada's and Bea's bolt deliveries. The three partial nut deliveries
fail because no job needs nut.
:::

:::ada
Temporarily give north $m$ drivers and a nut stock tuple on each of
1,000 different days. How much work does this order do for those stocks?
:::alice
It constructs $1{,}000m$ driver–stock tuples that no job can use.
Yet a single existence test for item nut could reject each stock tuple
before multiplying it by the drivers.
:::

:::ada
Restore the small instance. Which facts does a stock tuple need before
we bother attaching a driver and a job?
:::alice
Its depot needs at least one driver in $D$, and its item needs at least
one job in $N$. Two semijoins could check that while retaining the
stock tuple's own columns.

Neither filter needs to enumerate all matching driver–job combinations.
:::

:::ada
Which relation connects those two tests? Arrange the three atoms around
it and check the join-tree condition from 2.5.
:::alice
$D-S-N$, rooted at $S$. Depot connects $D$ to $S$, and item connects
$S$ to $N$.

Day occurs only in $S$. Every variable's occurrences are connected.
:::

:::ada
Both leaves can filter the root. Either leaf can go first in this tree;
try $D$ first. Write the retained stock tuples, not just their number.
:::alice
$$
S_1=S_0\ltimes D_0
$$

retains `(north,bolt,Mon)`, `(north,nut,Tue)`, and `(south,nut,Mon)`.
Only `(east,bolt,Tue)` disappears.

The key for this semijoin is depot.
:::

:::ada
Next let $N$ filter that result.
:::alice
$$
S_2=S_1\ltimes N_0=\{(\mathrm{north},\mathrm{bolt},\mathrm{Mon})\}.
$$

The key is item this time. Both nut tuples disappear.
:::

:::ada
We have sent support from both leaves toward the root: an **upward pass**.
Does every tuple in every relation now belong to a complete answer?
:::alice
Yes, we checked both branches.
:::

:::ada
Find a complete answer using Cy.
:::alice
There is none. Cy's south stock disappeared because no job needs nut.
Di and job2 have no complete answer either.

We reduced the root, but we have not sent its surviving choices back to
the leaves.
:::

:::ada
Which existing operator sends those surviving root choices back to
$D$ and $N$? Apply it.
:::alice
$$
\begin{gathered}
D_1=D_0\ltimes S_2\\
=\{(\mathrm{Ada},\mathrm{north}),(\mathrm{Bea},\mathrm{north})\},
\end{gathered}
$$

$$
N_1=N_0\ltimes S_2=\{(\mathrm{job1},\mathrm{bolt})\}.
$$

Every surviving tuple participates in at least one complete delivery.
This return of support from root to leaves is the **downward pass**.
:::

:::ada
Our physical implementation cached the depot keys of $S_1$:
`{north,south}`. Can the downward pass use that cache unchanged?
:::alice
No. It would keep Cy, whose stock support was removed by the next
semijoin. The downward pass needs the depot keys of $S_2$, just `{north}`.

An exact index of an earlier relation is not an exact index of the later
one. We must rebuild or maintain the appropriate structure.
:::

:::ada
Write the whole logical program with fresh result names.
:::alice
```text
S1 = semijoin(S0, D0)
S2 = semijoin(S1, N0)
D1 = semijoin(D0, S2)
N1 = semijoin(N0, S2)

J1 = join(S2, D1)
J2 = join(J1, N1)
```

`D1` and `N1` both depend on `S2`; neither depends on the other.
The names state dependencies without requiring a copied array for every
logical relation.
:::

:::ada
Finish the joins.
:::alice
| driver | depot | item | day | job |
|---|---|---|---|---|
| Ada | north | bolt | Mon | job1 |
| Bea | north | bolt | Mon | job1 |

Filtering left two answers to assemble. It did not assemble them itself.
:::

:::reading
**Book foundation.** AHV,
[Chapter 6](https://webdam.di.ens.fr/Alice/pdfs/Chapter-6.pdf#page=24),
§6.4, pp. 128–132, develops global consistency, full reducers, and join
trees. The delivery trace expands the two-pass program in the course's
reserved Yannakakis slides.
:::

:::ada
Before proving that we removed all unsupported tuples, prove the easier
direction. Could any one exact semijoin remove a tuple used by a complete
answer?
:::alice
Take a complete answer and restrict it to the two relations involved.
Those two tuples agree on their shared variables. The right restriction
is therefore a witness for the left restriction, so the left one survives.
:::

:::ada
And after several replacements?
:::alice
The same complete answer retains its restrictions at every step. By
induction, all original complete answers survive the whole program.

Since semijoins only remove tuples, they cannot create a new answer.
:::

:::law Preservation by exact semijoins
Replacing any input relation by its exact semijoin with another input
preserves their complete natural join. Repeating such replacements
preserves the full query body. This preservation does not require acyclicity.
:::

:::ada
So what needs the join tree?
:::alice
The stronger claim: every tuple left afterward has a complete answer.
On the loop from 2.5, all pairwise tests passed and the complete join was
still empty.
:::

:::ada
Look at a node $v$ with children. After the upward pass has finished its
whole subtree, what should a surviving tuple at $v$ be able to do?
:::alice
Extend to a satisfying valuation of every atom in that subtree.

At a leaf that is immediate. At an internal node we need compatible
extensions from all its children.
:::

:::ada
Why can those child extensions be combined? Could two branches disagree
on some variable away from $v$?
:::alice
If a variable occurs in both branches, its path passes through $v$.
The join-tree condition forces it to occur at $v$ too.

Each child extension agrees with the retained tuple on that variable.
So they agree with each other. Other variables occur in separate branches
and impose no additional cross-branch equality.
:::

:::ada
Our delivery tree had only one level below the root. Test a deeper tree
before choosing a general order:

```text
R(x) -- S(x,y) -- T(y)     root: R
R = {1,2}
S = {(1,7),(2,8)}
T = {7}
```

First do $R\gets R\ltimes S$, then $S\gets S\ltimes T$.
Does the root end with exactly the values that have complete support?
:::alice
$R$ keeps both 1 and 2 at the first step. Then $S$ loses `(2,8)`.
The root still keeps 2 even though its only supporting tuple has gone.

The root asked its child too early.
:::

:::ada
Change only the order of those two semijoins.
:::alice
First $S\gets S\ltimes T$ leaves `{(1,7)}`. Then
$R\gets R\ltimes S$ leaves `{1}`.

Finish a child's subtree before using that child to filter its parent.
Then its support already accounts for everything below it.

That is a postorder, from leaves toward the root.
:::

:::definition Upward-pass invariant
After processing the subtree rooted at $v$, its remaining local relation
contains exactly the tuples that extend to a satisfying valuation of that
subtree. For a child $c$, update the parent by

$$
I_v\gets I_v\ltimes I_c
$$

after processing $c$'s descendants. The root's survivors consequently
extend to the whole query.
:::

:::ada
The root now has complete support. Take a child tuple that survives
semijoining with that root. Why does it have complete support too?
:::alice
It has its own subtree extension from the upward invariant. It also
agrees with some surviving root tuple on the entire shared key.

That root tuple has a complete extension. We can replace its old child
subtree choices with this child's extension.
:::

:::ada
Why is the replacement safe?
:::alice
Every variable shared between that subtree and the rest of the tree
appears across the parent–child edge. Agreement on its shared key fixes
all those values. No hidden equality crosses the boundary.
:::

:::ada
Continue to the grandchildren.
:::alice
First give their parent complete support, then filter each grandchild by
that parent. The same replacement argument applies at every edge.

This time the order is from root toward leaves.
:::

:::definition Yannakakis for a full acyclic join
Choose a join tree and root it. Apply child-to-parent exact semijoins in
postorder, then parent-to-child exact semijoins in preorder. Finally
enumerate the join of the reduced relations by following the tree.

The first two phases form a **full reducer**: every surviving local tuple
extends to a complete answer, and every original complete answer remains.
For disconnected queries, components can be joined by tree edges with empty
shared keys, using the empty-key semijoin convention from 3.4.
:::

:::reading
**Algorithm and guarantees.** Koutris,
[Acyclic Conjunctive Queries](https://pages.cs.wisc.edu/~paris/cs784-s19/lectures/lecture4.pdf),
§4.2, distinguishes the full and Boolean cases from general projected CQs.
The recent survey by Koutris et al.,
[Database Theory in Action: Yannakakis' Algorithm](https://doi.org/10.4230/LIPIcs.ICDT.2026.25),
gives the classical phases and discusses their implementation costs.
Our invariant arguments above specialize the full-reducer theory to a
rooted join tree.

**Original paper.** Yannakakis,
[Algorithms for Acyclic Database Schemes](https://www.researchgate.net/publication/200034379_Algorithms_for_Acyclic_Database_Schemes),
§4, begins with full reduction and then computes projected results through
the tree. Theorem 4.1 states a polynomial input-and-output bound for that
general setting; it should not be restated as a linear bound for arbitrary
projection.
:::

:::ada
Count work under an explicit model. Fix the query, let
$\mathrm{IN}=\sum_v|I_v|$, and assume exact hashing takes expected
constant time per fixed-width key. What do the two passes cost?
:::alice
There are twice as many semijoins as tree edges. Each builds and probes
structures on relations that only shrink.

The number of edges is fixed, so the expected total is $O(\mathrm{IN})$.
If the query grows, we must expose its contribution instead of hiding it.
:::

:::ada
The passes have removed every unsupported local tuple. Does that make
every combination of surviving tuples useful? Change only $T$ in the
small chain to `{7,8}`. Now all three relations are fully reduced.
What does $R\times T$ contain?
:::alice
`(1,7)`, `(1,8)`, `(2,7)`, and `(2,8)`. Only `(1,7)` and `(2,8)`
agree with $S$.

Every local tuple has some complete answer, but arbitrary combinations
of them need not share one.
:::

:::ada
Instead join $R$ to its tree neighbor $S$, then attach $T$. What changes?
:::alice
The first join already contains only the compatible pairs `(1,7)` and
`(2,8)`. Both extend through $T$.

The enumeration should grow along the tree's connections, so the path
that enforces compatibility is never missing.
:::

:::ada
Generalize that observation. What stops a connected partial join of the
reduced relations from producing a huge useless intermediate?
:::alice
Follow the join tree, maintaining a connected set of already joined
nodes. Each compatible partial tuple extends through the remaining
branches, by the same separator argument.

Distinct partial tuples have disjoint sets of complete extensions,
because a complete tuple has only one restriction to their schema. Thus
each such intermediate has at most as many tuples as the full output.
:::

:::ada
Does that argument allow an arbitrary first combine of two disconnected
nodes?
:::alice
No. Their choices might be incompatible through the missing path. The
enumeration order and access structures are part of the argument.

Reduction alone does not license every possible binary plan.
:::

:::law Cost of the full-join algorithm
For a fixed full acyclic join over fixed-width tuples, exact hash-based
reduction and indexed tree-guided enumeration take expected
$O(\mathrm{IN}+\mathrm{OUT})$ time, where $\mathrm{OUT}$ is the number
of full result tuples. Index construction is included. Comparison-based
sorting or access can add logarithmic factors.
:::

:::ada
Could we replace full-output size by the number of distinct projected
answers in that proof? Test the query

```text
middle(y) :- R(x,y), S(y,z).
R = {(i,0): 1 <= i <= m}
S = {(0,j): 1 <= j <= m}
```

Count its input, full witnesses, and projected answers separately.
:::alice
There are $2m$ input tuples, $m^2$ full witnesses, and one answer, `0`.
All input tuples already have complete support, so reduction removes none.

Enumerating the full join and then deduplicating still visits $m^2$
witnesses. That execution is not linear in input plus projected output.

The earlier `eligible(driver,job)` head also projects away witnesses.
Correct projection preserves its meaning, but its cost needs its own analysis.
:::

:::ada
What if the query asks only whether any answer exists?
:::alice
After the upward pass, a root tuple exists exactly when the whole join
has a witness. So for this Boolean question we can stop there.

The downward pass is needed for reducing every relation, but not for
this existence test.
:::

:::ada
Try a branching transfer exercise:

```text
R(i,x), S(x,y,j), T(y,k), U(y,l)
```

Root at $S$. Suppose a particular $y$ has a thousand $T$ matches but no
$U$ match. Must we construct those thousand combinations first?
:::alice
No. The semijoin of $S$ with $U$ removes the affected $S$ tuples during
reduction. The downward pass then removes the corresponding unsupported
$T$ tuples. Enumeration never expands that branch.

The size of the avoided multiplication gives a reason to pay for the passes.
:::

:::ada
Finally, apply the two-pass recipe along a proposed path for
$R(x,y),S(y,z),T(x,z)$, with

```text
R = {(0,0), (1,1)}
S = {(0,0), (1,1)}
T = {(0,1), (1,0)}
```

What survives?
:::alice
Everything. Each tuple has a partner in each neighboring relation.
But $R$ and $S$ require $x=y=z$, while $T$ requires $x\ne z$.
There is no complete answer.

The proposed path has a gap in the occurrences of $x$. The proof cannot
cross that gap, however exact our hash tables are.
:::

:::recap Complete support on a tree
Exact semijoins preserve answers on every query shape. A join tree supplies
the additional separation property that makes the two passes complete.
The upward invariant gives subtree support; the downward invariant gives
whole-query support. Tree-guided enumeration then assembles full answers
without large dead partial joins, yielding the stated input-plus-full-output
bound under the access model.

Projection, approximate filters, stale support structures, and cyclic query
shapes do not inherit that argument unchanged. The next question is how
large a full output can be, even when every produced tuple is necessary.
:::
