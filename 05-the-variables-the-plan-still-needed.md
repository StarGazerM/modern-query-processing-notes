---
title: The Variables the Plan Still Needed
subtitle: Conversation 2.3 — From Binary Trees to Join–Project Plans
author: Modern Query Processing
date: Fall 2026
status: Draft
layout: dialogue
left_speaker: Ada
right_speaker: Alice
previous: [Conversation 2.2 · The Picture That Did Not Choose](04-the-picture-that-did-not-choose.html)
next: [Conversation 2.4 · The Order the Compiler Chose](06-the-order-the-compiler-chose.html)
---

# The variables the plan still needed

:::ada
Return to

```text
on_triangle(a) :-
    edge(a, b),
    edge(b, c),
    edge(c, a).
```

After joining the first two atoms, the raw schema is `{a,b,c}`. Which variables
must still reach the final edge or the query head?
:::alice
The final edge needs `c` and `a`, and the head needs `a`. The variable `b` has
finished its work after the first join.
:::

:::ada
Suppose the first join contains these two rows:

```text
a  b  c
A  x  C
A  y  C
```

Project them to `{a,c}`. What remains under set semantics?
:::alice
Both rows become `(A,C)`, and duplicate elimination leaves one row. The two
values of `b` were different witnesses for the same surviving `a,c` pair.
:::

:::ada
Why is that collapse safe before the final join with `edge(c,a)`?
:::alice
Because no remaining operation can inspect `b`. The last edge checks only
`c,a`, and the head returns only `a`. Keeping one surviving `a,c` pair preserves
whether an answer exists.
:::

:::law Safe forgetting after a chosen subtree (course lemma)
Let a binary join-expression node \(N\) cover atom occurrences \(C_N\). Define

$$
V_N=\bigcup_{A\in C_N}\operatorname{vars}(A),
\qquad
V_{\overline N}=
\bigcup_{A\notin C_N}\operatorname{vars}(A),
$$

and let \(H\) be the query-head variables. The node's required schema is

$$
K_N=V_N\cap(H\cup V_{\overline N}).
$$

Under set semantics, variables in \(V_N\setminus K_N\) may be projected out
after the subtree join: they occur neither in the answer nor in any atom outside
the subtree.
:::

:::reading
**Course lemma; book basis.** Abiteboul, Hull, and Vianu, *Foundations of
Databases*, Chapter 6, §6.1, Example 6.1.3, p. 114, says that variables may be
forgotten when they are used neither in the answer nor in subsequent joins.
Exercise 6.4, p. 137, asks for the corresponding left-to-right algorithm, and
Exercise 6.5 permits arbitrary binary trees. The node formula and lemma above
are the course's arbitrary-tree formulation.
:::

:::notice Set semantics matters
Discarding a dead variable existentially identifies witnesses that differ only
in that variable. Pure relational projection removes the resulting duplicates.
The argument here is for set relations. A bag-semantics plan would need a
separate multiplicity argument and is outside the current language.
:::

:::ada
The triangle used a left-deep tree. Now consider a bushy tree for

```text
chain(a, e) :-
    r(a, b),
    s(b, c),
    t(c, d),
    u(d, e).
```

First combine the two atoms on the left and the two atoms on the right. Write
the raw tree.
:::alice
With \(R,S,T,U\) for the atom relations, the tree is

$$
(R\bowtie S)\bowtie(T\bowtie U).
$$

The root has two non-leaf children, so it is bushy.
:::

:::ada
For the left subtree \(R\bowtie S\), compute its raw schema and its required
boundary.
:::alice
Its raw schema is `{a,b,c}`. The head needs `a`, and the right subtree needs
`c`. Therefore

$$
K_{R\bowtie S}=\{a,c\}.
$$

The variable `b` is internal to the left subtree.
:::

:::ada
Do the same for the right subtree \(T\bowtie U\).
:::alice
Its raw schema is `{c,d,e}`. The left subtree needs `c`, and the head needs `e`.
Thus

$$
K_{T\bowtie U}=\{c,e\}.
$$

The variable `d` is internal to the right subtree.
:::

:::ada
Write the tree again with both safe projections and the final head projection.
:::alice
It becomes

$$
\pi_{a,e}\left(
  \pi_{a,c}(R\bowtie S)
  \bowtie
  \pi_{c,e}(T\bowtie U)
\right).
$$

Both children retain `c`, so the root can still join them. Each child discards
only its private witness variable.
:::

:::ada
The chain suggests one rule for every node. Let \(P_A\) be the annotated plan
at a leaf and \(P_N\) the annotated plan at an internal node with children
\(L,R\). State the rule using the required schemas from the lemma.
:::alice
At a leaf, project the atom relation to its required schema:

$$
P_A=\pi_{K_A}(E_A).
$$

At an internal node, join the annotated children and then keep the node's
required schema:

$$
P_N=\pi_{K_N}(P_L\bowtie P_R).
$$

An identity projection can be omitted.
:::

:::definition Required-schema annotation of a binary tree (course construction)
For each leaf \(A\), let

$$
P_A=\pi_{K_A}(E_A).
$$

For each internal node \(N\) with children \(L,R\), let

$$
P_N=\pi_{K_N}(P_L\bowtie P_R).
$$

An identity projection, where the kept schema already equals the input schema,
may be omitted. The resulting annotated expression is called a **join–project
logical plan** in this course.
:::

:::reading
**Course construction; book basis.** The construction generalizes the
left-to-right projection problem in Abiteboul, Hull, and Vianu, *Foundations of
Databases*, Chapter 6, Example 6.1.3, p. 114, and Exercise 6.4, p. 137, to the
arbitrary binary trees permitted by Exercise 6.5. The proof of Corollary 6.4.6,
p. 134, uses a related output-plus-separator projection while evaluating a join
tree of an acyclic schema. **Join–project logical plan** is course terminology;
the book does not give this general construction that name.
:::

:::ada
What invariant should the annotation preserve at every node \(N\)?
:::alice
The annotated node should equal the unprojected join of its atom leaves,
projected to the required schema:

$$
[\![P_N]\!]_I
=
\pi_{K_N}\left(
  \mathop{\bowtie}_{A\in C_N}[\![E_A]\!]_I
\right).
$$
:::

:::law Meaning preserved by required-schema annotation (course theorem)
For every node \(N\),

$$
[\![P_N]\!]_I
=
\pi_{K_N}\left(
  \mathop{\bowtie}_{A\in C_N}[\![E_A]\!]_I
\right).
$$

At the root, \(C_N\) contains every body atom and \(K_N=H\), so the annotated
plan returns the original CQ result.
:::

:::ada
Prove the invariant first for a leaf.
:::alice
A leaf covers one atom \(A\), and its annotated plan is defined as

$$
P_A=\pi_{K_A}(E_A).
$$

That is exactly the claimed invariant for \(C_A=\{A\}\).
:::

:::ada
Now suppose the invariant holds for children \(L\) and \(R\). What prevents a
child projection from discarding a variable needed at their join?
:::alice
Any variable shared by \(L\) and \(R\) occurs outside each child, so it belongs
to both \(K_L\) and \(K_R\). Each child also retains every variable that the
parent must expose.
:::

:::ada
What can be said about the variables that a child does discard?
:::alice
They are private to that child and absent from the parent's requested schema.
Under set projection, forgetting those private witnesses preserves the existence
of every required parent tuple.

Joining the annotated children and projecting to \(K_N\) therefore gives the
same result as joining the full child relations and projecting afterward.
:::

:::reading
**Course proof from book laws.** The induction uses the set projection and
natural-join definitions from Abiteboul, Hull, and Vianu, *Foundations of
Databases*, Chapter 4, §4.4, pp. 57–58. The safe-forgetting premise is the one
identified in Chapter 6, Example 6.1.3, p. 114.
:::

:::ada
Apply the construction to the triangle's left-deep tree.
:::alice
The annotated expression is

$$
\pi_a\left(
  \pi_{a,c}(E_1\bowtie E_2)
  \bowtie E_3
\right).
$$

The inner projection removes `b` after its last use. The root projection removes
`c` after the closing edge has checked it.
:::

:::ada
Now apply it after \(D\bowtie S\) in the connected `eligible` plan.
:::alice
The raw schema is `{driver,depot,item}`. The head needs `driver`, and the outside
atom \(N(job,item)\) needs `item`. Thus the intermediate may project to
`{driver,item}`:

$$
\pi_{driver,job}\left(
  \pi_{driver,item}(D\bowtie S)
  \bowtie N
\right).
$$
:::

:::ada
Can the product-first subtree \(D\times N\) project any of its four columns
before meeting \(S\)?
:::alice
No. The head needs `driver,job`, and the outside atom \(S\) needs `depot,item`.
Its required schema is the full raw schema `{driver,depot,job,item}`.
:::

:::ada
Return to the star after `road(from,hub)` joins `rail(hub,to)`. Can that
intermediate project anything yet?
:::alice
No. `from` and `to` belong to the head, and `hub` is still needed by the
unchosen `open` and `staffed` atoms. All three variables remain on the required
boundary.
:::

:::ada
For a left-deep order \(B_1,\ldots,B_n\), the outside of prefix \(i\) is simply
the unjoined suffix. Write the required-schema formula for that prefix.
:::alice
If

$$
V_i=\bigcup_{j\leq i}\operatorname{vars}(B_j),
$$

then

$$
K_i=
V_i\cap\left(
  H\cup\bigcup_{j>i}\operatorname{vars}(B_j)
\right).
$$
:::

:::reading
**Course specialization; book basis.** This left-deep formula is the course
solution pattern derived from Abiteboul, Hull, and Vianu, *Foundations of
Databases*, Chapter 6, Example 6.1.3, p. 114, and Exercise 6.4, p. 137. The book
states the criterion and asks for an algorithm; it does not state this formula.
:::

:::ada
One operator from Conversation 1.3 now appears as a special case. Suppose a
right child is needed only to test compatibility and the parent keeps the whole
left schema. Which operator has exactly that meaning?
:::alice
Semijoin:

$$
P_L\ltimes P_R
=
\pi_{\operatorname{schema}(P_L)}(P_L\bowtie P_R).
$$

If the parent keeps less than the left schema, the step is a semijoin followed
by another projection.
:::

:::reading
**Book operator.** Abiteboul, Hull, and Vianu, *Foundations of Databases*,
Chapter 6, §6.4, p. 128, defines semijoin as projection of a natural join back
to the left relation's sort.
:::

:::ada
Has the logical proof shown that executing an explicit projection is free or
always faster?
:::alice
No. It proves only that the projected relation is sufficient for the final
answer. Physical projection may require tuple rewriting and duplicate
elimination. Whether narrower later intermediates repay that work is a physical
cost question.
:::

:::notice Three measurements remain separate
For an annotated node \(N\):

- \(|K_N|\) is logical arity, measured in named columns;
- \(|[\![P_N]\!]_I|\) is logical row cardinality;
- bytes per tuple and pages occupied are physical measurements.

Projection can reduce both logical arity and, under set semantics, row
cardinality. Neither reduction alone is a complete runtime cost model.
:::

:::reading
**Book implementation and cost discussion.** Abiteboul, Hull, and Vianu,
*Foundations of Databases*, Chapter 6, §6.1, p. 107, describes projection as
tuple rewriting plus duplicate elimination. Pages 109–110 compare plans using
tuple counts, tuple width, tuples per page, and pages occupied.
:::

:::ada
What planning problem remains after this construction?
:::alice
We can annotate any chosen binary tree, but we have not chosen one tree from the
equivalent candidates. Tree selection is the next conversation.
:::

:::recap The join–project plan
A binary subtree first has raw schema \(V_N\), the union of variables in its
atom leaves. It need retain only

$$
K_N=V_N\cap(H\cup V_{\overline N}),
$$

the variables used by the query head or atoms outside the subtree. The remaining
variables have completed their logical work and may be projected out under set
semantics.

Annotating every node by

$$
P_N=\pi_{K_N}(P_L\bowtie P_R)
$$

preserves the projected meaning of every subtree and yields the CQ result at the
root. For a left-deep tree, the outside atoms are exactly the unjoined suffix.
When a right child contributes only a compatibility test, the annotated step
specializes to semijoin.

Paths may leave connector variables behind early; a star centre remains live
while an unjoined spoke still uses it. The `eligible` connected plan can discard
`depot` before meeting `needs`, whereas its Cartesian-first plan must retain all
four columns until `stocks` is checked. These are logical schema facts, not a
claim about physical runtime. Conversation 2.4 selects one reproducible tree and
then applies this annotation pass.
:::
