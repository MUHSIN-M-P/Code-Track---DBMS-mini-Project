# CodeTrack — DBMS Mini Project (Next.js + PostgreSQL)

CodeTrack is a full-stack coding practice + contest platform built specifically as a **DBMS mini-project**.
The goal is not only a working web app, but a database design that demonstrates **normalization, constraints, indexes, transactions, and advanced analytics queries**.

---

## Project Goals (DBMS Focus)

1. **Relational modeling**: Users, Problems, Topics, Submissions, Contests, Registrations, and per-user solved status.
2. **Query-driven analytics**: Leaderboards, acceptance rate, streaks, topic performance, and contest progress.
3. **Integrity & performance**: Primary keys, composite keys, foreign keys, indexes, and transaction-safe updates.
4. **Advanced SQL**: Global percentile ranking using a window function (`PERCENT_RANK()`).

---

## Features Implemented

- **RBAC**: Role-based navigation and admin-only management screens.
- **Problem bank**: Problems with difficulty + topic tagging (many-to-many).
- **Submissions ledger**: Stores attempts with verdicts, language, timestamps, and optional contest context.
- **Streak tracking**: Updates a user’s streak on Accepted submissions.
- **Contests**: Admin creates contests with ordered problems; users register; contest “Join” continues to next unsolved problem; final summary page when all solved.
- **Leaderboards**:
    - Total solved + acceptance rate
    - **Global Percentile Ranking (advanced SQL window function)**

---

## Tech Stack

### Frontend

- Next.js App Router + React + TypeScript
- Tailwind CSS + Tailgrids components
- Lucide React icons

### Backend + Database

- Next.js API routes (`app/api/**`)
- Prisma ORM
- PostgreSQL
- NextAuth (Credentials) + `bcryptjs`

---

## Database Design (What a DBMS Reviewer Cares About)

The schema is intentionally relational and constraint-heavy:

- **Many-to-many**: Problems ↔ Topics via `problem_topics`.
- **Composite keys**: Contest registrations (`userId, contestId`) and contest problem mapping (`contestId, problemId`).
- **Ledger-style table**: `submissions` stores immutable attempts over time.
- **Derived/analytic tables**:
    - `user_problem_status` tracks solved state per user per problem.
    - `topic_performance` aggregates attempted/solved counters.
- **Indexes**: Chosen for common access patterns (e.g., submissions by user/time, contest submissions, etc.).

CodeTrack relies on a highly relational schema to manage the ecosystem. Below is the blueprint of the core models interacting under the hood:

### Core Entities

- `users`: credentials + role + streak fields
- `problems`: difficulty + cached submission counters
- `topics`: unique topic names
- `problem_topics`: bridge table
- `submissions`: verdicts + timestamps (+ optional `contestId`)
- `contests`, `contest_problems`, `contest_registrations`
- `user_problem_status`: solved tracking

### 📚 `Problem` & 🏷️ `Topic`

A massive repository of competitive programming questions.

- **Problem**: Defines title, slug, description, and difficulty (EASY, MEDIUM, HARD).
- **Topic**: Tag definitions (like DFS, BFS, Array).
- **ProblemTopic**: A many-to-many bridging table linking Problems to their respective Topics for accurate weakness detection.

### 📝 `Submission`

The ledger for tracking all attempts.

- Stores variables regarding the user's attempt on a specific `Problem` using a chosen programming `language`.
- Records the precise `verdict` (ACCEPTED, WRONG_ANSWER, TLE, RUNTIME_ERROR, etc.).

### 🥇 `Contest`, 🎫 `ContestRegistration`, & 🧩 `ContestProblem`

The architecture for hosting platform-exclusive tournaments.

- **Contest**: Details the title, timings (start and end), duration, and the admin creator.
- **ContestProblem**: An ordered mapping of the problems specifically assigned to that contest.
- **ContestRegistration**: Tracks the users who have explicitly signed up to compete.

## Advanced SQL Showcase: Top X% Global Percentile Ranking

To earn strong DBMS marks, the leaderboard includes a **global percentile** computed inside PostgreSQL using a **window function**.

- **Window function**: `PERCENT_RANK() OVER (ORDER BY totalSolved DESC)`
- **Interpretation**: lower rank value = better; percentile is computed as `100 - percentRank * 100`.
- **Top X% filter**: `/api/leaderboard?topPercent=10` returns only the top 10%.

Implementation lives in `app/api/leaderboard/route.ts` and uses:

- CTEs (`WITH ...`) for readability
- `LEFT JOIN` + `COALESCE` to handle users with zero activity
- `PERCENT_RANK()` for true percentile ranking (not manual math)

---

## Project Structure

```text
codetrack/
  app/
    api/                 # Backend routes (leaderboard, contests, problems, submissions, ...)
    contests/            # Contest list, details, final summary
    problems/            # Problem list + detail + contest navigation
    manage/              # Admin management UI
    dashboard/           # User dashboard
  components/            # Tailgrids UI + Navbar
  lib/                   # prisma client, streak logic, analytics
  prisma/
    schema.prisma
    seed.mjs
```

---

## Setup (Local)

Ensure you have the following installed on your local machine:

- **Node.js** (v20+ recommended; see `package.json` engines)
- **npm**, **yarn**, **pnpm**, or **bun**

### 1. Clone & Install

Clone the repository and install all node modules:

```bash
npm install
```

### 2. Environment Configuration

Create a `.env` file at the root of the project to securely hold your credentials:

```bash
# Example .env contents
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/codetrack?schema=public"
NEXTAUTH_SECRET="your_very_secure_random_string_here"
NEXTAUTH_URL="http://localhost:3000"
```

### 3. Database Initialization

Synchronize your Prisma schema with your PostgreSQL database:

```bash
npx prisma generate
npx prisma db push
```

_(Optional)_ If you wish to populate the database with mock problems, topics, and test users:

```bash
npm run seed
```

### 4. Run the Application

Boot up the Next.js development server:

```bash
npm run dev
```

The application will now be running on [http://localhost:3000](http://localhost:3000).
Open your browser to start tracking your code!

---

## Useful Commands

In the project directory, you can run:

- `npm run dev` — Starts the development server with Hot Module Replacement (HMR).
- `npm run build` — Compiles the application for production deployment.
- `npm run start` — Boots the optimized production build.
- `npm run lint` — Runs ESLint to find and fix syntax/style problems in your code.
- `npm run seed` — Populates the database with sample users, topics, problems, and a contest.

---

## DBMS Viva / Evaluation Talking Points

If you are presenting this to a DBMS professor, highlight:

1. **Schema normalization**: clean separation of entities and bridge tables.
2. **Constraints**: composite primary keys for relationships (registrations, contest problems).
3. **Indexing**: optimized lookup patterns for submissions and contest analytics.
4. **Transactions**: submission creation updates multiple dependent tables safely.
5. **Advanced SQL analytics**: percentile ranking implemented using `PERCENT_RANK()`.

---

---

This is a DBMS mini-project built to demonstrate **real relational design + real SQL analytics**, not just CRUD screens.
