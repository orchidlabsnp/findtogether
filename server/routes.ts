import express, { type Express } from "express";
import { createServer, type Server } from "http";
import { db } from "@db";
import { cases, users } from "@db/schema";
import { eq } from "drizzle-orm";
import multer from "multer";
import path from "path";

const storage = multer.diskStorage({
  destination: "./uploads",
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|mp4|mov|avi/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error("Only images and videos are allowed!"));
  }
});

export function registerRoutes(app: Express): Server {
  // Serve uploaded files
  app.use('/uploads', express.static('uploads'));
  app.get("/api/cases", async (req, res) => {
    const allCases = await db.query.cases.findMany({
      orderBy: (cases, { desc }) => [desc(cases.createdAt)]
    });
    res.json(allCases);
  });

  app.post("/api/cases", upload.array("files"), async (req, res) => {
    try {
      const { childName, age, location, description, contactInfo } = req.body;
      const files = req.files as Express.Multer.File[];
      
      if (!childName || !age || !location || !description || !contactInfo) {
        return res.status(400).send("All fields are required");
      }

      // Get the first image file to use as the main image
      const imageFile = files?.find(file => file.mimetype.startsWith('image/'));
      const imageUrl = imageFile ? `/uploads/${imageFile.filename}` : undefined;

      const newCase = await db.insert(cases).values({
        childName,
        age: parseInt(age),
        location,
        description,
        contactInfo,
        imageUrl,
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
