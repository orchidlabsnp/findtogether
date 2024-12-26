import OpenAI from "openai";
import type { Case } from "@db/schema";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
export async function generateCaseNarrative(case_: Case): Promise<string> {
  try {
    const prompt = `
    Analyze the following missing child case details and create a clear, empathetic narrative description that highlights key information. Include physical description, last known details, and maintain a tone appropriate for a missing child case.

    Case Details:
    - Name: ${case_.childName}
    - Age: ${case_.age}
    - Last Seen: ${case_.createdAt ? new Date(case_.createdAt).toLocaleString() : 'Unknown'}
    - Location: ${case_.location}
    - Height: ${case_.height || 'Not specified'}
    - Weight: ${case_.weight || 'Not specified'}
    - Hair: ${case_.hair || 'Not specified'}
    - Eyes: ${case_.eyes || 'Not specified'}
    - Additional Details: ${case_.description || 'None provided'}

    Format the response as a JSON object with a single 'narrative' field containing the generated text.
    The narrative should be factual, clear, and formatted similar to this example:
    "Jane was last seen on December 24, 2023 at 2:30 PM in Central Park, New York. She is 12 years old, approximately 150cm tall, and weighs 45kg. Jane has brown hair and blue eyes. She was last seen wearing a red jacket and blue jeans."
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 500,
    });

    const result = JSON.parse(response.choices[0].message.content);
    return result.narrative;
  } catch (error) {
    console.error('Error generating case narrative:', error);
    return null;
  }
}
