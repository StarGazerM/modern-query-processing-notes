---
title: Course Project
subtitle: One query engine, exposed one inspectable stage at a time
author: Modern Query Processing
date: Fall 2026
status: Work in progress
layout: prose
---

# The project in one sentence

Students extend a supplied Rust query engine from a binary physical plan to
semi-naive recursive evaluation, preserving query meaning while making each
physical choice and its work visible.

This is not a build-a-database-engine course. Staff supplies the CQ frontend,
relation and index representations, reference semantics, workloads, tests, and
work counters. Students implement the named transformations and operators
inside that scaffold.

# Required stages

| Stage | Required implementation | Points |
|---|---|---:|
| 1. Binary physical plan | Lower a supplied **relation order** into a left-deep build/probe plan; count intermediate work | 6 |
| 2. Execution control | Run the same plan through pull and push interfaces using the supplied execution context | 4 |
| 3. Semijoin reduction | Implement a semijoin and both Yannakakis passes over a supplied join tree | 8 |
| 4. Triejoin | Implement leapfrog intersection and variable-at-a-time enumeration using a supplied **variable order** and tries | 12 |
| 5. Semi-naive evaluation | Maintain full and delta relations, remove duplicates, and run to a fixed point | 10 |
| Final presentation | Demonstrate one result and explain the relevant choices, evidence, and limitations | 10 |
| **Total** | | **50** |

# Releases

The stages are submitted as three releases:

- **R1:** Stages 1–2;
- **R2:** Stages 3–4; and
- **R3:** Stage 5.

The [course schedule](schedule.html#release-map) is the authoritative public
source for planned due weeks. Required recursion will be bounded to linear
positive rules unless the starter code supplies general delta-rule generation.

Each release consists of code, tests, and one-command benchmark output—no
proposal or long report. Correctness tests and algorithm-specific counters,
not raw speed, determine the stage score. DuckDB is a diagnostic baseline; the
goal is to explain differences, not beat it.

After R1 and R2, staff will release compatible reference checkpoints. Students
may use them for later stages without losing later-stage points.

# What students inspect

The supplied procedural-macro frontend makes the compilation path visible:

```text
CQ → typed logical IRs → physical choices → executable Rust
```

Students inspect macro expansions and implement ordinary Rust transformations
inside supplied interfaces. They do not build token parsing, procedural-macro
infrastructure, SQL parsing, transactions, a storage manager, a cost-based
optimizer, or a parallel runtime.

# Evidence expected in every release

1. correctness tests that distinguish the intended semantics from plausible wrong implementations;
2. algorithm-specific work counters that expose intermediates, probes, intersections, candidates, or deltas as appropriate;
3. one-command benchmark output that another reader can reproduce; and
4. a brief `AI-USE.md` naming material assistance and how it was checked.

The final presentation selects one result and explains the relevant choice,
evidence, failure case, and limitation. It is not a general project demo.
