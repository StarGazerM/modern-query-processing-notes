---
title: The Rows We Did Not Need
subtitle: Conversation 3.4 — Physical Semijoins and Filtering Evidence
author: Modern Query Processing
date: Fall 2026
status: Draft
layout: dialogue
left_speaker: Ada
right_speaker: Alice
previous: [Conversation 3.3 · The Loop That Kept Going](09-the-loop-that-kept-going.html)
next: [Conversation 4.1 · The Tuples That Found a Whole Answer](11-the-tuples-that-found-a-whole-answer.html)
---

# The rows we did not need

:::ada
The next query asks which records in $R$ have a matching key in $S$.
Values are ordinary non-null values, and the relations are sets.

| $R$: k | value |
|---:|---|
| 5 | a |
| 20 | b |
| 30 | c |
| 40 | d |
| 90 | e |

| $S$: k | tag |
|---:|---|
| 20 | early |
| 20 | late |
| 40 | early |

```text
supported(k, value) :- R(k, value), S(k, tag).
```

Use the algebra we already know. What plan computes this answer?
:::alice
Join $R$ and $S$, then project to `k,value`. The join constructs
`(20,b,early)`, `(20,b,late)`, and `(40,d,early)`.

Projection returns `{(20,b),(40,d)}`. It merges the two witnesses for
the same left tuple.
:::

:::ada
Now give key 20 a million different tags in $S$. How many joined tuples
would that part of the plan construct? How many answers would it add?
:::alice
A million joined tuples, all projecting to `(20,b)`.

Once one witness establishes that answer, finding more witnesses cannot
change whether it belongs. Could we stop at the first match?
:::

:::ada
Yes. Which operator from 1.3 expresses exactly that requirement?
:::alice
The semijoin $R\ltimes S$. It retains a left tuple when a right witness
exists. On our small instance it returns

$$
\{(20,\mathrm{b}),(40,\mathrm{d})\}.
$$

It has the schema of $R$.
:::

:::ada
To decide whether `(20,b)` belongs, which fields of its witnesses do we
need?
:::alice
Only their shared field `k`. We need to know that 20 occurs in $S$.
The tags never enter either the test or the result.
:::

:::ada
First try searching the right array afresh for each left tuple. How much
of $S$ must the search for key 90 inspect before concluding it is absent?
:::alice
All three rows. For 20 it can stop at the first row, but an absent key
must exhaust the search. Many absent left keys would repeat that scan.
:::

:::ada
Could one traversal of $S$ prepare all those existence tests? What must
it remember, and what can it discard?
:::alice
An exact set of keys:

$$
H=\pi_k(S)=\{20,40\}.
$$

Scan $R$ and retain a tuple exactly when its key belongs to $H$.
We pay to build the set once. Tags and repeated occurrences of a key
need no separate entries because they cannot change an existence answer.
:::

:::ada
If 30 hashes to the same bucket as 20, may the test return true?
:::alice
No. A bucket is a place to search. The keys still need an equality test.
Otherwise `(30,c)` would appear in an exact semijoin result.
:::

:::ada
What if two attributes are shared? Suppose the available support pairs
are `(north,bolt)` and `(south,nut)`. Does `(north,nut)` have support?
:::alice
North occurs, and nut occurs, so it looks possible.

But they occur in different tuples. I must test the pair `(north,nut)`
against a set of pairs. Two independent membership tests would admit a
false match.
:::

:::ada
And if there are no shared attributes?
:::alice
Every left tuple matches every right tuple. So keep all of $R$ if $S$ is
nonempty, and none if $S$ is empty.

The empty shared key has a witness exactly when $S$ has a tuple.
:::

:::definition Exact hash semijoin
For named set relations $R(X)$ and $S(Y)$, let $K=X\cap Y$.
Build an exact membership structure for $\pi_K(S)$. Keep each $r\in R$
exactly when its restriction $r|_K$ belongs to that structure:

$$
R\ltimes S=\{r\in R:r|_K\in\pi_K(S)\}.
$$

This is a physical implementation of the semijoin meaning already defined
in 1.3. Hashing locates candidates; equality settles membership.
:::

:::reading
**Semantic basis.** AHV,
[Chapter 6](https://webdam.di.ens.fr/Alice/pdfs/Chapter-6.pdf#page=24),
§6.4, p. 128, defines semijoin as projection of join and states its
join-preservation identity. The key-set implementation and numeric instance
here are course constructions.
:::

:::ada
Use the scalar iterator contract from 3.2. After building $H$, what does
the first external `next` call do on our numeric $R$?
:::alice
Read `(5,a)`. It fails, so return `None`?
:::

:::ada
What would the caller infer?
:::alice
That the semijoin is exhausted. But 20 is still ahead.
The call must continue internally and return `(20,b)`.
:::

:::ada
Finish the trace.
:::alice
| External call | Keys read internally | Returned result |
|---:|---|---|
| 1 | 5, 20 | `(20,b)` |
| 2 | 30, 40 | `(40,d)` |
| 3 | 90, then child exhaustion | `None` |
| 4 | none | `None` |

After the third call, the semijoin stays done.
:::

:::ada
Write the implementation.
:::alice
```text
open():
    H = exact_set_of_all_keys(S)
    input = open_R()
    done = false

next():
    if done: return None
    loop:
        match input.next():
            None:
                done = true
                return None
            Some(r):
                if H.contains(r.k):
                    return Some(r)
```

Closing releases the input and the table, including if the caller stops
before exhaustion.
:::

:::ada
How many of the five left keys did this avoid reading?
:::alice
None. It read all five and emitted two tuples.

It saved downstream work on the rejected rows. That is already useful,
but it does not establish that the scan read less data.
:::

:::ada
Would push execution make a different result?
:::alice
No. After completing the same build:

```text
for r in R:
    if H.contains(r.k):
        consume(r)
```

The same five membership tests decide the same two survivors.
:::

:::ada
Suppose an exact index on $S.k$ already exists. Must we build $H$ anyway?
:::alice
No. For each left key, ask the index whether it has any matching tuple.
For a semijoin we can stop at the first exact witness.

The full join from 3.3 had to enumerate every witness. This operator only
needs existence.
:::

:::ada
Could ordered inputs support another implementation?
:::alice
Yes. With left keys `5,20,30,40,90` and distinct right keys `20,40`, move
forward through the ordered keys. An equal key retains the left row.

If several different left rows have key 20, each needs to be retained.
We cannot discard the right key after matching the first one.
:::

:::ada
Suppose each left row has many payload columns, and the next operator
can read the same batch. Copying every surviving row into another batch
would move those columns again. Give the five input positions numbers
0 through 4. What smaller object tells the next operator which rows to use?
:::alice
Keep the input batch and a list of surviving positions:

```text
keys:       [5, 20, 30, 40, 90]
keep:       [0,  1,  0,  1,  0]
positions:  [1, 3]
```

The bitmap and position list describe the same survivors. The positions
are relative to this batch, not automatically base-table row IDs.
:::

:::ada
If the next batch has no survivors, is the whole query finished?
:::alice
Only if the input is finished. Our simple `nextBatch` wrapper would keep
searching for a nonempty result batch. A real pipeline can instead return
an empty output with a separate request for more input.
:::

:::reading
**Implementation example.** In
[DuckDB v1.4.0's join hash table](https://github.com/duckdb/duckdb/blob/v1.4.0/src/execution/join_hashtable.cpp),
`NextSemiJoin`, `ScanKeyMatches`, and `NextSemiOrAntiJoin` track exact
matches and construct a selection of left positions. The engine uses
chunk-processing protocols; our scalar `next` is teaching pseudocode.
:::

:::ada
We still read every left key. Suppose storage records a minimum and
maximum for each region. We want to reject a whole region before reading
its keys. Which two numbers from the completed build enclose every
possible matching key?
:::alice
20 and 40. Every match must lie between them, inclusive. A stored region
entirely outside that interval cannot contribute a match.
:::

:::ada
Then replace $H$ by that interval.
:::alice
That keeps 30 too. The interval is useful as a preliminary test, but it
does not compute the exact semijoin.
:::

:::ada
Four stored regions have these recorded ranges. Which can the scan skip
using the runtime interval $[20,40]$?

| Region | Stored minimum and maximum |
|---|---|
| A | $[1,10]$ |
| B | $[20,30]$ |
| C | $[40,45]$ |
| D | $[80,99]$ |
:::alice
A and D. Their ranges are disjoint from the runtime interval.
B and C must still be examined. Overlap does not tell us which actual
keys they contain.
:::

:::definition Runtime range and zone map
A **runtime range filter** summarizes possible keys derived during this
execution. A **zone map** summarizes values stored in a region, commonly
with a minimum and maximum. For runtime range $[l,u]$, a region is safely
rejected by this test when

$$
\begin{gathered}
\operatorname{region.max}<l\\
\text{or}\quad\operatorname{region.min}>u.
\end{gathered}
$$

Rejection can avoid scanning and decoding that region. Actual physical I/O
savings also depend on caching, prefetching, and storage layout.
:::

:::ada
Our exact keys remain $\{20,40\}$. A region's range is $[21,39]$.
Can the interval-overlap test reject it?
:::alice
It contains neither exact key, so I want to say yes.

But its interval overlaps $[20,40]$. That particular test cannot reject
it. We need stronger evidence, such as checking the exact key set against
the region's range, or reading and testing individual keys.
:::

:::reading
**Storage example.** The version-pinned
[DuckDB row-group implementation](https://github.com/duckdb/duckdb/blob/v1.4.0/src/storage/table/row_group.cpp)
contains `CheckZonemap`, `CheckZonemapSegments`, and cursor advancement
through `NextVector`. The four miniature regions above illustrate the
condition; they do not specify DuckDB's actual region sizes.
:::

:::ada
An exact support set could be large. Suppose we want a compact summary
to pass to another scan, while keeping the exact join later. Which
mistake can that preliminary test afford?
:::alice
Keeping an extra candidate costs work, but the exact join can reject it.
Rejecting a real match loses an answer that the later join cannot recover.
:::

:::ada
Try a tiny summary with three bits, initially zero. To insert a key $k$,
set bit $k\bmod3$. Insert 20 and 40. What can the summary tell us about
left keys 5, 30, and 40?
:::alice
The bits at positions 0, 1, 2 become `[0,1,1]`.

| Probe key | Bit position | What the bit establishes |
|---:|---:|---|
| 5 | 2 | maybe; 20 set the same bit |
| 30 | 0 | absent; an inserted 30 would have set it |
| 40 | 1 | maybe; the exact set confirms it |

So 5 is a false positive. Passing this test is not enough to emit `(5,a)`.
:::

:::ada
That is a one-hash example of a **Bloom filter**. The usual construction
sets several hash-selected bits per key. Why does any required zero bit
still prove absence?
:::alice
Inserting the key would have set every one of those bits. A zero rules
out insertion. If all are one, other keys may have set them.

That argument requires the same hashing and key interpretation when
building and probing the filter.
:::

:::ada
Could we build the filter from just the first $S$ tuple, key 20, and
immediately reject left key 40?
:::alice
No. Key 40 is still coming. A negative result about an incomplete key set
does not prove absence from the complete build input.

This schedule needs the completed build before it uses negative answers.
:::

:::ada
Suppose a zone map records a region's minimum and maximum. Both fail a
Bloom test. Does that reject every value between them?
:::alice
No. Bloom hashing has no such order property. An interior key may pass,
including because it really occurs in the build set.

Range evidence and membership evidence support different conclusions.
:::

:::ada
Could the restriction learned from $A$ help a later $C$ scan before
performing the full join $A(a)\bowtie B(a,b)\bowtie C(b)$?
Let $A(a)=\{20,40\}$ and

$$
B(a,b)=\{(20,7),(30,9),(40,8)\}.
$$

Can we send those $a$ values directly to $C$, or must $B$ do something first?
:::alice
First retain `(20,7)` and `(40,8)` in $B$. Then send $\{7,8\}$ in the
$b$ domain.

We had to read the relationship in $B$. Relabeling $\{20,40\}$ as a
set of $b$ values would be wrong.
:::

:::reading
**Paper connection.** Yang et al.,
[Predicate Transfer](https://www.vldb.org/cidrdb/papers/2024/p22-yang.pdf),
§§2.1 and 3, studies approximate filtering across joins. Our displayed
chain uses exact sets so every step can be checked. Approximate filters
can leave extra candidates and do not establish a full semijoin reduction.
:::

:::ada
What happened to the stored rows rejected by any of these operators?
:::alice
They remain in the database. We changed which rows this execution passes
forward, or which stored regions it visits. We did not execute a deletion.
:::

:::recap Physical support
An exact semijoin tests whether the complete shared key has a witness on
the right, retaining each qualifying left tuple. A key set, an existing
index, or ordered access can implement that test. A result may be carried
as tuples, row references, selected batch positions, or a bitmap with its
backing data.

Rejecting a tuple avoids emitting it. Avoiding a stored region requires
evidence available inside the scan. Conservative range or Bloom filters
may retain false positives, so exact matching remains necessary. The
filter's construction, completion, and key semantics determine whether its
negative answers are safe. These choices change work and representation
while preserving the same semijoin relation.
:::
