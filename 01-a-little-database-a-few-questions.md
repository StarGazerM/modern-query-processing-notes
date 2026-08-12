---
title: What's in a Name?
subtitle: Conversation 1.1 — The Database Before the Query
author: Modern Query Processing
date: Fall 2026
status: Work in progress
layout: dialogue
left_speaker: Ada
right_speaker: Alice
next: [Conversation 1.2 · By Indirections Find Directions Out](02-the-relation-that-wasnt-stored.html)
---

# What's in a name?

:::qa
What is a database?
:::answer
My first guess is software that stores and manages data on a computer.
:::

:::qa
Keep that guess. What is data?
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
queries, updates, and otherwise manages databases. A complete DBMS does much more.
We begin with the language used to ask for data and the processing needed to answer
those requests.
:::

:::alice
Chapter 1, p. 3 - the distinction between a database and a DBMS.
:::

:::qa
What have we described now?
:::answer
We have described a database schema and one current database instance: the
permitted shapes of its relations and the finite contents assigned to each one.

The DBMS is the software that would store and manage them. We have not yet
given it a language for asking questions.
:::

:::recap What the database is
Rust source text, Rust types, Rust values, and logical objects are distinct.
`Road` names the required shape of one Rust row; a `HashSet<Road>` represents a
finite set of such rows. A declaration `relation r(T1, ..., Tn);` specifies a
relation schema: a logical name $r$, arity $n$, and an ordered list of tuple-position
types, but no current tuples. A relation instance for that schema is a finite
relation $R\subseteq T_1\times\cdots\times T_n$, writing each $T_i$ also for
the set of values admitted by that type. A database schema is a finite
collection of relation schemas with distinct names. A database instance $I$
assigns each declared name $r$ one matching relation instance, written $I(r)$.
Together, the schema and $I$ describe the database at this logical level; a
DBMS is the software that manages such data.
:::
