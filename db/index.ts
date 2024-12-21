import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@db/schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set. Did you forget to provision a database?");
}

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : undefined
});

pool.on('error', (err: Error) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

pool.connect()
  .then(() => console.log('Connected to PostgreSQL database'))
  .catch((err: Error) => {
    console.error('Database connection error:', err);
    process.exit(-1);
  });

export const db = drizzle(pool, { schema });
