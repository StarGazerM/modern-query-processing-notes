---
title: The Matches the Algebra Did Not Find
subtitle: Conversation 3.1 — From a Bound Selection to an Index
author: Modern Query Processing
date: Fall 2026
status: Draft
layout: dialogue
left_speaker: Ada
right_speaker: Alice
previous: [Conversation 2.5 · The Order the Compiler Chose](06-the-order-the-compiler-chose.html)
next: [Conversation 3.2 · The Tuple That Waited](08-the-tuple-that-waited.html)
---

# The matches the algebra did not find

:::ada
Our textbook keeps its running examples in a small cinema database. Here
are its three relations; call them $M$, $P$, and $L$.

**Movies**

| Title | Director | Actor |
|---|---|---|
| filmA | Bergman | actor1 |
| filmA | Bergman | actor2 |
| filmB | Other | actor3 |

**Pariscope**

| Theater | Title | Schedule |
|---|---|---|
| Champo | filmA | 18:00 |
| Champo | filmA | 21:00 |
| Rialto | filmB | 20:00 |

**Location**

| Theater | Address | Phone |
|---|---|---|
| Champo | addr1 | phone1 |
| Rialto | addr2 | phone2 |

The book asks for the names and addresses of theaters featuring a Bergman
film. Drop Bergman for now: which theaters show a film, and what are their
addresses? Write the CQ. Use $t,d,c$ for a movie's Title, Director, and
Actor; $h,s$ for a showing's Theater and Schedule; and $a,p$ for an
Address and Phone.
:::alice
```text
theater_address(h, a) :-
    Movies(t, d, c),
    Pariscope(h, t, s),
    Location(h, a, p).
```

$t$ connects a movie to its showings, and $h$ connects a showing's
theater to its address.
:::

:::reading
**Book example and query.** Abiteboul, Hull, and Vianu,
[Foundations of Databases, Chapter 3](https://webdam.di.ens.fr/Alice/pdfs/Chapter-3.pdf#page=3),
§3.1, pp. 29–31, Figure 3.1, introduces the CINEMA database.
[Chapter 4](https://webdam.di.ens.fr/Alice/pdfs/Chapter-4.pdf#page=2),
§4.1, p. 38, lists query (4.4) about theaters featuring a Bergman film,
and Example 4.1.1, p. 39, writes it as a rule. Our query drops the
constant; the tuples are our small illustrative instance.
:::

:::ada
Start with the first two atoms. Match `Movies(t, d, c)` against the first
Movies tuple,

$$
u=\langle \mathrm{Title}{:}\ \mathrm{filmA},\ \mathrm{Director}{:}\ \mathrm{Bergman},\ \mathrm{Actor}{:}\ \mathrm{actor1}\rangle .
$$

What does the second atom then ask for?
:::alice
The atom reads $u$'s Title into $t$, its Director into $d$, and its
Actor into $c$:

$$
\nu=\{t/\mathrm{filmA},\ d/\mathrm{Bergman},\ c/\mathrm{actor1}\}.
$$

Then `Pariscope(h, t, s)` asks for the showings of filmA:

$$
\sigma_{\mathrm{Title}=\nu(t)}(P)=\sigma_{\mathrm{Title}=\mathrm{filmA}}(P),
$$

the two Champo showings.
:::

:::reading
**Book notation.** Abiteboul, Hull, and Vianu,
[Foundations of Databases, Chapter 3](https://webdam.di.ens.fr/Alice/pdfs/Chapter-3.pdf#page=5),
§3.2, p. 32, writes $u(A)$ for the value of attribute $A$ in a named tuple
$u$. [Chapter 4](https://webdam.di.ens.fr/Alice/pdfs/Chapter-4.pdf#page=5),
§4.2, p. 41, defines valuations, and pp. 45–46 write them with slashes.
Example 4.1.1 phrases query (4.4) first with tuples of the three relations
and then with variables: the same distinction as $u$ and $\nu$ here.
:::

:::ada
Good. Now pretend I am the computer. Where do I get those two showings?
:::alice
From $P$, of course.

Hmm. The selection says which tuples to return. It does not say where
they are. How does the computer find them?
:::

:::ada
The simplest way: read every stored Pariscope tuple and test its Title.
:::alice
- `(Champo,filmA,18:00)`: yes
- `(Champo,filmA,21:00)`: yes
- `(Rialto,filmB,20:00)`: no

Three tests, two matches.
:::

:::ada
Could you have stopped after the first yes?
:::alice
No. The second showing was still coming.

After the second yes, I would have lost nothing here. But I know that only
because I tested the third tuple.
:::

:::ada
Reading and testing every stored tuple is a **scan**. Does a scan return
exactly $\sigma_{\mathrm{Title}=\mathrm{filmA}}(P)$?
:::alice
Yes. Every tuple it keeps passes the test, and it tests every tuple.

But with a million showings, that is a million tests for one movie.
:::

:::definition Scan
A **scan** of a stored relation $r$ reads every stored tuple of $r$.
Testing $t(A)=a$ on each tuple it reads returns exactly
$\sigma_{A=a}(r)$.
:::

:::reading
**Book basis.** Abiteboul, Hull, and Vianu,
[Foundations of Databases, Chapter 6](https://webdam.di.ens.fr/Alice/pdfs/Chapter-6.pdf#page=3),
§6.1, p. 107, realizes selection by a scan of the argument relation, in
linear time. Garcia-Molina, Ullman, and Widom, *Database System
Implementation*, §6.2.1, calls reading all the stored tuples of a relation
a table-scan.
:::

:::ada
Now take the second Movies tuple, `(filmA,Bergman,actor2)`.
:::alice
It gives $\nu=\{t/\mathrm{filmA},\ d/\mathrm{Bergman},\ c/\mathrm{actor2}\}$:
filmA again. We already found its showings, so we can skip this one.
:::

:::ada
Count the valuations of the first two atoms if we skip it.
:::alice
`actor1` gives two and `actor3` gives one: three. But the first two atoms
have five valuations, one for each tuple of $M\bowtie P$.

Oh. `actor2` needs both showings too. I cannot skip the tuple. I only
want to skip the search.
:::

:::ada
Here is Pariscope again, with a second table beside it.

**Pariscope**

| Theater | Title | Schedule |
|---|---|---|
| Champo | filmA | 18:00 |
| Champo | filmA | 21:00 |
| Rialto | filmB | 20:00 |

**Second table**

| Title | Pariscope tuples |
|---|---|
| filmA | `(Champo,filmA,18:00)`, `(Champo,filmA,21:00)` |
| filmB | `(Rialto,filmB,20:00)` |
:::alice
What is the second table? It holds the same showings, grouped by Title.
:::

:::ada
It is an **index** on Title. You give it a Title value, called its
**search key**. A **lookup** returns every stored tuple with that Title,
without testing the others.
:::alice
So when the second atom has $t$ bound, I look up $\nu(t)$. For `actor2`,
I look up filmA and get both showings. No tests.
:::

:::ada
Look up filmB.
:::alice
One showing: `(Rialto,filmB,20:00)`.

And filmC? There is no filmC row.
:::

:::ada
What is $\sigma_{\mathrm{Title}=\mathrm{filmC}}(P)$?
:::alice
Empty. So returning nothing is the right answer, not a failure.
:::

:::ada
Suppose the index kept only one showing per Title:

| Title | Pariscope tuples |
|---|---|
| filmA | `(Champo,filmA,18:00)` |
| filmB | `(Rialto,filmB,20:00)` |

Is it still an index on Title?
:::alice
Its filmA lookup returns one showing, but
$\sigma_{\mathrm{Title}=\mathrm{filmA}}(P)$ has two. So `actor1` gets one
valuation instead of two.

`theater_address` still finds Champo through the 18:00 showing. But a query
that also asked for the schedule would lose 21:00. No: a lookup must
return every tuple with that Title.
:::

:::ada
Every tuple, and nothing else.
:::alice
Does a search key have to pick out one tuple, like a key of the relation?
:::

:::ada
Look at filmA.
:::alice
Two tuples. So Title is a search key for this index, but not a key of
Pariscope.
:::

:::ada
Now delete the index. What happens to $P$? To
$\sigma_{\mathrm{Title}=\mathrm{filmA}}(P)$?
:::alice
Nothing happens to either. $P$ still has three tuples, and the selection
still has two. Only my work changes: I would scan again.

So the index is not part of $P$. It sits beside it.
:::

:::ada
Was it free?
:::alice
No. Building it took one scan, and keeping it takes space. If a showing is
added to Pariscope, the index must change too.
:::

:::definition Index and search key
An **index** is a data structure that takes a value for one or more
attributes of a stored relation, its **search key**, and finds the stored
tuples having that value. A search key need not be a key of the relation:
several tuples may share one search-key value.

For an index on attribute $A$ of a stored relation $r$, a lookup with key
$k$ must return exactly the tuples of

$$
\sigma_{A=k}(r)=\{\,t\in r\mid t(A)=k\,\},
$$

possibly none.
:::

:::reading
**Book definitions; course restatement.** Garcia-Molina, Ullman, and
Widom, *Database System Implementation*, §4.1, defines an index and its
search key, including search keys shared by several records (§4.1.5);
§4.2 treats secondary indexes, whose search key does not determine how the
relation is stored. Abiteboul, Hull, and Vianu,
[Foundations of Databases, Chapter 4](https://webdam.di.ens.fr/Alice/pdfs/Chapter-4.pdf#page=21),
§4.4, p. 57, defines the selection $\sigma_{A=a}$. Stating the lookup
contract as that selection is our restatement.
:::

:::ada
The third atom, `Location(h, a, p)`, will want an index too, and Pariscope
might also need one on Theater.
:::alice
Then does every index keep its own copy of the tuples? That seems
wasteful.
:::

:::ada
Keep one copy. Store the showings in an array, and let each index
remember where its tuples are:

**Stored Pariscope**

| Row ID | Theater | Title | Schedule |
|---:|---|---|---|
| 0 | Champo | filmA | 18:00 |
| 1 | Champo | filmA | 21:00 |
| 2 | Rialto | filmB | 20:00 |

**Index on Title**

| Title | Row IDs |
|---|---|
| filmA | 0, 1 |
| filmB | 2 |

Look up filmA.
:::alice
Row IDs 0 and 1. That is not a showing yet.

I still have to read the array at 0 and 1 to get `(Champo,filmA,18:00)`
and `(Champo,filmA,21:00)`.
:::

:::ada
Right. Now a lookup finds **row IDs**, and a **fetch** reads the stored
tuple at a row ID.

Write the index on Theater.
:::alice
| Theater | Row IDs |
|---|---|
| Champo | 0, 1 |
| Rialto | 2 |

Both indexes point into the same array. The showings are stored once.
:::

:::ada
Is Row ID an attribute of Pariscope?
:::alice
It is a column in the table, so yes?
:::

:::ada
Store the same three showings in the reverse order.
:::alice
Now `(Rialto,filmB,20:00)` is at 0, and the filmA showings are at 1 and 2.
Pariscope is still the same set of three showings.

So a row ID is not an attribute. It records where this array put a tuple.
And both indexes are now wrong: they still point to the old places.
:::

:::ada
An index can instead keep the rest of each matching tuple:

| Title | (Theater, Schedule) |
|---|---|
| filmA | `(Champo,18:00)`, `(Champo,21:00)` |
| filmB | `(Rialto,20:00)` |

What does a lookup need now?
:::alice
No fetch. The lookup already has Theater and Schedule, and the Title is
the search key itself.

But this index copies the rest of every tuple, which is what I worried
about. Which design is right?
:::

:::ada
Both return the same tuples for every search key. Row IDs pay with a
fetch after each lookup. Copies pay with space and with another update
whenever a showing changes.
:::alice
So the design changes the work, not the answer.
:::

:::definition Row ID and fetch (course terms)
A **row ID** names where one representation of a relation stores a tuple.
It is not an attribute of the relation: storing the same tuples in another
order changes their row IDs, not the relation. A **fetch** returns the
stored tuple at a row ID.

An index whose entries hold row IDs answers a lookup in two steps: find the
row IDs for the search key, then fetch their tuples. An index may instead
keep the remaining attributes of each matching tuple and skip the fetch.
:::

:::reading
**Course terms; book basis.** Garcia-Molina, Ullman, and Widom, *Database
System Implementation*, §3.3, represents block and record addresses, and
§4.2 builds secondary indexes whose entries point to records; §4.2.3 adds
a level of indirection for repeated search-key values. "Row ID" is our
name for such an address.
:::

:::ada
Back to the first two atoms. Find all their valuations with the index on
Title.
:::alice
For each Movies tuple, the first atom binds $t$. I look up $\nu(t)$, fetch
each row, and extend $\nu$:

| Movies tuple | $\nu(t)$ | Row IDs | Valuations |
|---|---|---|---:|
| `(filmA,Bergman,actor1)` | filmA | 0, 1 | 2 |
| `(filmA,Bergman,actor2)` | filmA | 0, 1 | 2 |
| `(filmB,Other,actor3)` | filmB | 2 | 1 |

Five valuations, one for each tuple of $M\bowtie P$.
:::

:::ada
Count your work, and compare it with scanning Pariscope for each Movies
tuple.
:::alice
With the index: 3 lookups and 5 fetches, and no Title test on Pariscope.
With scans: 3 scans of 3 tuples, so 9 tests.

Is 3 plus 5 less than 9?
:::

:::ada
What would you be adding?
:::alice
A lookup, a fetch, and a test. Those are different operations.

Then I should not add them. The index made 3 lookups and 5 fetches; the
scans made 9 tests.
:::

:::definition Indexed nested-loop join (book algorithm)
Let $I_1$ and $I_2$ share exactly one attribute $A$, and let $I_2$ have an
index on $A$. For each $u\in I_1$, look up $u(A)$ and, for each returned
$v$, emit $u\bowtie v$. The emitted tuples are

$$
\{\,u\bowtie v\mid u\in I_1,\ v\in\sigma_{A=u(A)}(I_2)\,\}=I_1\bowtie I_2 .
$$

$I_1$ is the **outer** relation and $I_2$ the **inner** relation.
:::

:::reading
**Book algorithm.** Abiteboul, Hull, and Vianu,
[Foundations of Databases, Chapter 6](https://webdam.di.ens.fr/Alice/pdfs/Chapter-6.pdf#page=4),
§6.1, pp. 107–108, gives the nested loop over $u\in I_1$ and $v\in I_2$
and its variant that replaces the inner loop by indexed retrievals of the
tuples matching $u$; §4.4, pp. 57–58, defines natural join. Garcia-Molina,
Ullman, and Widom, *Database System Implementation*, §6.7.3, joins by
using an index.
:::

:::ada
In `theater_address`, $t$ sits in Pariscope's Title position, so the
lookup is on Title. Now try a query where one variable sits in two
different positions, over a fresh directed relation; SLC is Salt Lake
City.

**edge**

| Row ID | src | dst |
|---:|---|---|
| 0 | Logan | Ogden |
| 1 | Logan | Tremonton |
| 2 | Ogden | SLC |
| 3 | Tremonton | SLC |

```text
two_hop(x, z) :-
    edge(x, y),
    edge(y, z).
```

The first atom has matched row 0, giving the valuation
$\nu=\{x/\mathrm{Logan},\ y/\mathrm{Ogden}\}$. What does the second atom
look up?
:::alice
$y$ was the `dst` of the first edge. So an index on `dst`, with search key
Ogden.
:::

:::ada
Read the second atom again.
:::alice
`edge(y, z)`. Here $y$ is in the first position, `src`. The second atom
wants edges that start at Ogden.

So the index is on `src`, with search key $\nu(y)=\mathrm{Ogden}$. It
returns row 2, `(Ogden,SLC)`, and extends the valuation to
$\nu\cup\{z/\mathrm{SLC}\}$.
:::

:::ada
One variable, two stored attributes. What decided which one?
:::alice
The atom being matched. The position of $y$ in that atom names the stored
attribute. The variable alone says nothing about columns.
:::

:::ada
Finish all four tuples of the first atom.
:::alice
| First atom row | $\nu(y)$ | Lookup on `src` | Adds |
|---:|---|---|---|
| 0 | Ogden | 2 | $z/\mathrm{SLC}$ |
| 1 | Tremonton | 3 | $z/\mathrm{SLC}$ |
| 2 | SLC | none | — |
| 3 | SLC | none | — |

Four lookups, two fetches, and two valuations, one through Ogden and one
through Tremonton. Both give `(Logan,SLC)`, so `two_hop` has one answer.
:::

:::ada
Now bind both positions:

```text
return_trip(a) :-
    edge(a, b),
    edge(b, a).
```

After the first atom matches row 0, what does the second atom ask?
:::alice
$\nu=\{a/\mathrm{Logan},\ b/\mathrm{Ogden}\}$, so the second atom is
`edge(Ogden, Logan)`. Both positions are known.

Nothing is left to find. I only ask whether `(Ogden,Logan)` is stored. It
is not.
:::

:::ada
And an atom with no bound position, like the first atom of `two_hop`?
:::alice
Nothing to look up with. I scan.

So the bound positions decide: none bound, scan; some bound, look up on
their stored attributes; all bound, test one tuple.
:::

:::definition Access to an atom (course definition)
Let an atom $r(t_1,\ldots,t_n)$ be matched under a valuation $\nu$. A
position $i$ is **bound** when $t_i$ is a constant or a variable in the
domain of $\nu$. The atom reads the stored relation $r$ by

- a **scan** when no position is bound;
- a **lookup** on the attributes at the bound positions when some, but not
  all, positions are bound, with the search key given by those constants
  and $\nu$;
- a **membership test** for one tuple when every position is bound.

Each returns exactly the stored tuples that agree with the atom at its
bound positions. A variable repeated inside the atom still needs its own
equality test, as in 1.3.
:::

:::reading
**Course definition; book basis.** Abiteboul, Hull, and Vianu,
[Foundations of Databases, Chapter 4](https://webdam.di.ens.fr/Alice/pdfs/Chapter-4.pdf#page=5),
§4.2, Definition 4.2.1, p. 41, defines rule atoms and valuations;
pp. 45–46 write $\nu\cup\{x/c\}$ for extending a valuation. The bound
positions are where 2.2's sideways information enters an atom.
:::

:::ada
Classify the three atoms of `theater_address`, matched in written order.
:::alice
`Movies(t, d, c)`: nothing is bound, so scan.

`Pariscope(h, t, s)`: $t$ is bound in the second position, so look up
Pariscope on Title with $\nu(t)$.

`Location(h, a, p)`: $h$ is bound in the first position, so look up
Location on Theater with $\nu(h)$.

With the right indexes, only the first atom scans. Should every relation
keep an index on every attribute, then?
:::

:::ada
Try a separate illustration: 100 Movies tuples, each with a different
Title. Director A directs 80 of them, Bergman 2, and Director B 18.
Movies has an index on Director. Compare

```text
bergman_films(t) :-
    Movies(t, "Bergman", c).

director_a_films(t) :-
    Movies(t, "Director A", c).
```

How does each atom read Movies, and how much work does it take?
:::alice
Each atom has a constant in the Director position, so each looks up the
index on Director. A scan would test 100 tuples for either query.

For `bergman_films`: 1 lookup and 2 fetches. For `director_a_films`: 1
lookup and 80 fetches. The lookup avoids the 100 tests, but I still fetch
80 tuples, one row ID at a time.
:::

:::ada
The scan reads the array in order. The 80 fetches may jump anywhere in it,
and a large relation lives on many disk pages. Which would you choose?
:::alice
It depends on how many tuples match and where they sit. The index finds
the group; it does not make the group smaller.

And every index has to be built and kept up to date, even for queries
that never use it.
:::

:::reading
**Book basis.** Abiteboul, Hull, and Vianu,
[Foundations of Databases, Chapter 6](https://webdam.di.ens.fr/Alice/pdfs/Chapter-6.pdf#page=2),
§6.1, pp. 106–107, notes that a selection with many results may take two
or three page fetches per output tuple unless the relation is clustered,
and that indexes and clusterings must be maintained as the database
changes. Garcia-Molina, Ullman, and Widom, *Database System
Implementation*, §6.7.1, distinguishes clustering and nonclustering
indexes. The 100-tuple instance is a course illustration.
:::

:::ada
Scan, lookup with fetches, lookup with stored attributes, membership test.
Did any of them change an answer in this conversation?
:::alice
No. Only the index with one showing per Title did, and it did not return
exactly the selection. The correct ones changed only the work: tests,
lookups, fetches, space, and updates.
:::

:::law Access independence (course law)
Any two access methods that return exactly the same tuples for every
request can replace each other in a plan without changing its answer on
any input. They may differ in the work they perform and in the structures
that must be built and maintained.
:::

:::reading
**Course law; book basis.** Abiteboul, Hull, and Vianu,
[Foundations of Databases, Chapter 6](https://webdam.di.ens.fr/Alice/pdfs/Chapter-6.pdf#page=2),
§6.1, pp. 106–107, separates the physical level—generating, manipulating,
and combining streams of tuples—from the query's meaning, and uses B-trees
and hash indexes to reduce the size of those streams. The law is our
statement for access methods of a principle this course keeps: a physical
choice may change the work, never the answer.
:::

:::ada
Our index on Title has two search keys. Suppose it had a million. How
would a lookup find the entry for filmA?
:::alice
If it checked the search keys one by one, that would be a scan of the
index. The index needs its own way to find an entry without checking
every key.
:::

:::recap The matches the algebra did not find
Matching a CQ's atoms binds variables, and a bound variable turns the next
atom into a selection on its stored relation. In `theater_address`,
matching `Movies(t, d, c)` binds $t$, and `Pariscope(h, t, s)` then needs

$$
\sigma_{\mathrm{Title}=\nu(t)}(P)=\{\,v\in P\mid v(\mathrm{Title})=\nu(t)\,\}.
$$

The selection states which stored tuples are required; it does not state
how to find them. A scan tests every stored tuple and returns exactly the
selection. An index on $A$ takes a search-key value $k$ and returns
exactly the tuples of $\sigma_{A=k}(r)$, possibly none; a search key need
not be a key of the relation. An index that returns fewer tuples loses
valuations, even when a projection happens to hide the loss.

When index entries hold row IDs, a lookup finds row IDs and a fetch reads
the stored tuples there. Row IDs belong to a representation: storing the
same tuples in another order changes them without changing the relation.
An index may instead keep the remaining attributes of each matching tuple,
trading the fetch for space and additional updates.

For outer $I_1$, inner $I_2$, and a single shared attribute $A$, the
indexed nested-loop join computes

$$
I_1\bowtie I_2=\{\,u\bowtie v\mid u\in I_1,\ v\in\sigma_{A=u(A)}(I_2)\,\}.
$$

Every outer tuple issues its own lookup, even when its search key repeats.

The atom being matched decides the access. Under a valuation $\nu$,
positions holding constants or variables in the domain of $\nu$ are bound.
No bound position means a scan, some mean a lookup on the attributes at
those positions, and all mean a membership test. The stored attribute
comes from the variable's position in that atom, not from the variable.

Access methods that return exactly the same tuples for every request are
interchangeable without changing any answer. They differ in tests,
lookups, fetches, space, and maintenance, which we count separately rather
than add.
:::
