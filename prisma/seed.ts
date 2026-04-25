import { PrismaClient } from "@prisma/client";
import { hashSync } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Only seed if no users exist
  const userCount = await prisma.user.count();
  if (userCount > 0) {
    console.log("Database already seeded.");
    return;
  }

  // Read seed credentials from env so production passwords never live in
  // committed source. The seed script refuses to run without an explicit
  // password — accidentally creating an admin with a known default would be
  // worse than the script failing.
  const seedUsername = process.env.SEED_ADMIN_USERNAME?.trim() || "Admin";
  const seedPassword = process.env.SEED_ADMIN_PASSWORD?.trim();
  if (!seedPassword) {
    throw new Error(
      "SEED_ADMIN_PASSWORD is required. Run with " +
        "`SEED_ADMIN_PASSWORD='<strong-password>' npx tsx prisma/seed.ts` " +
        "(use a fresh password each run; never commit the value).",
    );
  }
  if (seedPassword.length < 12) {
    throw new Error("SEED_ADMIN_PASSWORD must be at least 12 characters.");
  }

  await prisma.user.create({
    data: {
      username: seedUsername,
      password: hashSync(seedPassword, 10),
    },
  });

  await prisma.demo.create({
    data: { mplname: "Demo Playlist", mdns: "", muser: "", mpass: "" },
  });

  await prisma.notification.create({
    data: { messageOne: "Welcome", messageTwo: "IPTV Player V1.0" },
  });

  await prisma.macLength.create({ data: { length: 12 } });
  await prisma.theme.create({ data: { themeNo: "theme_10" } });
  await prisma.loginText.create({
    data: { loginTitle: "Enter Your Activation Code", loginSubtitle: "" },
  });
  await prisma.adsSetting.create({ data: { adsType: "auto" } });
  await prisma.autoLayout.create({ data: { layout: "layout_7" } });
  await prisma.frameLayout.create({ data: { layout: "layout_2" } });
  await prisma.sport.create({
    data: {
      api: "1",
      headerName: "Event",
      borderColor: "#000000",
      bgColor: "#000000",
      textColor: "#ffffff",
    },
  });
  await prisma.tmdbApi.create({ data: { tmdbKey: "" } });
  await prisma.remoteUpdate.create({ data: { version: "1.0", url: "" } });

  console.log("Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
