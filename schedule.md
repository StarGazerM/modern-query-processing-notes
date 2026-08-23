---
title: Schedule
subtitle: One query, followed from meaning to recursive execution
author: Modern Query Processing
date: Fall 2026
status: Work in progress
layout: prose
---

# Weekly plan and primary readings

The course meets Monday and Wednesday from 3:00–4:15 p.m. Monday normally
introduces the week's query-processing idea; Wednesday normally turns it into a
trace, Rust/programming session, paper discussion, or practicum. The
[Fall 2026 academic calendar](https://www.usu.edu/calendar/academic/?year=2026)
exceptions are shown on the affected meeting rather than treating the whole
week as canceled.

| Week | Center | Monday · 3:00–4:15 | Wednesday · 3:00–4:15 | Primary reading / due |
|---|---|---|---|---|
| 1 · Aug. 31–Sep. 4 | CQ meaning | [Lecture 1 slides](slides/01-modern-query-processing-lecture-1.pptx); why compile a query; rules, valuations, and query hypergraphs | [Conversation 1.1](01-a-little-database-a-few-questions.html) and [Conversation 1.2](02-the-relation-that-wasnt-stored.html): schemas, instances, valuations, and the relation defined by a rule | Abiteboul, Hull, and Vianu, [Foundations of Databases](https://webdam.di.ens.fr/Alice/), §§3.1–3.3, 4.1–4.2 |
| 2 · Sep. 7–11 | Rust and staged query programs | **No class · Labor Day** | [Rust Conversation R.1](rust-01-the-code-that-became-a-value.html): code as a token stream, compile time versus runtime, and the procedural-macro boundary | Prepare with [Rust Guide R.0.0](rust-00-the-tree-we-could-read-twice.html) and keep [A Little Rust, Side by Side](aside-a-little-rust-side-by-side.html) open; Rust Book [Ch. 4](https://doc.rust-lang.org/book/ch04-00-understanding-ownership.html), [Ch. 6](https://doc.rust-lang.org/book/ch06-00-enums.html), and [§20.5](https://doc.rust-lang.org/book/ch20-05-macros.html) are references |
| 3 · Sep. 14–18 | Binary joins | [Conversation 1.3](03-the-plan-that-meant-the-same-thing.html) and [Conversation 2.1](04-the-order-logic-did-not-choose.html): establish CQ-to-SPJR equivalence, choose an administrative logical join plan, then move to nested-loop and hash join; expose build/probe state | [Rust Conversation R.2](rust-02-the-arithmetic-that-ran-before-the-program.html): map written syntax into a derived AST and evaluate it | Garcia-Molina, Ullman, and Widom, [Database System Implementation](https://i.stanford.edu/~ullman/dbsi.html), selected §§6.2–6.4 |
| 4 · Sep. 21–25 | Pull and push | Derive pull and push execution for one fixed logical plan | [Rust Conversation R.3](rust-03-the-program-left-behind.html); then run the fixed plan under both control models | Neumann, [Efficiently Compiling Efficient Query Plans for Modern Hardware](https://www.vldb.org/pvldb/vol4/p539-neumann.pdf), §§1, 3.1–3.2; **practicum 1** |
| 5 · Sep. 28–Oct. 2 | AGM bounds | Compute a fractional edge cover and its output-size bound | Compare the bound with measured intermediate work; guided practicum | Atserias, Grohe, and Marx, [Size Bounds and Query Plans for Relational Joins](https://arxiv.org/abs/1711.03860), §§2–3.1; **practicum 2; R1 due** |
| 6 · Oct. 5–9 | Yannakakis | Build a join tree and derive the two semijoin passes | Trace reduction and enumeration; connect the proof to implementation state | Yannakakis, [Algorithms for Acyclic Database Schemes](https://dblp.org/rec/conf/vldb/Yannakakis81), §§2, 4. Fall Break is Friday and does not cancel either meeting |
| 7 · Oct. 12–16 | Positive Datalog | Model, fixed-point, and proof views of recursion | Trace naive fixed-point execution, duplicates, and termination in code | Foundations of Databases, §§12.1–12.4 |
| 8 · Oct. 19–23 | Worst-case-optimal joins | Contrast binary and variable-at-a-time plans; derive Generic Join | Trace Generic Join and Leapfrog Triejoin under a supplied variable order | Veldhuizen, [Leapfrog Triejoin](https://www.openproceedings.org/2014/conf/icdt/Veldhuizen14.pdf), §§1, 3.1–3.5; **practicum 3** |
| 9 · Oct. 26–30 | Theory in action | Connect course models to practical filtering and data-skipping mechanisms; reading discussion | **Hangdong Zhao guest lecture:** predicate transfer, runtime filters, zone maps, and related system details | Yang et al., [Predicate Transfer](https://www.vldb.org/cidrdb/papers/2024/p22-yang.pdf) |
| 10 · Nov. 2–6 | Semi-naive evaluation | Derive the delta rules and candidate sets | Code trace: full, delta, candidates, duplicates, and termination | Foundations of Databases, §13.1; **R2 due** |
| 11 · Nov. 9–13 | Extending Datalog to ontology reasoning | Negation, disjunction, and their semantic consequences | Paper discussion and ontology-reasoning case study | [Ontology-Based Data Access: A Study through Disjunctive Datalog, CSP, and MMSNP](https://dl.acm.org/doi/abs/10.1145/2661643) |
| 12 · Nov. 16–20 | Probabilistic and neuro-symbolic Datalog | Proof evaluation under probabilistic and differentiable interpretations | Compare exact, top-k, and differentiable evaluation on one supplied example | Huang et al., [Scallop](https://proceedings.neurips.cc/paper/2021/hash/d367eef13f90793bd8121e2f675f0dc2-Abstract.html), §§2–4.2 |
| 13 · Nov. 23–27 | Project checkpoint | Project checkpoint: select and justify the advanced extension | **No class · Thanksgiving Holiday** | **No reading or work due** |
| 14 · Nov. 30–Dec. 4 | Project clinic | Correctness checks, work counters, and baselines | Failure cases, result clinic, and final project check | No reading; **R3 due** |
| 15 · Dec. 7–11 | Synthesis | Short project presentations and cross-course connections | Remaining presentations and synthesis; Zoom participation is permitted | No reading; **No-Test Week** |

Fall Break is Friday, October 9, so it does not change this course's meetings.
During Thanksgiving week, Monday remains a class meeting and Wednesday is
canceled. Week 15 has no quiz or examination; project presentations are the
only graded activity, as permitted by the university's
[No-Test Days policy](https://catalog.usu.edu/pages/TRt784ev1WOEs7vivhnO).

# Release map

| Release | Project stages | Planned point in course |
|---|---|---|
| R1 | Binary physical plan and execution control | End of Week 5 |
| R2 | Semijoin reduction and triejoin | End of Week 10 |
| R3 | Semi-naive evaluation and one advanced extension | End of Week 14 |

The [project page](project.html) defines what each stage must implement and how
it is evaluated. This schedule is the authoritative public location for due
weeks and calendar adjustments.
