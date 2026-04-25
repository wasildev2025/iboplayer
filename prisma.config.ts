// Prisma config — schema location and migrations folder.
// Connection settings live in prisma/schema.prisma so this file doesn't
// require DATABASE_URL at config-load time (which would break `npm install`
// on Vercel before env vars are bound).
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
});
