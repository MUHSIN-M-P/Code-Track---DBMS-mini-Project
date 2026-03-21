const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding platform problems...');

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
    }
  ];

  for (const problem of sampleProblems) {
    try {
      await prisma.platformProblem.upsert({
        where: {
          platform_platformId: {
            platform: problem.platform,
            platformId: problem.platformId
          }
        },
        update: {},
        create: problem
      });
      console.log(`Added: ${problem.title} (${problem.platform})`);
    } catch (error) {
      console.error(`Failed to add ${problem.title}:`, error.message);
    }
  }

  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });