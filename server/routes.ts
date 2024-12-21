import express, { type Express } from "express";
import { createServer, type Server } from "http";
import { db } from "@db";
import { cases, users } from "@db/schema";
import { eq } from "drizzle-orm";
import multer from "multer";
import path from "path";
import fs from "fs";
import { compareImageWithDescription, getImageDescription } from "./services/openai";
import { initializeNotificationService } from "./services/notifications";

const storage = multer.diskStorage({
  destination: "./uploads",
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ 
  storage: multer.memoryStorage(),
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

// Middleware to handle disk storage after AI processing
const diskStorage = multer.diskStorage({
  destination: "./uploads",
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
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
      const { childName, age, location, description, contactInfo, caseType } = req.body;
      const files = req.files as Express.Multer.File[];
      
      if (!childName || !age || !location || !description || !contactInfo || !caseType) {
        return res.status(400).send("All fields are required");
      }

      // Get the first image file to use as the main image
      const imageFile = files?.find(file => file.mimetype.startsWith('image/'));
      let imageUrl;
      let aiCharacteristics;
      
      if (imageFile) {
        try {
          // Process with AI first
          const analysis = await getImageDescription(imageFile.buffer);
          aiCharacteristics = JSON.stringify(analysis.characteristics);
          
          // Save to disk after AI processing
          const filename = `${Date.now()}-${imageFile.originalname}`;
          await fs.promises.writeFile(`./uploads/${filename}`, imageFile.buffer);
          imageUrl = `/uploads/${filename}`;
        } catch (error) {
          console.error("Error processing image:", error);
        }
      }

      const [newCase] = await db.insert(cases).values({
        childName,
        age: parseInt(age),
        location,
        description,
        contactInfo,
        imageUrl,
        aiCharacteristics,
        status: 'open'
      }).returning();

      res.json(newCase);
    } catch (error) {
      console.error("Error creating case:", error);
      res.status(500).send("Failed to create case");
    }
  });

  app.post("/api/cases/search", upload.array("files"), async (req, res) => {
    const { searchType } = req.body;
    const files = req.files as Express.Multer.File[];
    const query = req.body.query;
    
    if (!query && !files?.length && searchType !== "image") {
      return res.status(400).send("Search query or image is required");
    }

    try {
      let searchResults;
      
      switch (searchType) {
        case 'location':
          searchResults = await db.query.cases.findMany({
            where: (cases, { ilike }) => ilike(cases.location, `%${query}%`),
            orderBy: (cases, { desc }) => [desc(cases.createdAt)]
          });
          break;

        case 'case_type':
          searchResults = await db.query.cases.findMany({
            where: (cases, { eq }) => eq(cases.caseType, query as string),
            orderBy: (cases, { desc }) => [desc(cases.createdAt)]
          });
          break;
        
        case 'text':
          searchResults = await db.query.cases.findMany({
            where: (cases, { or, ilike }) => 
              or(
                ilike(cases.childName, `%${query}%`),
                ilike(cases.description, `%${query}%`),
                ilike(cases.caseType, `%${query}%`)
              ),
            orderBy: (cases, { desc }) => [desc(cases.createdAt)]
          });
          break;

        case 'image':
          if (!files || !files.length) {
            return res.status(400).send("Image file is required for image search");
          }
          
          try {
            const imageFile = files[0];
            const imageAnalysis = await getImageDescription(imageFile.buffer);
          
            // Get all cases
            const allCases = await db.query.cases.findMany({
              orderBy: (cases, { desc }) => [desc(cases.createdAt)]
            });
          
            // Compare image with each case
            const casesWithScores = await Promise.all(
              allCases.map(async (case_) => {
                if (!case_.imageUrl) return { ...case_, similarity: 0, matchedFeatures: [] };
                
                const characteristics = case_.aiCharacteristics ? 
                  JSON.parse(case_.aiCharacteristics) : undefined;
                
                const { similarity, matchedFeatures } = await compareImageWithDescription(
                  imageFile.buffer,
                  case_.description,
                  characteristics
                );
                
                return { 
                  ...case_,
                  similarity,
                  matchedFeatures,
                  aiAnalysis: imageAnalysis.characteristics 
                };
              })
            );
          
            // Filter and sort by similarity score
            searchResults = casesWithScores
              .filter(case_ => case_.similarity > 0.6) // threshold for similarity
              .sort((a, b) => b.similarity - a.similarity);
          } catch (error) {
            console.error('Error processing image search:', error);
            return res.status(500).send("Error processing image search");
          }
          break;

        default:
          // Combined search
          searchResults = await db.query.cases.findMany({
            where: (cases, { or, ilike }) => 
              or(
                ilike(cases.childName, `%${query}%`),
                ilike(cases.location, `%${query}%`),
                ilike(cases.description, `%${query}%`)
              ),
            orderBy: (cases, { desc }) => [desc(cases.createdAt)]
          });
      }
      
      res.json(searchResults);
    } catch (error) {
      console.error('Search error:', error);
      res.status(500).send("Error performing search");
    }
  });

  app.post("/api/users", async (req, res) => {
    const { address } = req.body;
    const existingUser = await db.query.users.findFirst({
      where: eq(users.address, address)
    });
    
    if (existingUser) {
      res.json(existingUser);
    } else {
      const [newUser] = await db.insert(users).values({ address }).returning();
      res.json(newUser);
    }
  });

  const httpServer = createServer(app);
  
  // Initialize notification service
  initializeNotificationService(httpServer);

  return httpServer;
}
