import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export async function GET(
    _: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    const { id } = await params;
    const user = await prisma.user.findUnique({
        where: { id },
        select: {
            id: true,
            username: true,
            email: true,
            role: true,
            preferredLang: true,
            joinDate: true,
            currentStreak: true,
            longestStreak: true,
            isActive: true,
        },
    });
    if (!user)
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(user);
}

export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    const { id } = await params;
    try {
        const { username, preferredLang, currentPassword, newPassword } =
            await req.json();

        let passwordHash = undefined;
        if (currentPassword && newPassword) {
            const user = await prisma.user.findUnique({ where: { id } });
            if (!user)
                return NextResponse.json(
                    { error: "User not found" },
                    { status: 404 },
                );

            const isValid = await bcrypt.compare(
                currentPassword,
                user.passwordHash,
            );
            if (!isValid)
                return NextResponse.json(
                    { error: "Incorrect current password" },
                    { status: 400 },
                );

            passwordHash = await bcrypt.hash(newPassword, 12);
        }

        if (username) {
            const existingUsername = await prisma.user.findUnique({
                where: { username },
            });
            if (existingUsername && existingUsername.id !== id) {
                return NextResponse.json(
                    { error: "Username already taken" },
                    { status: 409 },
                );
            }
        }

        const updatedUser = await prisma.user.update({
            where: { id },
            data: {
                ...(username && { username }),
                ...(preferredLang && { preferredLang }),
                ...(passwordHash && { passwordHash }),
            },
        });
        return NextResponse.json({
            id: updatedUser.id,
            username: updatedUser.username,
            preferredLang: updatedUser.preferredLang,
        });
    } catch {
        return NextResponse.json({ error: "Update failed" }, { status: 500 });
    }
}

export async function DELETE(
    _: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    const { id } = await params;
    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ message: "Deleted" });
}
