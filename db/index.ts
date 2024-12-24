import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import * as schema from "@db/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

console.log("Initializing database connection...");

// Create the database instance
const db = drizzle({
  connection: process.env.DATABASE_URL,
  schema,
  ws: ws,
  connectionOptions: {
    max: 1, // Limit connections for debugging
    onConnect: () => {
      console.log("Database connection established successfully");
    },
    onError: (err) => {
      console.error("Database connection error:", err);
    },
    onClose: () => {
      console.log("Database connection closed");
    }
  }
});

// Test the connection
try {
  console.log("Testing database connection...");
  // Perform a simple query to test the connection.  This assumes a 'users' table exists.  Adjust as needed.
  await db.query.users.findFirst();
  console.log("Database connection test successful");
} catch (error) {
  console.error("Database connection test failed:", error);
  // Don't throw here, let the application handle connection issues gracefully
}

export { db };