import { GoogleGenAI } from "@google/genai";
import { PROVIDED_API_KEY } from "../constants";
import { rtdb } from "../firebaseConfig";
import { ref, get } from "firebase/database";

const getApiKey = async (): Promise<string> => {
  // 1. Try to fetch from Firebase settings to get the latest user-configured key
  try {
    const snapshot = await get(ref(rtdb, 'settings/apiKey'));
    if (snapshot.exists()) {
      const key = snapshot.val();
      if (key && typeof key === 'string' && key.trim().length > 0) {
          return key;
      }
    }
  } catch (error) {
    console.warn("Could not fetch custom API key from DB, falling back to default.", error);
  }

  // 2. Fallback to env or provided constant
  // Safely check process.env to avoid ReferenceError in browser environments
  let envKey = undefined;
  try {
    if (typeof process !== 'undefined' && process.env) {
      envKey = process.env.API_KEY;
    }
  } catch (e) {
    // process not defined
  }

  return envKey || PROVIDED_API_KEY;
};

// Helper to get an authenticated AI instance
const getAIClient = async () => {
  const key = await getApiKey();
  if (!key) throw new Error("No API Key available");
  return new GoogleGenAI({ apiKey: key });
};

export const generateText = async (prompt: string, modelType: 'basic' | 'creative' = 'basic'): Promise<string> => {
  try {
    const ai = await getAIClient();
    // Use gemini-2.5-flash for everything to ensure access and stability
    const modelName = 'gemini-2.5-flash';
    
    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
    });
    
    return response.text || "No response generated.";
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    if (error.message?.includes('API key')) {
        return "Error: Invalid API Key. Please update it in the Admin Panel.";
    }
    return "Error connecting to AI service. Please check your connection.";
  }
};

export const generateJSON = async <T>(prompt: string, schema?: any): Promise<T | null> => {
    try {
        const ai = await getAIClient();
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
            }
        });
        
        const text = response.text;
        if (!text) return null;
        return JSON.parse(text) as T;
    } catch (e) {
        console.error("JSON Generation Error", e);
        return null;
    }
}

export const analyzeImage = async (base64Image: string, mimeType: string, prompt: string): Promise<string> => {
  try {
    const ai = await getAIClient();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType, 
              data: base64Image
            }
          },
          { text: prompt }
        ]
      }
    });
    return response.text || "Could not analyze image.";
  } catch (error) {
    console.error("Vision API Error:", error);
    return "Error processing image.";
  }
};

export interface EnhancedPhotoResult {
  image?: string; // base64
  text?: string;
}

export const enhancePhoto = async (base64Image: string, mimeType: string, instructions: string): Promise<EnhancedPhotoResult> => {
  try {
    const ai = await getAIClient();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType, 
              data: base64Image
            }
          },
          { text: `Enhance this image. Make it high quality, clear, and professional. ${instructions}` }
        ]
      }
    });

    let result: EnhancedPhotoResult = {};
    
    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          result.image = part.inlineData.data;
        } else if (part.text) {
          result.text = part.text;
        }
      }
    }
    
    return result;
  } catch (error) {
    console.error("Image Enhancement Error:", error);
    return { text: "Failed to generate image. Please check API quota or image format." };
  }
};

export const transformPerson = async (
  base64Source: string, 
  mimeTypeSource: string, 
  base64Target: string, 
  mimeTypeTarget: string
): Promise<EnhancedPhotoResult> => {
  try {
    const ai = await getAIClient();
    // Using gemini-2.5-flash-image (Banana) as it is the stable model for image generation
    // gemini-3-pro-image-preview often returns 403 PERMISSION_DENIED without specific billing setups
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { text: "Generate a high-quality, photorealistic image of these two people hugging warmly. \n\nPerson 1 (Reference):" },
          {
            inlineData: {
              mimeType: mimeTypeSource, 
              data: base64Source
            }
          },
          { text: "\nPerson 2 (Reference):" },
          {
            inlineData: {
              mimeType: mimeTypeTarget, 
              data: base64Target
            }
          },
          { text: "\nInstructions: Create a seamless, photorealistic composition where Person 1 and Person 2 are embracing in a warm hug. Preserve their facial features, expressions, and likenesses as accurately as possible. The style should be realistic photography." }
        ]
      },
      config: {
        imageConfig: {
            // imageSize is NOT supported in flash-image, only in pro
            aspectRatio: '1:1'
        }
      }
    });

    let result: EnhancedPhotoResult = {};
    
    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          result.image = part.inlineData.data;
        } else if (part.text) {
          result.text = part.text;
        }
      }
    }
    
    return result;
  } catch (error: any) {
    console.error("Person Transformation Error:", error);
    // Return the specific error message to help debug if it persists
    const msg = error.message || "Failed to generate image.";
    return { text: `Error: ${msg}` };
  }
};

export const analyzeVideo = async (base64Video: string, mimeType: string, prompt: string): Promise<string> => {
  try {
    const ai = await getAIClient();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash', 
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType, 
              data: base64Video
            }
          },
          { text: prompt }
        ]
      }
    });
    return response.text || "Could not analyze video.";
  } catch (error) {
    console.error("Video API Error:", error);
    return "Error processing video. The file might be too large.";
  }
};