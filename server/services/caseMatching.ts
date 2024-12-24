import OpenAI from "openai";
import { Case } from "@db/schema";

const openai = new OpenAI();
// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user

interface MatchDetails {
  physicalMatch: number;
  distinctiveFeatureMatch: number;
  contactMatch: number;
  overallSimilarity: number;
}

export async function compareCases(newCase: Partial<Case>, existingCase: Case): Promise<MatchDetails> {
  // Check for exact contact info match
  const contactMatch = compareContactInfo(newCase.contactInfo, existingCase.contactInfo);

  // Compare names and descriptions using AI
  const textSimilarity = await compareTextContent(
    {
      name: newCase.childName,
      description: newCase.description,
    },
    {
      name: existingCase.childName,
      description: existingCase.description,
    }
  );

  // Compare images if available
  let imageSimilarity = 0;
  if (newCase.imageUrl && existingCase.imageUrl) {
    imageSimilarity = await compareImages(newCase.imageUrl, existingCase.imageUrl);
  }

  // Calculate overall similarity
  const overallSimilarity = calculateOverallSimilarity(
    textSimilarity,
    imageSimilarity,
    contactMatch
  );

  return {
    physicalMatch: textSimilarity,
    distinctiveFeatureMatch: imageSimilarity,
    contactMatch,
    overallSimilarity,
  };
}

async function compareTextContent(
  newContent: { name: string | undefined; description: string | undefined },
  existingContent: { name: string; description: string }
): Promise<number> {
  const prompt = `Compare these two cases and determine if they likely refer to the same child. Consider names, descriptions, and any distinctive features mentioned.

Case 1:
Name: ${newContent.name}
Description: ${newContent.description}

Case 2:
Name: ${existingContent.name}
Description: ${existingContent.description}

Please analyze the similarity considering the following aspects:
1. Name similarity (accounting for nicknames, spelling variations)
2. Physical description matches
3. Distinctive features or characteristics mentioned
4. Location or circumstance similarities
5. Temporal consistency

Analyze the similarity and provide a similarity score between 0 and 1, where:
0 = Completely different cases
1 = Almost certainly the same case

Consider partial matches and provide detailed reasoning for the score.

Respond with JSON in this format:
{
  "similarityScore": number,
  "reasoning": string,
  "matchedAspects": {
    "name": number,
    "physicalDescription": number,
    "distinctiveFeatures": number,
    "location": number,
    "circumstances": number
  }
}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content);
    return result.similarityScore;
  } catch (error) {
    console.error("Error comparing text content:", error);
    return 0;
  }
}

async function compareImages(newImageUrl: string, existingImageUrl: string): Promise<number> {
  try {
    const newImageBuffer = await fetch(new URL(newImageUrl, 'http://localhost:5000')).then(res => res.arrayBuffer());
    const existingImageBuffer = await fetch(new URL(existingImageUrl, 'http://localhost:5000')).then(res => res.arrayBuffer());

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Compare these two images and determine if they show the same person. 
                    Focus on:
                    1. Facial features and structure
                    2. Distinctive marks or characteristics
                    3. Overall appearance and build
                    4. Clothing or accessories if relevant
                    5. Background or context if relevant

                    Provide a detailed analysis with a similarity score between 0 and 1, where:
                    0 = Definitely different people
                    1 = Definitely the same person

                    Respond with JSON in this format:
                    {
                      "similarityScore": number,
                      "reasoning": string,
                      "matchedFeatures": {
                        "facialFeatures": number,
                        "distinctiveMarks": number,
                        "overallAppearance": number,
                        "clothingMatch": number,
                        "contextMatch": number
                      }
                    }`
            },
            {
              type: "image_url",
              image_url: { url: `data:image/jpeg;base64,${Buffer.from(newImageBuffer).toString('base64')}` }
            },
            {
              type: "image_url",
              image_url: { url: `data:image/jpeg;base64,${Buffer.from(existingImageBuffer).toString('base64')}` }
            }
          ],
        },
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content);
    return result.similarityScore;
  } catch (error) {
    console.error("Error comparing images:", error);
    return 0;
  }
}

function compareContactInfo(newContact: string | undefined, existingContact: string): number {
  if (!newContact) return 0;

  // Normalize contact info by removing spaces, dashes, and converting to lowercase
  const normalizeContact = (contact: string) => 
    contact.toLowerCase().replace(/[\s-+()]/g, '');

  const normalized1 = normalizeContact(newContact);
  const normalized2 = normalizeContact(existingContact);

  // Check for exact match after normalization
  if (normalized1 === normalized2) return 1;

  // Check if one contains the other (for partial matches like different formatting)
  if (normalized1.includes(normalized2) || normalized2.includes(normalized1)) return 0.9;

  // Check for partial matches (e.g., same number with different country code)
  const longerNum = normalized1.length > normalized2.length ? normalized1 : normalized2;
  const shorterNum = normalized1.length > normalized2.length ? normalized2 : normalized1;

  if (longerNum.endsWith(shorterNum)) return 0.8;

  // Check for similar patterns (last 8 digits match)
  const last8Digits1 = normalized1.slice(-8);
  const last8Digits2 = normalized2.slice(-8);
  if (last8Digits1 === last8Digits2) return 0.7;

  return 0;
}

function calculateOverallSimilarity(
  textSimilarity: number,
  imageSimilarity: number,
  contactMatch: number
): number {
  // Weighted average of similarities with dynamic weighting
  let weights = {
    text: 0.4,
    image: 0.4,
    contact: 0.2,
  };

  // Adjust weights based on available data
  if (imageSimilarity === 0) {
    // No image comparison available, redistribute weight
    weights = {
      text: 0.7,
      image: 0,
      contact: 0.3,
    };
  }

  return (
    textSimilarity * weights.text +
    imageSimilarity * weights.image +
    contactMatch * weights.contact
  );
}