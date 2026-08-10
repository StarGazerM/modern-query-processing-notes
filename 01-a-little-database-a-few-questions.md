---
title: A Little Database, A Bit Rustic
subtitle: Conversation 1.1 — Where do queries fit?
author: Modern Query Processing
date: Fall 2026
left_speaker: Ada
right_speaker: Alice
---

# Before the first query

:::qa
What is a database?
:::answer
My first guess is: software that stores and manages data on a computer.
:::

:::qa
What is data?
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
No. It names the permitted form of a `Road` value; it does not create one.
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
The statement is code. When Rust evaluates the tuple expression, the resulting
value can be stored in `road`.

I see, `Road` is not data, but `Road` is a set of data.
:::

:::qa
Not quite. `Road` is a **type**. A type describes a decidable property of
values.

Here, Rust can decide whether a value has the shape required by `Road`: a pair
of `City` values. Because `City` is only an alias for `&'static str`, this
currently means a pair of static string references.

Is `("Apple", "Salt Lake City")` a road?
Is `("Apple", "Banana")` a road?
:::answer
No. So `Road` decides their Rust shape, but it does not decide whether either
tuple is recorded as a road.

How can we test which tuples are recorded as roads without answering your
hundred “Is this a road?” questions one at a time?
:::

:::qa
Can we write one named Rust function that takes the stored roads and one
candidate, then answers `true` or `false`?
:::answer
Perhaps:

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
    roads.contains(road)
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
Recreate the same `roads`, then try asking two questions:

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
Ahhh rust fails me, this not make sense. It should give me two `true` answers, but it says the second call is an error: `value moved here`.
:::

:::qa
When a variable "assigned" to another varible, for example variable in function argument,
rust doesn't "assign" the value, it **moves** the **ownership** of the value.
So here in your first call, first call's argument variable is moved, `roads` variable no longer owns the value, so it cannot be used in the second call. 

This make sense logically, you ask question about data, the existing data in the database will never moved.

And, as you predicated, you asked question two times, it should give you both true.

Now, change the first parameter type:

```rust
fn is_road(
    roads: &HashSet<Road>,
    road: Road,
) -> bool {
    roads.contains(road)
}
```

:::answer
`&` is the reference you mentioned. I saw it when you mentioned `&'static str`. 
:::

:::qa
Yes, but this actually called a **borrow**.
I owe you the definition of **ownership** and **borrowing**, let me push it back again.
Can we now ask both questions using the same set?

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
It still fails.
:::

:::qa
What is the type of the arguments to `is_road`?
:::answer
Okay, I see. `&HashSet<Road>` is not the same type as `HashSet<Road>`. I need to pass a reference to the candidate tuple, too:

```rust
is_road(
    &roads,
    ("Logan", "Salt Lake City"),
);
```
:::

:::qa
```text
is_road(("Logan", "Provo"))
```
:::answer
`false`.

But we all know that there is a two-road route from Logan to Provo. Why does `is_road` say `false`?
:::

:::qa
Good catch, we don't know yet.
How many values does this `HashSet` contain?

```rust
    HashSet::from([
        ("Logan", "Salt Lake City"),
        ("Logan", "Salt Lake City"),
    ]);
```
:::answer
One. Its a **Set**. I know it.
:::

:::qa
For a fixed `roads`, the expression

```text
is_road(candidate)
```

decides which property of `candidate`?
:::answer
Whether `candidate` is a member of `roads`.
:::

:::qa
A true-or-false test of membership is a **membership predicate**.

The finite set of tuples `roads` is a **relation instance**.

How much additional road data is stored inside `is_road`?
:::answer
None. Once `roads` is fixed, the answer of `is_road` is fixed.

The set and its membership predicate describe the same membership information.
:::

:::alice
Chapter 3, Section 3.3, p. 32 - a relation instance as a finite set of tuples.
:::

:::qa
Now compare two values.

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

Do they have the same Rust type?
:::answer
Yes. Both have type `HashSet<Road>`.
:::

:::qa
Do they contain the same road tuples?
:::answer
No. `roads_tomorrow` contains one more tuple.
:::

:::qa
The MiniLinq homework declares the logical input like this:

```text
input road/2;
```

Does `/2` mean that `road` contains exactly two tuples?
:::answer
No. `roads_tomorrow` already gives a counterexample: it contains three tuples.

`/2` says that each `road` tuple has two positions. We call this number its
**arity**.
:::

:::qa
Now change only the name.

```text
input rail/2;
```

Could `rail/2` use the same two-position Rust row shape as `road/2`?
:::answer
Yes.
:::

:::qa
Then are `road/2` and `rail/2` the same logical relation?
:::answer
No. Their arity is the same, but their relation names differ.
:::

:::qa
So is this Rust alias the complete logical description of the relation?

```rust
type Road = (City, City);
```
:::answer
No. `Road` gives the host-language shape of one row. It does not supply the
logical relation name `road`.
:::

:::qa
Now test a new candidate.

```rust
let no_roads: HashSet<Road> =
    HashSet::new();
```

Can the empty set be a relation instance over `road/2`?
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

Is it a relation instance over `road/2`?
:::answer
Yes. It is a finite set of tuples containing two `City` values.

The stored claim may be nonsense. Membership in an instance does not by itself
certify geography; Rust has not earned that degree.
:::

:::qa
Is this a relation instance over `road/2`?

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
No. Its only tuple has three positions, while `road/2` requires two.
:::

:::qa
Does `road/2` alone reject this tuple?

```text
("Logan", 42)
```
:::answer
No. It still has two positions. The Rust type `Road` rejects it because `42`
is not a `City`; the logical declaration `road/2` records only the name and
arity.
:::

:::qa
We can now name the distinction.

The relation name together with its arity, `road/2`, is a **relation schema**
in our MiniLinq notation. Each current finite set of two-position tuples is a
**relation instance** over that schema.

Between `roads_today` and `roads_tomorrow`, which one changed: the schema or
the instance?
:::answer
The instance changed. The schema remained `road/2`.
:::

:::qa
Then how can we decide whether a new finite set `S` is a relation instance
over `road/2`?
:::answer
Check two things:

1. `S` is a finite set.
2. Every tuple in `S` has two positions.

The Rust type `HashSet<Road>` adds a separate host-language check for the row
representation used in our string example.
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
Our database schema has only `road/2`. What, then, is the whole database
instance?
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
    input road/2;
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
No. `input road/2;` declares the input relation. A Rust caller supplies one
particular instance when the generated program runs.
:::

:::qa
To run this example with the completed homework's fixed `[i32; n]` row
representation, let us encode the city names as integer IDs:

```text
0 = Logan
1 = Salt Lake City
2 = Provo
```

Give the same two roads a Rust name, then run the query:

```rust
let road_rows_a = vec![
    [0, 1],
    [1, 2],
];

let answer_a = TwoHopRoads::run(
    road_rows_a.clone(),
);
```

What value should `answer_a` contain?
:::answer
```rust
vec![[0, 2]]
```
:::

:::qa
After `run` returns, did `road_rows_a` change?
:::answer
No. It still contains:

```rust
vec![
    [0, 1],
    [1, 2],
]
```

The generated Rust interface consumes owned rows, so `.clone()` gave it an
owned copy and left `road_rows_a` available for this check. `answer_a` is
stored separately; `[0, 2]` was not inserted into the input.
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
Now the caller constructs a different input by adding one city and one road.

```text
3 = Ogden
```

```rust
let road_rows_b = vec![
    [0, 1],
    [1, 2],
    [2, 3],
];

let answer_b = TwoHopRoads::run(
    road_rows_b.clone(),
);
```

What value should `answer_b` contain?
:::answer
```rust
vec![
    [0, 2],
    [1, 3],
]
```
:::

:::qa
Should `[0, 3]` also appear?
:::answer
No. Reaching `3` from `0` takes three roads. The query body contains exactly
two `road` atoms.
:::

:::qa
The MiniLinq text stayed fixed, but its input and output changed:

```text
A(road) = { [0, 1], [1, 2] }
q(A)    = { [0, 2] }

B(road) = { [0, 1], [1, 2], [2, 3] }
q(B)    = { [0, 2], [1, 3] }
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
vec![[0, 2]]
```
:::

:::qa
Suppose the second program instead returns:

```rust
vec![[0, 3]]
```

Could it still be a correct translation of the query on `A`?
:::answer
No. `[0, 3]` is not in `q(A)`.
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
| `input road/2;` | Declared input relation `road` with arity two. |
| `two_hop(from, to)` | Named the output relation and selected the values of `from` and `to`. |
| `:-` | Read as “if.” |
| The comma | Required both body atoms: logical “and.” |
| `.` | Ended the rule. |

`from`, `via`, and `to` are logical variables. They receive values through the
valuations tested above; they are not Rust bindings. An arity-`n` runtime row
in the current homework is `[i32; n]`.

The earlier expressions such as `road("Logan", "Provo")` were semantic
notation. Current MiniLinq atoms contain identifiers only; concrete values
enter through the Rust input rows.
:::
