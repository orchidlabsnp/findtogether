import express, { type Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { db } from "@db";
import { cases, users } from "@db/schema";
import { eq } from "drizzle-orm";
import multer from "multer";
import path from "path";
import fs from "fs";
import { compareImageWithDescription, getImageDescription } from "./services/openai";
import { initializeNotificationService } from "./services/notifications";
import { analyzeAndNotify } from "./services/reportAnalysis";

// Add request logging middleware
const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} - Started`);

  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} - Completed in ${duration}ms with status ${res.statusCode}`);
  });

  next();
};

// Add error handling middleware
const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(`[${new Date().toISOString()}] Error processing ${req.method} ${req.url}:`, err);

  // Send appropriate error response
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal Server Error',
      status: err.status || 500,
      path: req.url,
      timestamp: new Date().toISOString()
    }
  });
};

const storage = multer.diskStorage({
  destination: "./uploads",
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

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
  // Add logging middleware
  app.use(requestLogger);

  // Serve uploaded files
  app.use('/uploads', express.static('uploads'));

  app.get("/api/cases", async (req, res, next) => {
    try {
      console.log("Fetching all cases...");
      const allCases = await db.query.cases.findMany({
        orderBy: (cases, { desc }) => [desc(cases.createdAt)]
      });
      console.log(`Successfully fetched ${allCases.length} cases`);
      res.json(allCases);
    } catch (error) {
      console.error("Error fetching cases:", error);
      next(error);
    }
  });

app.post("/api/cases", upload.array("files"), async (req, res, next) => {
    try {
      const { childName, age, location, description, contactInfo, caseType, reporterAddress } = req.body;
      const files = req.files as Express.Multer.File[];

      if (!childName || !age || !location || !description || !contactInfo || !caseType || !reporterAddress) {
        return res.status(400).send("All fields are required");
      }

      // Get or create user by address
      let user = await db.query.users.findFirst({
        where: eq(users.address, reporterAddress)
      });

      if (!user) {
        // Create new user if doesn't exist
        const [newUser] = await db.insert(users)
          .values({ address: reporterAddress })
          .returning();
        user = newUser;
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
          next(error); // Pass error to error handler
        }
      }

      const [newCase] = await db.insert(cases).values({
        childName,
        age: parseInt(age),
        location,
        description,
        contactInfo,
        caseType,
        imageUrl,
        aiCharacteristics,
        reporterId: user.id,
        status: 'open'
      }).returning();

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
      next(error); // Pass error to error handler
    }
  });

  app.get("/api/cases/user/:address", async (req, res, next) => {
    try {
      const { address } = req.params;

      // Get or create user by address
      let user = await db.query.users.findFirst({
        where: eq(users.address, address)
      });

      if (!user) {
        // Create new user if doesn't exist
        const [newUser] = await db.insert(users)
          .values({ address })
          .returning();
        user = newUser;
      }

      // Get cases for this user
      const userCases = await db.query.cases.findMany({
        where: eq(cases.reporterId, user.id),
        orderBy: (cases, { desc }) => [desc(cases.createdAt)]
      });

      res.json(userCases);
    } catch (error) {
      console.error("Error fetching user cases:", error);
      next(error); // Pass error to error handler
    }
  });

  app.post("/api/cases/search", upload.array("files"), async (req, res, next) => {
    console.log('Search request received:', {
      searchType: req.body.searchType,
      hasFiles: req.files && (req.files as Express.Multer.File[]).length > 0,
      query: req.body.query
    });

    const { searchType } = req.body;
    const files = req.files as Express.Multer.File[];
    const query = req.body.query;

    if (!query && (!files || files.length === 0) && searchType !== "image") {
      console.log('Invalid search request: missing query or files');
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
          console.log('Processing image search...');
          if (!files || !files.length) {
            console.log('No image file provided');
            return res.status(400).send("Image file is required for image search");
          }

          try {
            const imageFile = files[0];
            console.log('Processing image:', imageFile.originalname);

            // Ensure uploads directory exists
            if (!fs.existsSync('./uploads')) {
              console.log('Creating uploads directory');
              fs.mkdirSync('./uploads', { recursive: true });
            }

            // Save image to disk first
            const filename = `${Date.now()}-${imageFile.originalname}`;
            const filepath = `./uploads/${filename}`;
            console.log('Saving image to:', filepath);

            await fs.promises.writeFile(filepath, imageFile.buffer);
            const imageUrl = `/uploads/${filename}`;
            console.log('Image saved successfully at:', imageUrl);

            console.log('Processing image analysis...');
            const imageAnalysis = await getImageDescription(imageFile.buffer);
            console.log('Image analysis completed:', imageAnalysis);

            // Get all cases
            const allCases = await db.query.cases.findMany({
              orderBy: (cases, { desc }) => [desc(cases.createdAt)]
            });

            console.log('Found cases for comparison:', allCases.length);

            // Compare image with each case using enhanced analysis
            const casesWithScores = await Promise.all(
              allCases.map(async (case_) => {
                try {
                  if (!case_.imageUrl) {
                    console.log(`Case ${case_.id} skipped - no image`);
                    return { 
                      ...case_, 
                      similarity: 0, 
                      matchedFeatures: [],
                      matchDetails: null
                    };
                  }

                  // Read the case image file
                  const casePath = path.join(process.cwd(), case_.imageUrl.replace(/^\//, ''));
                  if (!fs.existsSync(casePath)) {
                    console.log(`Case ${case_.id} image not found at ${casePath}`);
                    return { 
                      ...case_, 
                      similarity: 0, 
                      matchedFeatures: [],
                      matchDetails: null
                    };
                  }

                  const caseImageBuffer = await fs.promises.readFile(casePath);
                  const characteristics = case_.aiCharacteristics ? 
                    JSON.parse(case_.aiCharacteristics) : undefined;

                  console.log(`Analyzing case ${case_.id} with AI characteristics`);

                  const comparison = await compareImageWithDescription(
                    caseImageBuffer,
                    case_.description,
                    characteristics
                  );

                  console.log(`Case ${case_.id} analysis complete:`, {
                    similarity: comparison.similarity,
                    matchDetails: comparison.matchDetails
                  });

                  return { 
                    ...case_,
                    similarity: comparison.similarity,
                    matchedFeatures: comparison.matchedFeatures,
                    matchDetails: comparison.matchDetails,
                    aiAnalysis: {
                      ...imageAnalysis.characteristics,
                      matchScore: comparison.similarity,
                      matchBreakdown: comparison.matchDetails
                    }
                  };
                } catch (error) {
                  console.error(`Error processing case ${case_.id}:`, error);
                  return { 
                    ...case_, 
                    similarity: 0, 
                    matchedFeatures: [],
                    matchDetails: null
                  };
                }
              })
            );

            // Enhanced filtering with detailed match analysis
            searchResults = casesWithScores
              .filter(case_ => {
                // Case must meet minimum overall similarity threshold
                if (case_.similarity < 0.4) return false;

                // If match details available, apply additional criteria
                if (case_.matchDetails) {
                  const { physicalMatch, distinctiveFeatureMatch } = case_.matchDetails;
                  // Require good physical match OR strong distinctive features
                  return physicalMatch > 0.6 || distinctiveFeatureMatch > 0.7;
                }

                return true;
              })
              .sort((a, b) => b.similarity - a.similarity);

            console.log(`Found ${searchResults.length} similar cases`);
          } catch (error) {
            console.error('Error processing image search:', error);
            next(error); //Pass error to error handler
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
      next(error); //Pass error to error handler
    }
  });

  app.post("/api/users", async (req, res, next) => {
    try{
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
    } catch (error) {
      console.error("Error creating user:", error);
      next(error); // Pass error to error handler
    }
  });

  // Add PUT endpoint for updating case status
  app.put("/api/cases/:id/status", async (req, res, next) => {
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
      next(error); // Pass error to error handler
    }
  });


  const httpServer = createServer(app);

  // Initialize notification service
  initializeNotificationService(httpServer);

  // Add error handling middleware last
  app.use(errorHandler);

  return httpServer;
}