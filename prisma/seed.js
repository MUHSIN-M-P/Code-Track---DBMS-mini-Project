const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  // Create admin user
  const adminPassword = await bcrypt.hash("admin123", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@codetrack.io" },
    update: {},
    create: {
      name: "Admin User",
      email: "admin@codetrack.io",
      password: adminPassword,
      role: "ADMIN",
    },
  });

  // Create regular user
  const userPassword = await bcrypt.hash("user123", 12);
  const user = await prisma.user.upsert({
    where: { email: "john@codetrack.io" },
    update: {},
    create: {
      name: "John Doe",
      email: "john@codetrack.io",
      password: userPassword,
      role: "USER",
      preferredLang: "python",
    },
  });

  // Create streaks
  await prisma.streak.upsert({
    where: { userId: admin.id },
    update: {},
    create: { userId: admin.id, currentStreak: 0, longestStreak: 0 },
  });
  await prisma.streak.upsert({
    where: { userId: user.id },
    update: {},
    create: { userId: user.id, currentStreak: 5, longestStreak: 12, lastActiveDate: new Date() },
  });

  // Create topics
  const topicsData = [
    { name: "Arrays", slug: "arrays" },
    { name: "Strings", slug: "strings" },
    { name: "Dynamic Programming", slug: "dynamic-programming" },
    { name: "Graphs", slug: "graphs" },
    { name: "Trees", slug: "trees" },
    { name: "Sorting", slug: "sorting" },
    { name: "Binary Search", slug: "binary-search" },
    { name: "Linked Lists", slug: "linked-lists" },
    { name: "Stack", slug: "stack" },
    { name: "Greedy", slug: "greedy" },
  ];

  const topics = [];
  for (const t of topicsData) {
    const topic = await prisma.topic.upsert({
      where: { slug: t.slug },
      update: {},
      create: t,
    });
    topics.push(topic);
  }

  // Create problems
  const problemsData = [
    { title: "Two Sum", difficulty: "EASY", description: "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.\n\n**Example:**\nInput: nums = [2,7,11,15], target = 9\nOutput: [0,1]\n\n**Constraints:**\n- 2 <= nums.length <= 10^4\n- -10^9 <= nums[i] <= 10^9", topicSlugs: ["arrays"] },
    { title: "Valid Parentheses", difficulty: "EASY", description: "Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.\n\n**Example:**\nInput: s = \"()[]{}\"\nOutput: true\n\n**Constraints:**\n- 1 <= s.length <= 10^4", topicSlugs: ["stack", "strings"] },
    { title: "Longest Substring Without Repeating Characters", difficulty: "MEDIUM", description: "Given a string s, find the length of the longest substring without repeating characters.\n\n**Example:**\nInput: s = \"abcabcbb\"\nOutput: 3\n\n**Constraints:**\n- 0 <= s.length <= 5 * 10^4", topicSlugs: ["strings"] },
    { title: "Merge Two Sorted Lists", difficulty: "EASY", description: "You are given the heads of two sorted linked lists list1 and list2. Merge the two lists into one sorted list.\n\n**Example:**\nInput: list1 = [1,2,4], list2 = [1,3,4]\nOutput: [1,1,2,3,4,4]", topicSlugs: ["linked-lists"] },
    { title: "Maximum Subarray", difficulty: "MEDIUM", description: "Given an integer array nums, find the subarray with the largest sum, and return its sum.\n\n**Example:**\nInput: nums = [-2,1,-3,4,-1,2,1,-5,4]\nOutput: 6\n\n**Constraints:**\n- 1 <= nums.length <= 10^5", topicSlugs: ["arrays", "dynamic-programming"] },
    { title: "Binary Tree Level Order Traversal", difficulty: "MEDIUM", description: "Given the root of a binary tree, return the level order traversal of its nodes' values.\n\n**Example:**\nInput: root = [3,9,20,null,null,15,7]\nOutput: [[3],[9,20],[15,7]]", topicSlugs: ["trees"] },
    { title: "Longest Common Subsequence", difficulty: "MEDIUM", description: "Given two strings text1 and text2, return the length of their longest common subsequence.\n\n**Example:**\nInput: text1 = \"abcde\", text2 = \"ace\"\nOutput: 3", topicSlugs: ["dynamic-programming", "strings"] },
    { title: "Number of Islands", difficulty: "MEDIUM", description: "Given an m x n 2D binary grid which represents a map of '1's (land) and '0's (water), return the number of islands.\n\n**Example:**\nInput: grid = [\n  [\"1\",\"1\",\"0\",\"0\",\"0\"],\n  [\"1\",\"1\",\"0\",\"0\",\"0\"],\n  [\"0\",\"0\",\"1\",\"0\",\"0\"],\n  [\"0\",\"0\",\"0\",\"1\",\"1\"]\n]\nOutput: 3", topicSlugs: ["graphs"] },
    { title: "Merge Sort", difficulty: "MEDIUM", description: "Implement merge sort algorithm to sort an array of integers in ascending order.\n\n**Example:**\nInput: [38, 27, 43, 3, 9, 82, 10]\nOutput: [3, 9, 10, 27, 38, 43, 82]", topicSlugs: ["sorting"] },
    { title: "Binary Search", difficulty: "EASY", description: "Given a sorted array of distinct integers and a target value, return the index if the target is found. If not, return -1.\n\n**Example:**\nInput: nums = [-1,0,3,5,9,12], target = 9\nOutput: 4", topicSlugs: ["binary-search", "arrays"] },
    { title: "Edit Distance", difficulty: "HARD", description: "Given two strings word1 and word2, return the minimum number of operations required to convert word1 to word2.\n\nYou have three operations: Insert, Delete, Replace.\n\n**Example:**\nInput: word1 = \"horse\", word2 = \"ros\"\nOutput: 3", topicSlugs: ["dynamic-programming", "strings"] },
    { title: "Dijkstra's Shortest Path", difficulty: "HARD", description: "Given a weighted directed graph, find the shortest path from a source vertex to all other vertices using Dijkstra's algorithm.\n\n**Constraints:**\n- All edge weights are non-negative\n- V <= 10^5, E <= 10^6", topicSlugs: ["graphs", "greedy"] },
  ];

  const problems = [];
  for (const p of problemsData) {
    const slug = p.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const problem = await prisma.problem.upsert({
      where: { slug },
      update: {},
      create: { title: p.title, slug, description: p.description, difficulty: p.difficulty },
    });
    problems.push(problem);

    for (const ts of p.topicSlugs) {
      const topic = topics.find((t) => t.slug === ts);
      if (topic) {
        await prisma.problemTopic.upsert({
          where: { problemId_topicId: { problemId: problem.id, topicId: topic.id } },
          update: {},
          create: { problemId: problem.id, topicId: topic.id },
        });
      }
    }
  }

  // Create some submissions for John
  const verdicts = ["ACCEPTED", "WRONG_ANSWER", "ACCEPTED", "TLE", "ACCEPTED"];
  for (let i = 0; i < Math.min(5, problems.length); i++) {
    await prisma.submission.create({
      data: {
        userId: user.id,
        problemId: problems[i].id,
        language: "python",
        verdict: verdicts[i],
        submittedAt: new Date(Date.now() - (5 - i) * 86400000),
      },
    });
  }

  // Create a contest
  const contestStart = new Date(Date.now() + 86400000);
  const contest = await prisma.contest.create({
    data: {
      title: "Weekly Challenge #1",
      description: "Solve 3 problems in 90 minutes. Compete with others and climb the leaderboard!",
      startTime: contestStart,
      endTime: new Date(contestStart.getTime() + 90 * 60000),
      duration: 90,
      createdById: admin.id,
      problems: {
        create: [
          { problemId: problems[0].id, order: 1 },
          { problemId: problems[2].id, order: 2 },
          { problemId: problems[4].id, order: 3 },
        ],
      },
    },
  });

  await prisma.contestRegistration.create({
    data: { userId: user.id, contestId: contest.id },
  });

  console.log("✅ Seed completed successfully!");
  console.log(`   Admin: admin@codetrack.io / admin123`);
  console.log(`   User: john@codetrack.io / user123`);
  console.log(`   ${topics.length} topics, ${problems.length} problems, 1 contest created`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
