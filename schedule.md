---
title: Schedule
subtitle: One query, followed from meaning to recursive execution
author: Modern Query Processing
date: Fall 2026
status: Work in progress
layout: prose
---

# Weekly plan and primary readings

The [Fall 2026 academic calendar](https://www.usu.edu/calendar/academic/?year=2026)
includes Labor Day, Fall Break, Thanksgiving recess, and No-Test Week. Those
adjustments are marked below. Until the syllabus is finalized, treat dates and
release markers as planned rather than official.

| Week | Center | In class | Primary reading / due |
|---|---|---|---|
| 1 · Aug. 31–Sep. 4 | CQ meaning | Rules, valuations, and query hypergraphs | Abiteboul, Hull, and Vianu, [Foundations of Databases](https://webdam.di.ens.fr/Alice/), §§3.1–3.3, 4.1–4.2 |
| 2 · Sep. 7–11 | Binary joins | Nested-loop and hash join; build/probe state | Garcia-Molina, Ullman, and Widom, [Database System Implementation](https://i.stanford.edu/~ullman/dbsi.html), selected §§6.2–6.4; **Labor Day adjustment** |
| 3 · Sep. 14–18 | Rust and staged query programs | Ownership and borrowing; enums and pattern matching; traits and iterators; trace a CQ through typed IRs to generated Rust | The Rust Programming Language: [Ch. 4](https://doc.rust-lang.org/book/ch04-00-understanding-ownership.html), [Ch. 6](https://doc.rust-lang.org/book/ch06-00-enums.html), and [§20.5 overview](https://doc.rust-lang.org/book/ch20-05-macros.html) |
| 4 · Sep. 21–25 | Pull and push | Run the same fixed plan under both control models | Neumann, [Efficiently Compiling Efficient Query Plans for Modern Hardware](https://www.vldb.org/pvldb/vol4/p539-neumann.pdf), §§1, 3.1–3.2; **practicum 1** |
| 5 · Sep. 28–Oct. 2 | AGM bounds | Compute a fractional cover; compare bounds with measured work | Atserias, Grohe, and Marx, [Size Bounds and Query Plans for Relational Joins](https://arxiv.org/abs/1711.03860), §§2–3.1; **practicum 2; R1 due** |
| 6 · Oct. 5–9 | Yannakakis | Join trees, two semijoin passes, and enumeration | Yannakakis, [Algorithms for Acyclic Database Schemes](https://dblp.org/rec/conf/vldb/Yannakakis81), §§2, 4; **Fall Break adjustment** |
| 7 · Oct. 12–16 | Positive Datalog | Model, fixed-point, and proof views of recursion | Foundations of Databases, §§12.1–12.4 |
| 8 · Oct. 19–23 | Worst-case-optimal joins | Contrast binary and variable-at-a-time plans; trace Generic Join and Leapfrog Triejoin under a supplied variable order | Veldhuizen, [Leapfrog Triejoin](https://www.openproceedings.org/2014/conf/icdt/Veldhuizen14.pdf), §§1, 3.1–3.5; **practicum 3** |
| 9 · Oct. 26–30 | Practical join filtering | **Hangdong Zhao guest lecture:** predicate transfer and runtime filters | Yang et al., [Predicate Transfer](https://www.vldb.org/cidrdb/papers/2024/p22-yang.pdf) |
| 10 · Nov. 2–6 | Semi-naive evaluation | Track full, delta, candidates, duplicates, and termination | Foundations of Databases, §13.1; **R2 due** |
| 11 · Nov. 9–13 | Extending Datalog to ontology reasoning | Negation and disjunction | [Ontology-Based Data Access: A Study through Disjunctive Datalog, CSP, and MMSNP](https://dl.acm.org/doi/abs/10.1145/2661643) |
| 12 · Nov. 16–20 | Probabilistic and neuro-symbolic Datalog | Compare exact, top-k, and differentiable proof evaluation | Huang et al., [Scallop](https://proceedings.neurips.cc/paper/2021/hash/d367eef13f90793bd8121e2f675f0dc2-Abstract.html), §§2–4.2 |
| 13 · Nov. 23–27 | Thanksgiving break | No class | **No reading or work due** |
| 14 · Nov. 30–Dec. 4 | Project clinic | Correctness, work counters, baselines, and failure cases | No reading; **R3 due** |
| 15 · Dec. 7–11 | Synthesis | Short project presentations (can be Zoom) and connections across the course | No reading; **No-Test Week** |

Week 13 is a full course break. Week 15 has no quiz or examination; project
presentations are the only graded activity, as permitted by the university's
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
