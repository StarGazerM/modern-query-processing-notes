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

# Start with the course

This graduate course follows one query all the way down: from a mathematical
relation, through joins and typed intermediate representations, to executable
Rust. We ask not only what a query means, but what an implementation must do—and
how query shape limits the work it should have to do.

:::cards
[Read the syllabus](syllabus.html) | Outcomes, prerequisites, assessment, participation, and course policies.
[Follow the schedule](schedule.html) | Fifteen weeks of topics, primary readings, practica, and release dates.
[Understand the project](project.html) | One cumulative Rust implementation, released in three inspectable stages.
[Open the first conversation](01-a-little-database-a-few-questions.html) | Begin with values, relations, database instances, and the conditions under which logical statements are true.
:::

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
[Conversation 1.1 · What's in a Name?](01-a-little-database-a-few-questions.html) | Establish data, relation schemas, database schemas, instances, and the DBMS before asking a query.
[Conversation 1.2 · By Indirections Find Directions Out](02-the-relation-that-wasnt-stored.html) | Move from recorded facts through valuations and conjunction to a rule-based query and its separate image.
[Rust Conversation R.1 · The Code That Became a Value](rust-01-the-code-that-became-a-value.html) | Inspect one familiar macro, represent grammatical shape with Rust values, and build a typed relation declaration.
[A Little Rust, Side by Side](aside-a-little-rust-side-by-side.html) | A Python-to-Rust cheat sheet for reading the project and the course text.
:::

# Public while it develops

The syllabus, schedule, project contract, and notes live in one
[public repository](https://github.com/StarGazerM/modern-query-processing-notes).
The work-in-progress label is deliberate: students can read the course as it
develops, while changes remain inspectable through version control.
