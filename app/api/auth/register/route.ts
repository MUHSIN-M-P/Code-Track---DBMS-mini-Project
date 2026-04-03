import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const { username, email, password } = await req.json();

        if (!username || !email || !password) {
            return NextResponse.json(
                { error: "All fields are required" },
                { status: 400 },
            );
        }

        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            return NextResponse.json(
                { error: "Email already registered" },
                { status: 409 },
            );
        }

        const existingUsername = await prisma.user.findUnique({
            where: { username },
        });
        if (existingUsername) {
            return NextResponse.json(
                { error: "Username already taken" },
                { status: 409 },
            );
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const user = await prisma.user.create({
            data: { username, email, passwordHash: hashedPassword },
        });

        return NextResponse.json(
            { message: "Account created successfully", userId: user.id },
            { status: 201 },
        );
    } catch (err) {
        console.error("[register] Error:", err);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 },
        );
    }
}
