---
title: A Little Database, A Bit Rustic
subtitle: Conversation 1.1 — Not Ideas About the Database but the Database Itself
author: Modern Query Processing
date: Fall 2026
left_speaker: Ada
right_speaker: Alice
---

# Before the first query

> After Wallace Stevens's [“Not Ideas About the Thing But the Thing
> Itself”](https://poets.org/poem/not-ideas-about-thing-thing-itself).

:::qa
what is mini-linq?
:::answer
I don't know.
:::

:::qa
It a database query language, I will teach you what it is and how to build.

What is a database?
:::answer
My first guess is: software that stores and manages data on a computer.
:::

:::qa
Keep that guess. Before we decide whether a database is data or software, what
is data?
:::answer
I use the word every day, but it is hard to say. Perhaps data is information
stored on a computer.
:::

:::qa
Is a file on a disk data?
:::answer
Yes.
:::

:::qa
Is a spreadsheet cell data?
:::answer
Yes.
:::

:::qa
Suppose Rust evaluates `("Logan", "Salt Lake City")`. Can the resulting tuple
be data?
:::answer
Yes.
:::

:::qa
```rust
type City = &'static str;
type Road = (City, City);
```
Is `Road` data?

:::answer
What is `&'static str`? Isn't a city name a `String`?
:::

:::qa
A string literal such as `"Logan"` already has type `&'static str`: it is a
reference to text that remains valid for the entire program. It is not a
`String`.

We need only this fact now; we will return to borrowing later.

Now, again, is `Road` data?
:::answer
No. It seems to name a kind of value rather than create a value.
:::

:::qa
Is
```rust
let road: Road = (
    "Logan",
    "Salt Lake City",
);
```
data?
:::answer
The line is code, but the tuple it creates—the two city names—looks like data.

Then perhaps `Road` is the set of all such data?
:::

:::qa
Not quite. `Road` is a **type**. A type describes a decidable property of
values.

Here, Rust can decide whether a value has the shape required by `Road`: a pair
of `City` values. Because `City` is only an alias for `&'static str`, this
currently means a pair of static string references.

Do both of these statements compile?

```rust
let apple_slc: Road =
    ("Apple", "Salt Lake City");
let apple_banana: Road =
    ("Apple", "Banana");
```
:::answer
Yes. Rust even accepts Apple to Banana. So the type is checking their shape,
not whether they describe roads?
:::

:::qa
Exactly. `Road` decides their Rust shape; it does not record either tuple.

How can we store the exact roads and test candidates without answering your
hundred “Is this a road?” questions one at a time?
:::answer
Perhaps with a `HashSet` and a named function:

```rust
use std::collections::HashSet;

let roads = HashSet::from([
    ("Logan", "Salt Lake City"),
    ("Salt Lake City", "Provo"),
]);

fn is_road(
    roads: HashSet<Road>,
    road: Road,
) -> bool {
    roads.contains(&road)
}
```

Then I can ask:

```rust
is_road(
    roads,
    ("Logan", "Salt Lake City"),
)
```
:::

:::qa
Start with a freshly recreated `roads`, then ask the same question twice:

```rust
is_road(
    roads,
    ("Logan", "Salt Lake City"),
);
is_road(
    roads,
    ("Logan", "Salt Lake City"),
);
```
:::answer
Ahhh, Rust fails me. I expected two `true` answers, but the second call says
`value moved here`.
:::

:::qa
The problem is ownership, not road membership. A `HashSet<Road>` is not
`Copy`. Passing `roads` by value moves its ownership into the first call, so
the caller cannot use the same binding again.

Did the first call add or remove a tuple?
:::answer
No. The members did not change. I only lost the caller's `roads` binding.
:::

:::qa
The function needs permission to inspect the set, not ownership of it. Replace
only the first parameter:

```rust
fn is_road(
    roads: &HashSet<Road>,
    road: Road,
) -> bool {
    roads.contains(&road)
}
```

What does the new parameter type ask the caller to supply?
:::answer
A reference to the stored set instead of the set itself.
:::

:::qa
Can we keep the old call?

```rust
is_road(
    roads,
    ("Logan", "Salt Lake City"),
)
```
:::answer
No. The function expects `&HashSet<Road>`, so perhaps I need to write
`&roads` at the call.
:::

:::qa
Then can we ask twice this way?

```rust
is_road(
    &roads,
    ("Logan", "Salt Lake City"),
);
is_road(
    &roads,
    ("Logan", "Salt Lake City"),
);
```
:::answer
Yes. Both calls return `true`, and I can still use `roads` afterward.
:::

:::qa
Good. Evaluating `&roads` **borrows** the stored set and produces a shared
reference. The caller keeps ownership. I still owe you the fuller story of
ownership and borrowing.

There is another reference inside the function:

```rust
roads.contains(&road)
```

Does `&road` borrow the stored set again?
:::answer
No. This `&` is attached to `road`, not `roads`. It must refer to the candidate.
:::

:::qa
Right. `&roads` borrows the stored set for `is_road`; `&road` borrows the local
candidate for `contains`.

For the next few questions, the surrounding discussion keeps `roads` fixed.
We will abbreviate

```rust
is_road(&roads, candidate)
```

as

```text
is_road(candidate)
```

Which argument did we hide?
:::answer
`&roads`.
:::

:::qa
Using that shorthand, what does this call return?
```text
is_road(("Logan", "Provo"))
```
:::answer
`false`.

But we all know that there is a two-road route from Logan to Provo. Why does
`is_road` say `false`?
:::

:::qa
The tuple `("Logan", "Provo")` is not stored in `roads`.

Is testing one stored road the same question as testing whether two roads form
a route?
:::answer
No. `is_road` tests direct membership. Two-road reachability is a different
question.
:::

:::qa
Good. Keep the two-road question; we will return to it after we understand what
`roads` is.

How many values does this `HashSet` contain?

```rust
HashSet::<Road>::from([
    ("Logan", "Salt Lake City"),
    ("Logan", "Salt Lake City"),
])
```
:::answer
One. It is a **set**. I know this one.
:::

:::qa
`roads` is a set, and every member is an ordered pair. Mathematics calls a set
of ordered pairs a binary **relation**.

Is the relation `roads` one road tuple?
:::answer
No. A tuple is one member; the relation is the whole set of members.
:::

:::qa
For fixed `roads`, what does

```text
is_road(candidate)
```

decide?
:::answer
Whether `candidate` is a member of the relation `roads`.
:::

:::qa
A true-or-false test of relation membership is a **membership predicate**.

Does `is_road` store any road data in addition to `roads`?
:::answer
No. If I know `roads`, I can predict every answer that `is_road` will give.
:::

:::alice
Chapter 3, Section 3.3, p. 32 - the finite-set-of-tuples view. We will add the
schema-instance distinction next.
:::

:::qa
Now compare:
```rust
let roads_today: HashSet<Road> =
    HashSet::from([
        ("Logan", "Salt Lake City"),
        ("Salt Lake City", "Provo"),
    ]);

let roads_tomorrow: HashSet<Road> =
    HashSet::from([
        ("Logan", "Salt Lake City"),
        ("Salt Lake City", "Provo"),
        ("Logan", "Provo"),
    ]);
```

Do they have the same **type**?
:::answer
Yes. Both have type `HashSet<Road>`.
:::

:::qa
Do they contain the same road tuples?
:::answer
No. `roads_tomorrow` contains one more tuple.
:::

:::notation Reading the MiniLinq declaration
```text
relation road(City, City);
```

`road` is the logical relation name. The two entries inside the parentheses
are its ordered column types. Their number, two, is the relation's **arity**.
It is not the number of tuples stored in a particular instance.

MiniLinq borrows this declaration shape from
[Ascent](https://docs.rs/crate/ascent/latest). In MiniLinq, a declared relation
is supplied by the Rust caller; the declaration itself inserts no tuples.
:::

:::alice
Chapter 3, p. 31 - relation names and arity.
:::

:::qa
Does this Rust alias also declare the logical relation name `road`?

```rust
type Road = (City, City);
```
:::answer
No. `Road` gives the host-language shape of one row; it does not create a
logical relation named `road`.
:::

:::qa
Now test a new candidate.

```rust
let no_roads: HashSet<Road> =
    HashSet::new();
```

Can the empty set be a relation instance over `relation road(City, City);`?
:::answer
Yes. It is finite, and it contains no tuple of the wrong shape.

It is a perfectly legal relation instance—just a disappointing travel guide.
:::

:::qa
What about this one?

```rust
let strange_roads: HashSet<Road> =
    HashSet::from([
        ("Apple", "Banana"),
    ]);
```

Is it a relation instance over `relation road(City, City);`?
:::answer
Yes. It is a finite set of tuples containing two `City` values.

The stored claim may be nonsense. Membership in an instance does not by itself
certify geography; Rust has not earned that degree.
:::

:::qa
Is this a relation instance over `relation road(City, City);`?

```text
{
    (
        "Logan",
        "Salt Lake City",
        "Provo"
    )
}
```
:::answer
No. Its only tuple has three positions, while the declaration has two column
types.
:::

:::qa
Does the MiniLinq declaration reject this tuple?

```text
("Logan", 42)
```
:::answer
Yes. Its second position must have type `City`, but `42` is an integer. The
declaration and the Rust alias now agree on both the arity and the two column
types.
:::

:::qa
We can now name the distinction.

The relation name together with its ordered column types,
`relation road(City, City);`, is a **relation schema** in our MiniLinq
notation. Each current finite set of matching tuples is a **relation instance**
over that schema.

Between `roads_today` and `roads_tomorrow`, which one changed: the schema or
the instance?
:::answer
The instance changed. The schema remained `relation road(City, City);`.
:::

:::qa
Then how can we decide whether a new finite set `S` is a relation instance
over `relation road(City, City);`?
:::answer
Check two things:

1. `S` is a finite set.
2. Every tuple in `S` has two positions, both containing `City` values.

In this example, the Rust type `HashSet<Road>` enforces exactly that host-side
row shape before MiniLinq ever sees the instance.
:::

:::alice
Chapter 3, Section 3.1, pp. 29-31, and Section 3.3, p. 32 - schema, instance,
and the type-value analogy.
:::

:::qa
Let `I` name today's database state.

```text
I:
    road -> {
        ("Logan", "Salt Lake City"),
        ("Salt Lake City", "Provo")
    }
```

Is `I` another road tuple?
:::answer
No. `I` assigns a set of tuples to the relation name `road`.
:::

:::qa
We will abbreviate the same assignment as:

```text
I(road) = roads_today
```

Is this a Rust function call?
:::answer
No. It is mathematical notation: ask the database instance `I` which relation
instance belongs to the name `road`.
:::

:::qa
Our database schema has only `relation road(City, City);`. What, then, is the
whole database instance?
:::answer
`I`. It supplies the current content of `road`.
:::

:::qa
Is `I` an instruction that the computer can execute?
:::answer
No. `I` only describes which tuples are stored.
:::

:::qa
Something must store those tuples, look them up, and change them.

Is that something more data, or is it software?
:::answer
Software.
:::

:::qa
The stored data is the **database**. The software that supports managing it is
a **database management system**, or **DBMS**.

What was wrong with our first answer?
:::answer
It called the software a database. The software is the DBMS; the stored data is
the database.
:::

:::qa
Have we built a DBMS merely by writing down `I`?
:::answer
No. We have described one database instance.
:::

:::alice
Chapter 1, p. 3 - the distinction between a database and a DBMS.
:::

:::qa
Return to `I`.

```text
I(road) = {
    ("Logan", "Salt Lake City"),
    ("Salt Lake City", "Provo")
}
```

Is this statement true in `I`?

```text
road("Logan", "Salt Lake City")
```
:::answer
Yes. Its tuple belongs to `I(road)`.
:::

:::qa
Reverse the two cities.

```text
road("Salt Lake City", "Logan")
```

Is it true in `I`?
:::answer
No. Ordered tuples do not become equal when we reverse their positions, and
the reversed tuple is not in `I(road)`.
:::

:::qa
There is a two-road route from Logan through Salt Lake City to Provo. Is this
statement nevertheless false in `I`?

```text
road("Logan", "Provo")
```
:::answer
Yes. The statement is false because its tuple does not belong to `I(road)`.
It does not silently ask whether Provo is reachable by one or more roads.
:::

:::qa
Does that answer prove that there is no road from Logan to Provo in the real
world?
:::answer
No. It says only that the tuple is absent from this database instance.
:::

:::qa
The expressions we just tested all have this form:

```text
road(value, value)
```

A relation name applied to terms is a **relational atom**.

Does this atom contain a variable?

```text
road("Logan", "Provo")
```
:::answer
No.
:::

:::qa
An atom with no variables is called a **ground atom**.

Can a later choice of variable values change which tuple this ground atom
names?
:::answer
No. It already names one complete tuple.
:::

:::qa
Inside the fixed instance `I`, is that absent ground atom false or merely
unknown?
:::answer
False. `I` interprets `road` as exactly the set `I(road)`, and the tuple is not
in that set.
:::

:::qa
Does this mathematical answer by itself claim that `I` lists every road in the
real world?
:::answer
No.
:::

:::qa
Suppose we additionally agree that the stored relation contains every
`road` fact relevant to our application. How should we read an absent tuple
then?
:::answer
As false about the application we are modeling. That extra completeness
agreement is the **closed-world assumption**.
:::

:::qa
Now use tomorrow's instance `J`.

```text
J(road) = {
    ("Logan", "Salt Lake City"),
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
When a ground atom is true in an instance, we say that the instance
**satisfies** the statement, or is a **model** of it.

Is `I` a model of

```text
road("Logan", "Salt Lake City")
```

and is it a model of

```text
road("Logan", "Provo")
```
:::answer
`I` is a model of the first statement, but not the second. `J` is a model of
both.
:::

:::qa
Now remove the city values.

```text
road(from, to)
```

Is this atom true or false in `I`?
:::answer
We cannot tell yet. `from` and `to` are variables, not city values.
:::

:::qa
Choose these values:

```text
from -> "Logan"
to   -> "Salt Lake City"
```

Which ground atom do we obtain, and is it true in `I`?
:::answer
We obtain

```text
road("Logan", "Salt Lake City")
```

and it is true in `I`.
:::

:::qa
Keep `from` fixed. Change only `to`.

```text
from -> "Logan"
to   -> "Provo"
```

Is the resulting atom true in `I`?
:::answer
No.
:::

:::qa
Keep those same choices, but replace `I` with `J`. Is the atom true now?
:::answer
Yes.

The chosen values tell us which tuple to test. The instance tells us whether
that tuple belongs to `road`.
:::

:::qa
A choice of values for the variables is called a **valuation**. Call the first
choice `v`:

```text
v(from) = "Logan"
v(to)   = "Salt Lake City"
```

Why did we need both `I` and `v` to test `road(from, to)`?
:::answer
`v` selects the candidate tuple. `I` supplies the stored relation against which
we test it.
:::

:::alice
Chapter 4, pp. 41 and 46 - valuations, tuple membership, and satisfaction of a
relational atom.
:::

:::qa
Now add one more variable.

```text
from -> "Logan"
via  -> "Salt Lake City"
to   -> "Provo"
```

Is the first atom true in `I`?

```text
road(from, via)
```
:::answer
Yes. It becomes `road("Logan", "Salt Lake City")`.
:::

:::qa
Under the same choices, is the second atom true in `I`?

```text
road(via, to)
```
:::answer
Yes. It becomes `road("Salt Lake City", "Provo")`.
:::

:::qa
Then is this whole body true under those choices?

```text
road(from, via), road(via, to)
```
:::answer
Yes. The comma requires both atoms to be true under the same valuation.
:::

:::qa
Keep `from` and `via` fixed, but change only `to` to `"Logan"`.

Is the whole body still true?
:::answer
No. The first atom remains true, but the second becomes
`road("Salt Lake City", "Logan")`, which is false in `I`.
:::

:::qa
The body contains two relational atoms joined by logical “and.” Such an “and”
is called a **conjunction**.

Why, then, will we call this kind of query a **conjunctive query**, or **CQ**?
:::answer
Its body requires a conjunction of relational atoms to hold.
:::

:::qa
Here is the same two-road requirement in the exact notation accepted by the
MiniLinq homework:

```rust
::mini_linq::mini_linq! {
    struct TwoHopRoads;
    relation road(City, City);
    two_hop(from, to) :-
        road(from, via),
        road(via, to).
}
```

Which relation is supplied as input?
:::answer
`road`.
:::

:::qa
Which relation is produced as output?
:::answer
`two_hop`.
:::

:::qa
Does this line declare another relation containing roads?

```rust
struct TwoHopRoads;
```
:::answer
No. It names the Rust program that `mini_linq!` generates.
:::

:::qa
Look only at the symbol between the head and the body.

```text
head :- body
     ^^
```

Does the body contain results already produced by the head, or a condition for
producing a head tuple?
:::answer
A condition. We read `:-` as **if**.
:::

:::qa
What does the final `.` mark?
:::answer
The end of the rule.
:::

:::qa
Why does `via` occur in the body but not in the query head
`two_hop(from, to)`?
:::answer
An output row is produced when **some** value of `via` makes both body atoms
true under one valuation. That value is a **witness**, but the query asks to
return only the two endpoints.
:::

:::qa
Does the MiniLinq program contain the actual road tuples?
:::answer
No. `relation road(City, City);` declares the input relation's name and column
types. A Rust caller supplies one particular instance when the generated
program runs.
:::

:::qa
Run the query on the same `roads_today` instance we already inspected:

```rust
let answer_a = TwoHopRoads::run(
    roads_today.clone(),
);
```

What value should `answer_a` contain?
:::answer
```rust
vec![("Logan", "Provo")]
```
:::

:::qa
After `run` returns, did `roads_today` change?
:::answer
No. It still contains the same two tuples:

```rust
roads_today.contains(&("Logan", "Salt Lake City")) // true
roads_today.contains(&("Salt Lake City", "Provo")) // true
```

The generated Rust interface consumes owned rows, so `.clone()` gave it an
owned copy and left `roads_today` available for this check. `answer_a` is
stored separately; `("Logan", "Provo")` was not inserted into the input.
:::

:::law CQ evaluation does not update its input
In the pure CQ semantics used here, evaluating a query on an input database
instance produces a separate result instance. It does not add tuples to or
remove tuples from the input. An update is a different operation; `.clone()`
is only a detail of this Rust interface.
:::

:::qa
Does this `Vec` mean that the logical query result is an ordered list?
:::answer
No. The logical result is a set. The current `run` method removes duplicates
and materializes that set as a lexicographically sorted `Vec`, which gives Rust
tests one deterministic representation.
:::

:::qa
Now the caller constructs a different input by adding one road:

```rust
let more_roads: HashSet<Road> = HashSet::from([
    ("Logan", "Salt Lake City"),
    ("Salt Lake City", "Provo"),
    ("Provo", "Ogden"),
]);

let answer_b = TwoHopRoads::run(
    more_roads.clone(),
);
```

What value should `answer_b` contain?
:::answer
```rust
vec![
    ("Logan", "Provo"),
    ("Salt Lake City", "Ogden"),
]
```
:::

:::qa
Should `("Logan", "Ogden")` also appear?
:::answer
No. Reaching Ogden from Logan takes three roads. The query body contains
exactly two `road` atoms.
:::

:::qa
The MiniLinq text stayed fixed, but its input and output changed:

```text
A(road) = { (Logan, Salt Lake City), (Salt Lake City, Provo) }
q(A)    = { (Logan, Provo) }

B(road) = { (Logan, Salt Lake City), (Salt Lake City, Provo), (Provo, Ogden) }
q(B)    = { (Logan, Provo), (Salt Lake City, Ogden) }
```

What, then, is fixed, and what varies?
:::answer
The query text `q` is fixed. The input instance varies, and the result varies
with it.
:::

:::qa
Now we have earned two names.

The MiniLinq rule is a **query**: a syntactic object. Its meaning is the
**query mapping** that sends each permitted input instance to the output
instance produced by the rule.

Was the earlier Rust function `is_road` already such a query mapping?
:::answer
Not as written. In our shorthand, `roads` was fixed while the candidate tuple
varied. A query mapping instead keeps the query fixed while the database
instance varies.
:::

:::qa
Is returning `bool` what prevents `is_road` from being a query?
:::answer
No. If the candidate were fixed in advance and the database instance varied,
the same membership test could define a **Boolean query**. Its result is a
truth value, equivalently represented as a zero-arity result relation.
:::

:::alice
Chapter 4, p. 37 - query syntax and query mappings; pp. 41-42 - rule-based
conjunctive queries and their meaning.
:::

:::qa
The current homework stage deliberately preserves the written body order.
Is that order part of what the query means, or a choice made by this compiler
stage?
:::answer
A choice made by this stage.

A later optimizer could search `road(via, to)` before `road(from, via)` and
still return the same `q(A)`.
:::

:::qa
Suppose one generated program searches the first atom first, while another
searches the second atom first. On input `A`, must they perform the same work?
:::answer
No. They may use different orders or indexes and still both return:

```rust
vec![("Logan", "Provo")]
```
:::

:::qa
Suppose the second program instead returns:

```rust
vec![("Logan", "Ogden")]
```

Could it still be a correct translation of the query on `A`?
:::answer
No. `("Logan", "Ogden")` is not in `q(A)`.
:::

:::qa
Then what must a correct translation from the MiniLinq rule to Rust preserve?
:::answer
For every permitted input instance `A`, the generated program must produce
exactly the result relation `q(A)` denoted by the query.
:::

:::alice
Chapter 1, pp. 4 and 6 - compiling requests against a logical representation
into executable programs.
:::

:::notation MiniLinq homework notation
These are the spellings the dialogue has now exercised:

| DSL spelling | What it did in the example |
|---|---|
| `struct TwoHopRoads;` | Named the generated Rust query program. |
| `relation road(City, City);` | Declared input relation `road` with two ordered `City` columns. |
| `two_hop(from, to)` | Named the output relation and selected the values of `from` and `to`. |
| `:-` | Read as “if.” |
| The comma | Required both body atoms: logical “and.” |
| `.` | Ended the rule. |

`from`, `via`, and `to` are logical variables. They receive values through the
valuations tested above; they are not Rust bindings. The declared column types
determine the runtime row type; here it is `(City, City)`.

The earlier expressions such as `road("Logan", "Provo")` were semantic
notation. Current MiniLinq atoms contain identifiers only; concrete values
enter through the Rust input rows. MiniLinq has no fact-insertion syntax.
:::
