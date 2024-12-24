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

Analyze the similarity and provide a similarity score between 0 and 1, where:
0 = Completely different cases
1 = Almost certainly the same case

Respond with JSON in this format:
{
  "similarityScore": number,
  "reasoning": string
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
    const newImageBuffer = await fetch(newImageUrl).then(res => res.arrayBuffer());
    const existingImageBuffer = await fetch(existingImageUrl).then(res => res.arrayBuffer());

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Compare these two images and determine if they show the same person. Focus on facial features, distinctive marks, and overall appearance. Provide a similarity score between 0 and 1, where 1 means definitely the same person. Respond with JSON in this format: { \"similarityScore\": number, \"reasoning\": string }"
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
    contact.toLowerCase().replace(/[\s-]/g, '');
  
  const normalized1 = normalizeContact(newContact);
  const normalized2 = normalizeContact(existingContact);
  
  // Check for exact match after normalization
  if (normalized1 === normalized2) return 1;
  
  // Check if one contains the other (for partial matches like different formatting)
  if (normalized1.includes(normalized2) || normalized2.includes(normalized1)) return 0.9;
  
  return 0;
}

function calculateOverallSimilarity(
  textSimilarity: number,
  imageSimilarity: number,
  contactMatch: number
): number {
  // Weighted average of similarities
  const weights = {
    text: 0.4,
    image: 0.4,
    contact: 0.2,
  };

  return (
    textSimilarity * weights.text +
    imageSimilarity * weights.image +
    contactMatch * weights.contact
  );
}
