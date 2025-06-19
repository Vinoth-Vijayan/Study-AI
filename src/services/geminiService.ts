
import { AnalysisResult, QuestionResult } from "@/components/StudyAssistant";

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
    Analyze this scanned page/image which contains study material specifically for TNPSC (Tamil Nadu Public Service Commission) exam preparation - Group 1, Group 2, and Group 4. 
    ${languageInstruction}
    
    Please provide a comprehensive analysis for TNPSC exam purposes by extracting:

    1. The main topic/subject of the content
    2. Key study points with their importance level (high/medium/low) specifically for TNPSC exams
    3. A brief summary of the content
    4. The primary language detected in the source material (Tamil, English, or Mixed)
    5. TNPSC categories this content relates to (History, Geography, Polity, Economy, Current Affairs, Science, etc.)

    For each study point, provide:
    - A clear title
    - A detailed description/explanation
    - Importance level for TNPSC exam purposes (high/medium/low)
    - Specific TNPSC relevance (which group exams, which subjects, why important)

    Focus on content relevant to TNPSC syllabus including:
    - Tamil Nadu History and Culture
    - Indian History, Geography, Polity
    - Economy and Current Affairs
    - Science and Technology
    - General Knowledge
    - Administrative concepts

    Please respond in valid JSON format with this structure:
    {
      "mainTopic": "string",
      "studyPoints": [
        {
          "title": "string",
          "description": "string", 
          "importance": "high|medium|low",
          "tnpscRelevance": "string (specific relevance to TNPSC groups and subjects)"
        }
      ],
      "summary": "string",
      "language": "string (detected source language)",
      "tnpscCategories": ["string array of relevant TNPSC subject categories"]
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

    console.log('Sending request to Gemini API for TNPSC analysis...');
    
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
        mainTopic: "TNPSC Study Material Analysis",
        studyPoints: [
          {
            title: "Content Analysis",
            description: generatedText.substring(0, 500) + "...",
            importance: "medium" as const,
            tnpscRelevance: "General TNPSC preparation material"
          }
        ],
        summary: "The image has been analyzed for TNPSC exam preparation. Please review the content analysis above.",
        language: "Mixed",
        tnpscCategories: ["General Knowledge"]
      };
    }

  } catch (error) {
    console.error('Error analyzing image:', error);
    throw new Error('Failed to analyze the image. Please check your internet connection and try again.');
  }
};

export const generateQuestions = async (
  imageFile: File, 
  analysisResult: AnalysisResult, 
  outputLanguage: "english" | "tamil" = "english"
): Promise<QuestionResult> => {
  try {
    const base64Image = await fileToBase64(imageFile);
    const base64Data = base64Image.split(',')[1];

    const languageInstruction = outputLanguage === "tamil" 
      ? "Please provide all questions and answers in Tamil language. Use Tamil script for all content."
      : "Please provide all questions and answers in English language.";

    const studyPointsText = analysisResult.studyPoints
      .map(point => `${point.title}: ${point.description}`)
      .join('\n');

    const prompt = `
    Based on this image and the following analyzed study points for TNPSC exam preparation, generate practice questions:

    Main Topic: ${analysisResult.mainTopic}
    Study Points: ${studyPointsText}
    TNPSC Categories: ${analysisResult.tnpscCategories?.join(', ')}

    ${languageInstruction}

    Generate 8-12 practice questions suitable for TNPSC Group 1, Group 2, and Group 4 exams with the following distribution:
    - 4-6 Multiple Choice Questions (MCQ) with 4 options each
    - 2-3 Short Answer Questions  
    - 2-3 Essay Type Questions

    For each question, provide:
    - Question text
    - Question type (mcq, short, essay)
    - Difficulty level (easy, medium, hard)
    - TNPSC Group relevance (Group 1, Group 2, Group 4, or All Groups)
    - For MCQs: 4 options and correct answer
    - For Short/Essay: Model answer or key points

    Focus on questions that test:
    - Factual knowledge
    - Conceptual understanding
    - Analytical thinking
    - Application of knowledge
    - Current affairs relevance

    Please respond in valid JSON format:
    {
      "questions": [
        {
          "question": "string",
          "options": ["string array - only for MCQ"],
          "answer": "string",
          "type": "mcq|short|essay",
          "difficulty": "easy|medium|hard",
          "tnpscGroup": "Group 1|Group 2|Group 4|All Groups"
        }
      ],
      "totalQuestions": number
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
        temperature: 0.6,
        topK: 32,
        topP: 1,
        maxOutputTokens: 4096,
      }
    };

    console.log('Sending request to Gemini API for question generation...');
    
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
    console.log('Gemini API response for questions:', data);

    if (!data.candidates || data.candidates.length === 0) {
      throw new Error('No question results received from API');
    }

    const generatedText = data.candidates[0].content.parts[0].text;
    console.log('Generated questions text:', generatedText);

    // Clean the response and parse JSON
    const cleanedText = generatedText
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    try {
      const result: QuestionResult = JSON.parse(cleanedText);
      
      // Validate the result structure
      if (!result.questions || !Array.isArray(result.questions)) {
        throw new Error('Invalid question response structure from API');
      }

      // Ensure totalQuestions is set
      result.totalQuestions = result.questions.length;

      return result;
    } catch (parseError) {
      console.error('Failed to parse JSON response:', parseError);
      console.error('Raw response:', cleanedText);
      
      // Fallback: create sample questions
      return {
        questions: [
          {
            question: "Based on the study material, what are the key concepts mentioned?",
            type: "short" as const,
            difficulty: "medium" as const,
            tnpscGroup: "All Groups",
            answer: "Please refer to the analyzed study points for detailed information."
          }
        ],
        totalQuestions: 1
      };
    }

  } catch (error) {
    console.error('Error generating questions:', error);
    throw new Error('Failed to generate questions. Please check your internet connection and try again.');
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
