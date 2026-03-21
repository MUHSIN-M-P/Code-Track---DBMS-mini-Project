# 🚀 CodeTrack - The Ultimate Hub For Code Athletes

Welcome to **CodeTrack**, a full-stack competitive programming and progress-tracking platform designed for dedicated code athletes!

CodeTrack acts as an aggregated, unified dashboard where users can monitor their performance across different platforms (such as [Codeforces](https://codeforces.com/) and [LeetCode](https://leetcode.com/)), track their daily submission streaks, identify weak algorithm topics, and compete on global/college-wide leaderboards in real-time. This project also serves as a comprehensive Database Management System (DBMS) mini-project.

---

## 🎯 Core Platform Objectives

1. **Unify Profiles**: Connect multiple competitive programming accounts to track aggregate progress automatically.
2. **Identify Weaknesses**: Use an internal engine to spot topics where accuracy falls below average (e.g., Dynamic Programming, Graph Theory).
3. **Foster Competition**: Create localized and global leaderboards to gamify problem-solving.
4. **Host Contests**: Allow designated users or admins to host internal coding contests with selected problem sets.

---

## ✨ Key Features

- 🔗 **Deep Analytics Integration**: Seamlessly maps external platform handles (Codeforces & LeetCode) to retrieve rating graphs, submission histories, and platform-specific metrics.
- 🎯 **AI Topic Detection & Tracking**: Organizes problems into topics (Sliding Window, Math, Trees) and measures the user’s success rate per topic to guide their learning journey.
- 🔥 **Daily Streaks System**: Keeps developers motivated by tracking continuous days of coding activity.
- 🏆 **Dynamic Leaderboards**: Ranks all connected users based on a proprietary score combining their Codeforces ELO ratings, problem-solving streaks, and total problem counts.
- 🛡️ **Role-Based Access Control (RBAC)**: Supports `USER` and `ADMIN` roles. Admins have access to exclusive dashboards (`/admin`) for overseeing the platform, managing users, and curating problems.
- ⚔️ **Custom Contests**: Users can register for scheduled internal contests, battling over a custom set of coding problems within a strict time limit.
- 🎨 **Premium UI/UX**: Built with a sleek dark mode aesthetic using Tailwind CSS and components from 'Tailgrids', featuring smooth gradients, glassmorphism elements, and Lucide reactivity icons.

---

## 🛠️ Technology Stack

### Frontend Architecture

- **Framework**: [Next.js (App Router)](https://nextjs.org/) for Server-Side Rendering (SSR) and seamless SEO-optimized page routing.
- **Language**: [TypeScript](https://www.typescriptlang.org/) for end-to-end type safety.
- **Styling Engine**: [Tailwind CSS](https://tailwindcss.com/) paired with highly-polished utility components.
- **Icons**: [Lucide React](https://lucide.dev/) for crisp, scalable vector graphics.

### Backend & Database Layer

- **API Runtime**: Next.js App Router API Routes (`app/api/**`).
- **ORM (Object-Relational Mapping)**: [Prisma](https://www.prisma.io/).
- **Database**: PostgreSQL (used for production deployments and local dev parity).
- **Authentication**: [NextAuth.js](https://next-auth.js.org/) and [`bcryptjs`](https://www.npmjs.com/package/bcryptjs) for robust credential management and secure session handling.

---

## 🗄️ Database Architecture (Prisma Schema Overview)

CodeTrack relies on a highly relational schema to manage the ecosystem. Below is the blueprint of the core models interacting under the hood:

### 👤 `User`

The central entity for authentication and tracking.

- Stores credentials, global platform handles (`leetcodeHandle`, `codeforcesHandle`), and ratings.
- Contains relations to their Submissions, Contour Registrations, created Contests, and Streaks.

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

### 🔥 `Streak`

Gamification model bound 1-to-1 with a `User`.

- Tracks `currentStreak` and `longestStreak` alongside the `lastActiveDate` to encourage daily coding activity.

---

## 📂 Project Structure Overview

```text
m:\project\CodeTrack- DBMS mini project\codetrack\
├── app/                  # Next.js App Router root (Pages, Layouts, API Endpoints)
│   ├── admin/            # Admin control panel UI
│   ├── api/              # Backend serverless REST routes (e.g., /api/problems)
│   ├── leaderboard/      # UI for viewing global user ranks
│   ├── globals.css       # Core global stylesheet
│   └── page.tsx          # Marketing landing page (Hero, Stats, Features)
├── components/           # Reusable React components (Buttons, Cards, Badges, Modals)
├── lib/                  # Shared utility logic
│   ├── analytics.ts      # Functions calculating user weakness & strengths
│   └── leetcode.ts       # Service methods for scraping or calling LeetCode endpoints
├── prisma/               # Database configurations
│   ├── schema.prisma     # The Prisma schema defining the database entities
│   ├── seed.js           # Seed script for sample data
│   └── seed.js           # Script to prepopulate the DB with dummy data/problems
├── public/               # Static assets directly served to the frontend
└── package.json          # Node.js dependencies and script configurations
```

---

## ⚙️ Prerequisites & Setup

Ensure you have the following installed on your local machine:

- **Node.js** (v18.x or newer)
- **npm**, **yarn**, **pnpm**, or **bun**

### 1. Clone & Install

Clone the repository and install all node modules:

```bash
git clone <repository-url>
cd "CodeTrack- DBMS mini project/codetrack"
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
# Generate the Prisma Client
npx prisma generate

# Push the schema state to the database (creates tables)
npx prisma db push
```

_(Optional)_ If you wish to populate the database with mock problems, topics, and test users:

```bash
node prisma/seed.js
```

### 4. Run the Application

Boot up the Next.js development server:

```bash
npm run dev
```

The application will now be running on [http://localhost:3000](http://localhost:3000).
Open your browser to start tracking your code!

---

## 💻 Available CLI Scripts

In the project directory, you can run:

- `npm run dev` — Starts the development server with Hot Module Replacement (HMR).
- `npm run build` — Compiles the application for production deployment.
- `npm run start` — Boots the optimized production build.
- `npm run lint` — Runs ESLint to find and fix syntax/style problems in your code.

---

## 🛣️ Roadmap & Future Enhancements

- [ ] Implement live WebSocket connections for real-time Contest Leaderboards.
- [ ] Extend API support to include AtCoder and CodeChef profile aggregations.
- [ ] Incorporate interactive data visualization graphs using Chart.js or Recharts to map out submission history over time.
- [ ] Add dark-mode/light-mode toggles.

---

## 🤝 Contribution Guidelines

This project was built as a DBMS mini-project, but contributions to expand functionality are highly encouraged!

1. **Fork** the repository.
2. Create a **Feature Branch** (`git checkout -b feature/AmazingFeature`).
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the Branch (`git push origin feature/AmazingFeature`).
5. Open a **Pull Request**.

---

<p align="center">
  <i>Made with 💡 and ☕ for competitive programmers, by competitive programmers.</i>
</p>
