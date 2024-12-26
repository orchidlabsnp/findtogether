import express, { type Express } from "express";
import { createServer, type Server } from "http";
import { db } from "@db";
import { cases, users } from "@db/schema";
import { eq, ilike, or } from "drizzle-orm";
import multer from "multer";
import path from "path";
import fs from "fs";
import { compareImageWithDescription, getImageDescription } from "./services/openai";

// Ensure uploads directory exists
if (!fs.existsSync('./uploads')) {
  fs.mkdirSync('./uploads', { recursive: true });
}

const upload = multer({ 
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error("Only image files (JPEG, PNG, GIF) are allowed!"));
  }
});

export function registerRoutes(app: Express): Server {
  // Serve uploaded files
  app.use('/uploads', express.static('uploads'));

  app.get("/api/cases", async (req, res) => {
    try {
      const allCases = await db.query.cases.findMany({
        orderBy: (cases, { desc }) => [desc(cases.createdAt)]
      });
      res.json(allCases);
    } catch (error) {
      console.error("Error fetching cases:", error);
      res.status(500).send("Failed to fetch cases");
    }
  });

  app.post("/api/cases", upload.array("files"), async (req, res) => {
    try {
      console.log("Received case submission with body:", { ...req.body, files: req.files?.length || 0 });

      const { childName, age, description, contactInfo, reporterAddress } = req.body;
      const files = req.files as Express.Multer.File[];

      if (!childName || !age || !description || !contactInfo || !reporterAddress) {
        console.log("Missing required fields:", { childName, age, description, contactInfo, reporterAddress });
        return res.status(400).send("All fields are required");
      }

      // Get or create user by address - normalize the address to lowercase
      const normalizedAddress = reporterAddress.toLowerCase();
      console.log("Looking up user with normalized address:", normalizedAddress);

      let user = await db.query.users.findFirst({
        where: (users, { eq }) => eq(users.address, normalizedAddress)
      });

      if (!user) {
        console.log("Creating new user for address:", normalizedAddress);
        const [newUser] = await db.insert(users)
          .values({ address: normalizedAddress })
          .returning();
        user = newUser;
      }

      console.log("User for case:", user);

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
          console.log("Image saved successfully:", imageUrl);
        } catch (error) {
          console.error("Error processing image:", error);
        }
      }

      // Check for similar existing cases - This logic remains largely unchanged
      const existingCases = await db.query.cases.findMany();
      const newCaseData = {
        childName,
        description,
        contactInfo,
        imageUrl,
      };

      for (const existingCase of existingCases) {
        const matchDetails = await compareCases(newCaseData, existingCase);

        // If overall similarity is high, return the match details
        if (matchDetails.overallSimilarity > 0.8) {
          return res.status(409).json({
            message: "Similar case already exists",
            existingCase,
            matchDetails,
          });
        }
      }

      console.log("Creating case with reporterId:", user.id);

      const [newCase] = await db.insert(cases).values({
        childName,
        age: parseInt(age),
        description,
        contactInfo,
        imageUrl,
        aiCharacteristics,
        reporterId: user.id,
        status: 'open',
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();

      console.log("Created new case:", newCase);

      // Analyze the case and send notifications if necessary
      try {
        const analysisResult = await analyzeAndNotify(newCase);
        res.json({
          case: newCase,
          analysis: analysisResult
        });
      } catch (notificationError) {
        console.error("Error in notification system:", notificationError);
        // Still return success since the case was created
        res.json({
          case: newCase,
          analysis: {
            status: 'created',
            message: 'Case created successfully, but notification system encountered an error'
          }
        });
      }
    } catch (error) {
      console.error("Error creating case:", error);
      res.status(500).send("Failed to create case");
    }
  });

  app.get("/api/cases/user/:address", async (req, res) => {
    try {
      const { address } = req.params;
      const normalizedAddress = address.toLowerCase();
      console.log("Fetching cases for normalized address:", normalizedAddress);

      // First, find the user by normalized address
      const user = await db.query.users.findFirst({
        where: (users, { eq }) => eq(users.address, normalizedAddress)
      });

      if (!user) {
        console.log("No user found for address:", normalizedAddress);
        return res.json([]);
      }

      console.log("Found user:", user);

      // Get cases for this user
      const userCases = await db.query.cases.findMany({
        where: (cases, { eq }) => eq(cases.reporterId, user.id),
        orderBy: (cases, { desc }) => [desc(cases.createdAt)]
      });

      console.log(`Found ${userCases.length} cases for user`);
      res.json(userCases);
    } catch (error) {
      console.error("Error fetching user cases:", error);
      res.status(500).send("Failed to fetch user cases");
    }
  });

  app.post("/api/cases/search", upload.single('files'), async (req, res) => {
    try {
      console.log('Search request received:', {
        method: req.method,
        searchType: req.body.searchType,
        hasFile: !!req.file,
        query: req.body.query
      });

      const { searchType } = req.body;
      const query = req.body.query;
      const file = req.file;

      // Handle image search
      if (searchType === 'image') {
        if (!file) {
          console.error('Image search error: No file provided');
          return res.status(400).send("Image file is required for image search");
        }

        try {
          console.log('Processing image search:', {
            filename: file.originalname,
            size: file.size,
            mimetype: file.mimetype
          });

          // Save image to disk
          const filename = `${Date.now()}-${file.originalname}`;
          const filepath = `./uploads/${filename}`;
          console.log('Saving uploaded image to:', filepath);

          await fs.promises.writeFile(filepath, file.buffer);
          const imageUrl = `/uploads/${filename}`;
          console.log('Image saved successfully:', imageUrl);

          // Process image with AI
          console.log('Starting AI image analysis...');
          let imageAnalysis;
          try {
            imageAnalysis = await getImageDescription(file.buffer);
            console.log('AI analysis completed:', imageAnalysis);
          } catch (aiError) {
            console.error('AI analysis failed:', aiError);
            throw new Error('Failed to analyze image with AI');
          }

          // Get all cases for comparison
          console.log('Fetching cases from database...');
          const allCases = await db.query.cases.findMany({
            orderBy: (cases, { desc }) => [desc(cases.createdAt)]
          });
          console.log(`Found ${allCases.length} cases for comparison`);

          // Compare image with each case
          console.log('Starting case comparison...');
          const casesWithScores = await Promise.all(
            allCases.map(async (case_) => {
              try {
                if (!case_.imageUrl) {
                  console.log(`Case ${case_.id}: No image available`);
                  return { ...case_, similarity: 0 };
                }

                const casePath = path.join(process.cwd(), case_.imageUrl.replace(/^\//, ''));
                if (!fs.existsSync(casePath)) {
                  console.log(`Case ${case_.id}: Image file not found at ${casePath}`);
                  return { ...case_, similarity: 0 };
                }

                console.log(`Processing case ${case_.id} image comparison...`);
                const caseImageBuffer = await fs.promises.readFile(casePath);
                const characteristics = case_.aiCharacteristics ? 
                  JSON.parse(case_.aiCharacteristics) : undefined;

                const comparison = await compareImageWithDescription(
                  caseImageBuffer,
                  case_.description,
                  characteristics
                );

                console.log(`Case ${case_.id} comparison results:`, {
                  similarity: comparison.similarity,
                  matchDetails: comparison.matchDetails
                });

                return { 
                  ...case_,
                  similarity: comparison.similarity,
                  matchDetails: comparison.matchDetails
                };
              } catch (error) {
                console.error(`Error processing case ${case_.id}:`, error);
                return { ...case_, similarity: 0 };
              }
            })
          );

          // Filter and sort results
          const searchResults = casesWithScores
            .filter(case_ => case_.similarity > 0.4)
            .sort((a, b) => b.similarity - a.similarity);

          console.log(`Search complete. Found ${searchResults.length} similar cases`);
          return res.json(searchResults);

        } catch (error) {
          console.error('Image search processing error:', error);
          return res.status(500).json({
            error: "Error processing image search",
            details: error instanceof Error ? error.message : "Unknown error"
          });
        }
      }

      // Handle name-based search
      try {
        if (!query?.trim()) {
          return res.status(400).json({
            error: "Invalid search",
            details: "Please provide a name to search"
          });
        }

        console.log('Performing name search:', { query });

        const searchResults = await db.query.cases.findMany({
          where: (cases, { ilike }) => 
            ilike(cases.childName, `%${query}%`),
          orderBy: (cases, { desc }) => [desc(cases.createdAt)]
        });

        console.log(`Name search complete. Found ${searchResults.length} results`);
        res.json(searchResults);
      } catch (error) {
        console.error('Name search error:', error);
        res.status(500).json({
          error: "Error performing name search",
          details: error instanceof Error ? error.message : "Unknown error"
        });
      }
    } catch (error) {
      console.error('Search endpoint error:', error);
      res.status(500).json({
        error: "Search operation failed",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  app.post("/api/users", async (req, res) => {
    try {
      const { address } = req.body;
      if (!address) {
        return res.status(400).send("Address is required");
      }

      const normalizedAddress = address.toLowerCase();
      console.log("Creating/fetching user for address:", normalizedAddress);

      const existingUser = await db.query.users.findFirst({
        where: (users, { eq }) => eq(users.address, normalizedAddress)
      });

      if (existingUser) {
        console.log("Found existing user:", existingUser);
        res.json(existingUser);
      } else {
        console.log("Creating new user for address:", normalizedAddress);
        const [newUser] = await db.insert(users)
          .values({ address: normalizedAddress })
          .returning();
        res.json(newUser);
      }
    } catch (error) {
      console.error("Error handling user:", error);
      res.status(500).send("Failed to handle user");
    }
  });

  // Add PUT endpoint for updating case status
  app.put("/api/cases/:id/status", async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['open', 'investigating', 'resolved'].includes(status)) {
      return res.status(400).send("Invalid status value");
    }

    try {
      const [updatedCase] = await db.update(cases)
        .set({ status })
        .where(eq(cases.id, parseInt(id)))
        .returning();

      if (!updatedCase) {
        return res.status(404).send("Case not found");
      }

      res.json(updatedCase);
    } catch (error) {
      console.error("Error updating case status:", error);
      res.status(500).send("Failed to update case status");
    }
  });


  const httpServer = createServer(app);
  return httpServer;
}