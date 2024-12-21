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
    faceShape: string;
    complexion: string;
    facialHair?: string;
    accessories?: string[];
    ethnicity?: string;
    scars?: string[];
    tattoos?: string[];
    lastSeenWearing: string[];
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
          role: "system",
          content: "You are an expert in analyzing photos of people, particularly for identification and recognition purposes. Focus on clear, objective details that would be useful for identification."
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze this person's appearance in detail. Focus on unique, identifiable characteristics. Provide a structured response in JSON format with the following information:
              {
                "description": "Detailed, objective description focusing on unique identifiable features",
                "characteristics": {
                  "age": "Estimated age in years (number only)",
                  "gender": "Identified gender",
                  "hairColor": "Precise hair color and style description",
                  "eyeColor": "Precise eye color",
                  "distinguishingFeatures": ["List any unique features that aid identification"],
                  "height": "Estimated height with range",
                  "buildType": "Detailed body build description",
                  "clothing": ["Detailed list of visible clothing items with colors and styles"],
                  "faceShape": "Description of face shape",
                  "complexion": "Detailed skin tone and complexion description",
                  "facialHair": "Description of facial hair if present",
                  "accessories": ["List of any visible accessories"],
                  "ethnicity": "Apparent ethnic background",
                  "scars": ["Any visible scars or marks"],
                  "tattoos": ["Any visible tattoos with descriptions"],
                  "lastSeenWearing": ["Detailed description of outfit"]
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
      max_tokens: 1000,
      temperature: 0.5, // Lower temperature for more focused, consistent output
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
        faceShape: parsedResponse.characteristics?.faceShape || "",
        complexion: parsedResponse.characteristics?.complexion || "",
        facialHair: parsedResponse.characteristics?.facialHair || undefined,
        accessories: parsedResponse.characteristics?.accessories || [],
        ethnicity: parsedResponse.characteristics?.ethnicity || undefined,
        scars: parsedResponse.characteristics?.scars || [],
        tattoos: parsedResponse.characteristics?.tattoos || [],
        lastSeenWearing: parsedResponse.characteristics?.lastSeenWearing || []
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
    faceShape?: string;
    complexion?: string;
    facialHair?: string;
    accessories?: string[];
    ethnicity?: string;
    scars?: string[];
    tattoos?: string[];
    lastSeenWearing?: string[];
  }
): Promise<{ 
  similarity: number; 
  matchedFeatures: string[];
  matchDetails: {
    physicalMatch: number;
    clothingMatch: number;
    distinctiveFeatureMatch: number;
    ageMatch: number;
  };
}> {
  try {
    const imageAnalysis = await getImageDescription(imageBuffer);
    const base64Image = imageBuffer.toString('base64');

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert in facial recognition and human identification. Analyze and compare images with high attention to detail, focusing on both obvious and subtle characteristics that could help identify a person."
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Compare this image with the reference details provided. Focus on key identifying features and provide a detailed matching analysis.
              
              Respond with a JSON object containing:
              {
                "similarity": "Overall match score (0-1)",
                "matchedFeatures": ["List of specific matching characteristics"],
                "confidence": "Confidence in the match (0-1)",
                "matchDetails": {
                  "physicalMatch": "Score for permanent physical features (0-1)",
                  "clothingMatch": "Score for clothing match (0-1)",
                  "distinctiveFeatureMatch": "Score for unique identifying features (0-1)",
                  "ageMatch": "Score for age similarity (0-1)"
                },
                "analysis": {
                  "keyMatches": ["Detailed descriptions of significant matching features"],
                  "keyDifferences": ["Notable differences that affect the match score"],
                  "confidenceFactors": ["Reasons for the confidence score"],
                  "recommendedActions": ["Suggestions for verification"]
                }
              }

              Reference Description: ${description}
              Reference Characteristics: ${JSON.stringify(targetCharacteristics || {})}
              Current Image Analysis: ${JSON.stringify(imageAnalysis)}`,
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
      max_tokens: 1000,
      temperature: 0.3, // Lower temperature for more consistent analysis
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    // Calculate weighted similarity score
    const weights = {
      physicalMatch: 0.4,
      distinctiveFeatureMatch: 0.3,
      ageMatch: 0.2,
      clothingMatch: 0.1
    };

    const weightedScore = 
      (result.matchDetails.physicalMatch * weights.physicalMatch) +
      (result.matchDetails.distinctiveFeatureMatch * weights.distinctiveFeatureMatch) +
      (result.matchDetails.ageMatch * weights.ageMatch) +
      (result.matchDetails.clothingMatch * weights.clothingMatch);

    const finalSimilarity = Math.max(0, Math.min(1, weightedScore * result.confidence));

    return {
      similarity: finalSimilarity,
      matchedFeatures: result.analysis.keyMatches || [],
      matchDetails: {
        physicalMatch: result.matchDetails.physicalMatch || 0,
        clothingMatch: result.matchDetails.clothingMatch || 0,
        distinctiveFeatureMatch: result.matchDetails.distinctiveFeatureMatch || 0,
        ageMatch: result.matchDetails.ageMatch || 0
      }
    };
  } catch (error) {
    console.error('Error comparing image:', error);
    return { 
      similarity: 0, 
      matchedFeatures: [],
      matchDetails: {
        physicalMatch: 0,
        clothingMatch: 0,
        distinctiveFeatureMatch: 0,
        ageMatch: 0
      }
    };
  }
}