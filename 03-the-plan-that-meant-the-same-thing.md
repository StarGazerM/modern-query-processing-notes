---
title: The Plan That Meant the Same Thing
subtitle: Conversation 1.3 — From Conjunctive Queries to Named Relational Algebra
author: Modern Query Processing
date: Fall 2026
status: Work in progress
layout: dialogue
left_speaker: Ada
right_speaker: Alice
previous: [Conversation 1.2 · By Indirections Find Directions Out](02-the-relation-that-wasnt-stored.html)
next: [Conversation 2.1 · The Order Logic Did Not Choose](04-the-order-logic-did-not-choose.html)
---

# The plan that meant the same thing

:::ada
We have discussed the logical meaning of

```text
two_hop(from, to) :-
    road(from, via),
    road(via, to).
```

Quick recap?
:::alice
Its result is the set of head tuples produced by valuations that make every
body atom true at the same time.
:::

:::ada
In computer science, a program can have several useful accounts of its meaning.
So far we have used the **logical**, or **model-theoretic**, account of a CQ.

It tells us what the correct result must be. But as programmers, knowing the
required output is only the first step. We also want to implement it.
:::alice
**Algorithm**!!!
:::

:::ada
First inspect what the logical account does **not** say. A valuation for
`two_hop` has the form

```text
{from -> a, via -> b, to -> c}.
```

Which variable does the logical semantics assign first?
:::alice
None. A valuation is one complete function. The semantics only asks whether all
body atoms are true under that function.

That leaves an implementation question: code must choose an order even though
the logical semantics does not.
:::


:::ada
We want an account that can express partial matches, combine them in a chosen
binary structure, and still be checked against the order-free logical meaning.

Before choosing a plan, start from one complete valuation that the logical
semantics already accepts. Conversation 1.2 used the instance

```text
road = {
    {src = "Logan",          dst = "Salt Lake City"},
    {src = "Logan",          dst = "Garden City"},
    {src = "Garden City",    dst = "Logan"},
    {src = "Salt Lake City", dst = "Provo"},
    {src = "Logan",          dst = "Provo"}
}.
```

Consider

```text
v = {
    from = "Logan",
    via  = "Salt Lake City",
    to   = "Provo"
}.
```

Why is \(v\) a successful valuation of the real `two_hop` body?
:::alice
Because the instance contains both required facts:

```text
road("Logan", "Salt Lake City")
road("Salt Lake City", "Provo").
```

The logical semantics gives \(v\) as one complete function. It does not assign
one variable first or check one body atom first.
:::

:::ada
For this body, let

```text
C1 = road(from, via)
C2 = road(via, to).
```

Its full body is \(B=C_1\land C_2\).

Restrict \(v\) to the variables of each sub-body. What are the two functions?
:::alice
They are uniquely determined:

```text
v1 = v|{from, via}
   = {from = "Logan", via = "Salt Lake City"}

v2 = v|{via, to}
   = {via = "Salt Lake City", to = "Provo"}.
```

Each restriction is total on its own sub-body schema. It is partial only
relative to the larger schema `{from, via, to}` of \(B\).
:::

:::ada
What happens on the variable shared by the two schemas, and what is their
union?
:::alice
Both restrictions map `via` to `"Salt Lake City"`, so they agree on their
overlap. Their union reconstructs the original complete valuation:

```text
v1 ∪ v2 = v.
```
:::

:::ada
Now widen from the restrictions of this one successful \(v\) to all local
matches. A sub-body \(C\) is a conjunction of selected original body atoms,
retaining their original variable names. Define

$$
\operatorname{Val}_I(C)=
\left\{
  t:\operatorname{vars}(C)\to D
  \mid I\models C[t]
\right\}.
$$
:::alice
Every member has the same fixed schema \(\operatorname{vars}(C)\), so this set
can be viewed as a named relation. It contains every locally satisfying
valuation of \(C\), not only restrictions known to extend to a successful
valuation of \(B\).
:::

:::definition Valuation relation (course term)
For this course, the **valuation relation** \(\operatorname{Val}_I(C)\) contains
exactly the valuations satisfying sub-body \(C\), viewed as named tuples over
the fixed schema \(\operatorname{vars}(C)\).
:::

:::ada
For the current instance, what are the two atom-valuation relations?
:::alice
```text
Val(C1) = {
    {from = "Logan",          via = "Salt Lake City"},
    {from = "Logan",          via = "Garden City"},
    {from = "Garden City",    via = "Logan"},
    {from = "Salt Lake City", via = "Provo"},
    {from = "Logan",          via = "Provo"}
}

Val(C2) = {
    {via = "Logan",          to = "Salt Lake City"},
    {via = "Logan",          to = "Garden City"},
    {via = "Garden City",    to = "Logan"},
    {via = "Salt Lake City", to = "Provo"},
    {via = "Logan",          to = "Provo"}
}.
```
:::

:::ada
Focus on the local match

```text
{from = "Logan", via = "Provo"}
```

in `Val(C1)`. Can it be the \(C_1\)-restriction of a successful valuation of
\(B\)?
:::alice
No. Extending it would require a tuple in `Val(C2)` whose `via` value is
`"Provo"`, which would require some fact `road("Provo", to)`. The instance has
none.

So this tuple satisfies \(C_1\) locally but is dangling relative to the full
body.
:::

:::ada
By contrast, \(v_1\) and \(v_2\) agree on their shared variable, and their union
is \(v\). The operation that keeps exactly such compatible pairs and takes
their union is **natural join**.
:::alice
So it keeps precisely the pairs that agree wherever their schemas overlap.
:::

:::definition Natural join
For relations \(R\) and \(S\), their **natural join** is

$$
R\bowtie S=
\left\{
  r\cup s
  \mid r\in R,\ s\in S,
  \ r\text{ and }s\text{ agree on shared attributes}
\right\}.
$$

Its schema is \(\operatorname{schema}(R)\cup\operatorname{schema}(S)\). If the
schemas are disjoint, every pair is compatible, and the join is their Cartesian
product.
:::

:::ada
Now compare the complete valuations of a conjunction with the compatible
unions of its local valuations. For all sub-bodies \(C_1,C_2\),

$$
\operatorname{Val}_I(C_1\land C_2)=
\operatorname{Val}_I(C_1)\bowtie\operatorname{Val}_I(C_2).
$$

For the forward direction, take
\(w\in\operatorname{Val}_I(C_1\land C_2)\). Its unique restrictions to
\(\operatorname{vars}(C_1)\) and \(\operatorname{vars}(C_2)\) satisfy their
respective sub-bodies. Because both come from \(w\), they agree on every shared
variable, and their union is \(w\). Hence \(w\) belongs to the join.

Conversely, take \(t_1\in\operatorname{Val}_I(C_1)\) and
\(t_2\in\operatorname{Val}_I(C_2)\) that agree on their overlap. Their union is
one well-defined valuation on
\(\operatorname{vars}(C_1)\cup\operatorname{vars}(C_2)\). It satisfies both
sub-bodies, so it belongs to \(\operatorname{Val}_I(C_1\land C_2)\).
:::alice
So natural join is not an analogy here. It is exactly compatible union, and it
produces exactly the satisfying valuations of the conjunction.
:::

:::law Conjunction becomes natural join
For all sub-bodies \(C_1,C_2\) and input instances \(I\),

$$
\operatorname{Val}_I(C_1\land C_2)=
\operatorname{Val}_I(C_1)\bowtie\operatorname{Val}_I(C_2).
$$

Natural join is the relational form of conjunction over relational atoms.
:::

:::ada
In a plan that chooses \(C_1\) first, the evaluator uses
\(\operatorname{Val}_I(C_1)\) as the partial-match relation for that first
chosen atom; \(\operatorname{Val}_I(B)\) is the complete body-valuation relation
for both atoms. Choosing \(C_1\) first is an evaluation decision, not part of
the logical semantics.
:::alice
So the equation gives either plan order the same meaning; the plan merely
chooses which permitted intermediate to construct first.
:::

:::ada
For a three-atom body \(A_1\land A_2\land A_3\), let

$$
E_i=\operatorname{Val}_I(A_i).
$$

Each \(E_i\) is a leaf denotation supplied by one atom. Binary natural join is
the constructor that composes two sub-body denotations. Applying the law
repeatedly, we may abbreviate the complete body relation as

$$
E_1\bowtie E_2\bowtie E_3.
$$

But the primitive join operation accepts how many inputs?
:::alice
Two. A concrete expression needs parentheses, for example

$$
(E_1\bowtie E_2)\bowtie E_3
$$

or

$$
E_1\bowtie(E_2\bowtie E_3).
$$
:::

:::ada
Different parentheses do not change the complete valuation relation.
**Associativity** permits regrouping; a second law, **commutativity**, permits
reordering the atom relations.
:::alice
So both choices change the expression's structure without changing its final
relation.
:::

:::law Join licenses administrative grouping
For compatible named relations,

$$
(R\bowtie S)\bowtie T=R\bowtie(S\bowtie T)
$$

and

$$
R\bowtie S=S\bowtie R.
$$

These laws make polyadic join notation possible. They also guarantee that a
chosen binary grouping preserves the order-free conjunction semantics.
:::


:::ada
This is the reason relational algebra is a useful bridge. Logic does not choose
an order. The algebra does not choose one either, but its laws **permit** a
compiler to choose parentheses while preserving meaning.
:::alice
And the parentheses expose different partial valuation relations, even though
the final relation is equal.
:::

:::ada
Both atoms read the same `road` relation, whose attributes are `src` and `dst`,
but their variables need the schemas `{from, via}` and `{via, to}`. We relabel
the input attributes for each occurrence. This operation is **renaming**:

```text
E1 := δ[src→from, dst→via](road)
E2 := δ[src→via, dst→to](road).
```
:::alice
One stored relation can therefore provide two differently named atom relations.
:::

:::definition Renaming
For a one-to-one attribute map \(f\), **renaming** relabels every named tuple:

$$
\delta_f(R)=\{f(r)\mid r\in R\}.
$$

It changes the schema from \(U\) to \(f(U)\) but does not change tuple values.
:::


:::ada
A constant or repeated variable imposes a local condition within one atom:

```text
road("Logan", to)
edge(x, x).
```

Should those equalities be enforced by joining two atom relations?
:::alice
No. Each condition checks positions of one input tuple.
:::

:::ada
The one-relation filtering operation is called **selection**.
:::alice
Unlike join, it keeps the relation's existing schema.
:::

:::definition Selection
A **selection** retains the tuples satisfying a condition:

$$
\sigma_\theta(R)=\{r\in R\mid\theta(r)\}.
$$

Here the relevant conditions are constant equality \(A=a\) and attribute
equality \(A=B\). Selection leaves the schema unchanged.
:::


:::ada
So shared variables across distinct atom relations cause joins; equalities
inside one atom cause selections.

Now consider

```text
triangle(a, b, c) :-
    edge(a, b),
    edge(b, c),
    edge(c, a).
```

After joining the first two atom relations, the schema is `{a, b, c}`. What does
the third atom add?
:::alice
No attribute. It only tests whether each partial valuation has a compatible
`edge(c, a)` tuple.
:::

:::ada
A join whose right input only filters existing tuples without adding attributes
has a useful narrower form called **semijoin**.
:::alice
So its result keeps the left relation's schema.
:::

:::definition Semijoin
For relations \(R\) and \(S\), the **semijoin**

$$
R\ltimes S=
\left\{
  r\in R
  \mid \text{some }s\in S\text{ is compatible with }r
\right\}
$$

retains only tuples from \(R\) and therefore keeps its schema.
:::


:::ada
Because the third triangle relation has schema `{c, a}`, already contained in
`{a, b, c}`,

```text
(E1 ⋈ E2) ⋈ E3
```

and

```text
(E1 ⋈ E2) ⋉ E3
```

denote the same relation.
:::alice
The semijoin spelling records that the final atom filters partial valuations
without extending them.
:::

:::ada
Return to `two_hop`. Its complete body-valuation relation has schema
`{from, via, to}`. The separate result relation has schema `{from, to}`.

New answers accumulate there by **set union**. If the same answer is derived
twice, should the destination contain it twice?
:::alice
No. A relation is a set, so adding an existing tuple changes nothing.
:::

:::definition Set union
For relations \(R\) and \(S\) with the same schema,

$$
R\cup S=\{t\mid t\in R\text{ or }t\in S\}.
$$

Adding a tuple already present has no further effect.
:::


:::ada
Then try

```text
two_hop := two_hop ∪ (E1 ⋈ E2).
```
:::alice
It is undefined. The destination lacks `via`, so the two union operands have
different schemas.
:::

:::ada
Union exposed the problem. **Projection** keeps the requested attributes, here
`from` and `to`, while discarding `via`.
:::alice
Then projection can make the body result schema-compatible with the head.
:::

:::definition Projection
For \(X\subseteq\operatorname{schema}(R)\), the **projection**

$$
\pi_X(R)=\{r|_X\mid r\in R\}
$$

restricts every tuple to \(X\). Its schema is \(X\), and duplicate restrictions
collapse under set semantics.
:::


:::notice Output fragment used here
For now, every head contains pairwise-distinct body variables, and the result
relation uses those variable names as its attributes. Projection can therefore
produce a union-compatible result. Other head forms require a later
output-construction operation.
:::


:::ada
Now state the result and its accumulation.
:::alice
$$
two\_hop(I)=
\pi_{\mathit{from},\mathit{to}}(E_1\bowtie E_2),
$$

and, for a separate destination \(H\),

$$
H\leftarrow H\cup two\_hop(I).
$$
:::

:::ada
This changes \(H\), not `road`. For a standalone CQ, \(H\) begins empty and
remains separate from the input. The same union form will later accumulate rule
consequences in Datalog.
:::alice
So the CQ derives a separate result without modifying its input instance.
:::

:::ada
Complete the two local atom translations now that projection is available.
:::alice
```text
leaves_logan(to) :- road("Logan", to).

δ[dst→to](π[dst](σ[src="Logan"](road)))
```

```text
self_loop(x) :- edge(x, x).

δ[src→x](π[src](σ[src=dst](edge)))
```
:::

:::ada
The examples expose the general pattern. For an atom
\(A=r(t_1,\ldots,t_k)\), select constants and equal repeated positions. Project
one representative position for each distinct variable, then rename those
representatives with the variable names. The resulting expression \(E_A\)
denotes exactly \(\operatorname{Val}_I(A)\).
:::alice
So each source atom becomes a relation of precisely its satisfying valuations.
:::

:::definition Named relational algebra
The named SPJR algebra builds relation-valued expressions from input relation
names using selection, projection, natural join, and renaming. Every expression
\(E\) has a set-theoretic denotation \([\![E]\!]_I\) on input
instance \(I\).

Semijoin is a derived filtering operation. Union additionally describes
accumulation into a schema-compatible relation.
:::


:::ada
Because each atom expression matches one atom's valuation relation, the join
law extends that correspondence inductively through the whole body. Projection
then keeps the head variables. Therefore the translated expression \(E_q\)
satisfies

$$
[\![E_q]\!]_I=q(I)
$$

for every permitted input instance \(I\).
:::alice
That is the equivalence we need: different notation, the same result on every
input.
:::

:::definition Equivalent queries
Two queries are **equivalent** when they return the same relation on every input
instance over their common database schema.
:::

:::ada
What has the equivalence proof deliberately left open?
:::alice
It does not choose among the equivalent binary expressions. That administrative
choice is the next conversation.
:::

:::reading
**Reading trail.** Abiteboul, Hull, and Vianu, *Foundations of Databases*:

- [Chapter 4](http://webdam.inria.fr/Alice/pdfs/Chapter-4.pdf), Definition
  4.2.1 and pp. 41–42: CQ syntax, valuations, and \(q(I)\); p. 37: query
  equivalence.
- Chapter 4, §4.4, pp. 57–60: named selection, projection, natural join,
  renaming, join associativity and commutativity, and SPJR; Theorem 4.4.8,
  p. 61: equivalence of the conjunctive-query formalisms.
- Chapter 4, §4.5, pp. 62–63: union, equal-sort operands, SPJRU, and union of
  same-head rule outputs.
- [Chapter 6](http://webdam.inria.fr/Alice/pdfs/Chapter-6.pdf), §6.4, p. 128:
  semijoin as projection of a natural join; the displayed existence-test
  formulation is the equivalent course restatement.

The name **valuation relation**, the conjunction-as-join lemma, the assignment
\(H\leftarrow H\cup\cdots\), and the restricted output fragment are course
constructions derived from those definitions, not named definitions in the
book.
:::

:::recap The plan that meant the same thing
Let \(B=A_1\land\cdots\land A_n\) be the full CQ body, the conjunction of its
original atoms. Its logical semantics defines complete successful valuations,

$$
\operatorname{Val}_I(B)=
\left\{
  v:\operatorname{vars}(B)\to D
  \mid I\models B[v]
\right\},
$$

but no variable-assignment order or body-atom evaluation order. Those orders are
irrelevant to which complete valuations satisfy the body.

For \(B=C_1\land C_2\), every complete
\(v\in\operatorname{Val}_I(B)\) restricts uniquely to valuations that are total
on the schemas of \(C_1\) and \(C_2\), though partial relative to \(B\). The two
restrictions agree on their overlap, and their union reconstructs \(v\).

For any sub-body \(C\)—a conjunction of selected original atoms of \(B\) that
retains their original variable names—\(\operatorname{Val}_I(C)\) contains all
locally satisfying named tuples on the fixed schema
\(\operatorname{vars}(C)\). Some may be dangling local matches that do not
extend to a complete valuation of \(B\). Natural join composes these relations
by compatible union:

$$
R\bowtie S=
\left\{
  r\cup s
  \mid r\in R,\ s\in S,
  \ r\text{ and }s\text{ agree on shared attributes}
\right\},
$$

and therefore

$$
\operatorname{Val}_I(C_1\land C_2)=
\operatorname{Val}_I(C_1)\bowtie\operatorname{Val}_I(C_2).
$$

Shared variables across atom relations are enforced by join. Constants and
repeated variables within one atom are enforced by selection. If a right
relation only tests whether a left valuation can be extended, semijoin retains
exactly the compatible left tuples.

When answers are accumulated in a separate relation \(H\), set union requires a
schema compatible with \(H\). For the fragment used here, the head contains
distinct body variables and \(H\) uses those variable names as attributes.
Projection therefore removes body-only variables and forms union-compatible
tuples:

$$
H\leftarrow H\cup
\pi_{\operatorname{vars}(\operatorname{head}(q))}
\bigl(\operatorname{Val}_I(B)\bigr).
$$

Renaming, selection, natural join, and projection give an SPJR expression
\(E_q\) satisfying

$$
[\![E_q]\!]_I=q(I).
$$

Natural join is a binary primitive, while associativity and commutativity prove
that different binary groupings preserve this denotation. Polyadic join notation
hides the parentheses; a logical plan makes them explicit. Relational algebra
therefore does not prescribe an evaluation order: it mathematically licenses an
administrative choice of order.
:::
