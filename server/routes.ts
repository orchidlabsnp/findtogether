import type { Express } from "express";
import { createServer, type Server } from "http";
import { db } from "@db";
import { cases, users } from "@db/schema";
import { eq } from "drizzle-orm";

export function registerRoutes(app: Express): Server {
  app.get("/api/cases", async (req, res) => {
    const allCases = await db.query.cases.findMany({
      orderBy: (cases, { desc }) => [desc(cases.createdAt)]
    });
    res.json(allCases);
  });

  app.post("/api/cases", async (req, res) => {
    try {
      const { childName, age, location, description, contactInfo } = req.body;
      
      if (!childName || !age || !location || !description || !contactInfo) {
        return res.status(400).send("All fields are required");
      }

      const newCase = await db.insert(cases).values({
        childName,
        age: parseInt(age),
        location,
        description,
        contactInfo,
        status: 'open'
      }).returning();

      res.json(newCase[0]);
    } catch (error) {
      console.error("Error creating case:", error);
      res.status(500).send("Failed to create case");
    }
  });

  app.get("/api/cases/search", async (req, res) => {
    const { query } = req.query;
    const searchResults = await db.query.cases.findMany({
      where: (cases, { or, ilike }) => 
        or(
          ilike(cases.childName, `%${query}%`),
          ilike(cases.location, `%${query}%`)
        )
    });
    res.json(searchResults);
  });

  app.post("/api/users", async (req, res) => {
    const { address } = req.body;
    const existingUser = await db.query.users.findFirst({
      where: eq(users.address, address)
    });
    
    if (existingUser) {
      res.json(existingUser);
    } else {
      const newUser = await db.insert(users).values({ address }).returning();
      res.json(newUser[0]);
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
