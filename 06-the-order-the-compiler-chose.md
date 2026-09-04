---
title: The Order the Compiler Chose
subtitle: Conversation 2.4 — A Deterministic Logical Planning Baseline
author: Modern Query Processing
date: Fall 2026
status: Draft
layout: dialogue
left_speaker: Ada
right_speaker: Alice
previous: [Conversation 2.3 · The Variables the Plan Still Needed](05-the-variables-the-plan-still-needed.html)
---

# The order the compiler chose

:::ada
Conversation 2.3 can annotate any chosen binary tree. Now give `trip` an
awkward source order:

```text
trip(from, to) :-
    leg(from, hub, carrier),
    open(to, day),
    partner(carrier, partner),
    leg(hub, to, partner),
    open(from, day).
```

Use the occurrence names \(L_1,O_2,P,L_2,O_1\) in that order. What first join
does a blind source-order fold construct?
:::alice
It begins with \(L_1\bowtie O_2\). Their schemas
`{from,hub,carrier}` and `{to,day}` are disjoint, so the first join is
Cartesian.
:::

:::ada
After choosing only \(L_1\), which later occurrences already share one of its
variables?
:::alice
\(P\) shares `carrier`, \(L_2\) shares `hub`, and \(O_1\) shares `from`.
\(O_2\) shares nothing with \(L_1\) yet.

![The trip query hypergraph reused by the planner.](assets/04-trip-hypergraph.svg "The trip query hypergraph.")
:::

:::ada
A structural baseline can postpone \(O_2\) while any shared-variable extension
exists. It still needs a deterministic tie-break among \(P,L_2,O_1\). Which
one does source order choose?
:::alice
\(P\), because it is the earliest of those three occurrences in the body. That
choice is reproducible, but source position is not evidence that \(P\) is
cheaper.
:::

:::definition Query component and prefix-connected order (course terms)
A **query component** is a maximal family of atom occurrences connected by
chains of shared variables. A left-deep order is **prefix-connected within each
query component** when the occurrences from each component form one block and,
after that block's first occurrence, every later occurrence \(B_k\) satisfies

$$
\operatorname{vars}(B_k)\cap
\bigcup_{\substack{i<k\\B_i\text{ is in the same component}}}
\operatorname{vars}(B_i)
\neq\varnothing.
$$

The first occurrence of each additional component necessarily creates one
Cartesian boundary join with the accumulated expression.
:::

:::reading
**Course terms; book basis.** Abiteboul, Hull, and Vianu, *Foundations of
Databases*, Chapter 6, §6.1, pp. 112–113, defines sip strategies in which each
later relational atom is adjacent to an earlier atom, with separate cases for
constants and constraint atoms. **Query component** and **prefix-connected** are
the course's restricted, constant-free relational formulation.
:::

:::ada
We can now turn that policy into a procedure.
:::alice
**Algorithm**!!!
:::

:::definition Source-tied frontier scan (course algorithm)
Given a nonempty sequence of indexed body occurrences in source order:

1. Choose the earliest unplanned occurrence \(A\), mark it planned, and set
   \(J=E_A\) and \(V=\operatorname{vars}(A)\).
2. While unplanned occurrences remain, if one \(B\) satisfies
   \(\operatorname{vars}(B)\cap V\neq\varnothing\), choose the earliest such
   \(B\).
3. Otherwise choose the earliest unplanned \(B\); the next join crosses a
   component boundary and is Cartesian.
4. Replace \(J\) by \(J\bowtie E_B\), replace \(V\) by
   \(V\cup\operatorname{vars}(B)\), mark \(B\) planned, and return to step 2.

The scan returns a left-deep binary join-expression tree. It uses source order
only as a deterministic tie-breaker and uses no cardinality or cost estimate.
An empty CQ body requires no join order and is outside this algorithm's scope.
:::

:::reading
**Course algorithm; book basis.** Abiteboul, Hull, and Vianu, *Foundations of
Databases*, Chapter 6, §6.1, pp. 112–114, defines sip graphs and sip strategies
and discusses System R's consideration of left-to-right join orders. The
source-tied frontier scan is a course baseline, not an algorithm stated in the
book.
:::

:::ada
Apply the scan to `trip`. It starts at \(L_1\). Which occurrence is selected
next?
:::alice
\(P\). The source-earlier \(O_2\) has empty frontier, while \(P\), \(L_2\), and
\(O_1\) are connected choices. Among those, \(P\) occurs first.
:::

:::ada
After adding \(P\), which unplanned occurrences are connected, and which one
wins the tie-break?
:::alice
\(L_2\) remains connected through `hub` and `partner`; \(O_1\) remains
connected through `from`. \(O_2\) is still disconnected. Source order chooses
\(L_2\).
:::

:::ada
What happens after \(L_2\) introduces `to`?
:::alice
Both \(O_2\) and \(O_1\) are now connected. \(O_2\) appears earlier in the
source, so it is chosen next; \(O_1\) follows.

The selected order is

```text
L1, P, L2, O2, O1
```

and its raw left-deep expression is

$$
((((L_1\bowtie P)\bowtie L_2)\bowtie O_2)\bowtie O_1).
$$
:::

:::ada
Suppose the scan has unplanned occurrences but none shares a variable with the
chosen prefix. What does that situation mean?
:::alice
The chosen prefix has exhausted its query component. The next occurrence seeds
a different component, so its join with the accumulated expression is
necessarily Cartesian. After that seed, the scan again prefers connected
extensions within the new component.
:::

:::ada
Why must the scan terminate?
:::alice
The body has finitely many indexed occurrences. The initialization marks one,
and every loop iteration marks one more. The unplanned set therefore shrinks to
empty.
:::

:::ada
Why does it select every occurrence exactly once?
:::alice
Only unplanned occurrences may be selected, and each selection immediately
marks its occurrence planned. The loop stops only when no unplanned occurrence
remains.
:::

:::ada
Why does reordering the occurrences preserve the body meaning?
:::alice
The output tree still contains every atom relation exactly once. Associativity
and commutativity of natural join make every parenthesization and permutation
equivalent. A disjoint-schema natural join is the Cartesian product, so crossing
a component boundary remains semantically valid.
:::

:::reading
**Book equivalence basis.** Abiteboul, Hull, and Vianu, *Foundations of
Databases*, Chapter 4, §4.4, p. 58, states associativity and commutativity of
natural join and identifies Cartesian product as the disjoint-sort case.
:::

:::notice Deferring products is a policy, not a cost theorem
A Cartesian boundary may be unavoidable for a disconnected query, and a
Cartesian intermediate is not universally slower than every shared-variable
alternative. This baseline merely defers empty-frontier choices while a
shared-variable choice exists. It does not prove that the chosen order minimizes
rows, columns, bytes, or runtime.
:::

:::ada
The scan has selected a raw tree. Which construction from Conversation 2.3
turns it into a join–project logical plan?
:::alice
The required-schema pass. For prefix \(i\), compute

$$
V_i=\bigcup_{j\leq i}\operatorname{vars}(B_j)
$$

and keep

$$
K_i=
V_i\cap\left(
  H\cup\bigcup_{j>i}\operatorname{vars}(B_j)
\right).
$$
:::

:::ada
Begin that pass after \(L_1\). Which variables must remain?
:::alice
All three: `{from,hub,carrier}`. `from` belongs to the head, `hub` is needed by
\(L_2\), and `carrier` is needed by \(P\).
:::

:::ada
After \(L_1\bowtie P\), the raw schema is
`{from,hub,carrier,partner}`. Which variable becomes dead?
:::alice
`carrier`. It is not in the head, and no remaining atom uses it. The required
schema is `{from,hub,partner}`.
:::

:::ada
After the projected prefix joins \(L_2\), which variables must continue to
\(O_2\) and \(O_1\)?
:::alice
Only `{from,to}`. The head needs both. `hub` and `partner` have no remaining
use, while `carrier` was already removed after the preceding prefix.
:::

:::ada
What happens when \(O_2(to,day)\) joins that two-column intermediate?
:::alice
It adds `day`, which \(O_1(from,day)\) still needs. The required schema becomes
`{from,to,day}`.
:::

:::ada
And after the final join with \(O_1\)?
:::alice
No atom remains outside the root, so only the head variables `{from,to}` are
required. The root projection removes `day`.
:::

:::ada
Write the resulting plan as named steps.
:::alice
```text
p1 = L1;                                      // {from, hub, carrier}
j2 = natural_join p1 with P;                 // adds partner
p2 = project j2 keep {from, hub, partner};   // carrier is dead
j3 = natural_join p2 with L2;                // adds to
p3 = project j3 keep {from, to};             // hub and partner are dead
j4 = natural_join p3 with O2;                // adds day
j5 = natural_join j4 with O1;                // checks from and day
p5 = project j5 keep {from, to};             // final head schema
```

The projection theorem from Conversation 2.3 proves that these narrower
intermediates preserve the query result.
:::

:::definition Two-pass baseline logical planner (course construction)
The course's first logical planner performs two sequential passes:

1. **Tree selection:** the source-tied frontier scan returns one left-deep binary
   join-expression tree.
2. **Schema annotation:** the required-schema pass inserts projections using
   \(K_i=V_i\cap(H\cup\bigcup_{j>i}\operatorname{vars}(B_j))\).

Its output is a join–project logical plan. Tree selection is a heuristic
administrative choice; schema annotation is an equivalence-preserving rewrite.
:::

:::reading
**Course construction; book basis.** Abiteboul, Hull, and Vianu,
*Foundations of Databases*, Chapter 6, §6.1, pp. 110–114, separates equivalent
plan generation, cost estimation, plan choice, left-to-right join ordering, and
variables that can be forgotten. Exercise 6.4, p. 137, asks for the projection
analysis. The two-pass baseline and its source-order tie-break are course
constructions.
:::

:::ada
Would a correctness-only source-order fold need the query hypergraph?
:::alice
No. Associativity and commutativity already justify folding the atoms in source
order. The hypergraph became useful only because the planning policy asks
whether an unplanned atom shares a variable with the chosen prefix.
:::

:::ada
What would a cost-based optimizer need that this baseline lacks?
:::alice
It would need alternative trees, required-schema annotation for each tree,
cardinality and physical-width estimates, access paths, physical operators, and
a cost comparison.

This baseline makes one deterministic legal choice. It does not claim that the
choice is cheapest.
:::

:::reading
**Book planning stages.** Abiteboul, Hull, and Vianu, *Foundations of
Databases*, Chapter 6, §6.1, pp. 110–111, describes generating alternative
evaluation plans, estimating their execution costs, selecting one, and then
executing it. The course baseline stops after constructing one equivalent
logical plan.
:::

:::recap The first plan the compiler can explain
A blind source-order fold begins `trip` with the Cartesian join
\(L_1\bowtie O_2\). The source-tied frontier scan instead chooses the earliest
shared-variable extension and crosses a component boundary only when no such
extension exists. It produces

```text
L1, P, L2, O2, O1.
```

The scan terminates because each iteration removes one occurrence from the
finite unplanned set. It covers every occurrence exactly once, and natural-join
associativity and commutativity preserve the flat body meaning.

A second, sequential pass computes each prefix's required schema. It removes
`carrier` after \(P\), removes `hub` and `partner` after \(L_2\), and retains
`day` until the final `open` check.

The result is a deterministic join–project logical plan, not an optimized
physical plan. Cost-based planning still requires candidate generation,
cardinality and width estimates, physical alternatives, and a cost comparison.
:::
