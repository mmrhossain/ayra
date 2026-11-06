import { prisma } from "../lib/prisma.ts"
import { hashPassword } from "better-auth/crypto";

import { env } from "../config/env.ts"

async function seedAdmin() {

    const email = env.ADMIN_EMAIL
    const password = env.ADMIN_PASSWORD
    const role = env.ADMIN_ROLE

    if (!email || !password || !role) {
        console.error(
            "❌ ADMIN_EMAIL, ADMIN_PASSWORD and ADMIN_ROLE must be set to seed an admin user."
        );
        process.exit(1);
    }

    try {
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            await prisma.user.update({
                where: { email },
                data: {
                    role,
                    ...(role.toUpperCase() === "ADMIN"
                        ? { isSuperAdmin: true, staffStatus: "ACTIVE" as const }
                        : {}),
                },
            });
            console.log(`✅ User ${email} already exists. Role successfully updated to ${role}!`);
            return;
        }


        const userId = "admin_" + Date.now();
        const hashedPassword = await hashPassword(password); // আপনার ইচ্ছামতো পাসওয়ার্ড দিন

        await prisma.user.create({
            data: {
                id: userId,
                name: env.ADMIN_NAME ?? "Admin",
                email,
                emailVerified: env.ADMIN_EMAIL_VERIFIED,
                role,
                ...(role.toUpperCase() === "ADMIN"
                    ? { isSuperAdmin: true, staffStatus: "ACTIVE" as const }
                    : {}),
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        });

        await prisma.account.create({
            data: {
                id: "acc_" + Date.now(),
                userId: userId,
                accountId: userId,
                providerId: "credential",
                password: hashedPassword,
                issuer: "local:credential",
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        });

        console.log(`🚀 Admin user created successfully: ${email} with role ${role}`);
        console.log(`Admin email verified: ${env.ADMIN_EMAIL_VERIFIED}`);
    } catch (error) {
        console.error("❌ Error seeding admin:", error);
    } finally {
        await prisma.$disconnect();
    }
}

seedAdmin();