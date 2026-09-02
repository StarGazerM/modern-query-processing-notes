---
title: Course Schedule
subtitle: Rust first, then one query from meaning to recursive execution
author: Modern Query Processing
date: Fall 2026
status: Work in progress
layout: prose
---

# Meeting-by-meeting plan and primary readings

The course meets Monday and Wednesday from 3:00–4:15 p.m. Each column below is
a separate class meeting, not a weekly topic followed by an elaboration of the
same lecture. Week 1 supplies the Rust needed to read the project: one meeting
uses the [course cheat sheet](aside-a-little-rust-side-by-side.html) with
[Rust Guide R.0.0](rust-00-the-tree-we-could-read-twice.html), and the next
begins the staged-programming sequence with
[Rust Conversation R.1](rust-01-the-code-that-became-a-value.html). Rust then
returns in ten later Wednesday conversations and project studios.

Five meetings are marked as **student-led paper forums**. One or more assigned
leaders open each forum with the paper's claim, evidence, and a question or
counterexample; the rest of the class comes prepared to test that account. A
**Rust/project studio** is guided work during class, not an additional weekly
programming assignment. Exceptions from the
[Fall 2026 academic calendar](https://www.usu.edu/calendar/academic/?year=2026)
are attached to the affected meeting.

| Week | Center | Monday · 3:00–4:15 | Wednesday · 3:00–4:15 | Primary reading / due |
|---|---|---|---|---|
| 1 · Aug. 31–Sep. 4 | Rust for the course | **Rust lecture and guided lab:** use [A Little Rust, Side by Side](aside-a-little-rust-side-by-side.html) while working through [Rust Guide R.0.0](rust-00-the-tree-we-could-read-twice.html): values, ownership, borrowing, enums, structs, and iterators | [Rust Conversation R.1](rust-01-the-code-that-became-a-value.html): make written code a typed syntax value; separate macro expansion, compilation, and runtime | Rust Book [Ch. 4](https://doc.rust-lang.org/book/ch04-00-understanding-ownership.html), [Ch. 6](https://doc.rust-lang.org/book/ch06-00-enums.html), and [§20.5](https://doc.rust-lang.org/book/ch20-05-macros.html) are references, not prerequisites |
| 2 · Sep. 7–11 | CQ meaning | **No class · Labor Day** | [Lecture 1 slides](slides/01-modern-query-processing-lecture-1.pptx), [Conversation 1.1](01-a-little-database-a-few-questions.html), and [Conversation 1.2](02-the-relation-that-wasnt-stored.html): databases, rules, valuations, query images, and why we compile a query | Abiteboul, Hull, and Vianu, [Foundations of Databases](https://webdam.di.ens.fr/Alice/), §§3.1–3.3, 4.1–4.2 |
| 3 · Sep. 14–18 | From CQs to binary joins | [Conversation 1.3](03-the-plan-that-meant-the-same-thing.html), [Conversation 2.1a](04-the-order-logic-did-not-choose.html), [Conversation 2.1b](04-the-picture-that-did-not-choose.html), and [Conversation 2.2](05-the-variables-the-plan-still-needed.html): translate valuation semantics into SPJR, compare binary join trees, expose shared-variable frontiers, and derive the required schema of each intermediate | **Rust conversation:** [R.2](rust-02-the-arithmetic-that-ran-before-the-program.html); map written syntax into a derived AST and evaluate it during expansion | Garcia-Molina, Ullman, and Widom, [Database System Implementation](https://i.stanford.edu/~ullman/dbsi.html), selected §§6.2–6.4 |
| 4 · Sep. 21–25 | Pull and push | Derive pull and push execution for one fixed logical plan; identify the state each model exposes | **Rust conversation and practicum 1:** [R.3](rust-03-the-program-left-behind.html), then run the fixed plan under both control models | Neumann, [Efficiently Compiling Efficient Query Plans for Modern Hardware](https://www.vldb.org/pvldb/vol4/p539-neumann.pdf), §§1, 3.1–3.2; **practicum 1** |
| 5 · Sep. 28–Oct. 2 | Cardinality and join order | **Student-led paper forum:** compare left-deep orders and the intermediate work they create; derive the dynamic-programming search space | **Rust/project studio:** instrument two equivalent plans, check their answers, and explain the work-counter difference | Selinger et al., [Access Path Selection in a Relational Database Management System](https://research.ibm.com/publications/access-path-selection-in-a-relational-database-management-system), §5; **R1 due** |
| 6 · Oct. 5–9 | AGM bounds | Derive a fractional edge cover and its output-size bound; distinguish output size from the work of a chosen binary plan | **Rust/project studio and practicum 2:** generate controlled relation sizes, measure intermediate work, and compare the trace with the bound | Atserias, Grohe, and Marx, [Size Bounds and Query Plans for Relational Joins](https://arxiv.org/abs/1711.03860), §§2–3.1; **practicum 2**. Fall Break is Friday and cancels neither meeting |
| 7 · Oct. 12–16 | Yannakakis | **Student-led paper forum:** build a join tree and justify the bottom-up and top-down semijoin passes | **Rust/project studio:** inspect the join-tree analysis, trace both reduction passes, and check reduced-instance enumeration | Yannakakis, [Algorithms for Acyclic Database Schemes](https://dblp.org/rec/conf/vldb/Yannakakis81), §§2, 4 |
| 8 · Oct. 19–23 | Worst-case-optimal joins | **Student-led paper forum:** contrast binary and variable-at-a-time execution; derive Generic Join under one variable order | **Rust/project studio:** trace trie cursors and Leapfrog intersection, then compare the counters with a binary plan | Veldhuizen, [Leapfrog Triejoin](https://www.openproceedings.org/2014/conf/icdt/Veldhuizen14.pdf), §§1, 3.1–3.5 |
| 9 · Oct. 26–30 | Practical predicate transfer | **Rust/project studio:** integrate the semijoin and triejoin stages, run the R2 correctness checks, and prepare one implementation question for the guest | **Hangdong Zhao guest lecture:** predicate transfer, runtime filters, zone maps, and related system details | Yang et al., [Predicate Transfer](https://www.vldb.org/cidrdb/papers/2024/p22-yang.pdf) |
| 10 · Nov. 2–6 | Positive Datalog | Treat a positive Datalog program as recursive CQ evaluation; derive model, fixed-point, and proof views | **Rust/project studio:** trace naive fixed-point evaluation and account for rounds, duplicates, and termination | Foundations of Databases, §§12.1–12.4; **R2 due** |
| 11 · Nov. 9–13 | Semi-naive evaluation | Derive delta rules and candidate sets from the naive evaluator | **Rust/project studio and practicum 3:** follow full, delta, and candidate relations through code; check duplicates and termination | Foundations of Databases, §13.1; **practicum 3** |
| 12 · Nov. 16–20 | Extending Datalog to ontology reasoning | Negation, disjunction, and the semantic commitments introduced by each extension | **Student-led paper forum:** ontology-based data access case study; test which conclusions follow from the paper's semantics | [Ontology-Based Data Access: A Study through Disjunctive Datalog, CSP, and MMSNP](https://dl.acm.org/doi/abs/10.1145/2661643) |
| 13 · Nov. 23–27 | Project checkpoint | Select the advanced extension; state its semantic contract, baseline, and correctness oracle | **No class · Thanksgiving Holiday** | **No reading or work due** |
| 14 · Nov. 30–Dec. 4 | Probabilistic and neuro-symbolic Datalog | **Student-led paper forum:** compare exact, top-k, and differentiable proof evaluation on one supplied example | **Rust/project studio:** failure-case clinic, work counters, baselines, and final release check | Huang et al., [Scallop](https://proceedings.neurips.cc/paper/2021/hash/d367eef13f90793bd8121e2f675f0dc2-Abstract.html), §§2–4.2; **R3 due** |
| 15 · Dec. 7–11 | Synthesis | Short project presentations and cross-course connections | Remaining presentations and synthesis; Zoom participation is permitted | No reading; **No-Test Week** |

Labor Day cancels Monday, September 7. Fall Break is Friday, October 9, so it
cancels neither meeting. Thanksgiving recess cancels Wednesday, November 25,
but Monday remains a class meeting. Week 15 has no quiz or examination;
project presentations are the only graded activity, as permitted by the
university's [No-Test Days policy](https://catalog.usu.edu/pages/TRt784ev1WOEs7vivhnO).

# Release map

The project releases **R1–R3** are submission checkpoints. They are distinct
from the instructional Rust Conversations **R.1–R.3** linked above.

| Release | Project stages | Planned point in course |
|---|---|---|
| R1 | Binary physical plan and execution control | End of Week 5 |
| R2 | Semijoin reduction and triejoin | End of Week 10 |
| R3 | Semi-naive evaluation and one advanced extension | End of Week 14 |

The [project page](project.html) defines each release's implementation and
evaluation contract. This page is the authoritative location for meeting
activities, due weeks, and calendar adjustments.
