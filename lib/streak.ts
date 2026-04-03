import { prisma } from "./prisma";

export async function updateStreak(userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            currentStreak: true,
            longestStreak: true,
            lastActiveDate: true,
        },
    });

    if (!user) {
        throw new Error("User not found");
    }

    const lastActive = user.lastActiveDate
        ? new Date(user.lastActiveDate)
        : null;

    if (lastActive) {
        lastActive.setHours(0, 0, 0, 0);
    }

    if (lastActive && lastActive.getTime() === today.getTime()) {
        return user;
    }

    if (lastActive && lastActive.getTime() === yesterday.getTime()) {
        const newCurrent = user.currentStreak + 1;
        return prisma.user.update({
            where: { id: userId },
            data: {
                currentStreak: newCurrent,
                longestStreak: Math.max(newCurrent, user.longestStreak),
                lastActiveDate: today,
            },
            select: {
                id: true,
                currentStreak: true,
                longestStreak: true,
                lastActiveDate: true,
            },
        });
    } else {
        return prisma.user.update({
            where: { id: userId },
            data: {
                currentStreak: 1,
                longestStreak: Math.max(1, user.longestStreak),
                lastActiveDate: today,
            },
            select: {
                id: true,
                currentStreak: true,
                longestStreak: true,
                lastActiveDate: true,
            },
        });
    }
}
