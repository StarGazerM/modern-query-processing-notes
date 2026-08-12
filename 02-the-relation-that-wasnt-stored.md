---
title: The Relation That Wasn't Stored
subtitle: Conversation 1.2 — From a Pattern to a Query
author: Modern Query Processing
date: Fall 2026
status: Work in progress
layout: dialogue
left_speaker: Ada
right_speaker: Alice
previous: [Conversation 1.1 · The Database Itself](01-a-little-database-a-few-questions.html)
---

# From a pattern to a query

:::qa
We ended with this conjunction:

```text
road("Logan", via),
road(via, "Provo")
```

It fixes the two endpoints. How could the same two-road pattern range over
every possible pair?
:::answer
I can replace the two fixed city names with logical variables:

```text
road(from, via),
road(via, to)
```

Now a valuation chooses all three cities. The conjunction succeeds when both
atoms are true in the input instance under that one valuation.
:::

:::qa
Use the relevant part of the same input instance:

```text
J(road) = {
    ("Logan", "Salt Lake City"),
    ("Logan", "Garden City"),
    ("Garden City", "Logan"),
    ("Salt Lake City", "Provo"),
    ("Logan", "Provo")
}
```

Which ordered pairs of cities are connected by two roads in `J`?
:::answer
```text
{
    ("Logan", "Provo"),                   // via Salt Lake City
    ("Logan", "Logan"),                   // via Garden City
    ("Garden City", "Salt Lake City"),   // via Logan
    ("Garden City", "Garden City"),      // via Logan
    ("Garden City", "Provo")             // via Logan
}
```
:::

:::qa
How do we store these routes in the database?
:::answer

```text
relation two_hop(City, City);
```

But we cannot simply assign an arbitrary relation instance to it. If I write

```text
J(two_hop) = {
    ...,
    ("Logan", "Logon")
}
```

then `two_hop` no longer means “cities connected by two stored roads.” Its name
has lost its meaning.
:::

:::qa
The trick is that we do not supply `J(two_hop)` as part of database instance
`J`. Instead, we let it be determined by `J(road)`. We write

```text
two_hop(from, to) :-
    road(from, via),
    road(via, to).
```
:::answer
What does `:-` mean?
:::

:::qa
Read `:-` as “if”:

```text
two_hop(from, to) if
    road(from, via) and
    road(via, to)
```
:::answer
I understand the condition after “if”: one road goes from `from` to `via`, and
another goes from that same `via` to `to`.

But what does `two_hop(from, to)` do before `:-`?
:::

:::qa
Whenever one valuation makes both `road` atoms true, the values assigned to
`from` and `to` form a tuple in the answer relation named `two_hop`.

We call `two_hop(from, to)` the **head** of the rule and the conjunction after
`:-` its **body**.
:::answer
So `via` helps the body succeed, but it does not appear in the answer tuple.
:::

:::qa
Exactly. The body determines which valuations succeed; the head determines
which values they contribute to the answer, and in what order.

Now try this head:

```text
two_hop(from, destination)
```

:::answer
That cannot work. The body never assigns a value to `destination`, so it cannot
produce the requested answer tuple.

Every variable in the head must also occur in the body.
:::

:::qa
Exactly. The head asked for a value that the body could never supply. We can
detect that mistake by reading the rule, before looking at any database
instance.

This is the rule's **safety guard**: every variable requested by the head must
be supplied by the body.
:::answer
Then safety is a property of the written rule, not a property of `J`.
:::

:::definition Rule-based conjunctive query
Let \(\mathcal R\) be an input database schema. A **rule-based conjunctive
query** \(q\) over \(\mathcal R\), in the general mathematical form, is a
syntactic expression of the form

```text
ans(u) :-
    R1(u1),
    ...,
    Rn(un).
```

Here \(n\geq 0\), and:

1. every body relation name \(R_i\) belongs to \(\mathcal R\);
2. the head relation name `ans` does **not** belong to \(\mathcal R\);
3. \(u,u_1,\ldots,u_n\) are tuples of variables or constants with the appropriate arities; and
4. every variable occurring in \(u\) also occurs in the body.

The last condition is the safety guard. A rule that satisfies it is **range
restricted**. The set of variables occurring in \(q\) is written \(var(q)\).

The body relation names belong to the input schema. The head identifies a
separate output relation schema.
:::

:::qa
Let \(q\) name the complete rule we have written.
:::answer
Is \(q\) another part of database instance `J`?
:::

:::qa
No. `J` supplies relation instances such as `J(road)`. The rule \(q\) is a
written expression that we interpret over `J`.
:::answer
Then what does \(q\) tell us about `J`?
:::

:::qa
For each pair of cities `(from, to)`, \(q\) asks whether there is some city
`via` for which

```text
road(from, via),
road(via, to)
```

is true in `J`.
:::answer
When we collect every pair with that property, do we add those pairs to `J`?
:::

:::qa
No. Evaluating \(q\) does not change `J`. The pairs form a separate result
relation.
:::answer
Is that result a relation instance in the same sense as `J(road)`?
:::

:::qa
Yes. Both are finite sets of tuples. Their roles differ: `J(road)` is supplied
as input, while the other relation is computed by applying \(q\) to `J`.

We write that result as \(q(J)\) and call it the **image of `J` under \(q\)**.
:::answer
So \(q\) is the query, `J` is its input, and \(q(J)\) is its result relation.
:::

:::definition Query and image
A **query** \(q\) is a syntactic object interpreted over database instances.
For the rule above and an input instance \(I\) over \(\mathcal R\), the
**image of \(I\) under \(q\)** is

$$
q(I)=
\left\{
v(u)
\;\middle|\;
v\text{ is a valuation over }var(q)
\text{ and }v(u_i)\in I(R_i)\text{ for every }i
\right\}.
$$

The head determines an output relation schema separate from \(\mathcal R\), and
\(q(I)\) is an instance of that output schema. Range restriction ensures that
every value in an output tuple comes from the finite input instance or from a
constant written in the query, so \(q(I)\) is finite.
:::

:::definition Extension and intension
The input instance supplies the contents, or **extensions**, of the body
relations. They are therefore called **extensional relations**.

The head relation is not stored in the input instance. Its value is computed on
request, and the rule supplies its **intension**, or definition. It is therefore
called an **intensional relation**.
:::

:::alice
Definition 4.2.1, p. 41 - rule-based conjunctive-query syntax; p. 41 - its image;
pp. 41-42 - extensional body relations and an intensional head relation.
:::

:::recap The relation that was not stored
Let \(\mathcal R\) be an input database schema. A rule-based conjunctive query
\(q\) over \(\mathcal R\) has the form

```text
ans(u) :-
    R1(u1),
    ...,
    Rn(un).
```

Every body relation name belongs to \(\mathcal R\); the head relation name
`ans` does not. Every head variable occurs in the body; this safety guard makes
the rule range restricted.

For an input instance \(I\) over \(\mathcal R\),

$$
q(I)=
\left\{
v(u)
\;\middle|\;
v\text{ is a valuation over }var(q)
\text{ and }v(u_i)\in I(R_i)\text{ for every }i
\right\}.
$$

The input instance supplies the extensions of the body relations. A successful
valuation contributes its head tuple to the separate result relation \(q(I)\),
the **image of \(I\) under \(q\)**. The rule gives the intension of that result
relation.

Evaluating \(q\) describes a property of \(I\) and produces \(q(I)\). It does
not add tuples to or remove tuples from \(I\).
:::
