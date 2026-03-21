import { prisma } from "./prisma";

export async function updateStreak(userId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  let streak = await prisma.streak.findUnique({ where: { userId } });

  if (!streak) {
    streak = await prisma.streak.create({
      data: { userId, currentStreak: 1, longestStreak: 1, lastActiveDate: today },
    });
    return streak;
  }

  const lastActive = streak.lastActiveDate
    ? new Date(streak.lastActiveDate)
    : null;

  if (lastActive) {
    lastActive.setHours(0, 0, 0, 0);
  }

  if (lastActive && lastActive.getTime() === today.getTime()) {
    return streak;
  }

  if (lastActive && lastActive.getTime() === yesterday.getTime()) {
    const newCurrent = streak.currentStreak + 1;
    streak = await prisma.streak.update({
      where: { userId },
      data: {
        currentStreak: newCurrent,
        longestStreak: Math.max(newCurrent, streak.longestStreak),
        lastActiveDate: today,
      },
    });
  } else {
    streak = await prisma.streak.update({
      where: { userId },
      data: {
        currentStreak: 1,
        longestStreak: Math.max(1, streak.longestStreak),
        lastActiveDate: today,
      },
    });
  }

  return streak;
}
