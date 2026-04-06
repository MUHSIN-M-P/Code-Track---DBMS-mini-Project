# CodeTrack — Database Tables & Usage (DBMS Mini Project)

This document explains **why each table exists**, how it relates to others, and how the application uses it.

- DB: **PostgreSQL**
- ORM: **Prisma** (schema in `prisma/schema.prisma`)
- Note: Prisma models are mapped to SQL tables using `@@map(...)`.

---

## 1) `users` (Model: `User`)

**Purpose**
- Stores authentication + core profile data.
- Stores **streak fields** directly on the user row for fast reads.

**Key columns**
- `id` (PK)
- `username` (UNIQUE)
- `email` (UNIQUE)
- `passwordHash`
- `role` (`user` | `admin`)
- `currentStreak`, `longestStreak`, `lastActiveDate`
- `isActive` (soft deactivation)

**Relationships**
- 1→many with `submissions`
- 1→many with `contest_registrations`
- 1→many with `contests` (as creator)
- 1→many with `user_problem_status`, `topic_performance`

**Where it’s used**
- Auth (NextAuth Credentials): login reads `users` and verifies `passwordHash`.
- Leaderboard and analytics read streak counters.

---

## 2) `topics` (Model: `Topic`)

**Purpose**
- Stores canonical topic tags (e.g., Arrays, DP).

**Key columns**
- `id` (PK)
- `name` (UNIQUE)

**Relationships**
- many↔many with `problems` via `problem_topics`
- 1→many with `topic_performance` (per-user aggregate)

**Where it’s used**
- Admin Manage: create/delete topics.
- Problem tagging and topic analytics.

---

## 3) `problems` (Model: `Problem`)

**Purpose**
- Stores problems users can solve.
- Stores cached counters for fast UI stats.

**Key columns**
- `id` (PK)
- `title` (UNIQUE)
- `description`
- `difficulty` (enum)
- `totalSubmissions`, `totalAccepted` (cached)
- `createdById` (nullable)

**Relationships**
- many↔many with `topics` via `problem_topics`
- 1→many with `submissions`
- 1→many with `contest_problems`
- 1→many with `user_problem_status`

**Where it’s used**
- Problem list + detail pages.
- Contest composition (`contest_problems`).

---

## 4) `problem_topics` (Model: `ProblemTopic`)

**Purpose**
- Bridge table implementing **many-to-many** between problems and topics.

**Keys / constraints**
- Composite PK: (`problemId`, `topicId`)

**Why it matters (DBMS)**
- Demonstrates normalized design: topics are not duplicated in `problems`.

---

## 5) `submissions` (Model: `Submission`)

**Purpose**
- Immutable **attempt ledger** of every submission.
- Powers analytics: acceptance rate, activity timeline, contest history.

**Key columns**
- `id` (PK)
- `userId` (FK → `users.id`)
- `problemId` (FK → `problems.id`)
- `verdict` (enum)
- `language`
- `submittedAt`
- `contestId` (nullable FK → `contests.id`)

**Indexes (performance)**
- (`userId`, `submittedAt`) → fast “recent submissions” per user
- (`problemId`, `verdict`) → fast per-problem analytics
- (`contestId`, `userId`) → fast contest filtering per participant

**Where it’s used**
- Submitting solutions
- Contest submissions (when `contestId` is present)
- Leaderboards and user stats

**Transaction behavior (DBMS-worthy)**
- On insert, the app may also update:
  - `problems.totalSubmissions / totalAccepted`
  - `user_problem_status` (first solve tracking)
  - `topic_performance`
  - streak fields in `users`

---

## 6) `contests` (Model: `Contest`)

**Purpose**
- Defines timed contests and ownership (admin creates).

**Key columns**
- `id` (PK)
- `title` (UNIQUE)
- `startTime`, `endTime`
- `createdById` (FK → `users.id`)

**Relationships**
- 1→many `contest_problems`
- 1→many `contest_registrations`
- 1→many `submissions` (via optional `contestId`)

**Where it’s used**
- Contest list, contest details
- Join flow and final summary

---

## 7) `contest_problems` (Model: `ContestProblem`)

**Purpose**
- Assigns problems to contests **in a defined order**.

**Keys / constraints**
- Composite PK: (`contestId`, `problemId`)
- `order` is stored per mapping.

**Where it’s used**
- Contest problem navigation (Prev/Next)
- “Next unsolved problem” selection logic

---

## 8) `contest_registrations` (Model: `ContestRegistration`)

**Purpose**
- Tracks which user registered for which contest.

**Keys / constraints**
- Composite PK: (`userId`, `contestId`)
- Prevents duplicate registrations by design.

**Where it’s used**
- Register button vs Join button logic
- Authorization checks for contest participation

---

## 9) `user_problem_status` (Model: `UserProblemStatus`)

**Purpose**
- Stores per-user solved state per problem.
- Supports “next unsolved” and solved counts without scanning all submissions.

**Keys / constraints**
- Composite PK: (`userId`, `problemId`)

**Key columns**
- `isSolved`
- `firstAcceptedAt`

**Where it’s used**
- Total solved per user (leaderboard)
- Next unsolved contest problem selection

---

## 10) `topic_performance` (Model: `TopicPerformance`)

**Purpose**
- Per-user aggregate stats per topic (attempted/solved).

**Keys / constraints**
- Composite PK: (`userId`, `topicId`)

**Why it matters (DBMS)**
- Example of a controlled “derived table” for faster analytics.

---

## 11) `leaderboard_entries` (Model: `LeaderboardEntry`)

**Purpose**
- ICPC-style contest leaderboard cache (rank, penalty, solved).

**Keys / constraints**
- Composite PK: (`contestId`, `userId`)

**Where it’s used**
- Contest leaderboard views / calculations (contest-specific ranking).

---

# Advanced SQL Examples (Impress-the-Professor Section)

Below are example queries that match the schema and demonstrate **joins, CTEs, and window functions**.

## A) Global Percentile Ranking (Top X%) — Window Function

Computes global percentile from solved counts using `PERCENT_RANK()`.

```sql
WITH solved AS (
  SELECT ups."userId" AS user_id, COUNT(*)::int AS total_solved
  FROM user_problem_status ups
  WHERE ups."isSolved" = true
  GROUP BY ups."userId"
), base AS (
  SELECT u.id, u.username, COALESCE(s.total_solved, 0) AS total_solved
  FROM users u
  LEFT JOIN solved s ON s.user_id = u.id
  WHERE u.role = 'user'::role AND u."isActive" = true
), ranked AS (
  SELECT
    id,
    username,
    total_solved,
    PERCENT_RANK() OVER (ORDER BY total_solved DESC) AS p_rank
  FROM base
)
SELECT
  id,
  username,
  total_solved,
  ROUND((100 - (p_rank * 100))::numeric, 2) AS global_percentile
FROM ranked
-- Top 10% example:
WHERE p_rank <= 0.10
ORDER BY total_solved DESC;
```

## B) Contest Progress — Next Unsolved Problem

Given a contest + user, pick the first contest problem that is not solved.

```sql
SELECT cp."problemId"
FROM contest_problems cp
LEFT JOIN user_problem_status ups
  ON ups."problemId" = cp."problemId"
 AND ups."userId" = $1
WHERE cp."contestId" = $2
  AND COALESCE(ups."isSolved", false) = false
ORDER BY cp."order" ASC
LIMIT 1;
```

## C) Acceptance Rate Per User (Aggregate)

```sql
SELECT
  s."userId",
  COUNT(*) AS total_submissions,
  SUM(CASE WHEN s.verdict = 'Accepted'::verdict THEN 1 ELSE 0 END) AS accepted,
  ROUND(
    (SUM(CASE WHEN s.verdict = 'Accepted'::verdict THEN 1 ELSE 0 END)::numeric / NULLIF(COUNT(*), 0)) * 100,
    2
  ) AS acceptance_rate
FROM submissions s
GROUP BY s."userId";
```

---

# Quick Mapping: Feature → Tables

- Auth & roles: `users`
- Problem tagging: `problems`, `topics`, `problem_topics`
- Submissions + stats: `submissions`, `problems` (cached counters)
- Solved tracking: `user_problem_status`
- Topic analytics: `topic_performance`
- Contests: `contests`, `contest_problems`, `contest_registrations`, `submissions`
- Contest leaderboard cache: `leaderboard_entries`
