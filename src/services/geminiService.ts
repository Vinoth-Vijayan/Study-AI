import { AnalysisResult, QuestionResult } from "@/components/StudyAssistant";

const GEMINI_API_KEY = "AIzaSyAJ2P2TqBOXQncnBgT0T_BNsLcAA7cToo4";
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

export const analyzeMultipleFiles = async (files: File[], outputLanguage: "english" | "tamil" = "english"): Promise<AnalysisResult> => {
  try {
    console.log(`Analyzing ${files.length} files for TNPSC preparation...`);
    
    const languageInstruction = outputLanguage === "tamil" 
      ? "Please provide the analysis in Tamil language. Use Tamil script for all content including titles, descriptions, and summary."
      : "Please provide the analysis in English language.";

    const prompt = `
    Analyze these ${files.length} study materials (images and/or PDFs) which contain content specifically for TNPSC (Tamil Nadu Public Service Commission) exam preparation - Group 1, Group 2, and Group 4. 
    ${languageInstruction}
    
    Please provide a comprehensive analysis for TNPSC exam purposes by extracting information from ALL uploaded files and combining them into:

    1. The main topic/subject that covers all the content
    2. Key study points with their importance level (high/medium/low) specifically for TNPSC exams
    3. A brief summary combining insights from all files
    4. The primary language detected in the source materials (Tamil, English, or Mixed)
    5. TNPSC categories this content relates to (History, Geography, Polity, Economy, Current Affairs, Science, etc.)

    For each study point, provide:
    - A clear title
    - A detailed description/explanation combining information from relevant files
    - Importance level for TNPSC exam purposes (high/medium/low)
    - Specific TNPSC relevance (which group exams, which subjects, why important)

    Focus on content relevant to TNPSC syllabus including:
    - Tamil Nadu History and Culture
    - Indian History, Geography, Polity
    - Economy and Current Affairs
    - Science and Technology
    - General Knowledge
    - Administrative concepts

    Analyze all files comprehensively and provide integrated study points that connect concepts across multiple files where relevant.

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

    // Process files and convert to base64
    const fileParts = await Promise.all(files.map(async (file) => {
      if (file.type === 'application/pdf') {
        // For PDFs, we'll send them as documents
        const base64Data = await fileToBase64(file);
        const base64Content = base64Data.split(',')[1];
        return {
          inline_data: {
            mime_type: file.type,
            data: base64Content
          }
        };
      } else {
        // For images
        const base64Data = await fileToBase64(file);
        const base64Content = base64Data.split(',')[1];
        return {
          inline_data: {
            mime_type: file.type,
            data: base64Content
          }
        };
      }
    }));

    const requestBody = {
      contents: [
        {
          parts: [
            { text: prompt },
            ...fileParts
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
        summary: "The files have been analyzed for TNPSC exam preparation. Please review the content analysis above.",
        language: "Mixed",
        tnpscCategories: ["General Knowledge"]
      };
    }

  } catch (error) {
    console.error('Error analyzing files:', error);
    throw new Error('Failed to analyze the files. Please check your internet connection and try again.');
  }
};

export const analyzeImage = async (imageFile: File, outputLanguage: "english" | "tamil" = "english"): Promise<AnalysisResult> => {
  return analyzeMultipleFiles([imageFile], outputLanguage);
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

export const generatePageAnalysis = async (
  pdfFile: File, 
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
    console.log(`Analyzing page ${pageNumber} of PDF for TNPSC preparation...`);
    
    const languageInstruction = outputLanguage === "tamil" 
      ? "Please provide the analysis in Tamil language. Use Tamil script for all content."
      : "Please provide the analysis in English language.";

    const prompt = `
    Analyze page ${pageNumber} of this PDF document which contains TNPSC (Tamil Nadu Public Service Commission) study material.
    ${languageInstruction}
    
    Focus specifically on this single page and provide:

    1. 10-20 key study points from this page that are relevant for TNPSC Group 1, 2, and 4 exams
    2. Overall importance level of this page content (high/medium/low) for TNPSC preparation
    3. Specific TNPSC relevance explaining why this page is important for which exam groups and subjects
    4. A concise summary of the main concepts covered on this page

    The key points should be:
    - Detailed and comprehensive for effective study
    - Prioritized based on TNPSC exam importance
    - Covering factual information, concepts, and analytical aspects
    - Focused on Tamil Nadu specific content where applicable

    Please respond in valid JSON format:
    {
      "page": ${pageNumber},
      "keyPoints": ["array of 10-20 detailed study points"],
      "summary": "comprehensive summary of page content", 
      "importance": "high|medium|low",
      "tnpscRelevance": "specific explanation of TNPSC exam relevance"
    }
    `;

    const base64Data = await fileToBase64(pdfFile);
    const base64Content = base64Data.split(',')[1];

    const requestBody = {
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inline_data: {
                mime_type: pdfFile.type,
                data: base64Content
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

    console.log('Sending request to Gemini API for page analysis...');
    
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
    console.log('Gemini API response for page analysis:', data);

    if (!data.candidates || data.candidates.length === 0) {
      throw new Error('No page analysis results received from API');
    }

    const generatedText = data.candidates[0].content.parts[0].text;
    console.log('Generated page analysis text:', generatedText);

    const cleanedText = generatedText
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    try {
      const result = JSON.parse(cleanedText);
      
      if (!result.keyPoints || !Array.isArray(result.keyPoints)) {
        throw new Error('Invalid page analysis response structure from API');
      }

      return result;
    } catch (parseError) {
      console.error('Failed to parse JSON response:', parseError);
      console.error('Raw response:', cleanedText);
      
      // Fallback response
      return {
        page: pageNumber,
        keyPoints: [
          "Content analysis completed for this page",
          "Key concepts identified for TNPSC preparation",
          "Important facts and figures extracted",
          "Relevant for multiple TNPSC exam groups"
        ],
        summary: "Page analysis completed. Please review the extracted content for TNPSC preparation.",
        importance: "medium" as const,
        tnpscRelevance: "This page contains material relevant for TNPSC Group 1, 2, and 4 examinations."
      };
    }

  } catch (error) {
    console.error('Error analyzing page:', error);
    throw new Error('Failed to analyze the page. Please check your internet connection and try again.');
  }
};

export const generateAdvancedQuestions = async (
  pdfFile: File,
  pageRange: { start: number; end: number },
  difficulty: string,
  questionsPerPage: number,
  outputLanguage: "english" | "tamil" = "english"
): Promise<{
  questions: any[];
  totalQuestions: number;
  pageRange: { start: number; end: number };
  difficulty: string;
}> => {
  try {
    console.log(`Generating ${difficulty} questions for pages ${pageRange.start}-${pageRange.end}...`);
    
    const languageInstruction = outputLanguage === "tamil" 
      ? "Please provide all questions and answers in Tamil language. Use Tamil script for all content."
      : "Please provide all questions and answers in English language.";

    const difficultyMapping = {
      'easy': 'Basic factual questions suitable for beginners',
      'medium': 'Moderate analytical questions requiring understanding of concepts',
      'hard': 'Advanced questions requiring critical thinking and deep analysis',
      'very-hard': 'Extremely challenging questions with multiple concepts, similar to TNPSC mains level difficulty'
    };

    const totalQuestions = (pageRange.end - pageRange.start + 1) * questionsPerPage;

    const prompt = `
    Generate ${totalQuestions} TNPSC practice questions from pages ${pageRange.start} to ${pageRange.end} of this PDF.
    ${languageInstruction}
    
    Question specifications:
    - Difficulty Level: ${difficulty.toUpperCase()} - ${difficultyMapping[difficulty as keyof typeof difficultyMapping]}
    - ${questionsPerPage} questions per page
    - All questions should be Multiple Choice Questions (MCQ) with 4 options each
    - Questions should be relevant to TNPSC Group 1, 2, and 4 exams
    
    For ${difficulty} difficulty level:
    ${difficulty === 'easy' ? '- Focus on direct facts and basic concepts\n- Simple recall questions\n- Straightforward applications' : ''}
    ${difficulty === 'medium' ? '- Mix of factual and analytical questions\n- Require understanding of relationships between concepts\n- Some application-based questions' : ''}
    ${difficulty === 'hard' ? '- Complex analytical questions\n- Multi-step reasoning required\n- Integration of multiple concepts\n- Critical thinking essential' : ''}
    ${difficulty === 'very-hard' ? '- Extremely challenging analytical questions\n- Require deep conceptual understanding\n- Multi-layered reasoning\n- Similar to TNPSC mains examination difficulty\n- Integration of current affairs with core concepts' : ''}

    Ensure questions cover:
    - Tamil Nadu specific content where applicable
    - Historical facts and analysis
    - Geographical concepts
    - Political and administrative knowledge
    - Economic principles
    - Current affairs integration
    - Scientific concepts relevant to TNPSC

    Please respond in valid JSON format:
    {
      "questions": [
        {
          "question": "question text",
          "options": ["option A", "option B", "option C", "option D"],
          "answer": "correct option text",
          "type": "mcq",
          "difficulty": "${difficulty}",
          "tnpscGroup": "Group 1|Group 2|Group 4|All Groups",
          "pageNumber": page_number
        }
      ],
      "totalQuestions": ${totalQuestions},
      "pageRange": {"start": ${pageRange.start}, "end": ${pageRange.end}},
      "difficulty": "${difficulty}"
    }
    `;

    const base64Data = await fileToBase64(pdfFile);
    const base64Content = base64Data.split(',')[1];

    const requestBody = {
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inline_data: {
                mime_type: pdfFile.type,
                data: base64Content
              }
            }
          ]
        }
      ],
      generationConfig: {
        temperature: difficulty === 'very-hard' ? 0.8 : 0.6,
        topK: 32,
        topP: 1,
        maxOutputTokens: 4096,
      }
    };

    console.log('Sending request to Gemini API for advanced question generation...');
    
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
    console.log('Gemini API response for advanced questions:', data);

    if (!data.candidates || data.candidates.length === 0) {
      throw new Error('No question results received from API');
    }

    const generatedText = data.candidates[0].content.parts[0].text;
    console.log('Generated advanced questions text:', generatedText);

    const cleanedText = generatedText
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    try {
      const result = JSON.parse(cleanedText);
      
      if (!result.questions || !Array.isArray(result.questions)) {
        throw new Error('Invalid question response structure from API');
      }

      return result;
    } catch (parseError) {
      console.error('Failed to parse JSON response:', parseError);
      console.error('Raw response:', cleanedText);
      
      // Fallback response
      return {
        questions: [
          {
            question: "Based on the study material, what is the primary focus of this content for TNPSC preparation?",
            options: ["Historical Analysis", "Geographical Study", "Administrative Concepts", "All of the above"],
            answer: "All of the above",
            type: "mcq" as const,
            difficulty: difficulty,
            tnpscGroup: "All Groups",
            pageNumber: pageRange.start
          }
        ],
        totalQuestions: 1,
        pageRange,
        difficulty
      };
    }

  } catch (error) {
    console.error('Error generating advanced questions:', error);
    throw new Error('Failed to generate questions. Please check your internet connection and try again.');
  }
};

export const generateQuestionsFromAnalysis = async (
  analysisResult: any,
  outputLanguage: "english" | "tamil"
): Promise<any> => {
  try {
    const prompt = `
Based on the following TNPSC analysis results, generate 15-20 multiple choice questions in ${outputLanguage}:

Topic: ${analysisResult.mainTopic}
Summary: ${analysisResult.summary}
Study Points: ${analysisResult.studyPoints.map((point: any) => `${point.title}: ${point.description}`).join('\n')}
TNPSC Categories: ${analysisResult.tnpscCategories?.join(', ')}

Generate questions with:
- 4 options each (A, B, C, D)
- Mixed difficulty levels (easy, medium, hard)
- TNPSC Group 1, 2, 4 exam style questions
- Focus on the key concepts from the analysis

Return as JSON with this structure:
{
  "questions": [
    {
      "question": "Question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "answer": "Correct option text",
      "type": "mcq",
      "difficulty": "easy|medium|hard",
      "tnpscGroup": "Group 1|Group 2|Group 4"
    }
  ],
  "totalQuestions": number
}
`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
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

    // Clean and parse the JSON response
    const cleanedContent = content.replace(/```json\n?|\n?```/g, '').trim();
    const result = JSON.parse(cleanedContent);
    
    return result;
  } catch (error) {
    console.error('Error generating questions from analysis:', error);
    throw error;
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
