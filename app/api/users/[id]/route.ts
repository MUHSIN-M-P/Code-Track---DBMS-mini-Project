import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, email: true, role: true, preferredLang: true, joinedAt: true, codeforcesHandle: true, leetcodeHandle: true, cfRating: true },
  });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(user);
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const { name, preferredLang, codeforcesHandle, leetcodeHandle, currentPassword, newPassword } = await req.json();
    
    let passwordHash = undefined;
    if (currentPassword && newPassword) {
      const user = await prisma.user.findUnique({ where: { id } });
      if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
      
      const isValid = await bcrypt.compare(currentPassword, user.password);
      if (!isValid) return NextResponse.json({ error: "Incorrect current password" }, { status: 400 });
      
      passwordHash = await bcrypt.hash(newPassword, 12);
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { 
        ...(name && { name }), 
        ...(preferredLang && { preferredLang }),
        ...(codeforcesHandle !== undefined && { codeforcesHandle }),
        ...(leetcodeHandle !== undefined && { leetcodeHandle }),
        ...(passwordHash && { password: passwordHash }),
      },
    });
    return NextResponse.json({ id: updatedUser.id, name: updatedUser.name, codeforcesHandle: updatedUser.codeforcesHandle });
  } catch {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ message: "Deleted" });
}
