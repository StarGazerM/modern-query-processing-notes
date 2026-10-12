---
title: The Little Joiner
subtitle: Conversation 0 — Authoring template
author: Modern Query Processing
date: Fall 2026
layout: dialogue
left_speaker: Ada
right_speaker: Alice
---

# Begin with something that can be computed

Replace this introduction with two or three sentences that establish the
objects already known to the reader. Do not explain the chapter in advance.

:::ada
Suppose the relations are:

| $R$: x | y |
|---:|---:|
| 1 | 7 |
| 2 | 7 |

| $S$: y | z |
|---:|---:|
| 7 | 4 |
| 8 | 5 |

Which tuples are produced by the query?

```text
Q(x,z) :- R(x,y), S(y,z).
```
:::alice
`(1,4)` and `(2,4)`.

Both R tuples have `y=7`, so each matches `S(7,4)`. The two satisfying
valuations differ in x. `S(8,5)` has no matching R tuple.
:::

:::reading
Chapter 4, pp. 37-39 - the introduction to conjunctive queries.
:::

:::ada
Did the query specify which relation must be examined first?
:::alice
No. The rule specifies the result, not an execution order.
:::

:::ada
Could an implementation examine either relation first?
:::alice
Yes—but its choice can change the operations performed even though the answer
must remain the same.
:::

:::law A provisional law
A physical choice may change the execution trace and its work. It must not
change the relation denoted by the query.
:::

# End with transfer, then compress

:::ada
Change `S(7,4)` to `S(9,4)`. Which part of the preceding reasoning changes?
:::alice
Both satisfying valuations disappear, so the result becomes empty. The
distinction between query meaning and execution choice does not change.
:::

:::recap What this conversation established
For an input instance $I$, the conjunctive query
`Q(x,z) :- R(x,y), S(y,z).` denotes the relation
$$
Q(I)=\{(v(x),v(z))\mid
(v(x),v(y))\in I(R)\text{ and }(v(y),v(z))\in I(S)\}.
$$
The repeated variable $y$ requires one shared value in both atoms. Execution
may inspect either input first, but a correct implementation must return
exactly $Q(I)$ for every permitted $I$.
:::
