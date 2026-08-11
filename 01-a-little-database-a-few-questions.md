---
title: A Little Database, A Bit Rustic
subtitle: Conversation 1.1 — Not Ideas About the Database but the Database Itself
author: Modern Query Processing
date: Fall 2026
status: Work in progress
layout: dialogue
left_speaker: Ada
right_speaker: Alice
---

# Before the first query

> After Wallace Stevens's [“Not Ideas About the Thing But the Thing
> Itself”](https://poets.org/poem/not-ideas-about-thing-thing-itself).

:::qa
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
Suppose Rust evaluates this statement:

```rust
let road = ("Logan", "Salt Lake City");
```

Which part could serve as data about a road: the source statement, or the value
produced by evaluating it?
:::answer
The statement is code. The tuple value it produces can serve as data.

So data need not be a file sitting on a disk. It can also be a value used by a
running program.
:::

:::qa
```rust
type City = &'static str;
type Road = (City, City);
```
Do these two lines create a pair of cities?
:::answer
No. They name permitted forms of values; they do not create a value.
:::

::::review Rust string literals
:::qa
What type does the string literal `"Logan"` have? Is it a `String`?
:::answer
I would have guessed `String`, because it is a string.
:::

:::qa
Rust gives a string literal such as `"Logan"` the type `&'static str`: a
reference to text that remains valid for the entire program. An owned `String`
is a different type.

Does `"Logan"` fit `City` as we defined it?
:::answer
Yes. `City` is exactly that alias. We can postpone the rest of the lifetime
story.
:::
::::

:::qa
What does the annotation `: Road` contribute here?

```rust
let road: Road = (
    "Logan",
    "Salt Lake City",
);
```
:::answer
It requires the tuple value to fit whatever form `Road` permits. The tuple is
still the value that can serve as data.

Then perhaps `Road` is the set of all such data?
:::

:::qa
Which of these statements will Rust reject?

```rust
let apple_slc: Road =
    ("Apple", "Salt Lake City");
let apple_banana: Road =
    ("Apple", "Banana");
```
:::answer
Neither. Rust even accepts Apple to Banana.

So `Road` distinguishes shape, not geography.
:::

:::qa
Exactly. Rust can decide whether an expression has type `Road`—here, whether it
produces a pair of `City` values. A type describes a decidable property; it does
not remember the values that passed the check.

How could we store exactly the pairs we accept?
:::answer
In a `HashSet<Road>`:

```rust
use std::collections::HashSet;

let roads = HashSet::from([
    ("Logan", "Salt Lake City"),
    ("Salt Lake City", "Provo"),
]);
```
:::

:::qa
How could we turn that stored set into a yes-or-no test for one candidate?
:::answer
Perhaps with a named function:

```rust
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

::::review Rust borrowing
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
Ahhh, Rust rejects the second call. It says the first call moved `roads`.
:::

:::qa
The compiler points to `roads` in the first call and says `value moved here`.

Did moving `roads` mutate the `HashSet` value, or did it only transfer who owns
that value?
:::answer
The move itself only transferred ownership; it did not change the members.
Because this function does not return the set, Rust drops it when the call
ends.
:::

:::qa
A `HashSet<Road>` is not `Copy`. A parameter of type `HashSet<Road>` therefore
takes ownership of the set passed to it. After the first call, the caller no
longer owns the binding named `roads`.

But `is_road` only needs permission to inspect the set. What could it ask for
instead of owning the set?
:::answer
Perhaps a reference to the set.
:::

:::qa
Yes. Replace only the first parameter:

```rust
fn is_road(
    roads: &HashSet<Road>,
    road: Road,
) -> bool {
    roads.contains(&road)
}
```

Can we keep the old call?

```rust
is_road(
    roads,
    ("Logan", "Salt Lake City"),
)
```
:::answer
No. The function now expects `&HashSet<Road>`, so I need to pass `&roads`.
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
Yes. Both calls compile, and the caller can still use `roads` afterward.
:::

:::qa
Evaluating `&roads` **borrows** the stored set and produces a shared reference.
The caller keeps ownership.

There is another reference inside the function:

```rust
roads.contains(&road)
```

Does `&road` borrow the stored set again?
:::answer
No. This `&` is attached to `road`, not `roads`. It must refer to the candidate.
:::
::::

Keep the version we will use from now on:

```rust
fn is_road(
    roads: &HashSet<Road>,
    road: Road,
) -> bool {
    roads.contains(&road)
}
```

For the next few questions, `roads` stays fixed. We will abbreviate

```rust
is_road(&roads, candidate)
```

as

```text
is_road(candidate)
```

:::qa
Using that shorthand, what does this call return, and what does `roads` contain
afterward?

```text
is_road(("Logan", "Provo"))
```
:::answer
It returns `false`, and `roads` still contains exactly its original two tuples.
The hidden first argument was `&roads`; the function only inspected it.

But we all know that there is a two-road route from Logan to Provo. Why does
`is_road` say `false`?
:::

:::qa
Trace the only test performed by the function:

```rust
roads.contains(&("Logan", "Provo"))
```

What question were you expecting instead?
:::answer
Whether there is some intermediate city joined to Logan and Provo by two stored
roads. Direct membership and a two-road route are different questions.
:::

:::qa
Suppose two sources report the same road, and we insert both reports:

```rust
HashSet::<Road>::from([
    ("Logan", "Salt Lake City"),
    ("Logan", "Salt Lake City"),
])
```

Can this `HashSet` later tell us that there were two reports?
:::answer
No. It contains one tuple. A set remembers membership, not how many times a
member was inserted.
:::

:::qa
We now have three different things: the type `Road`, one pair such as
`("Logan", "Salt Lake City")`, and the value `roads`.

Which one is a member, and which one is the whole set whose membership we test?
:::answer
The pair is one member. `roads` is the whole set. `Road` is the Rust type of
each permitted member.
:::

:::definition Binary relation
Let $A$ and $B$ be sets of values. A **binary relation** between them is a set
of ordered pairs $(a, b)$, where $a$ comes from $A$ and $b$ comes from $B$.

When we write set notation, we also use `City` for the set of values having the
Rust type `City`.

Each member of `roads` is one tuple; `roads` is the relation. Rust represents
this particular finite relation as a `HashSet<Road>`.
:::

:::qa
So `roads` is the relation.
:::answer
Then `is_road` is only its membership test, not another source of road facts?
:::

:::law Membership
For the fixed relation `roads` and every `candidate: Road`,
`is_road(candidate)` is `true` exactly when `candidate` is a member of `roads`.
We therefore call `is_road` the **membership predicate** of `roads`; the
relation determines every answer it gives.
:::

:::alice
Chapter 3, Section 3.3, p. 32 - the finite-set-of-tuples view.
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

What stayed fixed, and what changed?
:::answer
Both values have type `HashSet<Road>`. Their contents differ:
`roads_tomorrow` additionally contains `("Logan", "Provo")`.

The question is still about roads. Must its name change whenever the Rust
binding changes?
:::

:::qa
No. Our notation needs a stable name independent of
either Rust binding. Let us try:

```text
relation road(City, City);
```

Read as much of that line as you can, and stop where it becomes uncertain.
:::answer
It is not Rust, and `relation` suggests that the line declares the stable name
`road`. But `road(City, City)` still looks like a function call wearing a
semicolon. Are we calling it with two values?
:::

:::qa
Put one candidate beneath the new line:

```text
relation road( City ,       City       );
               "Logan", "Salt Lake City"
```

The lower line supplies values. What might the two occurrences of `City` be
specifying?
:::answer
The permitted types of two ordered positions: `"Logan"` fits the first `City`,
and `"Salt Lake City"` fits the second.

So `relation road(City, City);` declares the name and tuple shape; it is not
calling `road` with two values.
:::

:::qa
With only this declaration, can you tell whether the Logan-to-Salt-Lake-City
tuple is currently stored?

```text
relation road(City, City);
```
:::answer
No. It gives the name `road` and the types of its two positions, but no current
city values. I still need a set such as `roads_today` or `roads_tomorrow`.
:::

:::qa
Suppose `road` refers to `roads_today` today and to `roads_tomorrow` tomorrow.
Would either set violate the declaration?
:::answer
No. Every member of either set has the declared two-position shape.

The number of members may change; the declaration need not.
:::

:::qa
The declaration contains two occurrences of `City`. `roads_today` contains two
tuples, while `roads_tomorrow` contains three.

What do the two occurrences of `City` count?
:::answer
The two ordered positions in each tuple, not the number of tuples in the set.
:::

:::definition Arity
The **arity** of a relation declaration is the number of ordered positions in
each tuple. `road` has arity two, no matter how many tuples its current content
has.
:::

:::alice
Chapter 3, p. 31 - relation names and arity.
:::

:::qa
So both the Rust alias `Road` and the declaration describe two ordered
positions.
:::answer
Then what did the logical name `road` add?
:::

:::qa
`Road` describes the shape of one Rust row:

```rust
type Road = (City, City);
```

The declaration adds the stable logical name `road`, whose current content is a
set of such rows.

Could the empty set be that current content?

```rust
let no_roads: HashSet<Road> =
    HashSet::new();
```
:::answer
Yes. Nothing in the declaration requires at least one tuple. With no members,
there cannot be a member of the wrong shape.

It is perfectly legal—just a disappointing travel guide.
:::

:::qa
What about this one?

```rust
let strange_roads: HashSet<Road> =
    HashSet::from([
        ("Apple", "Banana"),
    ]);
```

Could it be the current content of `road`?
:::answer
Yes—unfortunately. `City` is only an alias for `&'static str`, so both words
have type `City`.

The stored claim may be nonsense. Membership in the set does not by itself
certify geography; Rust does not come with an atlas.
:::

:::qa
Could this be the current content of `road`?

```text
{ ("Logan", "Salt Lake City", "Provo") }
```
:::answer
No. Its only tuple has three positions, while the declaration permits two.
:::

:::qa
Could this tuple belong to the current content of `road`?

```text
("Logan", 42)
```
:::answer
No. Its second position must have type `City`, but `42` is an integer. The
declaration and the Rust alias both require two ordered positions, each of type
`City`.
:::

:::qa
We tried four possible contents for `road`:

- no tuples;
- the pair `("Apple", "Banana")`;
- one tuple with three positions;
- the pair `("Logan", 42)`.

Which two did the declaration reject, and what did they have in common?
:::answer
It rejected the three-position tuple and `("Logan", 42)`. Both violate the
declared tuple shape.

The declaration did not reject the empty set or Apple and Banana: it fixes
neither the number of tuples nor whether the stored claims make geographic
sense.
:::

:::definition Relation schema and relation instance
In this notation,

```text
relation road(City, City);
```

is a **relation schema**. It fixes the relation name and the permitted shape of
its tuples: arity two, with a `City` value in each ordered position.

A **relation instance** over this schema is any finite relation
$R \subseteq City \times City$, where $City \times City$ means all ordered
pairs of `City` values.

The Rust type `HashSet<Road>` already enforces the row shape in this example.
The logical declaration additionally gives the relation the name `road`.
:::

:::alice
Chapter 3, Section 3.1, pp. 29-31, and Section 3.3, p. 32 - schema, instance,
and the type-value analogy.
:::

:::qa
Let `I` name today's choice:

```text
I(road) = roads_today
```

How would you read this equation?
:::answer
In `I`, the logical name `road` denotes the finite relation represented by the
Rust value `roads_today`.

I am reading `I(road)` as mathematical lookup notation, not as a Rust function
call.
:::

:::definition Database schema and database instance
A **database schema** is a finite collection of relation schemas with distinct
relation names.

A **database instance** over that schema assigns every declared relation name
exactly one relation instance that matches its schema.

If `I` is a database instance, `I(r)` denotes the relation that `I` assigns to
the declared name `r`. Here the schema contains only `road`, with

```text
I(road) = roads_today
```

Strictly, `I(road)` is a mathematical relation and `roads_today` is the Rust
value representing it. When no confusion results, we identify a `HashSet` value
with the finite set it represents.

Tomorrow's database instance could be named `J`, with

```text
J(road) = roads_tomorrow
```
:::

:::qa
At the beginning, you guessed that a database was software. Return to that
guess: where does `I` belong, and what has not yet appeared in our example?
:::answer
`I` describes the current data, so it belongs on the database side. The software
that stores, queries, and changes such data has not appeared at all.
:::

:::definition Database and DBMS
A **database** is an organized collection of data. In our logical account, its
current contents are represented by a database instance such as `I`.

A **database management system**, or **DBMS**, is software that stores,
queries, updates, and otherwise manages databases.
:::

A complete DBMS does much more. We begin with the language used to ask for data
and the processing needed to answer those requests.

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
The stored roads give us a two-road route:

```text
Logan -> Salt Lake City -> Provo
```

What truth value does `I` give to this statement?

```text
road("Logan", "Provo")
```
:::answer
False. The statement asks for one tuple in `I(road)`. It does not ask whether
Provo can be reached by following several stored roads.
:::

:::qa
Does that answer prove that there is no road from Logan to Provo in the real
world?
:::answer
No. It says only that the tuple is absent from `I(road)`. The database may be
incomplete or mistaken about the physical world.
:::

:::definition Relational atom and ground atom
For a relation name $r$ of arity $n$, an expression

$$
r(t_1, \ldots, t_n)
$$

is a **relational atom**. Each $t_i$ is a term for the corresponding tuple
position: either a data literal denoting a value, or a logical variable.

An atom containing no variables is **ground**. For example,

```text
road("Logan", "Provo")
```

is a ground atom naming the complete tuple `("Logan", "Provo")`.
:::

:::qa
Inside the fixed instance `I`, is that absent ground atom false or merely
unknown?
:::answer
False **in `I`**. The instance interprets `road` as exactly `I(road)`, and the
tuple is absent from that relation.

That answer is about `I`; it does not by itself say whether a direct road exists
outside the database.
:::

:::qa
Suppose we additionally agree that the stored relation contains every
`road` fact relevant to our application. How may we now read a ground `road`
atom whose tuple is absent?
:::answer
As false about the application we are modeling.
:::

:::definition Closed-world assumption
Under the **closed-world assumption**, a ground atom whose tuple is absent is
taken to be false about the application represented by that database.

This assumes that the database completely records the relevant facts. It does
not claim that the database records every fact in the physical world.
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

:::definition Satisfaction and model
When a ground atom is true in an instance, we say that the instance
**satisfies** the statement, or is a **model** of it.

For a ground relational atom,

$$
I \models r(a_1, \ldots, a_n)
$$

exactly when $(a_1, \ldots, a_n) \in I(r)$.
:::

:::qa
Which of `I` and `J` are models of each statement?

```text
road("Logan", "Salt Lake City")
road("Logan", "Provo")
```
:::answer
Both `I` and `J` are models of the first statement. Only `J` is a model of the
second.
:::

:::qa
Replace the quoted city values with logical variable names.

```text
road(from, to)
```

Can `I` alone tell us whether this atom is true?
:::answer
Not yet. `from` and `to` do not identify city values until we choose values for
them.
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
No. It becomes

```text
road("Logan", "Provo")
```

whose tuple is absent from `I(road)`.
:::

:::qa
Keep those same choices, but replace `I` with `J`. Is the atom true now?
:::answer
Yes. The chosen tuple now belongs to `J(road)`. Only the instance changed.
:::

:::qa
In the last three tests, we first changed only the chosen value of `to`. Then we
kept those values and changed `I` to `J`.

What job did the chosen values perform, and what job did the instance perform?
:::answer
The chosen values selected one candidate tuple. The instance supplied the
relation in which that tuple was tested.
:::

:::definition Valuation and truth of an atom
A **valuation** assigns a value of the appropriate type to each logical
variable. Call our first choice `v`:

```text
v(from) = "Logan"
v(to)   = "Salt Lake City"
```

Applying `v` to `road(from, to)` produces the ground atom

```text
road("Logan", "Salt Lake City")
```

An instance satisfies an atom under `v` exactly when it satisfies the resulting
ground atom.
:::

:::alice
Chapter 4, pp. 41 and 46 - valuations, tuple membership, and satisfaction of a
relational atom.
:::

:::qa
Extend our choices with one more variable:

```text
from -> "Logan"
via  -> "Salt Lake City"
to   -> "Provo"
```

Evaluate both atoms under those choices:

```text
road(from, via)
road(via, to)
```
:::answer
The first becomes

```text
road("Logan", "Salt Lake City")
```

and the second becomes

```text
road("Salt Lake City", "Provo")
```

Both are true in `I`. What does the comma between them require?
:::

:::qa
It requires both atoms to be true under the same valuation. Keep `from` and
`via`, but change `to`:

```text
to -> "Logan"
```

Are the two atoms still true together?
:::answer
No. The first atom remains true, but the second becomes
`road("Salt Lake City", "Logan")`, which is false in `I`.
:::

:::definition Conjunction
A **conjunction** is a collection of statements joined by logical “and.”

A conjunction of relational atoms is true in an instance under a valuation
exactly when every atom is true there under the same valuation. In our
notation, a comma denotes this “and.”
:::

:::qa
Our successful choice used three cities: `from`, `via`, and `to`.

If the question asks only where a two-road route starts and ends, which values
should one answer tuple keep?
:::answer
`from` and `to`.

`via` helps show that the route exists, but it should not appear in the answer
tuple. How do we say that?
:::

:::qa
We write:

```text
two_hop(from, to) :-
    road(from, via),
    road(via, to).
```

How would you read this rule aloud?
:::answer
`two_hop(from, to)` holds **if** there is a road from `from` to `via` **and** a
road from that same `via` to `to`.

So `:-` reads as “if,” and the comma reads as “and.”
The final period ends the rule.
:::

:::qa
The database instance supplies tuples for `road`, but it supplies none for
`two_hop`. Where do the `two_hop` tuples come from?
:::answer
From the rule. Whenever one valuation makes both `road` atoms true, its values
for `from` and `to` form a derived `two_hop` tuple.
:::

:::qa
For the answer

```text
two_hop("Logan", "Provo")
```

which value of `via` made the two atoms true in `I`? Does that value appear in
the answer tuple?
:::answer
`"Salt Lake City"` made both atoms true. It justifies the answer, but the answer
keeps only `"Logan"` and `"Provo"`.
:::

:::definition Conjunctive query
A rule of the form

```text
q(x1, ..., xk) :-
    A1,
    ...,
    Am.
```

is a **conjunctive query**, or **CQ**, when its body is a conjunction of
relational atoms.

The expression left of `:-` is the **head**; the conjunction to its right is the
**body**. Every head variable must also occur in the body. The head selects and
orders body-variable values for the result; their types follow from the body
positions in which they occur. Values assigned to body-only variables provide
the evidence for an answer; such satisfying values are called **witnesses**.

A tuple belongs to the result exactly when some valuation gives the head
variables the values in that tuple and makes every body atom true in the input
instance.
:::

:::qa
Where are `"Logan"`, `"Salt Lake City"`, and today's other actual city names in
the rule?
:::answer
They are not there. The rule remains fixed; the database instance supplies the
current `road` tuples when we evaluate it.
:::

:::qa
Suppose we paste the declaration and rule directly into a Rust source file.
What problem occurs before Rust can inspect any roads?
:::answer
`rustc` does not recognize `relation` or `:-`. The rule is written in our query
notation, not in Rust.
:::

:::qa
Here is one deliberately direct account of the same meaning in ordinary Rust.
We wrote it by hand; the query notation did not generate it.

```rust
fn two_hop(
    roads: &HashSet<Road>,
) -> HashSet<Road> {
    let mut answer = HashSet::new();

    for &(from, via) in roads {
        for &(other_via, to) in roads {
            if via == other_via {
                answer.insert((from, to));
            }
        }
    }

    answer
}
```

Which part of the rule is realized by `via == other_via`?
:::answer
The repeated variable `via`. Both body atoms must use one shared value for
`via`; the equality enforces that requirement in the two loops.
:::

:::qa
When that equality holds, why does Rust insert `(from, to)` rather than
`(from, via, to)`?
:::answer
The query head keeps `from` and `to`. `via` is needed as a witness, but it is not
part of the output tuple.
:::

:::qa
Apply the Rust function to the same `roads_today` relation we already
inspected:

```rust
let answer_a = two_hop(&roads_today);
```

What set should `answer_a` contain?
:::answer
```rust
HashSet::from([
    ("Logan", "Provo"),
])
```
:::

:::qa
Now compare one tuple in the two sets:

```rust
answer_a.contains(
    &("Logan", "Provo"),
) // true

roads_today.contains(
    &("Logan", "Provo"),
) // false
```

How can both answers be correct?
:::answer
`answer_a` and `roads_today` are different relations. The query placed the
derived tuple in its result; it did not insert the tuple into its input.
:::

:::law CQ evaluation does not update its input
In the pure CQ semantics used here, evaluating a query on an input database
instance produces a separate result relation. It does not add tuples to or
remove tuples from the input. An update is a different operation.
:::

:::qa
Now construct a different input by adding one road:

```rust
let more_roads: HashSet<Road> = HashSet::from([
    ("Logan", "Salt Lake City"),
    ("Salt Lake City", "Provo"),
    ("Provo", "Ogden"),
]);

let answer_b = two_hop(&more_roads);
```

What set should `answer_b` contain?
:::answer
```rust
HashSet::from([
    ("Logan", "Provo"),
    ("Salt Lake City", "Ogden"),
])
```
:::

:::qa
Should `("Logan", "Ogden")` also appear?
:::answer
No. Reaching Ogden from Logan takes three roads. The query body contains
exactly two `road` atoms.
:::

:::qa
Compare two evaluations of the same written rule `q`:

```text
A(road) = {
    ("Logan", "Salt Lake City"),
    ("Salt Lake City", "Provo")
}
q(A) = {
    ("Logan", "Provo")
}

B(road) = {
    ("Logan", "Salt Lake City"),
    ("Salt Lake City", "Provo"),
    ("Provo", "Ogden")
}
q(B) = {
    ("Logan", "Provo"),
    ("Salt Lake City", "Ogden")
}
```

What changed between them, and what did not?
:::answer
The query text `q` is fixed. The input instance varies, and the result varies
with it.
:::

:::definition Query mapping and denotation
A **query** is the written syntactic object, such as our fixed rule `q`.

For this relation-valued query, its **query mapping** sends every permitted input
database instance `I` to the result relation `q(I)`. That mapping—what result
the query assigns to every permitted input—is the query's **denotation**.
:::

:::qa
Why was our earlier shorthand not already the same database-to-result mapping
as `q`?

```text
is_road(candidate)
```

:::answer
There, `roads` was fixed while the separately supplied candidate varied. That
is not the input-to-result mapping we just gave `q`.

If we instead fixed the candidate—for example, always asking whether
`("Logan", "Provo")` is present—and varied the database instance, membership
would return one Boolean for each database instance.
:::

A query whose result is `true` or `false` is called a **Boolean query**.

:::alice
Chapter 4, p. 37 - query syntax and query mappings; pp. 41-42 - rule-based
conjunctive queries and their meaning.
:::

:::qa
Suppose we swap the two loops: search for the second road first and the first
road second, while keeping the same equality test and insertion. Should the
result set change?
:::answer
No. The search order changes, but the set of endpoint pairs satisfying the rule
does not.
:::

:::qa
Suppose another function returns `{ ("Logan", "Ogden") }` on input `A`. Could it
still implement this query?
:::answer
No. Different machinery is allowed; a different denotation is not.
`("Logan", "Ogden")` is not in `q(A)`.
:::

:::law Same meaning, different machinery
An executable implementation may change the search order, storage, and amount
of work. It implements `q` correctly only if, for every permitted input
instance `A`, it returns exactly `q(A)`.
:::

:::alice
Chapter 1, pp. 4 and 6 - compiling requests against a logical representation
into executable programs.
:::

:::qa
We now have permitted forms and an agreed meaning for each one.
:::answer
Then this is already a language, even though `rustc` does not understand it.

And because its fixed queries are interpreted over database instances and
produce results without updating those instances, it is a database query
language?
:::

:::definition Database query language
A **database query language** provides syntactic forms for queries over
database instances. Under its semantics, each query denotes a query mapping
from permitted input instances to results. Our conjunctive query returns a
relation; a Boolean query returns a truth value.
:::

:::notation Forms earned so far
| Form | What it did in the example |
|---|---|
| `relation road(City, City);` | Declared input relation `road` with two ordered `City` positions. |
| `two_hop(from, to)` | Named the output relation and kept the values of `from` and `to`. |
| `:-` | Read as “if.” |
| The comma | Required both body atoms: logical “and.” |
| `.` | Ended the rule. |

`from`, `via`, and `to` are logical variables. They receive values through the
valuations tested above; they are not Rust bindings. The database instance
supplies the actual input tuples.
:::

:::qa
If we delete the hand-written `two_hop` function and leave only the bare rule,
what is still missing between our query language and executable Rust?
:::answer
Something must read the rule and produce Rust with the same denotation.

That missing piece is a compiler. How do we build the smallest one?
:::

:::recap The formal core
Rust source, Rust types, values, and logical objects are distinct. `Road` names
the required shape of one Rust row; a `HashSet<Road>` represents a finite set of
such rows. A declaration `relation r(T1, ..., Tn);` specifies a relation
schema: a logical name $r$, arity $n$, and an ordered list of tuple-position
types, but no current tuples. A relation instance for that schema is a finite
relation $R\subseteq T_1\times\cdots\times T_n$. A database schema is a finite
collection of relation schemas with distinct names. A database instance $I$
assigns each declared name $r$ one matching relation instance, written $I(r)$.
The database is the data represented by $I$; a DBMS is the software that
manages such data.

For a ground atom $r(a_1,\ldots,a_n)$,
$$
I\models r(a_1,\ldots,a_n)
\quad\text{exactly when}\quad
(a_1,\ldots,a_n)\in I(r).
$$
A valuation $v$ assigns each logical variable a value of the required type and
turns an atom with variables into a ground atom. An instance is a model of a
ground atom exactly when it satisfies that atom. If a tuple is absent from
$I(r)$, the corresponding ground atom is false in $I$. The closed-world
assumption adds the application-level claim that $I$ records all relevant
facts, permitting database absence to be read as falsity about the represented
application; it does not establish falsity in the physical world.

A conjunctive query $q$ has a head `q(x1, ..., xk)` and a conjunctive body
$A_1,\ldots,A_m$, written `head :- body.` Every head variable occurs in the
body. For each permitted input instance $I$,
$$
q(I)=
\left\{
\bigl(v(x_1),\ldots,v(x_k)\bigr)
\;\middle|\;
v\text{ is an appropriately typed valuation making every }A_i
\text{ true in }I
\right\}.
$$
The head selects and orders the values in a result tuple. Values assigned to
body-only variables are witnesses: they establish membership in $q(I)$ but do
not appear in the result tuple.

The denotation of the written query $q$ is the mapping $I\mapsto q(I)$; a
Boolean query instead maps each permitted $I$ to a truth value. Query evaluation
produces a result without adding tuples to or removing tuples from its input.
An executable implementation is correct exactly when it returns $q(I)$ for
every permitted input instance $I$, regardless of its search order, storage, or
amount of work. A compiler for this language must construct such an executable
program while preserving that denotation.
:::
