import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { newPasswordField } from "../src/lib/validators/settings";

async function main() {
  const parsed = newPasswordField.safeParse(process.env.NEW_OWNER_PASSWORD);
  delete process.env.NEW_OWNER_PASSWORD;
  if (!parsed.success) throw new Error("Provide a valid NEW_OWNER_PASSWORD: 12 characters to 72 UTF-8 bytes.");
  const prisma = new PrismaClient();
  try {
    const owners = await prisma.user.findMany({ select: { id: true, email: true }, take: 2 });
    if (owners.length !== 1) throw new Error("Password recovery requires exactly one owner.");
    const owner = owners[0];
    const passwordHash = await bcrypt.hash(parsed.data, 12);
    await prisma.$transaction([
      prisma.user.update({ where: { id: owner.id }, data: { passwordHash } }),
      prisma.trustedDevice.updateMany({ where: { userId: owner.id, revokedAt: null }, data: { revokedAt: new Date() } }),
      prisma.loginAttempt.deleteMany({ where: { email: owner.email, success: false } }),
      prisma.auditLog.create({ data: { userId: owner.id, action: "security.password.reset", entityType: "User", entityId: owner.id } }),
    ]);
    console.info("Owner password reset. Existing sessions and trusted devices are invalidated.");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  // Validation and configuration failures are safe; database errors can contain secrets.
  console.error(error instanceof Error && error.constructor === Error ? error.message : "Password recovery failed.");
  process.exitCode = 1;
});
