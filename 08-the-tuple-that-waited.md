---
title: The Tuple That Waited
subtitle: Conversation 3.2 — Iterators and the State Between Results
author: Modern Query Processing
date: Fall 2026
status: Draft
layout: dialogue
left_speaker: Ada
right_speaker: Alice
previous: [Conversation 3.1 · The Matches the Algebra Did Not Find](07-the-matches-the-algebra-did-not-find.html)
next: [Conversation 3.3 · The Loop That Kept Going](09-the-loop-that-kept-going.html)
---

# The tuple that waited

:::ada
Keep the cinema instance from 3.1. Here it is in physical arrays, with
positions written beside the tuples.

| Position | Movies: Title | Director | Actor |
|---:|---|---|---|
| 0 | filmA | Bergman | actor1 |
| 1 | filmA | Bergman | actor2 |
| 2 | filmB | Other | actor3 |

| Position | Pariscope: Theater | Title | Schedule |
|---:|---|---|---|
| 0 | Champo | filmA | 18:00 |
| 1 | Champo | filmA | 21:00 |
| 2 | Rialto | filmB | 20:00 |

| Position | Location: Theater | Address | Phone |
|---:|---|---|---|
| 0 | Champo | addr1 | phone1 |
| 1 | Rialto | addr2 | phone2 |

This time ask for the actor, showing time, and address:

```text
appearance(c, s, a) :-
    Movies(t, d, c),
    Pariscope(h, t, s),
    Location(h, a, p).
```

How many answers?
:::alice
Five. Each of actor1 and actor2 has two showing times at addr1. Actor3
has one at addr2.

Changing the head made the showings visible. In `theater_address`, several
of these witnesses gave the same answer.
:::

:::reading
**Continuity.** The CINEMA schema comes from AHV, Chapter 3, §3.1.
The small instance and this head are course examples, also used in the
query-execution slides. [Chapter 6](https://webdam.di.ens.fr/Alice/pdfs/Chapter-6.pdf#page=4),
§6.1, pp. 108–109, supplies the indexed-join and cinema-plan background.
:::

:::ada
Use the plan from 3.1: scan Movies, look up Pariscope by Title, then look
up Location by Theater. Call the first join $J_1$ and the second $J_2$.

The consumer wants to inspect one answer, then decide whether to ask for
another. How would you give $J_2$ its input?
:::alice
The algebra gives $J_1$ a relation as its result. So I would first put that
relation in an array, then let $J_2$ read it.
:::

:::ada
Suppose that intermediate has a million matches, and the consumer stops
after the first answer. What did the array strategy commit us to?
:::alice
Producing and storing all million intermediate tuples before $J_2$ could
even start. Much of that work might never be used.

Could $J_2$ ask for just one match now, and another only if it needs it?
:::

:::ada
To find the address for the first showing, which of the other four
matches does $J_2$ need?
:::alice
None. Once $J_1$ has `(filmA,Bergman,actor1,Champo,18:00)`, $J_2$ has
the Theater value it needs.

We could pass that tuple on. But where does $J_1$ wait while $J_2$ uses it?
If I simply restart it on the next request, I will get the same match again.
:::

:::ada
Start with an easier computation. A Movies scan has returned $M_0$.
What must it remember to answer another request?
:::alice
Position 1, the next unread position. It need not copy the whole relation.
:::

:::ada
Write every transition for this three-element array. Let `Some(u)` mean
one returned tuple and `None` mean exhaustion. Return the new position
alongside the result.
:::alice
| Old position | Result | New position |
|---:|---|---:|
| 0 | `Some(M₀)` | 1 |
| 1 | `Some(M₁)` | 2 |
| 2 | `Some(M₂)` | 3 |
| 3 | `None` | 3 |

Position 3 stays at 3. Another request cannot invent another movie.
:::

:::ada
Replace Movies by a fixed array $R$ of length $n$, including $n=0$.
:::alice
The state is $i\in\{0,\ldots,n\}$, initially 0, and

$$
\operatorname{next}_R(i)=
\begin{cases}
(\operatorname{Some}(R_i),i+1),&i<n,\\
(\operatorname{None},n),&i=n.
\end{cases}
$$

With an empty array, the first request is already the second case.
:::

:::definition An initialized iterator (course contract)
An **iterator** for values of type $A$ has a private state space $S$, an
initial state $s_0\in S$, and an operation

$$
\operatorname{next}:S\longrightarrow\operatorname{Option}(A)\times S,
$$

Here $\operatorname{Option}(A)$ contains `None` and one `Some(a)` for
each $a\in A$.

Inputs are finite and fixed, calls are synchronous, and `None` means
permanent exhaustion. Correctness additionally requires that the returned
sequence enumerate the intended results. The type alone does not establish
that requirement. Writing `cursor.next()` hides the state inside `cursor`.
:::

:::reading
**Paper basis; course formalization.** Graefe,
[Volcano—An Extensible and Parallel Query Evaluation System](https://people.eecs.berkeley.edu/~prabal/teaching/resources/eecs582/graefe94volcano.pdf#page=5),
§III.B, pp. 124–126, gives operator instances their own state records and
composes them through streams. The state-transition type above is our
presentation of the finite synchronous case.
:::

:::ada
Now open the Title lookup for filmA. Its matching Pariscope positions are
$K=[0,1]$. What is its state?
:::alice
An offset $q$ in that sequence: 0, then 1, then 2 for exhaustion.
At offset $q<2$, it fetches $P_{K[q]}$ and advances $q$.
:::

:::ada
For filmB, $K=[2]$. Is its initial state 2?
:::alice
No. Its initial offset is 0. The first fetch is $P_{K[0]}=P_2$.

The position inside the match list and the position inside Pariscope are
different numbers.
:::

:::ada
Does an arbitrary Pariscope iterator let us ask for filmB?
:::alice
It only promises the next result of the computation it already represents.
We need an additional operation that accepts a Title and starts the right
computation.
:::

:::definition Keyed access and its result iterator
The Title index supplies the course operation

$$
\begin{gathered}
\operatorname{lookup}_P:\operatorname{TitleValue}\\
\longrightarrow\operatorname{Iterator}(\operatorname{Tuple}(P)).
\end{gathered}
$$

For key $k$, the returned iterator enumerates exactly
$\sigma_{\mathrm{Title}=k}(P)$. With matching-ID sequence $K$, its
state is $q\in\{0,\ldots,|K|\}$, initially 0. It returns $P_{K[q]}$
and advances when $q<|K|$, and stays exhausted at $q=|K|$.

Keyed lookup is an access capability. It is additional to `next`.
The sequence $K$ may itself be exposed lazily by an index.
:::

:::ada
$J_1$ has just returned $M_0\bowtie P_0$. Can it now forget $M_0$?
:::alice
Yes, the Movies scan has moved to position 1.
:::

:::ada
Who will produce $M_0\bowtie P_1$?
:::alice
Oh. $J_1$ still owes actor1 the 21:00 showing. It must keep $M_0$ while
the Title lookup advances.

Its child scan is already past $M_0$, but its own work with $M_0$ is not
finished.
:::

:::ada
Give $J_1$ three possible situations: it needs an outer tuple, it is
matching a retained outer tuple, or it is done. What happens in each?
:::alice
In **Need**, request the next Movies tuple. If there is one, retain it and
initialize its Title lookup. Otherwise become **Done**.

In **Match**, request the next tuple of that lookup. Return the combined
tuple if there is one. Otherwise return internally to **Need**.

In **Done**, return `None`.
:::

:::ada
Suppose an outer movie has no showing. Should that failed lookup make
$J_1$ return `None`?
:::alice
No. Other movies may still have showings. One call to $J_1$ must continue
through empty lookups until it finds a result or exhausts its outer input.
:::

:::definition Indexed nested-loop iterator
The chosen join keeps an outer iterator, a keyed access function, and
private progress. The following pseudocode describes an already initialized
instance. `combine` forms the compatible union of the named tuples.

```text
next():
    loop:
        if state is Done:
            return None
        if state is Need:
            match outer.next():
                None:
                    state = Done
                Some(u):
                    inner = lookup(key(u))
                    state = Match(u, inner)
        else if state is Match(u, inner):
            match inner.next():
                None:
                    state = Need
                Some(v):
                    return Some(combine(u, v))
```

The state and algorithm belong to this join implementation. Other operators
can implement the same result interface with different state.
Initialization sets `state = Need`; `key` selects the shared Title value
for $J_1$ and the shared Theater value for $J_2$.
:::

:::ada
Now use $J_1$ as $J_2$'s outer iterator. What changes in that definition?
:::alice
The outer child becomes $J_1$. The retained tuple now contains both movie
and showing attributes. Its Theater initializes a Location lookup.

$J_2$ can use the same algorithm without knowing how $J_1$ produces tuples.
:::

:::ada
Request the first answer, then the second. Record the source positions
used and what remains pending.
:::alice
| Request | Witness | Pending work after the return |
|---:|---|---|
| 1 | $(M_0,P_0,L_0)$ | $J_1$ retains $M_0$, next Title-match offset 1; $J_2$'s current Location lookup is exhausted |
| 2 | $(M_0,P_1,L_0)$ | $J_1$ retains $M_0$, next Title-match offset 2; $J_2$'s new Location lookup is exhausted |

The answers are `(actor1,18:00,addr1)` and `(actor1,21:00,addr1)`.
The second request did not advance the Movies scan.
:::

:::ada
And the third?
:::alice
The exhausted Location lookup sends $J_2$ back to $J_1$. Its exhausted
Title lookup makes $J_1$ request $M_1$, then initialize another filmA
lookup at offset 0.

The witness is $(M_1,P_0,L_0)$, giving `(actor2,18:00,addr1)`.
The same Title does not make the two actors interchangeable.
:::

:::ada
What whole intermediate relation did we store?
:::alice
None. Each join retained its current outer tuple and inner progress.
The indexes and backing arrays already existed.

The relation denoted by $J_1$ is still well defined, even though we never
put all of it in one array.
:::

:::ada
Now the consumer wants all five matches. It calls $J_1$ five times for
tuples and once more to discover exhaustion. Suppose each return crosses
an operator boundary with some fixed overhead. How could we cross that
boundary less often without collecting the entire result?
:::alice
Return a bounded group of results per request. We would keep the ability
to resume, but share that overhead among several tuples.

We would also make the caller wait for a group. The useful group size
depends on the consumer and the implementation.
:::

:::ada
Use a capacity of three. Where does the first group end?
:::alice
Its matching source-position pairs are

```text
batch 1: (0,0), (0,1), (1,0)
batch 2: (1,1), (2,2)
```

After batch 1, $M_1$ still has one showing left. The batch boundary must
save that pending match. Two calls return data, and a third discovers
exhaustion, under this same explicit end-of-stream protocol.
:::

:::ada
Call such a group a **batch**. Did it reduce the number of movie–showing
matches that the query requires?
:::alice
No. All five remain. The change amortizes the boundary overhead; it does
not remove a relational result or guarantee a lower total running time.
:::

:::ada
Does collecting three scalar results already make the computation
vectorized?
:::alice
It changes the unit passed to the caller. To compute over column vectors,
we must also change the work inside the batch.

And a final batch can be short. We cannot throw away its two results.
:::

:::reading
**Teaching comparison.** CMU 15-721,
[Query Execution and Processing I](https://15721.courses.cs.cmu.edu/spring2024/notes/04-execution1.pdf),
§§4–6, compares processing units and selection representations. Our batch
trace retains the indexed algorithm and its pending matches.
:::

:::ada
Suppose Pariscope has no index. Could a hash join still offer `next`?
:::alice
Yes, after building a temporary table. Its private state would include
that table as well as its probe progress.

The interface does not promise that preparation is cheap, or that every
join uses an index supplied beforehand.
:::

:::ada
Our consumer stops after two answers. The operator still owns its temporary
table and open input. If it releases them only when `next` reaches `None`,
what happens?
:::alice
The consumer will never make that call. We need a separate way to release
resources when it stops early.

Preparation must happen before the first request, and cleanup must be
possible without requesting another result.
:::

:::ada
Volcano names those operations `open` and `close`. Does `close` mean
“run the query to exhaustion”?
:::alice
No. It means release the resources this instance owns. Exhaustion and
cleanup are different events.
:::

:::definition Lifecycle in the course model
Open an instance, request zero or more results, and close it. Closing is
allowed before exhaustion. A closed instance cannot be resumed without
separate initialization. Opening a build-then-probe hash join may consume
its entire build input. Real systems also need protocols for errors and
temporary blocking, which our `Some`/`None` model omits.
:::

:::ada
One last change. Location gains another tuple for Champo, with a different
address. What must $J_2$ do after returning the first address?
:::alice
Keep its current $J_1$ tuple and finish that Location lookup before asking
$J_1$ for another showing. Otherwise it loses the second address.

Every level has its own unfinished work.
:::

:::ada
If we return to the old head `(h,a)`, can projection simply return one
pair for every witness?
:::alice
That would repeat `(Champo,addr1)` four times. Our relations are sets, so
the result still needs duplicate elimination.

Streaming the witnesses did not change what projection means.
:::

:::recap Resumable evaluation
A pull plan lets a consumer request the next result of an operator. Each
operator retains the progress needed to resume. A request may cause many
internal reads and may pass through several children before producing one
result. An empty inner lookup is not exhaustion of the enclosing join.

For the chosen indexed plan, keyed access initializes an inner iterator,
and the join retains its outer tuple until that iterator ends. Composition
does not require materializing each logical intermediate. Batch boundaries
must preserve the same unfinished work. Access capabilities, join algorithms,
processing units, and lifecycle protocols remain distinct choices, all
subject to the query's original set semantics.
:::
