import OpenAI from "openai";
import { createReadStream } from "fs";

if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY is required");
}

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function compareImageWithDescription(
  imageBuffer: Buffer, 
  description: string
): Promise<number> {
  try {
    const base64Image = imageBuffer.toString('base64');
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Compare this image with the following description and provide a similarity score between 0 and 1, where 1 means perfect match and 0 means no similarity at all. Respond with just the number.\n\nDescription: ${description}`,
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`,
              },
            },
          ],
        },
      ],
      max_tokens: 10,
    });

    const similarityScore = parseFloat(response.choices[0].message.content || "0");
    return Math.max(0, Math.min(1, similarityScore));
  } catch (error) {
    console.error('Error comparing image:', error);
    return 0;
  }
}

export async function getImageDescription(imageBuffer: Buffer): Promise<string> {
  try {
    const base64Image = imageBuffer.toString('base64');
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Describe this person's appearance in detail, including facial features, clothing, and any distinguishing characteristics. Focus on attributes that would be helpful for identification.",
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`,
              },
            },
          ],
        },
      ],
      max_tokens: 300,
    });

    return response.choices[0].message.content || "";
  } catch (error) {
    console.error('Error getting image description:', error);
    throw error;
  }
}
