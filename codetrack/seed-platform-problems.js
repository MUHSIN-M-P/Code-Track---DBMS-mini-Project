const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const sampleProblems = [
  {
    title: "Two Sum",
    platform: "LEETCODE",
    platformId: "two-sum",
    difficulty: "EASY",
    url: "https://leetcode.com/problems/two-sum/"
  },
  {
    title: "Add Two Numbers",
    platform: "LEETCODE",
    platformId: "add-two-numbers",
    difficulty: "MEDIUM",
    url: "https://leetcode.com/problems/add-two-numbers/"
  },
  {
    title: "Watermelon",
    platform: "CODEFORCES",
    platformId: "4A",
    difficulty: "EASY",
    url: "https://codeforces.com/problemset/problem/4/A"
  },
  {
    title: "Way Too Long Words",
    platform: "CODEFORCES",
    platformId: "71A",
    difficulty: "EASY",
    url: "https://codeforces.com/problemset/problem/71/A"
  },
  {
    title: "Team",
    platform: "CODEFORCES",
    platformId: "231A",
    difficulty: "EASY",
    url: "https://codeforces.com/problemset/problem/231/A"
  },
  {
    title: "Valid Parentheses",
    platform: "LEETCODE",
    platformId: "valid-parentheses",
    difficulty: "EASY",
    url: "https://leetcode.com/problems/valid-parentheses/"
  },
  {
    title: "Binary Tree Inorder Traversal",
    platform: "LEETCODE",
    platformId: "binary-tree-inorder-traversal",
    difficulty: "MEDIUM",
    url: "https://leetcode.com/problems/binary-tree-inorder-traversal/"
  },
  {
    title: "Theatre Square",
    platform: "CODEFORCES",
    platformId: "1A",
    difficulty: "MEDIUM",
    url: "https://codeforces.com/problemset/problem/1/A"
  },
  {
    title: "Median of Two Sorted Arrays",
    platform: "LEETCODE",
    platformId: "median-of-two-sorted-arrays",
    difficulty: "HARD",
    url: "https://leetcode.com/problems/median-of-two-sorted-arrays/"
  },
  {
    title: "Longest Substring Without Repeating Characters",
    platform: "LEETCODE",
    platformId: "longest-substring-without-repeating-characters",
    difficulty: "MEDIUM",
    url: "https://leetcode.com/problems/longest-substring-without-repeating-characters/"
  }
];

async function main() {
  console.log('🚀 Adding sample platform problems...');

  for (const problem of sampleProblems) {
    try {
      await prisma.platformProblem.create({
        data: problem
      });
      console.log(`✅ Added: ${problem.title} (${problem.platform})`);
    } catch (error) {
      if (error.code === 'P2002') {
        console.log(`⚠️  Skipped: ${problem.title} (already exists)`);
      } else {
        console.error(`❌ Failed to add: ${problem.title}`, error.message);
      }
    }
  }

  const count = await prisma.platformProblem.count();
  console.log(`\n🎉 Database now has ${count} platform problems!`);
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });