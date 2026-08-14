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

# Course at a glance

| | |
|---|---|
| Term | Fall 2026 · August 31–December 11 |
| Level | Graduate; advanced undergraduates with permission |
| Format | Lecture, paper discussion, guided practica, and one cumulative project |
| Exams | None |
| Language | Rust is introduced in the course; prior Rust experience is not required |
| Through-line | CQ meaning → joins → bounds → execution → recursive Datalog |

# One intellectual path

## 01 · Give the query a meaning

We begin with relations, valuations, conjunctive queries, and query hypergraphs.
The first obligation is exact: for every permitted input database, what relation
does the query denote?

## 02 · Account for the work

Binary joins, pull and push, AGM bounds, Yannakakis, filtering, and
worst-case-optimal joins turn one meaning into sharply different executions.
Students trace the intermediates and measure the operations—not merely the wall
clock.

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
[Rust Conversation R.0.0 · The Tree We Could Read Twice](rust-00-the-tree-we-could-read-twice.html) | Learn the ordinary Rust needed to read structs, enums, borrows, recursive matches, and fallible transformations.
[Rust Conversation R.1 · The Code That Became a Value](rust-01-the-code-that-became-a-value.html) | Separate expansion from execution and make generated Rust syntax into a typed value.
[Rust Conversation R.2 · The Arithmetic That Ran Before the Program](rust-02-the-arithmetic-that-ran-before-the-program.html) | Map expressions into Syn's AST and make compile-time evaluation observable.
[Rust Conversation R.3 · The Program Left Behind](rust-03-the-program-left-behind.html) | Derive one course syntax shape, expand into a typed Rust block, and leave runtime holes.
:::

# Public while it develops

The syllabus, schedule, project contract, and notes live in one
[public repository](https://github.com/StarGazerM/modern-query-processing-notes).
The work-in-progress label is deliberate: students can read the course as it
develops, while changes remain inspectable through version control.
