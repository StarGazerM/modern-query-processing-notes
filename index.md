---
title: Modern Query Processing
subtitle: From declarative meaning to executable systems
author: Yihao Sun · Utah State University
date: Fall 2026
status: Work in progress
layout: home
left_speaker: Ada
right_speaker: Alice
---

> How does a short declarative reasoning query become an efficient executable
> program?

# Weekly materials

Find the lecture slides, companion notes, readings, and project checkpoints on
the course schedule. PDF slides are available for Weeks 1–5, covering Rust,
macros, CQ semantics, relational algebra, physical access, and query execution.

:::cards
[Lecture slides and weekly schedule](schedule.html#weekly-slides) | Download the PDFs for each week and follow the meeting plan.
:::

# Course at a glance

| | |
|---|---|
| Term | Fall 2026 · August 31–December 11 |
| Level | Graduate; advanced undergraduates with permission |
| Meetings | Monday and Wednesday · 3:00–4:15 p.m. |
| Format | Query-processing lecture and discussion; Rust/project tutorial; guided practica; one cumulative project |
| Textbook | Abiteboul, Hull, and Vianu, [Foundations of Databases](https://webdam.di.ens.fr/Alice/) (AHV) |
| Exams | None |
| Language | Rust is introduced in the course; prior Rust experience is not required |
| Through-line | CQ meaning → joins → bounds → execution → recursive Datalog |


# One intellectual path

## 01 · Give the query a meaning

We begin with relations, valuations, conjunctive queries, and logical relational
plans. The first obligation is exact: for every permitted input database, what
relation does the query denote?

## 02 · Account for the work

Join plans, indexes, relation layouts, and iterator state determine how a query
runs. Pull and push, AGM bounds, Yannakakis, filtering, and worst-case-optimal
joins reveal different ways to organize that work. Students trace the
intermediates and measure the operations as well as elapsed time.

## 03 · Make joins recursive

Positive Datalog turns a conjunctive query into a repeated one. Fixed points,
deltas, duplicates, and termination make the same semantic and physical
questions recur over time.

# Course notes

The notes are working documents, written for quick retrieval during the course.
Pause at a question, predict an answer, and then read across. Exact tuples,
types, bindings, and programs matter more than isolated terminology.

:::cards
[A Little Rust, Side by Side](aside-a-little-rust-side-by-side.html) | A Python-to-Rust cheat sheet for reading the project and the course text.
[Conversation 1.1 · What's in a Name?](01-a-little-database-a-few-questions.html) | Establish data, relation schemas, database schemas, instances, and the DBMS before asking a query.
[Conversation 1.2 · By Indirections Find Directions Out](02-the-relation-that-wasnt-stored.html) | Move from recorded facts through valuations and conjunction to a rule-based query and its separate image.
[Conversation 1.3 · The Plan That Meant the Same Thing](03-the-plan-that-meant-the-same-thing.html) | Translate CQ valuations into named SPJR and prove that the expression returns the same image on every input.
[Conversation 2.1 · The Order Logic Did Not Choose](04-the-order-logic-did-not-choose.html) | Compare equivalent join orders through their intermediate results and the effect of an early filter.
[Conversation 2.2 · The Picture That Did Not Choose](04-the-picture-that-did-not-choose.html) | Build SIP graphs from shared variables and trace how a restriction passes through the stock tuples.
[Conversation 2.3 · The Variables Inside the Picture](04-the-variables-inside-the-picture.html) | Open atom vertices into hyperedges, test why variables must stay grouped, and compare a star with a loop.
[Conversation 2.4 · The Variables the Plan Still Needed](05-the-variables-the-plan-still-needed.html) | Match whole shared variable sets, derive safe projection, and distinguish fewer rows from fewer columns.
[Conversation 2.5 · The Order the Compiler Chose](06-the-order-the-compiler-chose.html) | Test local support, construct join trees, challenge ordering heuristics, and justify a plan with schemas and row counts.
[Conversation 3.1 · The Matches the Algebra Did Not Find](07-the-matches-the-algebra-did-not-find.html) | Separate which tuples a selection requires from how a scan or an index finds them, then let each atom choose its access.
[Conversation 3.2 · The Tuple That Waited](08-the-tuple-that-waited.html) | Trace resumable indexed joins, distinguish lookup from iteration, and preserve pending matches across calls and batches.
[Conversation 3.3 · The Loop That Kept Going](09-the-loop-that-kept-going.html) | Derive synchronous push execution and then generate its loops from a physical plan, keeping compilation separate from runtime.
[Conversation 3.4 · The Rows We Did Not Need](10-the-rows-we-did-not-need.html) | Implement exact semijoins and distinguish row selection, conservative runtime filters, and storage pruning.
[Conversation 4.1 · The Tuples That Found a Whole Answer](11-the-tuples-that-found-a-whole-answer.html) | Trace both Yannakakis passes, prove their support invariants, and account for full-output enumeration.
[Conversation 4.2 · The Answers We Might Have to Write](12-the-answers-we-might-have-to-write.html) | Construct large outputs, derive the triangle bound, and distinguish AGM bounds from actual answers and execution work.
[Conversation 4.3 · The Variable All the Atoms Could Accept](13-the-variable-all-the-atoms-could-accept.html) | Derive Generic Join, trace Leapfrog Triejoin, and connect prefix access and intersection costs to worst-case guarantees.
[Rust Guide R.0.0 · The Rust We Need](rust-00-the-tree-we-could-read-twice.html) | Follow a focused Rust route, then predict, compile, and repair five small ordinary programs.
[Rust Conversation R.1 · The Code That Became a Value](rust-01-the-code-that-became-a-value.html) | Separate expansion from execution and make generated Rust syntax into a typed value.
[Rust Conversation R.2 · The Arithmetic That Ran Before the Program](rust-02-the-arithmetic-that-ran-before-the-program.html) | Map a small expression language into our derived AST and evaluate it during expansion.
[Rust Conversation R.3 · The Program Left Behind](rust-03-the-program-left-behind.html) | Derive one course syntax shape, expand into a typed Rust block, and leave runtime holes.
:::

# Public while it develops

The syllabus, schedule, project contract, and notes live in one
[public repository](https://github.com/StarGazerM/modern-query-processing-notes).
Released code and stable homework branches live in the separate
[homework repository](https://github.com/StarGazerM/modern-query-processing-homework).
The work-in-progress label is deliberate: students can read the course as it
develops, while changes remain inspectable through version control.
