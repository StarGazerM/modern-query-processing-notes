---
title: The Variable All the Atoms Could Accept
subtitle: Conversation 4.3 — Generic Join and Leapfrog Triejoin
author: Modern Query Processing
date: Fall 2026
status: Draft
layout: dialogue
left_speaker: Ada
right_speaker: Alice
previous: [Conversation 4.2 · The Answers We Might Have to Write](12-the-answers-we-might-have-to-write.html)
---

# The variable all the atoms could accept

:::ada
Return to the road instance on which every plain first binary join
produced dead candidates:

```text
road = {(0,1), (1,0), (0,2), (2,0)}
round_trip(a,b,c) :- road(a,b), road(b,c), road(c,a).
```

The first atom has bound `a=1,b=0`. If we enumerate the second atom's
matches before asking the third atom anything, which candidates do we build?
:::alice
`(1,0,1)` and `(1,0,2)`. The closing atom then asks for `(1,1)` and
`(2,1)`, neither of which is a road. Both candidates fail.
:::

:::ada
While we still have only `a=1,b=0`, can the third atom already tell us
something about possible $c$ values? Read `road(c,a)` with that binding.
:::alice
It asks for `road(c,1)`. The only such road is `(0,1)`, so it permits
only `c=0`.

The second atom permits `c=1` or `c=2`. We could discover the empty
intersection before constructing either complete candidate.
:::

:::ada
That suggests a different unit of progress: choose a value only after
consulting all atoms that contain its variable. Can we organize the
whole search that way, in order $a,b,c$?

For the triangle, write its local relations as $R(a,b)$, $S(b,c)$, and
$T(a,c)$. In the road query, $T(a,c)$ comes from `road(c,a)`: its columns
are reordered to agree with our variable order.

Before choosing $a$, which relations can say anything about it?
:::alice
$R$ and $T$. $S$ has no $a$.
So the initial candidates are $\pi_a(R)\cap\pi_a(T)$.
:::

:::ada
After choosing $a=\alpha$, which $b$ values remain possible?
:::alice
Those paired with $\alpha$ in $R$, and present somewhere in $S$:

$$
\pi_b(\sigma_{a=\alpha}R)\cap\pi_b(S).
$$

$T$ still matters, but it has no $b$ value to offer at this step.
:::

:::ada
After choosing $b=\beta$, where can $c$ come from?
:::alice
From both remaining requirements:

$$
\pi_c(\sigma_{b=\beta}S)
\cap
\pi_c(\sigma_{a=\alpha}T).
$$

We choose a $c$ acceptable to both atoms before making a complete tuple.
:::

:::ada
Check that these formulas reproduce the branch we just worked out.
Start with $a=1$ on the same four-road instance.
:::alice
$R$ allows only $b=0$. Then $S$ offers $c\in\{1,2\}$, while $T$
requires `road(c,1)`, so it offers only $c=0$.

Their intersection is empty. We do not construct `(1,0,1)` or
`(1,0,2)` as three-variable candidates.
:::

:::ada
Complete the trace for every surviving two-variable prefix.
:::alice
| $(a,b)$ | $S$ offers for $c$ | $T$ offers for $c$ | Common values |
|---|---|---|---|
| $(0,1)$ | $\{0\}$ | $\{1,2\}$ | none |
| $(0,2)$ | $\{0\}$ | $\{1,2\}$ | none |
| $(1,0)$ | $\{1,2\}$ | $\{0\}$ | none |
| $(2,0)$ | $\{1,2\}$ | $\{0\}$ | none |

The answer is empty. We visited four two-variable prefixes; the binary
first join produced six three-variable candidates.
:::

:::ada
That example only failed. Try fresh relations with some successful paths:

```text
R(a,b) = {(0,1), (0,2), (1,2)}
S(b,c) = {(1,4), (1,5), (2,5), (2,6)}
T(a,c) = {(0,5), (0,6), (1,4)}
```

What are the intersections?
:::alice
Both 0 and 1 are possible for $a$.

| $(a,b)$ | $S$ offers | $T$ offers | Emit |
|---|---|---|---|
| $(0,1)$ | $\{4,5\}$ | $\{5,6\}$ | $(0,1,5)$ |
| $(0,2)$ | $\{5,6\}$ | $\{5,6\}$ | $(0,2,5),(0,2,6)$ |
| $(1,2)$ | $\{5,6\}$ | $\{4\}$ | nothing |

Three full answers. The prefix `(1,2)` passes earlier tests but has no
complete extension.
:::

:::ada
So do these intersections provide Yannakakis's complete-support
guarantee at every prefix?
:::alice
No. They enforce the constraints available at that prefix. A later
intersection can still be empty.

They let later atoms participate earlier; they do not foretell every
future failure.
:::

:::ada
Before generalizing, consider an atom with no variable to choose:

```text
q(a) :- R(a), enabled("go").
R = {1,2}
enabled = {"stop"}
```

Will looking only at atoms containing the next variable reject this query?
:::alice
No. `enabled("go")` contains no query variable, so it would never enter
an intersection. But it is false, and the answer must be empty.

We must check such ground atoms before starting the search. Under 1.3's
normalization, a true ground atom gives the singleton empty tuple, and
a false one gives an empty local relation.
:::

:::definition Candidate values under a prefix
Fix a variable order $v_1,\ldots,v_n$ for a full join. A prefix valuation
$\nu$ assigns the first few variables. For an atom relation $R_e$ whose
schema contains the next variable $v$, let
$B_e=e\cap\operatorname{dom}(\nu)$ be its already bound variables. Define

$$
\begin{gathered}
D_e(v\mid\nu)=\\
\{t(v):t\in R_e,\ t|_{B_e}=\nu|_{B_e}\}.
\end{gathered}
$$

The candidates for $v$ are $\bigcap_{e\ni v}D_e(v\mid\nu)$.
Thus every atom containing $v$ contributes a condition using all its
already bound variables together. Constants and repeated positions have
first been handled by the local atom normalization from 1.3. Check for an
empty local relation before the search, including those from ground atoms.
If one is empty, the whole join is empty. A remaining zero-ary singleton
requires no variable choice.
:::

:::ada
Turn that construction into a recursive algorithm.
:::alice
```text
extend(prefix, depth):
    if depth == number_of_variables:
        emit(prefix)
        return
    v = variable_order[depth]
    candidates = intersect(
        allowed_values(atom, v, prefix)
        for every atom containing v
    )
    for value in candidates:
        extend(prefix with v=value, depth+1)

if any local atom relation is empty:
    return
extend(empty_valuation, 0)
```

An empty intersection ends this branch. Then we try the next value at
the previous depth.
:::

:::ada
Why is every emitted valuation correct?
:::alice
Consider any atom with variables. When its last variable was chosen, the corresponding
candidate set required the complete tuple to occur in that atom relation.
Later choices do not change the earlier bindings.

Ground atoms passed the preliminary check. Every atom therefore holds at
an emitted valuation.
:::

:::ada
And why is no answer missed?
:::alice
Take a satisfying valuation. At each depth, its next value belongs to
every candidate set: that valuation's restriction to each atom is an
actual tuple. So its path is never rejected.

Because each candidate set contains distinct values and the variable
order is fixed, that path is enumerated once.
:::

:::reading
**Algorithmic source.** Ngo, Ré, and Rudra,
[Skew Strikes Back](https://arxiv.org/abs/1310.3314), §4,
presents Generic Join as recursive decomposition of variable sets.
Our `extend` is its single-variable form for full joins; the candidate
notation is a course restatement. Correctness alone does not settle its
running time: the access and intersection implementations matter.
:::

:::ada
We have an algorithm that returns the right answer. Suppose
`allowed_values` scans its whole relation whenever it is called. In the
successful example, what happens while finding $c$ values for the three
prefixes `(0,1)`, `(0,2)`, and `(1,2)`?
:::alice
Each prefix scans all four $S$ rows and all three $T$ rows: 21 row
visits just at that final level.

The two prefixes with `b=2` ask $S$ for the same group `{5,6}`.
We should organize that group once and retrieve it by the bound key.
:::

:::ada
Would grouping alone guarantee cheap intersections? One retrieved group
could still be much larger than the other.
:::alice
No. We also need to avoid repeatedly scanning a large candidate set
when another atom already limits the choices to a tiny one.
:::

:::ada
At the final triangle step one candidate set has a million values and
the other has one. With exact hash sets already available, what can we do?
:::alice
Scan the smaller set and probe the larger. More generally, scan the
smallest candidate set and test each value in all the others.

For a fixed number of atoms and expected constant-time membership, the
work is proportional to the smallest set, plus producing its matches.
We must count building those structures too.
:::

:::ada
Use $d_S(b)$ and $d_T(a)$ from 4.2. What bounds all the triangle's
final intersections?
:::alice
The surviving `(a,b)` prefixes form a subset of $R$, so their total
smaller-set work is at most

$$
\sum_{(a,b)\in R}\min(d_S(b),d_T(a))
\leq\sqrt{|R||S||T|}.
$$

The same two inequalities from 4.2 prove it. The earlier levels cost at
most linear input work with prefix indexes: the $b$ intersections scan
at most the $R$ group for each distinct $a$.
:::

:::ada
What does that tell us, and what remains a general theorem?
:::alice
For this triangle implementation, including expected linear index
construction, the bound is
$O(\mathrm{IN}+\sqrt{|R||S||T|})$.

For arbitrary hypergraphs we need the full Generic Join analysis. We
have not proved it merely by writing a recursive loop.
:::

:::law Generic Join's cost model (general theorem)
For a fixed full join, suitable prefix indexes and smallest-set
intersection give an expected $O(\mathrm{IN}+B)$ implementation using
exact hash membership, where $B$ is the optimized AGM bound. Ordered
implementations may incur logarithmic factors. The guarantee requires
efficient access to conditional candidate sets; arbitrary rescanning
does not satisfy it.
:::

:::reading
**General analysis.** Ngo, Ré, and Rudra, §4's Generic Join algorithm and
query-decomposition analysis, provides the general bound. Veldhuizen,
[Leapfrog Triejoin](https://www.openproceedings.org/2014/conf/icdt/Veldhuizen14.pdf),
§6.1, describes the hash-based smallest-set variant. The triangle calculation
above exposes the essential cost that the implementation must control.
:::

:::ada
The hash implementation gives us one way to meet that requirement.
Suppose instead that suitable ordered indexes already exist. Could we
reuse their order to find common values, without building another set
of hash indexes?
:::alice
We would need access to the values under each bound prefix, and a way
to intersect those ordered groups efficiently.
:::

:::ada
Arrange the successful example's tuples by each relation's variables in
the order $a,b,c$. Group equal first values. What must each group expose
when that first value becomes bound?

```text
R, order (a,b)
  0: [1,2]
  1: [2]

S, order (b,c)
  1: [4,5]
  2: [5,6]

T, order (a,c)
  0: [5,6]
  1: [4]
```

:::alice
Its sorted, distinct next values. After choosing `a=0` in $R$, for
example, the children `[1,2]` are exactly its permitted $b$ values.

Choosing a first value and then a child identifies one tuple. This
grouped representation is a **trie**; it implements the prefix access
our search needs.
:::

:::ada
For the global order $a,b,c$, where does each relation participate?
:::alice
| Variable | Participating levels |
|---|---|
| $a$ | roots of $R$ and $T$ |
| $b$ | $R$ below the chosen $a$; root of $S$ |
| $c$ | $S$ below the chosen $b$; $T$ below the chosen $a$ |

$T$ stays at its chosen $a$ while we choose $b$. It has no $b$ level to
descend into.
:::

:::ada
Can every trie use the stored column order without checking the atoms?
:::alice
No. The road occurrence `road(c,a)` needs access in `(a,c)` order for
this plan, even if the base relation is stored as `(src,dst)`.

Each atom's index order must be the global variable order restricted to
that atom. Reordering or building an index has a cost.
:::

:::ada
Our symmetric road instance could hide a swapped-column mistake. Test
`road(c,a)` with only the directed fact `road(2,9)` and with `a=9` bound.
Which $c$ does its access offer?
:::alice
Only 2. The `(a,c)` index contains `(9,2)`, so its group at `a=9` has
child 2. Looking up source 9 in the original `(src,dst)` order would
miss the required match.
:::

:::ada
First test a tempting intersection method. One ordered group contains
`1,2,...,1000000`, and another contains only `1000000`. If we start at
both first values and advance the smaller current value one step at a
time, what happens?
:::alice
We traverse the whole large group to match the singleton. Knowing the
desired lower bound should let us jump, if the access structure supports it.

In a sorted array, binary search can find the first value at least that
bound in logarithmic time. Plain sequential iteration cannot promise that.
:::

:::ada
Use that stronger access to intersect these smaller sets:

```text
A = [1,4,8]
B = [2,4,7,8]
C = [4,6,8]
```

Start the cursors at their first values. How can the largest current
value help the others?
:::alice
The positions initially show `(1,2,4)`. No value below 4 can be common,
because $C$ is already at 4. Seek $A$ and $B$ to at least 4. Now all
three are at 4, so emit 4.
:::

:::ada
Continue after emitting 4. Advance one cursor, then repeat that reasoning.
:::alice
Advance $A$ to 8, giving `(8,4,4)`. Seek $B$ and $C$ to at least 8.
All three reach 8, so emit it.

Advance $A$ again and it ends. No further common value is possible.
The intersection is `{4,8}`.
:::

:::ada
What if `seek(5)` lands on 8?
:::alice
That is allowed. Seek promises the least remaining key at least 5,
not an equal key. We must compare the cursor values again.
:::

:::definition Ordered cursors and trie navigation
The linear cursor used by Leapfrog Join has `key()`, `next()`,
`seek(k)`, and `atEnd()`. At a valid position, `key` reads the key,
`next` advances, and forward `seek(k)` finds the least remaining key
at least $k$, or the end. These operations require ordered access.

A trie iterator also has `open()` to descend to the children of the
current prefix and `up()` to return to the preceding level. This
`open` is trie navigation; it is not Volcano's query-operator lifecycle
operation with the same name.
:::

:::reading
**Physical algorithm.** Veldhuizen, §§3.1–3.5, specifies Leapfrog Join's
ordered cursor interface, its cyclic seeking procedure, and trie navigation.
The three-list example above is a smaller course trace. The paper's
`next()` advances a positioned cursor; the tuple-returning `next` from 3.2
combines a different set of actions.
:::

:::ada
In the successful triangle example, we are at `a=0,b=1`. The $c$
intersection emitted 5 and is now exhausted. What happens next?
:::alice
Return from the $c$ levels of $S$ and $T$. Resume the $b$ intersection
and choose 2. Keep `a=0` fixed.

Then descend into $S$ under `b=2` and $T$ under `a=0`. Their $c$
intersection is `{5,6}`, giving two more answers.
:::

:::ada
Did the underlying $T$ cursor have to move through a fictitious $b$?
:::alice
No. Each relation descends only at variables it contains. The join's
global depth and an individual trie's depth are different quantities.
:::

:::ada
If every trie cursor can seek, did the generic iterator interface from
3.2 already provide everything needed here?
:::alice
No. That interface promised only resumable result production. Here we
also rely on order, forward seek, and navigation through conditional
groups. Those are stronger physical capabilities.
:::

:::ada
What bound should we attach to the ordered Leapfrog Triejoin algorithm?
:::alice
For a fixed full query, with the required ordered indexes and the
paper's cursor costs, it matches the worst-case output bound up to a
logarithmic factor. For the equal-size triangle that is
$O(N^{3/2}\log N)$ evaluation time.

If the indexes are not present, their construction must be included.
Sorting fixed-arity inputs can contribute $O(\mathrm{IN}\log\mathrm{IN})$.
:::

:::reading
**Scope of optimality.** Veldhuizen, §4, especially Theorem 4.2 and
Corollary 4.3, supplies the ordered algorithm's guarantee. CMU's
[Multi-Way Join Algorithms](https://15721.courses.cs.cmu.edu/spring2024/notes/10-multiwayjoins.pdf),
§2, is useful for the cursor and trie teaching sequence. Keep the paper's
worst-case-family interpretation and logarithmic qualification when
stating the bound.
:::

:::ada
Return to the scaled road instance with $2k$ tuples per occurrence.
What does the smaller-set implementation do at each final intersection?
:::alice
If `a=0`, there are $k$ possible nonzero `b` values; each has singleton
$S_b=\{0\}$ and $k$ nonzero values in $T_a$.

If `a` is nonzero, only `b=0` is possible; $T_a=\{0\}$ is the
singleton instead. All intersections are empty. There are $2k$ such
prefixes, and each tests a singleton against the other set.

With the stated hash access, this family takes linear work after linear
construction. That is a property of this family, beyond the general
worst-case bound.
:::

:::ada
Does WCOJ therefore replace Yannakakis everywhere?
:::alice
No. Yannakakis gives the stronger input-plus-actual-full-output bound
on acyclic joins. WCOJ applies a worst-case size guarantee to general
full joins, including cycles.

Variable order, index availability, and actual data still affect work.
Neither theorem says which implementation wins every timing experiment.
:::

:::recap Constructing answers by variables
Single-variable Generic Join extends a prefix only with values admitted
by every atom containing the next variable. At a full assignment each
atom has been checked, and every satisfying assignment has a surviving
path. Prefix access and efficient intersections turn this correct search
into a worst-case-optimal algorithm under the stated cost model.

Leapfrog Triejoin supplies an ordered implementation: each relation's trie
follows the global variable order restricted to that atom, unary leapfrog
intersections choose values, and trie navigation manages conditional groups
and backtracking. Its evaluation guarantee includes a logarithmic factor
under the paper's access model. These physical cursors require capabilities
beyond the generic result iterator. The query's set meaning remains the
same throughout.
:::
