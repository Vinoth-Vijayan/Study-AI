
import { AnalysisResult } from "@/components/StudyAssistant";

const GEMINI_API_KEY = "AIzaSyAJ2P2TqBOXQncnBgT0T_BNsLcAA7cToo4";
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

export const analyzeImage = async (imageFile: File, outputLanguage: "english" | "tamil" = "english"): Promise<AnalysisResult> => {
  try {
    // Convert image to base64
    const base64Image = await fileToBase64(imageFile);
    const base64Data = base64Image.split(',')[1]; // Remove data:image/jpeg;base64, prefix

    const languageInstruction = outputLanguage === "tamil" 
      ? "Please provide the analysis in Tamil language. Use Tamil script for all content including titles, descriptions, and summary."
      : "Please provide the analysis in English language.";

    const prompt = `
    Analyze this scanned page/image which contains study material in Tamil and/or English. 
    ${languageInstruction}
    
    Please provide a comprehensive analysis for study purposes by extracting:

    1. The main topic/subject of the content
    2. Key study points with their importance level (high/medium/low)
    3. A brief summary of the content
    4. The primary language detected in the source material (Tamil, English, or Mixed)

    For each study point, provide:
    - A clear title
    - A detailed description/explanation
    - Importance level for exam/study purposes

    Focus on educational content like definitions, concepts, formulas, key facts, etc.

    Please respond in valid JSON format with this structure:
    {
      "mainTopic": "string",
      "studyPoints": [
        {
          "title": "string",
          "description": "string", 
          "importance": "high|medium|low"
        }
      ],
      "summary": "string",
      "language": "string (detected source language)"
    }
    `;

    const requestBody = {
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inline_data: {
                mime_type: imageFile.type,
                data: base64Data
              }
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.4,
        topK: 32,
        topP: 1,
        maxOutputTokens: 4096,
      }
    };

    console.log('Sending request to Gemini API...');
    
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', errorText);
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Gemini API response:', data);

    if (!data.candidates || data.candidates.length === 0) {
      throw new Error('No analysis results received from API');
    }

    const generatedText = data.candidates[0].content.parts[0].text;
    console.log('Generated text:', generatedText);

    // Clean the response and parse JSON
    const cleanedText = generatedText
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    try {
      const result: AnalysisResult = JSON.parse(cleanedText);
      
      // Validate the result structure
      if (!result.mainTopic || !result.studyPoints || !result.summary || !result.language) {
        throw new Error('Invalid response structure from API');
      }

      return result;
    } catch (parseError) {
      console.error('Failed to parse JSON response:', parseError);
      console.error('Raw response:', cleanedText);
      
      // Fallback: create a structured response from the raw text
      return {
        mainTopic: "Study Material Analysis",
        studyPoints: [
          {
            title: "Content Analysis",
            description: generatedText.substring(0, 500) + "...",
            importance: "medium" as const
          }
        ],
        summary: "The image has been analyzed. Please review the content analysis above.",
        language: "Mixed"
      };
    }

  } catch (error) {
    console.error('Error analyzing image:', error);
    throw new Error('Failed to analyze the image. Please check your internet connection and try again.');
  }
};

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};
