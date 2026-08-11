---
title: A Little Rust, Side by Side
subtitle: A quick-reference Python-to-Rust cheat sheet for the project and book
author: Modern Query Processing
date: Fall 2026
status: Work in progress
left_speaker: Python
right_speaker: Rust
---

# Use this page as a cheat sheet

This is a quick information-retrieval page, not a chapter to memorize. When Rust syntax
hides the idea, scan the headings or search for the operation, read the two columns, and
return to the code.

The goal is simple: you can read all the Rust code used in the project and book. You do not
need to reproduce every spelling from memory, and it is expected that you will return here
when you need one.

You do not need to be good at Python. The left side is only a recognition aid: find an
operation you have seen, then read across to its Rust spelling. If the Python is also new,
the notice below each pair says what matters.

These are small fragments, not one long program. Later fragments reuse `City`, `Road`, and
`roads` after they have appeared. Each fragment isolates one common Rust spelling.

:::compare Put statements in a program
```python
city = "Logan"
```
:::rust
```rust
fn main() {
    let city = "Logan";
}
```
:::notice
Python permits statements directly in a file. Executable Rust statements live inside a
function such as `main`, and most end with `;`.
:::

:::compare Change a binding
```python
city = "Logan"
city = "Provo"
```
:::rust
```rust
let mut city = "Logan";
city = "Provo";
```
:::notice
Rust bindings are immutable unless `mut` is written. `mut` permits a new value, not a new
type.
:::

:::compare Keep two values in order
```python
road = ("Logan", "Salt Lake City")
reversed_road = ("Salt Lake City", "Logan")

road == reversed_road  # False
```
:::rust
```rust
let road = ("Logan", "Salt Lake City");
let reversed_road = ("Salt Lake City", "Logan");

road == reversed_road  // false
```
:::notice
Both values are tuples. Position matters, so reversing a road produces a different tuple.
:::

:::compare Give the tuple shape a name
```python
road = ("Logan", "Salt Lake City")
```
:::rust
```rust
type City = &'static str;
type Road = (City, City);

let road: Road = ("Logan", "Salt Lake City");
```
:::notice
`Road` is an alias for a tuple shape, not a class or constructor. The `type` lines create no
road and prove nothing about Utah geography. For now, read `&'static str` as “a reference to
a string literal.”
:::

:::compare Keep an ordered, growable sequence
```python
roads = []
roads.append(("Logan", "Salt Lake City"))
roads.append(("Logan", "Provo"))
```
:::rust
```rust
let mut roads: Vec<Road> = Vec::new();
roads.push(("Logan", "Salt Lake City"));
roads.push(("Logan", "Provo"));
```
:::notice
A Python list and a Rust `Vec` are ordered and growable. A `Vec<Road>` may contain only
`Road` values, and duplicates remain duplicates.
:::

:::compare Keep a set of unique roads
```python
roads = set()
roads.add(("Logan", "Salt Lake City"))
roads.add(("Logan", "Salt Lake City"))

count = len(roads)  # 1
```
:::rust
```rust
use std::collections::HashSet;

let mut roads: HashSet<Road> = HashSet::new();
roads.insert(("Logan", "Salt Lake City"));
roads.insert(("Logan", "Salt Lake City"));

let count = roads.len();  // 1
```
:::notice
Both sets collapse duplicate tuples. Neither set promises a useful iteration order.
:::

# Read a generic type

`Vec<T>` describes a family of sequence types. The `T` is a type parameter: a placeholder
for the element type. Writing `Vec<Road>` chooses `Road` for that parameter. `HashSet<T>`
and `Option<T>` use the same idea.

:::compare Choose the element type
```python
city_list: list[str] = [
    "Logan",
    "Provo",
]
road_list: list[tuple[str, str]] = [
    ("Logan", "Provo"),
]
```
:::rust
```rust
let city_list: Vec<City> = vec![
    "Logan",
    "Provo",
];
let road_list: Vec<Road> = vec![
    ("Logan", "Provo"),
];
```
:::notice
`Vec` supplies the reusable container shape; `City` or `Road` supplies its element type.
`Vec<City>` and `Vec<Road>` are different concrete Rust types, and the compiler rejects an
element of the wrong type. Python type annotations describe the intended distinction but do
not enforce it by themselves at runtime.
:::

:::compare Test one candidate
```python
candidate = ("Logan", "Provo")
present = candidate in roads
```
:::rust
```rust
let candidate: Road = ("Logan", "Provo");
let present = roads.contains(&candidate);
```
:::notice
Both expressions produce a Boolean and leave the set unchanged. Rust method syntax borrows
`roads` automatically; `&candidate` explicitly lends the candidate to `contains`.
:::

:::compare Let a function take the set
```python
def is_road(roads, road):
    return road in roads

first = is_road(roads, ("Logan", "Provo"))
second = is_road(roads, ("Ogden", "Logan"))
```
:::rust
```rust
fn is_road(roads: HashSet<Road>, road: Road) -> bool {
    roads.contains(&road)
}

let first = is_road(roads, ("Logan", "Provo"));
let second = is_road(roads, ("Ogden", "Logan"));
//                   ^^^^^ value used after move
```
:::notice
The Python name remains usable here. The Rust parameter asks to own the `HashSet`, so the
first call moves it into the function. The second call is a compiler error, not an empty
database.
:::

:::compare Borrow the set instead
```python
def is_road(roads, road):
    return road in roads

first = is_road(roads, ("Logan", "Provo"))
second = is_road(roads, ("Ogden", "Logan"))
```
:::rust
```rust
fn is_road(
    roads: &HashSet<Road>,
    road: Road,
) -> bool {
    roads.contains(&road)
}

let first = is_road(&roads, ("Logan", "Provo"));
let second = is_road(&roads, ("Ogden", "Logan"));
```
:::notice
`&HashSet<Road>` says the function borrows the set; `&roads` performs that borrow at each
call. Both calls can inspect the same set, and the caller still owns it afterward.
:::

:::compare Separate reading from changing
```python
before = len(roads)
answer = is_road(roads, ("Logan", "Provo"))
after = len(roads)

(before, answer, after)  # (1, False, 1)
```
:::rust
```rust
let before = roads.len();
let answer = is_road(&roads, ("Logan", "Provo"));
let after = roads.len();

(before, answer, after)  // (1, false, 1)
```
:::notice
Calling `is_road` reads the set; `insert` was the operation that changed it. Evaluating a
query does not change its input database. Updates are separate.
:::

:::compare Use a plain loop
```python
count = 0
for _road in roads:
    count += 1
```
:::rust
```rust
let mut count = 0;
for _road in &roads {
    count += 1;
}
```
:::notice
The Rust loop borrows `roads`, so the loop does not consume it. Because `roads` is a set,
neither loop should rely on the order in which roads appear.
:::

# Pass a small operation with a closure

A function can be named once and called later. A closure is an unnamed function-like value
that can be stored, passed to another operation, and use names from its surroundings.

:::compare Write a lambda or closure
```python
origin = "Logan"
destination = lambda road: road[1]
starts_here = lambda road: road[0] == origin

city = destination(("Logan", "Provo"))
answer = starts_here(("Logan", "Provo"))
```
:::rust
```rust
let origin = "Logan";
let destination = |road: &Road| road.1;
let starts_here = |road: &Road| road.0 == origin;

let city = destination(&("Logan", "Provo"));
let answer = starts_here(&("Logan", "Provo"));
```
:::notice
Python spells an unnamed function with `lambda`; Rust calls it a closure and places its
parameters between `|` bars. The final expression is the returned value. Both versions of
`starts_here` capture `origin`. Rust can usually infer closure parameter types when an
operation such as `map` or `filter` supplies the context.
:::

# Build an iterator pipeline

Collections hold values. An iterator describes how to visit them. In Rust, `iter()` borrows
the collection, iterator adaptors such as `map` and `filter` describe a pipeline, and a
consumer such as `collect`, `count`, or `any` drives that pipeline.

:::compare Borrow items with iter
```python
road_iter = iter(roads)
first = next(road_iter, None)
still_here = len(roads)
```
:::rust
```rust
let mut road_iter = roads.iter();
let first: Option<&Road> = road_iter.next();
let still_here = roads.len();
```
:::notice
`iter()` borrows `roads` and produces `&Road` references. The collection stays where it is
and remains usable. `next()` returns `Some(row)` while a row is available and `None` after
the iterator is exhausted.
:::

:::compare Take ownership with into_iter
```python
road_iter = iter(roads)
first = next(road_iter, None)

# Python still keeps roads here.
```
:::rust
```rust
let mut road_iter = roads.into_iter();
let first: Option<Road> = road_iter.next();

// roads.len();  // error: roads was moved
```
:::notice
`into_iter()` moves `roads` into the iterator and produces owned `Road` values. Use it when
the pipeline should take the collection's items. Python iteration has no ownership-taking
counterpart: Python's `iter(roads)` still leaves `roads` usable.
:::

:::compare Transform every item with map
```python
destinations = list(map(
    lambda road: road[1],
    roads,
))
```
:::rust
```rust
let destinations: Vec<City> = roads
    .iter()
    .map(|road| road.1)
    .collect();
```
:::notice
The `|road| road.1` closure says how to transform one row. Rust's `map` is lazy: it
describes the transformation, and `collect` drives the iterator and stores its outputs in
a `Vec`.
:::

:::compare Keep matching items with filter
```python
from_logan = list(filter(
    lambda road: road[0] == "Logan",
    roads,
))
```
:::rust
```rust
let from_logan: Vec<&Road> = roads
    .iter()
    .filter(|road| road.0 == "Logan")
    .collect();
```
:::notice
`filter` keeps an item when its closure returns `true`. Because `iter()` borrowed the
original collection, this `Vec` contains borrowed rows and `roads` remains usable.
:::

:::compare Ask whether an item exists
```python
has_provo = any(
    road[1] == "Provo"
    for road in roads
)
first_to_provo = next(
    (road for road in roads
     if road[1] == "Provo"),
    None,
)
```
:::rust
```rust
let has_provo = roads
    .iter()
    .any(|road| road.1 == "Provo");
let first_to_provo: Option<&Road> = roads
    .iter()
    .find(|road| road.1 == "Provo");
```
:::notice
`any` stops at the first match and returns a Boolean. `find` stops at the first match and
returns `Some(row)`, or `None` when no row matches. `all` is the corresponding “does every
item match?” operation.
:::

:::compare Reduce many items to one value
```python
total = sum(
    len(road[1])
    for road in roads
)
```
:::rust
```rust
let total: usize = roads
    .iter()
    .map(|road| road.1.len())
    .sum();

let same_total = roads.iter().fold(
    0,
    |total, road| total + road.1.len(),
);
```
:::notice
`sum` is a specialized reduction. `fold` carries an accumulator through the iterator and
can express other reductions; `count` simply reports how many items the pipeline produces.
:::

## Common iterator vocabulary

| Purpose | Python spelling | Rust iterator spelling |
| --- | --- | --- |
| Transform each item | `map(f, items)` | `.map(f)` |
| Keep matching items | `filter(p, items)` | `.filter(p)` |
| Run an action for each item | `for item in items: f(item)` | `.for_each(f)` |
| Transform and discard missing results | comprehension with a condition | `.filter_map(f)` |
| Produce several items from each item | nested comprehension | `.flat_map(f)` or `.flatten()` |
| Attach positions | `enumerate(items)` | `.enumerate()` |
| Pair two sequences | `zip(left, right)` | `.zip(right)` |
| Visit one sequence after another | `itertools.chain(left, right)` | `.chain(right)` |
| Ignore or limit a prefix | `itertools.islice(...)` | `.skip(n)` or `.take(n)` |
| Find one matching item | `next((x for x in items if p(x)), None)` | `.find(p)` |
| Test some or all items | `any(...)` or `all(...)` | `.any(p)` or `.all(p)` |
| Reduce items | `sum(...)` or `functools.reduce(...)` | `.sum()` or `.fold(initial, f)` |
| Materialize results | `list(...)` or `set(...)` | `.collect::<Vec<_>>()` or `.collect::<HashSet<_>>()` |

Use `iter()` when the pipeline should read borrowed items and `into_iter()` when it should
own the items. Most adaptors are lazy; consumers such as `next`, `collect`, `find`, `any`,
`all`, `count`, `sum`, and `fold` request results.

# Give a value named fields with a struct

A Rust `struct` defines one fixed shape. Every value of that type has the same named fields,
although the field values may differ.

:::compare Define one record shape
```python
from dataclasses import dataclass

@dataclass(frozen=True)
class Atom:
    relation: str
    arguments: tuple[str, ...]

atom = Atom(
    relation="road",
    arguments=("x", "y"),
)
```
:::rust
```rust
struct Atom {
    relation: &'static str,
    arguments: Vec<&'static str>,
}

let atom = Atom {
    relation: "road",
    arguments: vec!["x", "y"],
};
```
:::notice
`Atom` is the type; `Atom { ... }` constructs one value. Each field is required exactly once,
and `atom.relation` or `atom.arguments` reads a field. A struct groups fields that belong to
the same value; it does not represent a choice among different shapes.
:::

# Represent alternatives with an enum

A data-carrying Rust `enum` is a tagged, disjoint union—a **sum type**—not a subtype
hierarchy. For this syntax tree, the type has the shape

`Expr = Name(String) + Call(String × List(Expr))`.

The `+` means “one of these tagged alternatives”; the `×` means that the fields occur
together. A constructor builds one alternative as an `Expr`. A pattern match reads the tag
and exposes that alternative's payload.

:::compare Define the same AST union
```python
from dataclasses import dataclass

@dataclass(frozen=True)
class Name:
    text: str

@dataclass(frozen=True)
class Call:
    function: str
    arguments: list["Expr"]

Expr = Name | Call  # a union type alias

program: list[Expr] = [
    Name("x"),
    Call("f", [Name("x")]),
]
```
:::rust
```rust
enum Expr {
    Name(String),
    Call {
        function: String,
        arguments: Vec<Expr>,
    },
}

let program: Vec<Expr> = vec![
    Expr::Name(String::from("x")),
    Expr::Call {
        function: String::from("f"),
        arguments: vec![
            Expr::Name(String::from("x")),
        ],
    },
];
```
:::notice
The Python alias `Name | Call` is a union, not a base class. The Rust declaration builds the
corresponding union and its tags into one nominal type. `Expr::Name` and `Expr::Call` are
constructors and variants of `Expr`, not subtypes and not types of their own. A plain Python
`enum.Enum` is not the direct counterpart either: these alternatives carry payloads with
different shapes.
:::

A pattern can recognize the current form and bind names to parts of its payload in one step.

:::compare Match an AST form and bind its fields
```python
from typing import assert_never

def child_count(expr: Expr) -> int:
    match expr:
        case Name(text=_):
            return 0
        case Call(arguments=children):
            return len(children)
        case _ as impossible:
            assert_never(impossible)
```
:::rust
```rust
fn child_count(expr: &Expr) -> usize {
    match expr {
        Expr::Name(_) => 0,
        Expr::Call {
            arguments: children,
            ..
        } => {
            children.len()
        }
    }
}
```
:::notice
Python has supported structural pattern matching with `match` and `case` since Python 3.10,
even if this syntax is unfamiliar. `case Call(arguments=children)` tests the class and binds
its `arguments` field to the new name `children`. The Rust pattern performs the same two
jobs; `_` and `..` ignore parts that are not needed. In Python, `assert_never` asks a strict
type checker to prove that the last case contains no remaining member of the union. Rust
performs exhaustiveness checking directly and reports an error when a variant is missing.
:::

## Why subtyping is the wrong model here

Declaring `Name` and `Call` as subclasses of an `Expr` base class describes an **open**
family, not the closed sum above. Upcasting a node to `Expr` hides its alternative-specific
fields. Recovering them requires runtime narrowing, a partial downcast, virtual methods, or
a visitor. Adding another subclass also does not force every existing case analysis to be
rechecked.

Mutable containers expose another mismatch: a `list[Name]` cannot safely become a
`list[Expr]`, because code holding the latter could insert a `Call`. Strict type checkers
therefore reject that conversion. Declare the heterogeneous container at the union type from
the beginning: Python uses `list[Expr]`; Rust uses `Vec<Expr>`.

For a known AST, do not introduce a Rust trait such as `ExprNode` and
`Vec<Box<dyn ExprNode>>` merely to hold several node forms. Trait objects provide open
polymorphism and dynamic dispatch; an enum directly represents the required closed sum.

Return to [A Little Database, A Bit Rustic](01-a-little-database-a-few-questions.html) and
use this cheat sheet whenever Rust spelling hides the database idea. Finding the spelling
quickly and continuing to read is the skill this page is meant to build.
