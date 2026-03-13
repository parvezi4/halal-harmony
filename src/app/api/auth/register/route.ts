import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password || password.length < 8) {
      return NextResponse.json(
        { error: "Email and password (min 8 chars) are required" },
        { status: 400 }
      );
    }

    const [existingUser, existingMemberAccount, existingAdminAccount] = await Promise.all([
      prisma.user.findUnique({ where: { email }, select: { id: true } }),
      prisma.memberAccount.findUnique({ where: { email }, select: { id: true } }),
      prisma.adminAccount.findUnique({ where: { email }, select: { id: true } }),
    ]);

    if (existingUser || existingMemberAccount || existingAdminAccount) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role: 'MEMBER',
        memberAccount: {
          create: {
            email,
            passwordHash,
          },
        },
      },
    });

    return NextResponse.json({ id: user.id, email: user.email });
  } catch (error) {
    console.error("Error registering user", error);
    return NextResponse.json(
      { error: "Unable to register" },
      { status: 500 }
    );
  }
}

