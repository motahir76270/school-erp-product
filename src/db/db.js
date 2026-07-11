import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt('3306'),
  user: process.env.DB_USER || 'root',
  password: '',
  database: process.env.DB_NAME || 'school_manage',
});

export const db = drizzle(pool);
export default db;
