# Notes continuation and source review

October 12, 2026

The four requested subjects are developed as six draft conversations. Pull and
push need separate operational arguments, and WCOJ needs an output-bound
conversation before an algorithm can earn an optimality claim. The sequence
continues 3.1 in the repository's Ada–Alice format. These are reading units;
their numbering does not change the calendar or assign six new meetings.

### Slide coverage and narrative decisions

| Existing material inspected | What the continuation carries forward | What the note must supply |
|---|---|---|
| Native `08-query-execution.key`, 27 slides, including presenter notes; rendered interface and two-call trace | The cinema arrays, five distinct `appearance` answers, keyed access, private join state, batching, and separate lifecycle | [3.2](../08-the-tuple-that-waited.md) makes Alice lose a pending showing before deriving retained state. It distinguishes a match-list offset from a base row ID. |
| Execution deck's closing control-direction discussion and Neumann reference | Pull/push is independent of join algorithm, batch size, and physical layout | [3.3](../09-the-loop-that-kept-going.md) first changes runtime control for the fixed indexed plan, then derives code generation with a simpler selection. `produce`/`consume` remains a compiler-side interface. |
| `10-physical-semijoin.pptx`, all 14 slide texts and speaker notes; inspected scalar-filter and zone-map previews | Keys `{20,40}`, multiplicity of witnesses, internal retry, selection positions, range filters, zone maps, Bloom candidates | [3.4](../10-the-rows-we-did-not-need.md) separates exact support from conservative evidence and explains what each rejection actually avoids. |
| `09-join-planning.pptx`, 17 slide texts; existing design record | Relation-valued IDs express dependencies without fixing storage; atom and variable identities remain separate | [4.1](../11-the-tuples-that-found-a-whole-answer.md) uses fresh reduced-relation names and includes a stale-support-index counterexample. |
| All five reserved Yannakakis slide texts and speaker notes, plus Conversation 2.5 | Join-tree condition, two passes, the D–S–N program, and cyclic boundary | [4.1](../11-the-tuples-that-found-a-whole-answer.md) adds actual removed tuples, upward and downward invariants, preservation, tree-guided enumeration, and a scoped cost proof. |
| Conversation 2.5's scaled road example and the CQ-zoo design record | Every plain first binary join can make `k²+k` dead candidates; Loomis–Whitney is already a familiar query family | [4.2](../12-the-answers-we-might-have-to-write.md) derives the triangle bound and tests fractional covers. [4.3](../13-the-variable-all-the-atoms-could-accept.md) then derives prefix intersections and traces physical trie navigation. |

No separate completed push-compilation or WCOJ deck was found among these
course files. Their notes are new derivations grounded in the papers and the
existing examples, rather than transcriptions of an assumed earlier deck.

One terminology repair remains for a future slide edit: native execution slide
11 is titled **Two Calls Through the Join Tree**, but its picture and trace
concern the binary operator tree. Use **Two Calls Through the Operator Tree**
there to reserve *join tree* for the structural condition taught later. The
deck itself was not edited during this notes pass.

### Writing and teaching method

The current README, 3.1, and 2.5 are the immediate style references. Each new
mechanism answers a difficulty in a computation the reader already knows.
Ada supplies enough concrete evidence for Alice to work out that difficulty
and propose or assess a repair. A correct but expensive strategy can motivate
the next idea just as well as a wrong answer; Alice need not forget a previously
established definition to keep the conversation moving. Definitions follow the
examples, and each note ends with one recap that introduces no new dependency.
The recurring distinctions carry the narrative:

- Finishing the first movie does not mean finishing all its showings.
- A runtime push callback and a compiler's code-generating consumer operate at
  different times.
- Two matching right rows do not duplicate a left semijoin tuple, and rejecting
  that tuple does not by itself skip its storage region.
- Upward reduction gives the root complete support while leaving unsupported
  leaf tuples behind. A cache for an earlier reduced relation can be stale.
- Fractional weights describe a bound, not fractions of relations to read.
- A surviving WCOJ prefix can still fail later, and an iterator interface does
  not automatically provide ordered seek or trie navigation.

Reuse is deliberate: cinema for access and control, numeric keys for filter
evidence, delivery for the two passes, and the road loop for the cyclic work
problem. The one fresh successful triangle instance prevents WCOJ from being
taught only through empty answers. Pseudocode is labeled as such; it does not
claim to be an implemented homework API or compilable Rust.

### Guided derivation audit

The review criterion is causal: immediately before introducing a mechanism,
can the reader say what need it addresses, why the familiar approach falls
short, and which evidence makes the proposed change worth considering? A
question that simply tells Alice to use the next algorithm does not meet that
criterion. The revised conversations make these transitions explicit.

| Mechanism | Concrete reason it appears | Check the reader can perform |
|---|---|---|
| Result iterator, 3.2 | The consumer may stop after one answer; materializing a million intermediate tuples commits to work it may never use. Resuming must avoid repeating the first result. | Retain the current movie while its second showing is still pending; distinguish child position from current outer tuple. |
| Batches and lifecycle, 3.2 | A consumer requesting all results pays repeatedly for operator boundaries. A consumer stopping early cannot rely on exhaustion for cleanup. | Compare six scalar calls with three batch calls in the explicit end protocol; identify the pending match at the batch boundary and the resources requiring close. |
| Push execution, 3.3 | The consumer always performs the same action and immediately requests another result. | Put that action inside the producer's ongoing computation and preserve the cinema witness trace. This is an alternative to batching, not a universal replacement for pull. |
| Compilation, 3.3 | A generic runtime node repeatedly interprets choices already fixed in its physical plan. Hand-writing a program for every query would not scale. | Generate scan, selection, and consumer code compositionally; distinguish code expressions during generation from tuple values during execution. |
| Hash join, 3.3 | Without the existing Title index, two filmA actors repeat the search for the same group of showings. | Build the grouping once, retain all showings, and explain why probing requires build completion in this algorithm. |
| Semijoin and exact membership, 3.4 | A join followed by projection can construct a million right witnesses for one required left answer. Repeated right scans can also repeat absence searches. | Replace witness enumeration with existence, then prepare exact shared-key membership once. Check composite keys and the empty shared key. |
| Position selection, 3.4 | Copying surviving wide rows would move payload columns the next operator could read from the original batch. | Produce `[1,3]` or its bitmap, retaining the backing data and the meaning of those batch positions. |
| Region pruning, 3.4 | Rejecting rows after reading them still visits all left keys. Region metadata can supply earlier evidence. | Reject disjoint ranges, retain overlapping ranges, and explain why `[21,39]` cannot be rejected by overlap with `[20,40]`. |
| Bloom summary and transfer, 3.4 | An exact support set may be costly to carry to another scan. A preliminary test may keep extra candidates but may not lose a real match. | Construct bits `[0,1,1]` with `k mod 3`, distinguish false positive 5 from rejected 30, and use surviving B rows to translate a-domain support into b-domain support. |
| Yannakakis passes, 4.1 | The binary delivery plan multiplies useless nut stocks by drivers. Filtering the root alone leaves unsupported leaf tuples behind. | Derive the two directions; use a deeper R–S–T example to show why processing a parent before its child is ready leaves root value 2 unsupported. |
| Tree-guided enumeration, 4.1 | Individually supported tuples can still form incompatible combinations when joined across a missing path. | Compare the four R×T combinations with the two connected R⋈S results on a fully reduced chain. |
| Output bounds and covers, 4.2 | We need to separate required output work from dead candidate work. A size product that ignores a variable can fail. | Enumerate the small cube, derive the triangle inequality, and use domain sizes X,Y,Z to explain the edge-cover constraints. One-third weights fail on the eight-answer cube. |
| Variable-at-a-time join, 4.3 | The closing road atom can restrict c as soon as a is known, before constructing two candidates that will fail. | Intersect conditional choices before extending the prefix, then test both successful and dead branches. Ground atoms require a preliminary check. |
| Prefix indexes and ordered seek, 4.3 | Repeated full scans revisit 21 rows at the final level of the tiny successful example. Sequential merging can traverse a million-element group to match one value. | Retrieve groups by bound keys; reuse existing ordered indexes through trie levels and forward seek. Verify reversed atom positions with the asymmetric fact `road(2,9)`. |

The proof obligations stay separate. The notes prove the triangle bound and
the local correctness arguments they use. They identify the arbitrary-query
AGM and Generic Join bounds as general theorems from the readings. A cube
construction explains necessary cover constraints; it is not presented as a
proof of their sufficiency for arbitrary data. The cost discussions retain
their input, output, fixed-query, and access-model assumptions.

The correctness review also added the missing empty-local-relation guard to
the single-variable algorithm. Without it, a false ground atom such as
`enabled("go")` could escape all variable intersections. The new example
shows why the guard is required before formalizing the algorithm.

The authoring template also had a concrete correctness error: its two R rows
both match `S(7,4)`, producing `(1,4)` and `(2,4)`, rather than just the first
answer. The corrected template separates the input tables so that their
visual row alignment does not suggest positional matching.

### Reading trail and source limits

This is a focused review of relevant sections, not a claim to have surveyed
every course or read every chapter of each book.

| Source read | Sections used and purpose |
|---|---|
| AHV, [Chapter 4](https://webdam.di.ens.fr/Alice/pdfs/Chapter-4.pdf) and [Chapter 6](https://webdam.di.ens.fr/Alice/pdfs/Chapter-6.pdf) | Named relational semantics; §6.1 access and projection; §6.4, pp. 128–134, semijoin preservation, consistency, join trees, and the general projected-query result. |
| Graefe, [Volcano](https://people.eecs.berkeley.edu/~prabal/teaching/resources/eecs582/graefe94volcano.pdf) | §III.B, pp. 124–126: state records, anonymous streams, lifecycle, and build work during open. The indexed join is a course instantiation, not a claim about Volcano's principal join implementations. |
| Neumann, [Efficiently Compiling Efficient Query Plans](https://www.vldb.org/pvldb/vol4/p539-neumann.pdf) | §§3.1–3.2 and Figure 5: locality, pipeline boundaries, and compile-time `produce`/`consume`. |
| Yannakakis, [Algorithms for Acyclic Database Schemes](https://www.researchgate.net/publication/200034379_Algorithms_for_Acyclic_Database_Schemes) | Author-uploaded full text, especially §4 and Theorem 4.1. The legacy VLDB PDF path returned 404; the readable author upload supplied the original argument. Its general projected-query theorem is polynomial, not an unrestricted linear guarantee. |
| Koutris et al., [Database Theory in Action: Yannakakis' Algorithm](https://doi.org/10.4230/LIPIcs.ICDT.2026.25) | Classical full-join guarantee and the practical cost of reduction. Cross-check example formulas against the underlying join tree rather than copying them mechanically. |
| Atserias, Grohe, Marx, [Size Bounds and Query Plans for Relational Joins](https://arxiv.org/abs/1711.03860) | §§3.1 and 4: fractional covers, unequal relation sizes, and worst-case bounds. General tightness permits query-dependent factors and rounding; exact equality is demonstrated only for the displayed cube families. |
| Ngo, Ré, Rudra, [Skew Strikes Back](https://arxiv.org/abs/1310.3314) | §§2–4: triangle algorithms, the AGM connection, and Generic Join. The course uses its existing road family and independently checks all counts. |
| Veldhuizen, [Leapfrog Triejoin](https://www.openproceedings.org/2014/conf/icdt/Veldhuizen14.pdf) | §§3–4 and §6.1: ordered cursor costs, trie descent/backtracking, full-query optimality up to a logarithmic factor, and the smallest-set hash variant. |
| CMU 15-721, [execution](https://15721.courses.cs.cmu.edu/spring2024/notes/04-execution1.pdf), [compilation](https://15721.courses.cs.cmu.edu/spring2024/notes/07-compilation.pdf), [multiway joins](https://15721.courses.cs.cmu.edu/spring2024/notes/10-multiwayjoins.pdf) | Useful teaching comparisons for processing units, generation, and cursor progression. The notes retain the primary papers' qualifications instead of treating broad performance summaries as universal claims. |
| Wisconsin CS 784, [acyclic queries](https://pages.cs.wisc.edu/~paris/cs784-s19/lectures/lecture4.pdf), [size bounds](https://pages.cs.wisc.edu/~paris/cs784-s19/lectures/lecture6.pdf), [WCOJ](https://pages.cs.wisc.edu/~paris/cs784-s19/lectures/lecture7.pdf) | Proof sequencing and the distinction among Boolean, full, and projected queries. The lecture6 handout hosted here identifies itself as Spring 2017. |
| Washington CSE 544, [Query Optimization Wrapup](https://courses.cs.washington.edu/courses/cse544/25au/lectures/lecture16-how-good-and-wrapup.pdf) | Slides 51–73: semijoin identity, staged reducer, join-tree examples, and explicit theorem qualifications. |
| Yang et al., [Predicate Transfer](https://www.vldb.org/cidrdb/papers/2024/p22-yang.pdf); version-pinned DuckDB source already studied for deck 10 | Exact versus approximate evidence, transferring keys through surviving rows, build completion, and storage versus row rejection. The RPT+ systems discussion remains in the slide unit rather than becoming a prerequisite for classical YA. |

The WCOJ guarantee is a bound over families of inputs with stated size
constraints. It must not become a bound in terms of the actual output of one
instance. Likewise, the YA bound in 4.1 uses full result tuples, fixed query
size, and the stated hash/access assumptions. These distinctions stay in the
dialogue and beside the formal claims, not only in source notes.

### Verification of these drafts

The six conversations contain 172 paired exchanges and one terminal recap
each. Their worked cinema, semijoin, delivery, and triangle results were
independently recomputed. Exhaustive checks over all 4,096 two-value instances
of a three-atom chain verified preservation and complete support after the
stated passes. Another 4,096 triangle instances checked the prefix algorithm
against direct joining and checked the triangle cardinality inequality.
The guided revision adds 23 checked cases covering the new scheduling,
projection, Bloom, cover, and directed-access examples, including true and
false ground atoms and zero-variable queries.

The complete site build, including the existing Rust example checks, passed.
The generated site's 27 pages passed internal-link validation. Browser review
covered all six additions at 1,280-pixel desktop and 390-pixel phone widths;
long equations were split in the source until there were no math-rendering
errors, overflowing display equations, or horizontal page overflow. The new
files and navigation edits pass whitespace checks. A repository-wide diff
check separately reports pre-existing trailing whitespace in Conversation
2.1, outside this notes change.

All six additions retain Draft status. The review concerns the notes and
their navigation; native deck revisions remain separate.
