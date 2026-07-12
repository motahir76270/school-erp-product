import { defineConfig } from 'drizzle-kit';
import dotenv from 'dotenv';
dotenv.config();

export default defineConfig({
  schema: './src/db/schema/index.js',
  out: './src/db/migrations',
  dialect: 'mysql',
  dbCredentials: {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  },
});