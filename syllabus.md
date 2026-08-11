---
title: Syllabus
subtitle: Modern Query Processing · Databases and Reasoning
author: Yihao Sun · Utah State University
date: Fall 2026
status: Draft syllabus
layout: prose
---

> How does a short declarative reasoning query become an efficient executable
> program?

# Course facts

| | |
|---|---|
| Dates | August 31–December 11, 2026 |
| Level | Graduate; advanced undergraduates with permission |
| Format | Lecture, paper discussion, and a cumulative implementation project |
| Exams | None |
| Office hours | To be announced |
| Meeting time and location | To be announced |

# Course introduction

This course follows conjunctive queries (CQs) from logical rules to executable
code. We study binary joins, execution control, join ordering, output-size
bounds, semijoin reduction, and worst-case-optimal joins. An early Rust bridge
introduces the language and the staged macro pipeline used by the course
project. We then treat positive Datalog as recursive CQ evaluation and study
fixed points and semi-naive execution. Graph, ontology-style, probabilistic,
and neuro-symbolic reasoning provide recurring examples.

The course is one focused path through semantics, algorithms, and systems—not
a survey of SQL, storage, transactions, or every form of logic. All
nonrecursive queries considered are CQs; every positive Datalog rule body is a
CQ.

By the end of the course, students should be able to:

1. explain CQ and positive Datalog semantics;
2. move among rules, hypergraphs, typed intermediate representations, plans, and executable operators;
3. trace binary, semijoin, trie-based, and semi-naive evaluation;
4. use query shape, cardinality, and AGM bounds to choose an algorithm; and
5. test an implementation claim with correctness checks and interpretable work counters.

## Prerequisites

Students should know undergraduate algorithms and data structures, be
comfortable with mathematical notation, and be able to program in at least one
language. Prior Rust experience is not required: Week 3 introduces the subset
of Rust and metaprogramming used in the project. Prior database coursework is
helpful but not required.

# Course format

A typical meeting combines one lecture or board derivation, discussion of the
week's primary reading, and a short shared trace, code inspection, or result
comparison. There is no recurring full-class coding lab. A later meeting may
begin by comparing results from the previous activity.

Each content week has one primary reading and no reading response. Each student
leads one paper discussion. Outside class, students complete three releases of
one cumulative code project. There are no weekly problem sets, quizzes,
midterm, or final exam.

See the [week-by-week schedule](schedule.html) for readings, practica, release
dates, and university-calendar adjustments.

# Assessment

| Component | Points |
|---|---:|
| Three guided in-class practica | 30 |
| Cumulative engine project | 50 |
| Paper-discussion leadership | 10 |
| Prepared participation | 10 |
| **Total** | **100** |

## In-class practica · 30 points

The three open-note, collaborative practica ask students to trace an
execution, compute or apply a bound, and interpret supplied measurements. Each
is worth 10 points: correctness (4), use of evidence (3), and explanation (3).
They assess reasoning, not mere attendance, and create no separate report or
implementation assignment.

## Cumulative engine project · 50 points

Students work individually or in pairs in a supplied Rust codebase. The
project is one visible compilation and execution pipeline, delivered as R1,
R2, and R3—not a sequence of unrelated assignments. Read the complete
[project contract](project.html) for stages, scope, deliverables, and scoring.

## Discussion and participation · 20 points

Each student leads one reading discussion: accurate central claim (4), useful
connection or counterexample (3), and questions that advance discussion (3).
The remaining 10 points reflect prepared contributions to reading discussions,
derivations, and result clinics.

# Project tools and AI policy

The project uses Rust with a procedural-macro CQ frontend. Week 3 teaches enough
Rust and metaprogramming to read the pipeline from surface CQ through typed IRs
to generated code. Staff supplies and documents the macro parser, initial IRs,
expansion pipeline, and crate structure. Students inspect macro expansions and
implement ordinary Rust transformations inside the supplied interfaces; they
do not build a token parser or procedural-macro infrastructure from scratch.
When a stage emits Rust code, students use the `quote!` macro from the `quote`
crate with provided examples.

Staff also supplies storage, reference semantics, the test harness, and
benchmark infrastructure. Students implement only the named execution stages;
they do not build SQL parsing, transactions, a storage manager, a cost-based
optimizer, or a parallel runtime.

AI-assisted coding, testing, debugging, and writing are allowed. Each release
must include a brief `AI-USE.md` naming material assistance and how it was
checked; prompt transcripts are not required. Students remain responsible for
all submitted code, measurements, claims, and citations and must be able to
explain them in the final presentation.

# Optional references

- Ullman, [Principles of Database and Knowledge-Base Systems](https://dblp.org/db/books/dbtext/ullman89.html), and Ceri, Gottlob, and Tanca, [What You Always Wanted to Know About Datalog (And Never Dared to Ask)](https://doi.org/10.1109/69.43410).
- Graefe, [Query Evaluation Techniques for Large Databases](https://doi.org/10.1145/152610.152611).
- Ngo, [Worst-Case Optimal Join Algorithms: Techniques, Results, and Open Problems](https://arxiv.org/abs/1803.09930).
- Koutris et al., [Database Theory in Action: Yannakakis' Algorithm](https://doi.org/10.4230/LIPIcs.ICDT.2026.25).
- Abo Khamis, Ngo, and Suciu, [PANDA: Query Evaluation in Submodular Width](https://arxiv.org/abs/2402.02001).

# Policies and draft status

Official university statements on accessibility, accommodations, academic
integrity, safety, and related policies will be inserted before publication.
Meeting details, deadlines, grade thresholds, and late-work rules remain to be
finalized.
