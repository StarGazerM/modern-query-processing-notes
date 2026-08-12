---
title: By Indirections Find Directions Out
subtitle: Conversation 1.2 — From Ground Claims to Query Images
author: Modern Query Processing
date: Fall 2026
status: Work in progress
layout: dialogue
left_speaker: Ada
right_speaker: Alice
previous: [Conversation 1.1 · What's in a Name?](01-a-little-database-a-few-questions.html)
---

# By indirections find directions out

:::qa
In the instance `I` above, is this statement true?

```text
road("Logan", "Salt Lake City")
```
:::answer
Yes. It is a membership check against `I(road)`.
:::


:::qa
```text
road("Logan", "Provo")
```
:::answer
False. The statement asks for one tuple in `I(road)`. It does not ask whether
Provo can be reached by following several stored roads. Under the closed-world
assumption, the absent tuple gives us a negative answer.
:::

:::qa
Consider another database instance `J`. It agrees with `I` on `road_length`;
only its `road` relation changes:

```text
J(road) = {
    ("Logan", "Salt Lake City"),
    ("Logan", "Garden City"),
    ("Garden City", "Logan"),
    ("Salt Lake City", "Provo"),
    ("Logan", "Provo")
}
```

Is `road("Logan", "Provo")` true in `J`?
:::answer
Yes. We kept the statement fixed and changed the instance in which we tested
it.
:::

:::qa
```text
road("Logan", to)
```
:::answer
What is `to`? This seems to do more than evaluate a membership predicate.
:::

:::qa
It is a **relational atom**. Here, `to` is a **logical variable**: it represents
a not-yet-identified value in our known closed world. The first argument is the
known value `"Logan"`; we say that this argument is **ground**.
:::answer
Okay. This seems complicated, but useful. It looks like an intuitive way to
represent “all cities `to` for which Logan has a road to `to`.”
:::

:::definition Relational atom and ground atom
For a relation name $r$ of arity $n$, an expression

$$
r(t_1, \ldots, t_n)
$$

is a **relational atom**. Each $t_i$ is a term for the corresponding tuple
position: either a data literal denoting a value, or a logical variable.

An atom containing no variables is **ground**.
:::

:::definition Closed-world assumption
Let \(\Sigma\) be a set of sentences describing a database instance. The
**closed-world assumption** adds the inference rule

$$
\frac{\Sigma \not\vdash R(\vec a)}
     {\Sigma \vdash \neg R(\vec a)}.
$$

If \(R(\vec a)\) cannot be proved from \(\Sigma\) using conventional
first-order logic, infer \(\neg R(\vec a)\).
:::

:::alice
Chapter 2, Section 2.3, p. 27 - the closed-world assumption as an inference
rule.
:::

:::qa
Then give me all values of `to` such that Logan has a road to `to` in instance
`J`.
:::answer
```text
{"Salt Lake City", "Garden City", "Provo"}
```
:::


:::qa
The Garden City answer produced this ground atom:

```text
road("Logan", "Garden City")
```

Database researchers compress that claim to

$$
J \models road(\text{"Logan"}, \text{"Garden City"}).
$$

:::answer
So \(\models\) says that this ground atom is true in `J`.
:::

:::definition Satisfaction of a ground atom
For a ground relational atom,

$$
I \models r(a_1, \ldots, a_n)
$$

exactly when $(a_1, \ldots, a_n) \in I(r)$.

We read this as “$I$ satisfies the atom.” Because a ground atom contains no
variables, no valuation is needed.
:::

:::qa
Now let `to` name Ogden, what changes?
:::answer
The choice produces `road("Logan", "Ogden")`, which is false in `J` because its
tuple is absent from `J(road)`. The choice determines a candidate ground atom;
the instance determines whether that atom is true.
:::

:::qa
We call this assignment a **valuation**, written:

```
to -> "Ogden"
```
:::answer
Another term! Database researchers love strange terms.
:::

:::definition Valuation and satisfaction of an atom
A **valuation** assigns each logical variable in an expression one value of the
appropriate type. Every occurrence of the same variable receives the same
value, while data literals remain unchanged. Applying a valuation to a
relational atom therefore produces a ground atom.

For a relational atom $r(t_1,\ldots,t_n)$ and a valuation $v$, we write

$$
I \models r(t_1,\ldots,t_n)[v]
$$

exactly when

$$
v(t_1,\ldots,t_n) \in I(r).
$$

In words, $I$ satisfies the atom under $v$ exactly when applying $v$ produces a
tuple in $I(r)$. Satisfaction of a ground atom is the special case in which
there are no variables for $v$ to replace.
:::

:::alice
Chapter 2, Section 2.3, p. 24 - satisfaction under a variable assignment;
Chapter 4, pp. 41 and 46 - valuations, tuple membership, and satisfaction of a
relational atom in a database instance.
:::

:::qa
```text
road("Logan", via),
road(via, "Provo")
```

These two atoms share the logical variable `via`. What does that mean?


:::answer
`I` does not contain a direct road from Logan to Provo. Yet its stored roads
lead there through Salt Lake City. This expression is meant to find that
indirect route.
:::

:::qa
Try this valuation in `I`:

```text
via -> "Salt Lake City"
```

Are both atoms true _at the same time_?
:::answer
Yes. They become

```text
road("Logan", "Salt Lake City"),
road("Salt Lake City", "Provo")
```

Both tuples belong to `I(road)` at the same time. So the comma appears to mean “and.”
:::

:::qa
Now test the same two atoms in `J` with

```text
via -> "Garden City"
```

Are both atoms true _at the same time_?
:::answer
No. `road("Logan", "Garden City")` is true in `J`, but
`road("Garden City", "Provo")` is false there.
:::

:::definition Conjunction
A **conjunction** is a collection of statements joined by logical “and.”

A conjunction of relational atoms is satisfied in an instance under a valuation
exactly when every atom is satisfied there under the same valuation:

$$
I \models (A_1 \land \cdots \land A_m)[v]
\quad\text{exactly when}\quad
I \models A_i[v]\text{ for every }i.
$$

In our rule notation, a comma denotes this “and.”
:::

:::qa
Have we written a query yet?
:::answer
Not yet. We know when this conjunction is true under one valuation, but we have
not said which values should become an answer relation.
:::

:::recap What the database can make true
For a relational atom $r(t_1,\ldots,t_n)$ and a valuation $v$, satisfaction is
tuple membership after applying the valuation:
$$
I\models r(t_1,\ldots,t_n)[v]
\quad\text{exactly when}\quad
v(t_1,\ldots,t_n)\in I(r).
$$
A valuation $v$ assigns each logical variable one value of the required type,
consistently across all its occurrences; it leaves data literals unchanged.
For a ground atom, no valuation needs to be written. If a tuple is absent from
$I(r)$, the corresponding ground atom is false in the fixed instance $I$. When
a positive theory $\Sigma$ describes a database,
the closed-world assumption additionally permits failure to prove
$r(\vec a)$ from $\Sigma$ to license inferring $\neg r(\vec a)$. It does not
establish falsity in the physical world.

For relational atoms $A_1,\ldots,A_m$, one valuation must make every atom in
a conjunction true at the same time:

$$
I \models (A_1 \land \cdots \land A_m)[v]
\quad\text{exactly when}\quad
I \models A_i[v]\text{ for every }i.
$$

This tells us whether the conjunction succeeds. It does not yet say which
values an answer should retain.
:::

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
