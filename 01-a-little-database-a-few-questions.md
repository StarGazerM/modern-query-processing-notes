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
My first guess is software that stores and manages data on a computer.
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

Is this data?
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

Is this data?
:::answer
No. They describe shapes that data may have; neither line creates a value.
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
Are these roads?

```rust
("Apple", "Salt Lake City");
("Apple", "Banana");
```
:::answer
Neither. But each has the shape required by `Road`; Rust would accept either
where a `Road` value is expected.

So `Road` distinguishes shape, not geography.
:::

:::qa
Exactly. `Road` is a **type**. It describes a decidable property: whether a
value has the required shape.

You can answer “yes” to whether a road exists by searching for a road in the
world: if you find one, you have proved that it exists. But answering “no” to
this question requires enumerating all roads in the world, which is not
possible.

Therefore, this question is **semi-decidable** and cannot be captured by a
**type**.

But being unable to say “no” does not mean that we cannot answer anything.

:::answer

For a program that needs an answer now, we must keep track of the roads it is
allowed to know:

```rust
use std::collections::HashSet;

let roads = HashSet::from([
    ("Logan", "Salt Lake City"),
    ("Salt Lake City", "Provo"),
]);
```

We surrender the grand question, “Is this a road?” and ask a smaller one:
“According to what we have recorded, is this a road?”
:::

:::qa
Let us call “what we have recorded” our **world**. Reading a question as
“according to what we have recorded” uses the **closed-world assumption**. We
will define these terms formally later.

Now, are these roads?

```rust
("Apple", "Salt Lake City");
("Apple", "Banana");
```
:::answer
No. According to what we have recorded, they are not roads.
:::

:::qa
Good. That was easy for you, but computer scientists also want to know whether
this question is computable. Under the CWA, it is. How?

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
Recreate `roads`, then ask the same question twice:

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
Ahhh—Rust rejects the second call. It says the first call moved `roads`.
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

:::qa
```rust
is_road(&roads, ("Logan", "Provo"))
```

This is concrete Rust code, but scientists are lazy. When `roads` is
understood, they abbreviate it as:

```text
road("Logan", "Provo")
```

They call `road`—not `Road`—a **relation**, and `is_road` its **membership
predicate**.

:::answer
I am surprised they are not tired of writing:

```rust
HashSet::<Road>::from([
    ("Logan", "Salt Lake City"),
])
```
:::

:::qa
They are. They write:

```text
I(road) = {
    ("Logan", "Salt Lake City")
}
```

They call `I(road)` a **relation instance** of `road`. It is also the
**interpretation** of the relation name `road` in `I`.
:::answer
Neat. So `I` is something larger than the `road` relation alone.
:::

:::alice
Chapter 3, Section 3.3, p. 32 - the finite-set-of-tuples view.
:::

:::qa
Yes. Before we give `I` a name, consider:

```text
I0(road) = {
    ("Logan", "Salt Lake City"),
    ("Logan", "Salt Lake City")
}
```

Is `I0(road)` the same relation as `I(road)`?

:::answer
Yes. The braces denote a set, just as our `HashSet` did. Duplicates do not
count.

So a relation is mathematically a *set*.
:::

:::qa
```text
I1(road) = {
    ("Logan", "Salt Lake City"),
    ("Salt Lake City", "Logan")
}
```
Does `I1(road)` describe one road or two?
:::answer
That depends on what `road` means. Are I-15 South and I-15 North the same road?
If they are, I would say one; if not, two.
:::

:::qa
Good. As a set, `I1(road)` contains two distinct tuples. Whether those tuples
describe one physical road or two depends on their **interpretation**. We will
study that distinction more deeply later.
:::answer
Okay.
:::

:::qa
Is

```text
I2(road) = {
    ("Logan", "Salt Lake City"),
    ("Logan", 1, 2)
}
```

an instance of `road`?
:::answer
No. There are two problems:

1. `1` and `2` do not have type `City`.
2. A `road` tuple has two positions, not three.
:::

:::qa
Right. Before giving an instance, we must declare the relation's name and tuple
shape. This is called its **relation schema**.

```text
relation road(City, City);
```

The number of positions in each tuple is called the relation's **arity**.
:::answer
I see. In Rust, that tuple shape appears in:

```rust
let road: HashSet<(City, City)> = HashSet::new();
```
:::

:::definition Relation
Under the conventional perspective, a **relation** (or relation instance) is a
(possibly empty) finite set of tuples.
:::

:::qa
Good. Now it is your turn to write like a database researcher.

I want to record distances between cities in Utah. What relation schema and
example relation instance should I use?
:::answer
```text
relation road_length(City, City, u32);

I(road_length) = {
    ("Logan", "Salt Lake City", 82)
}
```
:::

:::qa
In Rust?
:::answer
```rust
let road_length: HashSet<(City, City, u32)> = HashSet::from([
    ("Logan", "Salt Lake City", 82)
]);
```
:::

:::alice
Chapter 3, Section 3.1, pp. 29-31, and Section 3.3, p. 32 - schema, instance,
and the type-value analogy.
:::


:::qa
Now put the relations we care about, and one instance of each, together:

```text
{
    relation road(City, City);
    relation road_length(City, City, u32);
}
{
    I(road) = {
        ("Logan", "Salt Lake City"),
        ("Salt Lake City", "Provo")
    }
    I(road_length) = {
        ("Logan", "Salt Lake City", 82)
    }
}
```

We can now refine your earlier guess about a database.
:::answer
A **database**!
:::

:::definition Database schema and database instance
A **database schema** is a finite collection of relation schemas with distinct
names.

A **database instance** over that schema assigns each relation name exactly one
relation instance matching that relation's schema.
:::

:::qa
Is a database a piece of software?
:::answer
No. These expressions describe organized data, including its schema and its
current instance. The software that stores and manages that data must have
another name.
:::

:::definition Database and DBMS
A **database** is an organized collection of data. In our logical account, its
schema describes its permitted structure, and a database instance describes its
current contents.

A **database management system**, or **DBMS**, is software that stores,
queries, updates, and otherwise manages databases.

A complete DBMS does much more. We begin with the language used to ask for data
and the processing needed to answer those requests.
:::

:::alice
Chapter 1, p. 3 - the distinction between a database and a DBMS.
:::

:::qa
In the instance `I` above, is this statement true?

```text
road("Logan", "Salt Lake City")
```
:::answer
Yes. Its tuple belongs to `I(road)`.
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
Consider another database instance:

```text
J(road) = {
    ("Logan", "Salt Lake City"),
    ("Logan", "Garden City"),
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

I can also write the answers as ground atoms:

```text
{
    road("Logan", "Salt Lake City"),
    road("Logan", "Garden City"),
    road("Logan", "Provo"),
}
```
:::


:::definition Satisfaction and model
When a ground atom is true in an instance, we say that the instance
**satisfies** the atom, or is a **model** of it.

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
variable in a relational atom. Applying a valuation replaces each variable with
its assigned value and produces a ground atom.

An atom is true in an instance under a valuation exactly when the ground atom
produced by that valuation is true in the instance.
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
road(from, via),
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
Our successful valuation assigned cities to three variables: `from`, `via`, and
`to`.

If the question asks only where a two-road route starts and ends, which
variables should determine the two positions of an answer tuple?
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
The input instance supplies tuples for `road`, while the rule's head names
`two_hop`. Where do the `two_hop` tuples come from?
:::answer
From the rule. Whenever a valuation makes both `road` atoms true, its values
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
positions in which they occur. Assignments to body-only variables provide the
evidence for an answer; these assignments are called **witnesses**.

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
Let `q` denote the fixed `two_hop` rule. Compare its evaluation on two input
instances:

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
Why did our earlier shorthand not define the same kind of database-to-result
mapping as `q`?

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
instance `I`, it returns exactly `q(I)`.
:::

:::alice
Chapter 1, pp. 4 and 6 - compiling requests against a logical representation
into executable programs.
:::

:::qa
We now have permitted forms and an agreed meaning for each one.
:::answer
Then this is already a language, even though `rustc` does not understand it.

And because its queries are interpreted over database instances and produce
results without updating those instances, it is a database query language?
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
| `relation road(City, City);` | Declared the schema of input relation `road`, with two ordered `City` positions. |
| `two_hop(from, to)` | Named the output relation and kept the values of `from` and `to`. |
| `:-` | Read as “if.” |
| The comma | Required both body atoms: logical “and.” |
| `.` | Ended the rule. |

`from`, `via`, and `to` are logical variables. Valuations assign values to them;
they are not Rust bindings. The database instance supplies the actual input
tuples.
:::

:::qa
If we delete the hand-written `two_hop` function and leave only the bare rule,
what is still missing between our query language and executable Rust?
:::answer
Something must read the rule and produce Rust with the same denotation.

That missing piece is a compiler. How do we build the smallest one?
:::

:::recap The formal core
Rust source text, Rust types, Rust values, and logical objects are distinct.
`Road` names the required shape of one Rust row; a `HashSet<Road>` represents a
finite set of such rows. A declaration `relation r(T1, ..., Tn);` specifies a relation
schema: a logical name $r$, arity $n$, and an ordered list of tuple-position
types, but no current tuples. A relation instance for that schema is a finite
relation $R\subseteq T_1\times\cdots\times T_n$. A database schema is a finite
collection of relation schemas with distinct names. A database instance $I$
assigns each declared name $r$ one matching relation instance, written $I(r)$.
Together, the schema and $I$ describe the database at this logical level; a
DBMS is the software that manages such data.

For a ground atom $r(a_1,\ldots,a_n)$,
$$
I\models r(a_1,\ldots,a_n)
\quad\text{exactly when}\quad
(a_1,\ldots,a_n)\in I(r).
$$
A valuation $v$ assigns each logical variable a value of the required type.
Applying $v$ replaces each variable with its assigned value, producing a ground
atom. An instance is a model of a ground atom exactly when it satisfies that
atom. If a tuple is absent from
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
The head selects and orders the values in a result tuple. Assignments to
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
