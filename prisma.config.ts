import { defineConfig, env } from "prisma/config";
import * as dotenv from 'dotenv';

// 加载环境变量
dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.development' });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  engine: "classic",
  datasource: {
    url: env("DATABASE_URL"),
  },
});
