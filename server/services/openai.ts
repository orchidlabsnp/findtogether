import OpenAI from "openai";

if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY is required");
}

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function getImageDescription(imageBuffer: Buffer | undefined): Promise<{
  description: string;
  characteristics: {
    age: number;
    gender: string;
    hairColor: string;
    eyeColor: string;
    distinguishingFeatures: string[];
    height: string;
    buildType: string;
    clothing: string[];
  };
}> {
  try {
    if (!imageBuffer) {
      throw new Error("No image buffer provided");
    }

    const base64Image = imageBuffer.toString('base64');

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze this person's appearance in detail and provide a structured response in JSON format with the following information:
              {
                "description": "Detailed textual description of the person",
                "characteristics": {
                  "age": "Estimated age in years (number)",
                  "gender": "Identified gender",
                  "hairColor": "Color and style of hair",
                  "eyeColor": "Color of eyes",
                  "distinguishingFeatures": ["List of any distinctive features, marks, or characteristics"],
                  "height": "Estimated height description",
                  "buildType": "Body build description",
                  "clothing": ["List of clothing items and colors"]
                }
              }`,
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
      response_format: { type: "json_object" },
      max_tokens: 500,
    });

    const parsedResponse = JSON.parse(response.choices[0].message.content || "{}");
    return {
      description: parsedResponse.description || "",
      characteristics: {
        age: Number(parsedResponse.characteristics?.age) || 0,
        gender: parsedResponse.characteristics?.gender || "",
        hairColor: parsedResponse.characteristics?.hairColor || "",
        eyeColor: parsedResponse.characteristics?.eyeColor || "",
        distinguishingFeatures: parsedResponse.characteristics?.distinguishingFeatures || [],
        height: parsedResponse.characteristics?.height || "",
        buildType: parsedResponse.characteristics?.buildType || "",
        clothing: parsedResponse.characteristics?.clothing || [],
      }
    };
  } catch (error) {
    console.error('Error getting image description:', error);
    throw error;
  }
}

export async function compareImageWithDescription(
  imageBuffer: Buffer, 
  description: string,
  targetCharacteristics?: {
    age: number;
    gender: string;
    hairColor: string;
    eyeColor: string;
    distinguishingFeatures: string[];
    height: string;
    buildType: string;
    clothing: string[];
  }
): Promise<{ similarity: number; matchedFeatures: string[] }> {
  try {
    const imageAnalysis = await getImageDescription(imageBuffer);
    const base64Image = imageBuffer.toString('base64');

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Compare this image with the following description and characteristics. Provide a JSON response with:
              {
                "similarity": "Score between 0 and 1",
                "matchedFeatures": ["List of matching characteristics"],
                "confidence": "Confidence level in the match (0-1)",
                "reasoning": "Brief explanation of the similarity score"
              }

              Description: ${description}

              Target Characteristics: ${JSON.stringify(targetCharacteristics || {})}
              Image Analysis: ${JSON.stringify(imageAnalysis)}`,
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
      response_format: { type: "json_object" },
      max_tokens: 500,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    return {
      similarity: Math.max(0, Math.min(1, result.similarity * result.confidence)),
      matchedFeatures: result.matchedFeatures || []
    };
  } catch (error) {
    console.error('Error comparing image:', error);
    return { similarity: 0, matchedFeatures: [] };
  }
}