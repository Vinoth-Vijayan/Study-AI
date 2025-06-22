import { AnalysisResult, QuestionResult } from "@/components/StudyAssistant";
import { extractTextFromPdfPage } from "@/utils/pdfReader";

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "AIzaSyAJ2P2TqBOXQncnBgT0T_BNsLcAA7cToo4";

export const analyzeImage = async (file: File, outputLanguage: "english" | "tamil" = "english"): Promise<AnalysisResult> => {
  try {
    const base64Image = await convertToBase64(file);
    
    const languageInstruction = outputLanguage === "tamil" 
      ? "Please provide all responses in Tamil language. Use Tamil script for all content."
      : "Please provide all responses in English language.";

    const prompt = `
Analyze this image for TNPSC (Tamil Nadu Public Service Commission) exam preparation.

${languageInstruction}

Please provide a comprehensive analysis in the following JSON format:
{
  "mainTopic": "Main topic of the content",
  "studyPoints": [
    {
      "title": "Key point title",
      "description": "Detailed description",
      "importance": "high/medium/low",
      "tnpscRelevance": "TNPSC relevance explanation"
    }
  ],
  "keyPoints": ["Key point 1", "Key point 2", ...],
  "summary": "Overall summary of the content",
  "tnpscRelevance": "How this content is relevant for TNPSC exams",
  "tnpscCategories": ["Category1", "Category2", ...],
  "difficulty": "easy/medium/hard"
}

Focus on:
- TNPSC Group 1, 2, 4 exam relevance
- Key facts and figures
- Important dates, names, places
- Conceptual understanding
- Application in exam context
`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt
              },
              {
                inline_data: {
                  mime_type: file.type,
                  data: base64Image.split(',')[1]
                }
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048,
        }
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!content) {
      throw new Error('No content received from Gemini API');
    }

    console.log('Raw Gemini response:', content);

    // Clean and parse the JSON response
    const cleanedContent = content.replace(/```json\n?|\n?```/g, '').trim();
    const result = JSON.parse(cleanedContent);
    
    return {
      keyPoints: result.keyPoints || [],
      summary: result.summary || '',
      tnpscRelevance: result.tnpscRelevance || '',
      studyPoints: result.studyPoints || [],
      tnpscCategories: result.tnpscCategories || []
    };
  } catch (error) {
    console.error('Error analyzing image:', error);
    throw error;
  }
};

export const generateQuestions = async (
  analysisResults: AnalysisResult[],
  difficulty: string = "medium",
  outputLanguage: "english" | "tamil" = "english"
): Promise<QuestionResult> => {
  try {
    const combinedContent = analysisResults.map(result => ({
      keyPoints: result.keyPoints.join('\n'),
      summary: result.summary,
      tnpscRelevance: result.tnpscRelevance
    }));

    const languageInstruction = outputLanguage === "tamil" 
      ? "Please provide all questions and answers in Tamil language."
      : "Please provide all questions and answers in English language.";

    const prompt = `
Based on the following TNPSC study content, generate 15-20 comprehensive questions:

Content Analysis:
${combinedContent.map((content, index) => `
Analysis ${index + 1}:
Key Points: ${content.keyPoints}
Summary: ${content.summary}
TNPSC Relevance: ${content.tnpscRelevance}
`).join('\n')}

Difficulty Level: ${difficulty}
${languageInstruction}

Generate a balanced mix of:
- Multiple choice questions (4 options each) - 60%
- True/False questions - 25% 
- Short answer questions - 15%

Return as a JSON array:
[
  {
    "question": "Question text here",
    "options": ["Option A", "Option B", "Option C", "Option D"], // for MCQ only, omit for others
    "answer": "Correct answer",
    "type": "mcq" | "true_false" | "short_answer",
    "difficulty": "${difficulty}",
    "tnpscGroup": "Group 1" | "Group 2" | "Group 4",
    "explanation": "Brief explanation of the answer"
  }
]

Ensure questions test:
- Factual knowledge
- Conceptual understanding  
- Application ability
- TNPSC exam pattern relevance
`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 3000,
        }
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!content) {
      throw new Error('No content received from Gemini API');
    }

    console.log('Raw questions response:', content);

    // Clean and parse the JSON response
    const cleanedContent = content.replace(/```json\n?|\n?```/g, '').trim();
    const questions = JSON.parse(cleanedContent);
    
    // Ensure all questions have the correct type format
    const formattedQuestions = questions.map((q: any) => ({
      ...q,
      type: q.type === "short" ? "short_answer" : q.type
    }));

    const result: QuestionResult = {
      questions: formattedQuestions,
      summary: combinedContent.map(c => c.summary).join(' '),
      keyPoints: analysisResults.flatMap(r => r.keyPoints),
      difficulty,
      totalQuestions: formattedQuestions.length
    };

    return result;
  } catch (error) {
    console.error('Error generating questions:', error);
    throw error;
  }
};

export const generatePageAnalysis = async (
  file: File,
  pageNumber: number,
  outputLanguage: "english" | "tamil" = "english"
): Promise<{
  page: number;
  keyPoints: string[];
  summary: string;
  importance: "high" | "medium" | "low";
  tnpscRelevance: string;
}> => {
  try {
    const textContent = await extractTextFromPdfPage(file, pageNumber);
    
    if (!textContent.trim()) {
      throw new Error('No text content found on this page');
    }

    const languageInstruction = outputLanguage === "tamil" 
      ? "Please provide all responses in Tamil language."
      : "Please provide all responses in English language.";

    const prompt = `
Analyze this PDF page content for TNPSC exam preparation:

${languageInstruction}

Content: ${textContent}

Please provide analysis in JSON format:
{
  "keyPoints": ["Key point 1", "Key point 2", ...],
  "summary": "Brief summary of the page content",
  "importance": "high/medium/low",
  "tnpscRelevance": "How this content relates to TNPSC exams"
}

Focus on:
- TNPSC exam relevance
- Important facts and concepts
- Key information for study
`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1500,
        }
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!content) {
      throw new Error('No content received from Gemini API');
    }

    const cleanedContent = content.replace(/```json\n?|\n?```/g, '').trim();
    const analysis = JSON.parse(cleanedContent);
    
    return {
      page: pageNumber,
      keyPoints: analysis.keyPoints || [],
      summary: analysis.summary || '',
      importance: analysis.importance || 'medium',
      tnpscRelevance: analysis.tnpscRelevance || ''
    };
  } catch (error) {
    console.error('Error analyzing page:', error);
    throw error;
  }
};

const convertToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

export const analyzeMultipleImages = async (
  files: File[],
  difficulty: string = "medium",
  outputLanguage: "english" | "tamil" = "english"
): Promise<QuestionResult> => {
  try {
    const analysisResults: AnalysisResult[] = [];
    
    for (const file of files) {
      if (file.type.startsWith('image/')) {
        const result = await analyzeImage(file, outputLanguage);
        analysisResults.push(result);
      }
    }
    
    if (analysisResults.length === 0) {
      throw new Error('No valid images found for analysis');
    }
    
    const questionResult = await generateQuestions(analysisResults, difficulty, outputLanguage);
    return questionResult;
  } catch (error) {
    console.error('Error in analyzeMultipleImages:', error);
    throw error;
  }
};
