---
title: The Order Logic Did Not Choose
subtitle: Conversation 2.1 — From Equivalent Plans to Intermediate Work
author: Modern Query Processing
date: Fall 2026
layout: dialogue
left_speaker: Ada
right_speaker: Alice
previous: [Conversation 1.3 · The Plan That Meant the Same Thing](03-the-plan-that-meant-the-same-thing.html)
next: [Conversation 2.2 · The Picture That Did Not Choose](04-the-picture-that-did-not-choose.html)
---

# The order logic did not choose

:::ada
Before choosing an algebraic tree, consider a delivery service. These are its
recorded facts:

![Drivers report to depots, depots stock items, and jobs need items.](assets/04-delivery-problem.svg "The delivery-service facts.")

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
For each driver, find the driver's depot, then the item stocked there, and
finally the jobs needing that item. Lin and Moe reach `job1` and `job2` through
`north` and `bolt`; Nia and Omar reach `job3` and `job4` through `south` and
`nut`.
:::

:::ada
How would you organize the reasoning starting from the jobs?
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

Throughout this conversation, each displayed body-join tree is followed by the
query's common head projection. We compare the body-join trees because that
projection is identical for both orders.

Translate the driver-first reasoning into relational algebra. How many tuples
does each join produce on this instance?
:::alice
The expression is

$$
(D\bowtie S)\bowtie N.
$$

The first join produces four `(driver, depot, item)` tuples: one stocked item
for each driver. Joining `needs` produces eight complete valuations. Its
join-output sizes are `4, 8`.
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
Before translating the third method, which shared variable could the natural
join of `D` and `N` require agreement on?
:::alice
None. `D` contains `{driver, depot}`, while `N` contains `{job, item}`. The
`stocks` atom `S` is the only atom connecting `depot` to `item`.
:::

:::ada
With no shared variable, what does the natural join of `D` and `N` produce on
this instance?
:::alice
It produces their Cartesian product: every one of the four `D` tuples combines
with every one of the four `N` tuples, giving sixteen tuples.
:::

:::ada
Now write the complete expression.
:::alice
It is

$$
(D\times N)\bowtie S.
$$

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

:::ada
The output of a nonfinal expression is called an **intermediate relation**.
After the common head projection, all three body-join trees return the same
eight answers. Why should we care that this one first produced sixteen tuples?
:::alice
Because the final join must receive and check all sixteen candidates against
`stocks`. Eight were constructed and carried forward only to be rejected.

In \((D\bowtie S)\bowtie N\), `stocks` is checked earlier. Only four supported
`(driver, depot, item)` tuples reach the final join, which extends them into
eight complete valuations.
:::

:::reading
**Book terminology.** Abiteboul, Hull, and Vianu, *Foundations of Databases*,
Chapter 6, §6.1, pp. 109–110, treats the outputs of internal expression-tree
nodes as intermediate results or intermediate relations.
:::

:::definition Logical row-volume proxy (course approximation)
For a logical body-join plan \(P\) and input instance \(I\), let
\(\operatorname{CombineNodes}(P)\) contain its natural-join and Cartesian-
product expression nodes, and define

$$
W_0(P,I)=
\sum_{M\in\operatorname{CombineNodes}(P)}
|[\![M]\!]_I|.
$$

This proxy counts tuples produced by the binary combine nodes. It does not count
relation leaves or the common head projection.
:::

:::reading
**Course approximation; book basis.** Abiteboul, Hull, and Vianu,
*Foundations of Databases*, Chapter 6, §6.1, pp. 112–114, uses expected
intermediate sizes to motivate join-order heuristics. The formula \(W_0\) is a
course proxy derived from that motivation; it is not a formula stated in the
book.
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
Return to `eligible`, but change only its input instance. Suppose `D`, `S`, and
`N` each contain three tuples. Both possible first joins share a variable and
add an attribute. Must their first outputs therefore have the same cardinality?
:::alice
I would expect so. With three tuples on each side, perhaps each first join also
produces three tuples.
:::

:::ada
Here is the instance:

```text
based_at               stocks              needs
(Lin, north)            (north, bolt)       (job1, bolt)
(Moe, north)            (north, screw)      (job2, bolt)
(Nia, south)            (south, nut)        (job3, nut)
```

Trace `D` joined with `S` one shared `depot` value at a time.
:::alice
For `north`, two drivers agree with two stocked items, producing four tuples.
For `south`, one driver agrees with one stocked item, producing one more. Thus
`D` joined with `S` produces five tuples:

```text
(Lin, north, bolt)
(Lin, north, screw)
(Moe, north, bolt)
(Moe, north, screw)
(Nia, south, nut)
```
:::

:::ada
Now trace `S` joined with `N` by `item`.
:::alice
`bolt` produces two tuples, `screw` produces none, and `nut` produces one. Thus
`S` joined with `N` produces three tuples:

```text
(north, bolt, job1)
(north, bolt, job2)
(south, nut, job3)
```
:::

:::ada
After the common head projection, both body-join trees return five driver–job
pairs. Compare their logical row volumes.
:::alice
The driver-first plan has join-output sizes `5, 5`, so \(W_0=10\). The job-first
plan has sizes `3, 5`, so \(W_0=8\).

All three input relations had cardinality three, but the first joins had
cardinalities five and three. Join cardinality depends on how many tuples agree
at each shared value, not only on the input relation sizes.
:::

:::ada
The ordinary first joins above both added attributes. Now change the query;
`approved` uses only a variable already present in `handles`:

```text
approved_task(person, task) :-
    member(person, team),
    handles(team, task),
    approved(task).
```

Its instance is

```text
member                 handles              approved
(Ana, red)              (red, build)         (build)
(Ben, red)              (red, test)          (ship)
(Cy, blue)              (blue, ship)
```

Which `handles` tuple has no matching `approved` fact?
:::alice
`(red, test)`. The `approved` relation contains `build` and `ship`, but not
`test`.
:::

:::ada
If `member` joins `handles` before that tuple is removed, how many tuples reach
the final `approved` join?
:::alice
Five:

```text
(Ana, red, build)
(Ana, red, test)
(Ben, red, build)
(Ben, red, test)
(Cy, blue, ship)
```

The unapproved `test` tuple has combined with both red-team members.
:::

:::ada
Instead join `handles` with `approved` first. What reaches the `member` join?
:::alice
Only the two supported tuples:

```text
(red, build)
(blue, ship)
```
:::

:::ada
After the common head projection, both body-join trees return `(Ana, build)`,
`(Ben, build)`, and `(Cy, ship)`. Compare their logical row volumes.
:::alice
Joining `member` with `handles` first gives sizes `5, 3`, so \(W_0=8\).
Joining `handles` with `approved` first gives sizes `2, 3`, so \(W_0=5\).
The second plan removes `(red, test)` before it can expand into two tuples.
:::

:::definition Semijoin prefilter
For a relation \(I\) over schema \(R\) and a relation \(J\), the semijoin

$$
I\ltimes J=\pi_R(I\bowtie J)
$$

keeps the schema of \(I\) and removes its tuples that have no match in \(J\).
Because `approved(task)` adds no variable to `handles(team, task)`, the natural
join `handles` \(\bowtie\) `approved` already has the schema of `handles` and has
this semijoin filtering effect. Here it acts as a prefilter before `handles`
meets `member`.
:::

:::reading
**Book definition and course application.** Abiteboul, Hull, and Vianu,
[*Foundations of Databases*, Chapter 6](http://webdam.inria.fr/Alice/pdfs/Chapter-6.pdf),
§6.4, p. 128, defines semijoin as projection of a join back to the left relation's
schema and motivates it by removing tuples that cannot contribute to the full
join. **Prefilter** describes its role in this example.
:::


:::recap Three join-order effects
After the common head projection, each pair of body-join trees below returns the
same final relation. The order changes which complete valuations are produced
before that projection.

| First-step situation | Comparison on the observed instance | Effect of the order |
|---|---|---|
| No shared variable | `D` joined with `S`: `4, 8`, \(W_0=12\); `D` times `N`: `16, 8`, \(W_0=24\) | With no agreement to check, the first step creates a Cartesian intermediate. |
| Shared variables and both joins add attributes | `D` joined with `S`: `5, 5`, \(W_0=10\); `S` joined with `N`: `3, 5`, \(W_0=8\) | Equal input sizes can still produce different join cardinalities because shared values occur with different frequencies. |
| Shared variable and the right side adds no attribute | `member` joined with `handles`: `5, 3`, \(W_0=8\); `handles` filtered by `approved`: `2, 3`, \(W_0=5\) | The semijoin prefilter removes `(red, test)` before it expands across two members. |
:::
