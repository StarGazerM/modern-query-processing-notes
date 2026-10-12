---
title: The Answers We Might Have to Write
subtitle: Conversation 4.2 — Output Size and the AGM Bound
author: Modern Query Processing
date: Fall 2026
status: Draft
layout: dialogue
left_speaker: Ada
right_speaker: Alice
previous: [Conversation 4.1 · The Tuples That Found a Whole Answer](11-the-tuples-that-found-a-whole-answer.html)
next: [Conversation 4.3 · The Variable All the Atoms Could Accept](13-the-variable-all-the-atoms-could-accept.html)
---

# The answers we might have to write

:::ada
At the end of 4.1, a projected query had many witnesses for one answer.
Now request the full tuple. The same witnesses become answers we must
actually produce. To judge wasted work, we need to distinguish those
necessary outputs from candidates that will be rejected.

```text
pair(x, y, z) :- R(x, y), S(y, z).
R = {(1,0),(2,0)}
S = {(0,3),(0,4)}
```

Can this input require more answers than either individual relation has rows?
:::alice
Yes. The answers are `(1,0,3)`, `(1,0,4)`, `(2,0,3)`, and `(2,0,4)`.
Each left tuple combines with both right tuples.
:::

:::ada
Give each relation $N$ tuples, still sharing only the middle value 0.
How many full answers can this require?
:::alice
Take

$$
\begin{aligned}
R&=\{(i,0):1\leq i\leq N\},\\
S&=\{(0,j):1\leq j\leq N\}.
\end{aligned}
$$

Every pair combines. There are $N^2$ distinct tuples `(i,0,j)`.
Writing them already takes that much work.
:::

:::ada
Close the triangle with $T(x,z)$, also of size $N$. Can all $N^2$ tuples
of that particular join still survive?
:::alice
No. They have $N^2$ different `(x,z)` pairs, and $T$ has room for only
$N$ of them.

But that only rules out this construction. Perhaps different relations
could give more than $N$ answers.
:::

:::ada
Try all pairs over a two-element domain:

$$
R(x,y)=S(y,z)=T(x,z)=\{0,1\}^2.
$$

Count each input and the full output.
:::alice
Four tuples per input, and all eight triples in $\{0,1\}^3$ survive.
So an $N$-answer bound is already wrong at $N=4$.
:::

:::ada
Replace the two-element domain by a domain of size $m$.
:::alice
Each input has $m^2$ tuples and the result has $m^3$. Writing
$N=m^2$, the output size is $N^{3/2}$.

We have constructed that many answers. Have we proved that no instance
can have more?
:::

:::ada
Not yet. For each fixed $y$, let $d_S(y)$ count its possible $z$ values
in $S$. For each fixed $x$, let $d_T(x)$ count its possible $z$ values
in $T$. How many $z$ values can complete one `(x,y)` from $R$?
:::alice
The common values of those two sets. At most
$\min(d_S(y),d_T(x))$. Summing those limits over $R$ bounds the answer
count, but still depends on the individual groups.
:::

:::ada
We want a bound using the three relation sizes. One useful step is to
replace that minimum by something that separates the two degrees.
For nonnegative $p\leq q$, why is $p\leq\sqrt{pq}$?
:::alice
Because $p^2\leq pq$. Swapping the names handles $q\leq p$, so
$\min(p,q)\leq\sqrt p\sqrt q$ in either case.

The bound can be loose: sizes 1 and 100 give at most one common value,
but the square-root product is 10. It remains an upper bound.
:::

:::ada
Now there is one term $\sqrt{d_S(y)d_T(x)}$ for each tuple of $R$.
The arithmetic tool Cauchy–Schwarz says
$(\sum_{i=1}^n a_i)^2\leq n\sum_{i=1}^n a_i^2$.
Substitute those terms for $a_i$ and $|R|$ for $n$. What remains to bound?
:::alice
$$
\begin{aligned}
|R\bowtie S\bowtie T|
&\leq\sum_{(x,y)\in R}\sqrt{d_S(y)d_T(x)}\\
&\leq\sqrt{|R|\sum_{(x,y)\in R}d_S(y)d_T(x)}.
\end{aligned}
$$

We have reduced the question to that last sum.
:::

:::ada
What happens if we enlarge the sum to all pairs of occurring $x,y$
values, including pairs absent from $R$?
:::alice
Its terms are nonnegative, so it can only grow. Then the sum factors:

$$
\begin{gathered}
\sum_{(x,y)\in R}d_S(y)d_T(x)\\
\leq
\left(\sum_y d_S(y)\right)
\left(\sum_x d_T(x)\right)\\
=|S||T|.
\end{gathered}
$$

Therefore

$$
|R\bowtie S\bowtie T|\leq\sqrt{|R||S||T|}.
$$

With all three sizes at most $N$, that gives $N^{3/2}$. Our square-domain
construction reaches it when $N=m^2$.
:::

:::reading
**Triangle argument.** The degree counts above are a course derivation
using the minimum/geometric-mean and Cauchy–Schwarz inequalities. Ngo, Ré,
and Rudra's [Skew Strikes Back](https://arxiv.org/abs/1310.3314), §2,
uses closely related inequalities to analyze triangle algorithms.
The general output theorem is due to Atserias, Grohe, and Marx.
:::

:::ada
We now have bounds $|R||S|$ and $|R|^{1/2}|S|^{1/2}|T|^{1/2}$.
Can the query's variable sets help us recognize which products are valid?
First try using $|R|$ alone. Test

```text
R = {(0,0)}
S = {(0,j): 1 <= j <= m}
T = {(0,j): 1 <= j <= m}
```
:::alice
There are $m$ answers `(0,0,j)` while $|R|=1$. That proposed bound
misses the choices for $z$, the variable absent from $R$.
:::

:::ada
Return to complete-pair inputs, but allow the $x,y,z$ domains to have
different sizes $X,Y,Z$. What are the relation sizes and output size?
:::alice
$|R|=XY$, $|S|=YZ$, $|T|=XZ$, and the output size is $XYZ$.
:::

:::ada
Write a proposed bound as $|R|^{w_R}|S|^{w_S}|T|^{w_T}$ with
nonnegative exponents. Substitute these complete-pair sizes. How often
does each domain-size factor appear?
:::alice
The product becomes

$$
X^{w_R+w_T}Y^{w_R+w_S}Z^{w_S+w_T}.
$$

To bound $XYZ$ for arbitrary positive integer domain sizes, each of those
exponents must be at least 1. Otherwise I can enlarge the corresponding
domain while keeping the other two sizes at 1.
:::

:::ada
Express those requirements using the query's three edges.
:::alice
The requirements are

$$
\begin{aligned}
w_R+w_T&\geq1,\\
w_R+w_S&\geq1,\\
w_S+w_T&\geq1.
\end{aligned}
$$

Taking every weight to be $1/2$ satisfies all three. Multiplying the
relation sizes to those powers gives our square-root bound.
:::

:::ada
Would taking every weight to be $1/3$ give a better valid cover?
:::alice
It would give a smaller expression, but each variable would receive only
$2/3$. On our two-element cube, that product is $4^{1/3+1/3+1/3}=4$,
although we listed eight answers. It is not a valid bound.

Adding the three requirements gives
$2(w_R+w_S+w_T)\geq3$. Thus the weight sum cannot be below $3/2$.
:::

:::definition Fractional edge cover
For a query hypergraph $H=(V,E)$, a **fractional edge cover** assigns
nonnegative weights $w_e$ to atom edges so that

$$
\sum_{e\ni v}w_e\geq1\qquad\text{for every }v\in V.
$$

An ordinary edge cover selects whole edges, with weights 0 or 1.
Fractional weights allow several incident edges to share the requirement.
They do not mean that the algorithm reads a fraction of each relation.
:::

:::ada
Does the triangle also admit the cover $(w_R,w_S,w_T)=(1,1,0)$?
:::alice
Yes. $x$ is covered by $R$, $z$ by $S$, and $y$ by both.
It gives the bound $|R||S|$, which we already had by considering the
first binary join.
:::

:::ada
Let $|R|=|S|=2$ and $|T|=100$. Which of those two covers gives the
smaller bound?
:::alice
The all-halves cover gives $\sqrt{2\cdot2\cdot100}=20$.
The cover $(1,1,0)$ gives $2\cdot2=4$.

With unequal sizes, minimizing the sum of weights is not the same as
minimizing the product of sizes to those weights.
:::

:::ada
Have the complete-pair examples proved that every cover gives a bound
on every possible input?
:::alice
No. They explained why those constraints are necessary for this family.
Our degree argument proved the all-halves triangle bound for arbitrary
triangle data. Neither argument proves the general hypergraph theorem.
:::

:::ada
That general step is the AGM theorem below. We will use its stated
guarantee, and continue testing how its cover conditions behave on other
queries. Its general proof is in the reading.
:::alice
So the examples motivate the conditions; the theorem supplies the
extension beyond the cases we have proved.
:::

:::law AGM output bound (general theorem)
For a full natural join $Q=\bowtie_{e\in E}R_e$ of finite set relations
and any fractional edge cover $w$,

$$
|Q(I)|\leq\prod_{e\in E}|R_e|^{w_e}.
$$

Handle an empty input by returning the empty join. For positive size
bounds $N_e$, the best fractional-cover bound is

$$
B=\min_w\prod_eN_e^{w_e}.
$$

Equivalently, minimize $\sum_e w_e\log N_e$ under the cover constraints.
For a common bound $N$, this becomes $N^{\rho^*(H)}$, where
$\rho^*(H)$ is the minimum cover-weight sum.
:::

:::reading
**General theorem.** Atserias, Grohe, and Marx,
[Size Bounds and Query Plans for Relational Joins](https://arxiv.org/abs/1711.03860),
§§3.1 and 4, establishes the cover bounds and their worst-case tightness
up to query-dependent factors. The exact cube construction above establishes
tightness for the equal-size triangle family. Koutris's
[Size Bounds for Joins](https://pages.cs.wisc.edu/~paris/cs784-s19/lectures/lecture6.pdf),
§§6.1–6.3, develops the weighted objective and an entropy proof.
:::

:::ada
Transfer the cover test to the path $R(x,y),S(y,z)$. Can either edge
receive weight $1/2$?
:::alice
No. $x$ appears only in $R$, forcing $w_R\geq1$; $z$ forces
$w_S\geq1$. The bound is $|R||S|$.

That agrees with our first construction. The extra triangle constraint
was doing real work in the smaller bound.
:::

:::ada
Now use the four-variable Loomis–Whitney shape from the CQ slides:

```text
R(b,c,d), S(a,c,d), T(a,b,d), U(a,b,c)
```

Each relation has at most $N$ tuples. Find a cover, and show its total
weight cannot be smaller.
:::alice
Each variable occurs in three edges, so weight $1/3$ per edge works.
Adding all four variable constraints counts each edge three times:

$$
3(w_R+w_S+w_T+w_U)\geq4.
$$

The minimum sum is $4/3$, giving $N^{4/3}$.
With a domain of size $m$, the complete three-column inputs have
$N=m^3$ tuples each and the full output has $m^4$.
:::

:::ada
If a triangle input has no answers, is its AGM bound zero?
:::alice
No. The bound uses relation sizes and query structure. Different data
with those same sizes may have many answers.

The actual output and the largest possible output are different quantities.
:::

:::ada
Bring back 2.5's road instance:

$$
road=\{(0,i),(i,0):1\leq i\leq k\},
$$

and the full query

```text
round_trip(a,b,c) :- road(a,b), road(b,c), road(c,a).
```

What did its first binary join produce?
:::alice
$k^2+k$ candidates, followed by no complete answers.
Each atom has $N=2k$ tuples, and the three-way output bound is
$N^{3/2}=(2k)^{3/2}$.

The binary intermediate grows quadratically even though the full output
could never grow quadratically under those size bounds.
:::

:::ada
If we pipeline those candidates without putting them in an array, is
the work problem gone?
:::alice
The large stored array may be gone. But if we still construct and test
all $k^2+k$ candidates, that many candidate steps remain.

Changing pull to push does not, by itself, let the third atom constrain
how those candidates are constructed.
:::

:::definition Worst-case-optimal join algorithms
For a fixed full join and specified input-size bounds, a **worst-case-optimal
join algorithm** matches the worst-case output-size bound in its evaluation
cost, under a stated access model. Input reading and index construction
must also be accounted for. Some algorithms match the bound up to
logarithmic factors, which should be stated explicitly.

For the equal-size triangle, the target is $O(N^{3/2})$ evaluation work,
or that bound with the stated logarithmic factor. This is a worst-case
guarantee across permitted inputs. It is not an
$O(\mathrm{IN}+|Q(I)|)$ guarantee for each individual input.
:::

:::ada
Have we obtained an algorithm merely by finding weights?
:::alice
No. We know a target and have an example that defeats the plain binary
construction. We still need a way to build tuples while consulting the
constraints that the binary plan postponed.
:::

:::recap Output and work
The output-size question fixes a query and input-size bounds, then asks
how many full answers any permitted instance can have. Fractional edge
covers provide AGM upper bounds; the triangle's equal-size bound is
$N^{3/2}$, attained by complete pairs over a common domain of size
$\sqrt N$ when that size is integral.

A particular instance may have far fewer answers, including none.
An execution can also produce partial candidates larger than the bound
on complete answers. Neither an output bound nor pipeline fusion alone
prevents that work. Worst-case-optimal evaluation requires an algorithm
whose candidate construction can be charged to the appropriate bound.
:::
