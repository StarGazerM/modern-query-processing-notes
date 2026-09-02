---
title: The Plan That Meant the Same Thing
subtitle: Conversation 1.3 — From Conjunctive Queries to Named Relational Algebra
author: Modern Query Processing
date: Fall 2026
layout: dialogue
left_speaker: Ada
right_speaker: Alice
previous: [Conversation 1.2 · By Indirections Find Directions Out](02-the-relation-that-wasnt-stored.html)
next: [Conversation 2.1a · The Order Logic Did Not Choose](04-the-order-logic-did-not-choose.html)
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
Let

```text
C1 = road(from, via)
C2 = road(via, to)
```

and recall that the instance contains

```text
road("Logan", "Salt Lake City")
road("Salt Lake City", "Provo")
road("Logan", "Provo").
```

It contains no road whose source is `"Provo"`.

The valuation

```text
v = {
    from = "Logan",
    via  = "Salt Lake City",
    to   = "Provo"
}
```

satisfies \(C_1\land C_2\). Its restrictions are

$$
v_1=v|_{\{\mathit{from},\mathit{via}\}}
$$

and

$$
v_2=v|_{\{\mathit{via},\mathit{to}\}}.
$$

They agree on `via`, and \(v_1\cup v_2=v\). How should we classify \(v_1\)
relative to the local schema `{from, via}`, and relative to the full body schema
`{from, via, to}`?
:::alice
It is total on the schema of \(C_1\), so it is a complete local valuation for
that atom. It is partial only relative to the full body schema
`{from, via, to}`. The same distinction applies to \(v_2\).
:::

:::ada
One successful \(v\) gives only local matches that extend to that full
valuation. To collect every local match, for any sub-body \(C\) let

$$
\operatorname{Val}_I(C)=
\left\{
  t:\operatorname{vars}(C)\to D
  \mid I\models C[t]
\right\}.
$$

For example,

```text
d = {from = "Logan", via = "Provo"}
```

belongs to \(\operatorname{Val}_I(C_1)\), but no tuple in
\(\operatorname{Val}_I(C_2)\) assigns `"Provo"` to `via`. Must \(d\) extend to
a valuation satisfying the full body?
:::alice
No. It satisfies \(C_1\) locally, but it has no compatible \(C_2\) match. It
is a dangling local match.
:::

:::definition Valuation relation (course term/adaptation)
For this course, the **valuation relation** \(\operatorname{Val}_I(C)\) contains
exactly the valuations satisfying sub-body \(C\), viewed as named tuples over
the fixed schema \(\operatorname{vars}(C)\).
:::

:::reading
**Course term/adaptation; book basis.** Abiteboul, Hull, and Vianu,
[*Foundations of Databases*, Chapter 4](http://webdam.inria.fr/Alice/pdfs/Chapter-4.pdf),
Definition 4.2.1,
pp. 41–42, defines valuations and \(q(I)\), but not **valuation relation**.
:::

:::ada
At tuple level, the restrictions of a complete valuation agree on shared
variables and recombine by union. **Natural join** lifts that operation to
sets: it keeps compatible tuple pairs and emits their unions.

Forward, every valuation satisfying \(C_1\land C_2\) restricts uniquely to
compatible members of \(\operatorname{Val}_I(C_1)\) and
\(\operatorname{Val}_I(C_2)\). Conversely, compatible members have one
well-defined union, and that union satisfies both sub-bodies. Is join merely an
analogy for conjunction here?
:::alice
No. The two directions show that compatible union produces exactly the
valuations satisfying the conjunction.
:::

:::definition Natural join
Natural join is a binary operator on relation instances, not necessarily a
relation of arity two. Let \(I\) and \(J\) have sorts \(V\) and \(W\). Their
**natural join** is

$$
I\bowtie J=
\left\{
  t\text{ over }V\cup W
  \mid
  \text{for some }v\in I,\ w\in J,\ t[V]=v\text{ and }t[W]=w
\right\}.
$$

Its sort is \(V\cup W\).
:::

:::reading
**Book definition.** Abiteboul, Hull, and Vianu, *Foundations of Databases*,
Chapter 4, §4.4, pp. 57–58, defines natural join and its output sort.
:::

:::law Conjunction becomes natural join (derived here from the book)
For all sub-bodies \(C_1,C_2\) and input instances \(I\),

$$
\operatorname{Val}_I(C_1\land C_2)=
\operatorname{Val}_I(C_1)\bowtie\operatorname{Val}_I(C_2).
$$

Natural join is the relational form of conjunction over relational atoms.
:::

:::reading
**Derived here from the book.** Abiteboul, Hull, and Vianu, *Foundations of
Databases*, Chapter 4, Definition 4.2.1, pp. 41–42, supplies valuation semantics;
§4.4, pp. 57–58, supplies natural join. The book does not state this
valuation-relation identity as a named law.
:::


:::ada
What if \(C_1\) and \(C_2\) share no variables?
:::alice
Then their valuation-relation schemas are disjoint. Every left tuple is
compatible with every right tuple, so the join contains every pairwise union.
:::

:::definition Cartesian product
Let \(I\) and \(J\) be relation instances of disjoint sorts \(V\) and \(W\).
Their **Cartesian product** is

$$
I\times J=
\{v\cup w\mid v\in I,\ w\in J\}.
$$

It has sort \(V\cup W\). Because agreement on \(V\cap W=\varnothing\) is
vacuous,

$$
I\bowtie J=I\times J.
$$

For finite set relations, each pair determines one distinct union, so

$$
|I\times J|=|I|\,|J|.
$$
:::

:::reading
**Book definition and immediate consequence.** Abiteboul, Hull, and Vianu,
*Foundations of Databases*, Chapter 4, §4.4, pp. 57–58, defines natural join and
identifies its disjoint-sort case as Cartesian product. The cardinality equation
follows directly from the definition for finite set relations.
:::


:::ada
Use the concrete query

```text
three_hop(from, to) :-
    road(from, x),
    road(x, y),
    road(y, to).
```

Let

$$
E_1=\operatorname{Val}_I
\bigl(\operatorname{road}(\mathit{from},x)\bigr),
$$

$$
E_2=\operatorname{Val}_I
\bigl(\operatorname{road}(x,y)\bigr),
$$

and

$$
E_3=\operatorname{Val}_I
\bigl(\operatorname{road}(y,\mathit{to})\bigr).
$$

Because natural join is binary, give two fully parenthesized expressions that
combine all three atom relations.
:::alice
Each expression needs two joins. Two possible groupings are

$$
(E_1\bowtie E_2)\bowtie E_3
$$

and

$$
E_1\bowtie(E_2\bowtie E_3).
$$
:::

:::ada
Expand either expression using the natural-join definition. Both contain
exactly the unions \(e_1\cup e_2\cup e_3\), where \(e_i\in E_i\) and the three
tuples agree on every shared variable. Therefore

$$
(E_1\bowtie E_2)\bowtie E_3
=
E_1\bowtie(E_2\bowtie E_3).
$$

This is **associativity**. The compatible-pair condition is also symmetric in
its two inputs, which gives **commutativity**. What changes between the two
`three_hop` expressions?
:::alice
Only their grouping changes. The complete valuation relation stays the same.
:::

:::law Join associativity and commutativity (book laws; course application)
For all named relation instances \(R,S,T\),

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

:::reading
**Book laws; course application.** Abiteboul, Hull, and Vianu, *Foundations of
Databases*, Chapter 4, §4.4, pp. 57–58, states that natural join is associative
and commutative. Their use here to compare binary expression structures is
local to the course.
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
Let \(I\) have sort \(U\), and let \(f:U\to\mathcal U\) be one-to-one. For each
tuple \(t\) over \(U\), let \(f(t)\) be the tuple over \(f(U)\) satisfying

$$
f(t)(f(A))=t(A)
$$

for every \(A\in U\). The **renaming** of \(I\) is

$$
\delta_f(I)=\{f(t)\mid t\in I\}.
$$

Its sort is \(f(U)\); only attribute names change.
:::

:::reading
**Book definition.** Abiteboul, Hull, and Vianu, *Foundations of Databases*,
Chapter 4, §4.4, pp. 58–59, defines a one-to-one
attribute map \(f\), its action on tuples, and \(\delta_f\).
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
Let \(I\) have sort \(U\), let \(A,B\in U\), and let \(a\in dom\). The named
selection primitives are

$$
\sigma_{A=a}(I)=\{t\in I\mid t(A)=a\}
$$

and

$$
\sigma_{A=B}(I)=\{t\in I\mid t(A)=t(B)\}.
$$

Both have the same sort \(U\) as \(I\).
:::

:::reading
**Book definition.** Abiteboul, Hull, and Vianu, *Foundations of Databases*,
Chapter 4, §4.4, pp. 57–58, defines only the named
selection primitives \(\sigma_{A=a}\) and \(\sigma_{A=B}\), both with the input
sort as output sort.
:::


:::ada
So shared variables across distinct atom relations cause joins; equalities
inside one atom cause selections.

Now consider

```text
edge_from_capital(a, b) :-
    edge(a, b),
    capital_city(a).
```

Let

$$
E=\operatorname{Val}_I(\operatorname{edge}(a,b))
\quad\text{and}\quad
C=\operatorname{Val}_I(\operatorname{capital\_city}(a)).
$$

Their schemas are `{a, b}` and `{a}`. What does joining with \(C\) add?
:::alice
No attribute. It only tests whether `a` is a capital city.
:::

:::ada
A join whose right input only filters existing tuples without adding attributes
has a useful narrower form called **semijoin**.
:::alice
So its result keeps the left relation's schema.
:::

:::definition Semijoin
Let \(I\) and \(J\) have sorts \(R\) and \(S\). Their **semijoin** is

$$
I\ltimes J=\pi_R(I\bowtie J).
$$

It has sort \(R\). Equivalently, it contains exactly those tuples of \(I\) for
which some tuple of \(J\) agrees on the shared attributes \(R\cap S\).
:::

:::reading
**Book definition.** Abiteboul, Hull, and Vianu,
[*Foundations of Databases*, Chapter 6](http://webdam.inria.fr/Alice/pdfs/Chapter-6.pdf),
§6.4, p. 128,
defines \(I\ltimes J=\pi_R(I\bowtie J)\) when \(I\) has sort \(R\). The
existence-test sentence is an equivalent explanation.
:::


:::ada
Because the schema `{a}` of \(C\) is already contained in the schema `{a, b}`
of \(E\),

$$
E\bowtie C=E\ltimes C.
$$

Both expressions denote exactly the edges whose first endpoint is a capital
city.
:::alice
The semijoin spelling records that \(C\) filters edges without extending their
schema.
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
Let \(I\) and \(J\) have the same sort \(R\). Their **union** is

$$
I\cup J=\{t\mid t\in I\text{ or }t\in J\},
$$

and it also has sort \(R\). Adding a tuple already present has no further
effect.
:::

:::reading
**Book definition.** Abiteboul, Hull, and Vianu, *Foundations of Databases*,
Chapter 4, §4.5, pp. 62–63, defines union only for
relation instances of the same sort and uses it in SPJRU and same-head rule
unions.
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
Let \(I\) be a relation instance, and let \(A_1,\ldots,A_n\) be attributes in
its sort, with no repetitions. The **projection**

$$
\pi_{A_1,\ldots,A_n}(I)=
\{t[A_1,\ldots,A_n]\mid t\in I\}
$$

has sort \(\{A_1,\ldots,A_n\}\). Equal restrictions collapse because relations
have set semantics.
:::

:::reading
**Book definition.** Abiteboul, Hull, and Vianu, *Foundations of Databases*,
Chapter 4, §4.4, pp. 57–58, defines \(\pi_{A_1,\ldots,A_n}\) for an attribute list with no repetitions and gives
output sort \(\{A_1,\ldots,A_n\}\).
:::


:::notice Output fragment used here (course restriction/adaptation)
For now, every head contains pairwise-distinct body variables, and the result
relation uses those variable names as its attributes. Projection can therefore
produce a union-compatible result. Other head forms require a later
output-construction operation.
:::

:::reading
**Course term/adaptation; book basis.** Abiteboul, Hull, and Vianu,
*Foundations of Databases*, Chapter 4, Definition 4.2.1,
pp. 41–42, supplies CQ heads and \(q(I)\); §4.4, pp. 57–58, and §4.5,
pp. 62–63, supply projection and same-sort union. The restricted output
fragment is local to this course.
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

:::reading
**Course term/adaptation; book basis.** The assignment
\(H\leftarrow H\cup\cdots\) and separate-destination presentation are course
notation. Abiteboul, Hull, and Vianu, *Foundations of Databases*, Chapter 4,
§4.5, pp. 62–63, directly supplies union of
same-head rule outputs.
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
The named SPJR algebra builds relation-valued expressions recursively from
database relation names. Its unary constructors are \(\sigma_{A=a}(E)\),
\(\sigma_{A=B}(E)\), \(\pi_{A_1,\ldots,A_n}(E)\) with no repeated projected
attributes, and one-to-one renaming. Its natural-join constructor is

$$
E_L\bowtie E_R,
$$

with exactly two relation-valued operands. Every well-formed expression has a
fixed output sort and a set-theoretic denotation \([\![E]\!]_I\).

Cartesian product needs no additional constructor: it is the disjoint-sort case
of natural join.

Allowing union only between expressions of the same sort yields SPJRU; in the
rule form, union combines queries having the same head. Semijoin is a derived
operation.
:::

:::reading
**Book definition.** Abiteboul, Hull, and Vianu, *Foundations of Databases*,
Chapter 4, §4.4, pp. 57–60, gives named SPJR, including binary natural-join
expressions, and its other operators; §4.5, pp. 62–63, adds same-sort union for
SPJRU. Chapter 6, §6.4, p. 128, gives semijoin as a derived projection of join.
:::


:::ada
For `three_hop`, let \(E_1,E_2,E_3\) be the three atom expressions. The CQ body
is one conjunction, but the algebra has no three-input join constructor. What
must its syntax record?
:::alice
A binary tree. For example,

$$
(E_1\bowtie E_2)\bowtie E_3
\qquad\text{or}\qquad
E_1\bowtie(E_2\bowtie E_3).
$$

Each join occurrence has exactly two operands.
:::

:::definition Logical join plan (course term/adaptation)
Let the body of \(q(\bar x)\) have atom occurrences \(A_1,\ldots,A_n\), with
local translations \(E_1,\ldots,E_n\). Label the leaves of a full binary tree \(T\)
with those occurrences, each exactly once, and define its body expression
recursively by

$$
J_{A_i}=E_i,
\qquad
J_{(T_L,T_R)}=J_{T_L}\bowtie J_{T_R}.
$$

For the restricted output fragment used here, the resulting relational-algebra
expression is

$$
E_{q,T}=\pi_{\bar x}(J_T).
$$

The course calls \(E_{q,T}\), or equivalently its expression tree, a **logical
join plan**. The tree makes every binary join operand explicit; it does not yet
choose a physical join algorithm.
:::

:::reading
**Course term/adaptation; book basis.** Abiteboul, Hull, and Vianu,
*Foundations of Databases*, Chapter 4, §4.4, pp. 57–60, supplies the
relation-valued algebra expressions and binary natural join. Chapter 6, §6.1,
pp. 112–114, discusses left-to-right join processing and arbitrary binary trees.
The recursive
construction \(J_T\) and the term **logical join plan** are course notation.
:::


:::ada
Because each \(E_i\) denotes \(\operatorname{Val}_I(A_i)\), the conjunction-as-
join law proves by induction on \(T\) that every \(J_T\) denotes the complete
body-valuation relation. Projection then keeps the head variables. Thus every
permitted tree \(T\) satisfies

$$
[\![E_{q,T}]\!]_I=q(I)
$$

for every permitted input instance \(I\).
:::alice
So the CQ fixes the result, while \(T\) makes one equivalent binary
relational-algebra expression explicit.
:::

:::definition Equivalent queries
Two queries over the same input database schema are **equivalent** when they
have the same output schema and return equal results on every input instance.
:::

:::reading
**Book definition.** Abiteboul, Hull, and Vianu, *Foundations of Databases*,
Chapter 4, p. 37, requires equal output schemas
and equal results on every input. Theorem 4.4.8, p. 60, gives the relevant
language equivalence.
:::

:::ada
What has the equivalence proof deliberately left open?
:::alice
It does not choose the tree \(T\) from among the equivalent logical join plans.
That administrative choice is the next conversation.
:::

:::reading
**Reading trail.** Abiteboul, Hull, and Vianu, *Foundations of Databases*:

- [Chapter 4](http://webdam.inria.fr/Alice/pdfs/Chapter-4.pdf), Definition
  4.2.1 and pp. 41–42: CQ syntax, valuations, and \(q(I)\); p. 37: query
  equivalence.
- Chapter 4, §4.4, pp. 57–60: named selection, projection, natural join,
  renaming, join associativity and commutativity, and SPJR; Theorem 4.4.8,
  p. 60: equivalence of the conjunctive-query formalisms.
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

When the two schemas are disjoint, compatibility is vacuous and natural join is
Cartesian product:

$$
R\bowtie S=R\times S,
\qquad
|R\times S|=|R|\,|S|.
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
