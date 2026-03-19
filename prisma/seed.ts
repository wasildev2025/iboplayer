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

  await prisma.user.create({
    data: {
      username: "Admin",
      password: hashSync("Ajmal$1234", 10),
    },
  });

  await prisma.demo.create({
    data: { mplname: "Demo Playlist", mdns: "", muser: "", mpass: "" },
  });

  await prisma.notification.create({
    data: { messageOne: "Welcome", messageTwo: "S Player V4.0" },
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
