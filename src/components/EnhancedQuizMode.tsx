import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, CheckCircle, AlertTriangle, Brain, Download, Trophy, Target, Image as ImageIcon, Play, FileText, Sparkles, Clock, Award } from "lucide-react";
import { downloadPDF } from "@/utils/pdfUtils";
import { extractTextFromPdfPage } from "@/utils/pdfReader";
import { toast } from "sonner";

interface EnhancedQuizModeProps {
  file: File;
  pageRange: { start: number; end: number };
  difficulty: string;
  questionsPerPage: number;
  outputLanguage: "english" | "tamil";
  onReset: () => void;
  onBackToAnalyzer: () => void;
  isImageMode?: boolean;
  imageFiles?: File[];
}

interface QuizQuestion {
  question: string;
  options: string[];
  answer: string;
  type: "mcq";
  difficulty: string;
  tnpscGroup: string;
  pageNumber: number;
}

interface UserAnswer {
  questionIndex: number;
  selectedOption: string;
}

const EnhancedQuizMode = ({
  file,
  pageRange,
  difficulty,
  questionsPerPage,
  outputLanguage,
  onReset,
  onBackToAnalyzer,
  isImageMode = false,
  imageFiles = []
}: EnhancedQuizModeProps) => {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [selectedOption, setSelectedOption] = useState<string>("");
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [quizResult, setQuizResult] = useState<any>(null);
  const [generationProgress, setGenerationProgress] = useState(0);

  const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "AIzaSyAJ2P2TqBOXQncnBgT0T_BNsLcAA7cToo4";

  const generateQuestionsFromText = async (pageText: string, pageNumber: number): Promise<QuizQuestion[]> => {
    const languageInstruction = outputLanguage === "tamil" 
      ? "Please provide all questions and answers in Tamil language. Use Tamil script for all content."
      : "Please provide all questions and answers in English language.";

    const prompt = `
Based on this text content from page ${pageNumber} for TNPSC preparation, generate ${questionsPerPage} multiple choice questions:

Content: ${pageText.substring(0, 3000)}

Difficulty: ${difficulty}
${languageInstruction}

Generate questions with:
- 4 options each (A, B, C, D)
- TNPSC Group 1, 2, 4 exam style
- Focus on key concepts and facts from this page
- Questions should test understanding, not just memorization

Return as JSON array of questions with this exact structure:
[
  {
    "question": "Question text here",
    "options": ["Option A text", "Option B text", "Option C text", "Option D text"],
    "answer": "Option A text",
    "type": "mcq",
    "difficulty": "${difficulty}",
    "tnpscGroup": "Group 1",
    "pageNumber": ${pageNumber}
  }
]

IMPORTANT: Return only valid JSON array, no other text.
`;

    console.log('Generating questions for page:', pageNumber);
    
    try {
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
      console.log('Gemini API response:', data);
      
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!content) {
        throw new Error("No content received from API");
      }

      const cleanedContent = content.replace(/```json\n?|\n?```/g, '').trim();
      const questions = JSON.parse(cleanedContent);
      
      console.log(`Generated ${questions.length} questions for page ${pageNumber}`);
      return questions;
    } catch (error) {
      console.error(`Failed to generate questions for page ${pageNumber}:`, error);
      throw error;
    }
  };

  const generateQuestionsFromImage = async (imageFile: File, imageNumber: number): Promise<QuizQuestion[]> => {
    const languageInstruction = outputLanguage === "tamil" 
      ? "Please provide all questions and answers in Tamil language. Use Tamil script for all content."
      : "Please provide all questions and answers in English language.";

    const prompt = `
Analyze this image for TNPSC preparation and generate ${questionsPerPage} multiple choice questions:

Difficulty: ${difficulty}
${languageInstruction}

Generate questions with:
- 4 options each
- TNPSC Group 1, 2, 4 exam style
- Focus on key concepts from this image

Return as JSON array of questions with this structure:
[
  {
    "question": "Question text",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "answer": "Correct option text",
    "type": "mcq",
    "difficulty": "${difficulty}",
    "tnpscGroup": "Group 1",
    "pageNumber": ${imageNumber}
  }
]
`;

    try {
      console.log(`Generating questions for image ${imageNumber}...`);
      const base64Data = await fileToBase64(imageFile);
      const base64Content = base64Data.split(',')[1];

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: prompt },
              {
                inline_data: {
                  mime_type: imageFile.type,
                  data: base64Content
                }
              }
            ]
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
      console.log(`Gemini API response for image ${imageNumber}:`, data);
      
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!content) {
        throw new Error("No content received from API");
      }
      
      const cleanedContent = content.replace(/```json\n?|\n?```/g, '').trim();
      const questions = JSON.parse(cleanedContent);
      
      console.log(`Generated ${questions.length} questions for image ${imageNumber}`);
      return questions;
    } catch (error) {
      console.error(`Failed to generate questions for image ${imageNumber}:`, error);
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

  const startQuiz = async () => {
    console.log("🚀 Starting quiz generation...", { 
      pageRange, 
      difficulty, 
      questionsPerPage, 
      isImageMode, 
      imageFilesCount: imageFiles.length 
    });
    
    setIsGenerating(true);
    setGenerationProgress(0);
    
    try {
      let allQuestions: QuizQuestion[] = [];
      
      if (isImageMode && imageFiles.length > 0) {
        console.log("📸 Generating questions from images:", imageFiles.length);
        
        const startIndex = pageRange.start - 1;
        const endIndex = pageRange.end - 1;
        const totalImages = Math.min(endIndex + 1, imageFiles.length) - startIndex;
        
        for (let i = startIndex; i <= endIndex && i < imageFiles.length; i++) {
          const imageFile = imageFiles[i];
          console.log(`🔄 Processing image ${i + 1}/${imageFiles.length}...`);
          
          try {
            const imageQuestions = await generateQuestionsFromImage(imageFile, i + 1);
            allQuestions.push(...imageQuestions);
            
            const progress = ((i - startIndex + 1) / totalImages) * 100;
            setGenerationProgress(progress);
            
            toast.success(`Generated ${imageQuestions.length} questions for image ${i + 1}`);
          } catch (error) {
            console.error(`❌ Failed to process image ${i + 1}:`, error);
            toast.error(`Failed to process image ${i + 1}. Skipping...`);
          }
        }
      } else {
        console.log("📄 Generating questions from PDF pages:", pageRange);
        
        const totalPages = pageRange.end - pageRange.start + 1;
        
        for (let page = pageRange.start; page <= pageRange.end; page++) {
          console.log(`🔄 Processing PDF page ${page}...`);
          
          try {
            const pageText = await extractTextFromPdfPage(file, page);
            if (pageText.trim()) {
              const pageQuestions = await generateQuestionsFromText(pageText, page);
              allQuestions.push(...pageQuestions);
              
              const progress = ((page - pageRange.start + 1) / totalPages) * 100;
              setGenerationProgress(progress);
              
              toast.success(`Generated ${pageQuestions.length} questions for page ${page}`);
            }
          } catch (error) {
            console.error(`❌ Failed to process page ${page}:`, error);
            toast.error(`Failed to process page ${page}. Skipping...`);
          }
        }
      }
      
      if (allQuestions.length === 0) {
        throw new Error("No questions were generated. Please try again.");
      }
      
      console.log("✅ Quiz generation complete! Generated questions:", allQuestions.length);
      setQuestions(allQuestions);
      setQuizStarted(true);
      setGenerationProgress(100);
      toast.success(`🎉 Generated ${allQuestions.length} questions successfully!`);
    } catch (error) {
      console.error("❌ Failed to generate questions:", error);
      toast.error("Failed to generate questions. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAnswerSelect = (value: string) => {
    setSelectedOption(value);
  };

  const handleNextQuestion = () => {
    if (!selectedOption) {
      toast.error("Please select an answer before proceeding");
      return;
    }

    const newAnswer: UserAnswer = {
      questionIndex: currentQuestionIndex,
      selectedOption: selectedOption
    };

    const updatedAnswers = [...userAnswers.filter(a => a.questionIndex !== currentQuestionIndex), newAnswer];
    setUserAnswers(updatedAnswers);

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      const savedAnswer = updatedAnswers.find(a => a.questionIndex === currentQuestionIndex + 1);
      setSelectedOption(savedAnswer?.selectedOption || "");
    } else {
      calculateResults(updatedAnswers);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      const savedAnswer = userAnswers.find(a => a.questionIndex === currentQuestionIndex - 1);
      setSelectedOption(savedAnswer?.selectedOption || "");
    }
  };

  const calculateResults = (answers: UserAnswer[]) => {
    const results = answers.map(answer => {
      const question = questions[answer.questionIndex];
      const isCorrect = answer.selectedOption === question.answer;
      
      return {
        question,
        userAnswer: answer.selectedOption,
        correctAnswer: question.answer,
        isCorrect,
        questionIndex: answer.questionIndex
      };
    });

    const score = results.filter(r => r.isCorrect).length;
    const percentage = Math.round((score / questions.length) * 100);

    setQuizResult({
      score,
      totalQuestions: questions.length,
      percentage,
      answers: results,
      difficulty,
      pageRange
    });

    setQuizCompleted(true);
    toast.success("Quiz completed! Check your results below.");
  };

  const handleDownloadQuestions = async () => {
    try {
      const title = isImageMode 
        ? `TNPSC Quiz - ${difficulty.toUpperCase()} - Images ${pageRange.start}-${pageRange.end}`
        : `TNPSC Quiz - ${difficulty.toUpperCase()} - Pages ${pageRange.start}-${pageRange.end}`;
        
      await downloadPDF({
        title,
        content: questions,
        type: 'questions'
      });
      toast.success("Questions PDF downloaded successfully!");
    } catch (error) {
      console.error("Download failed:", error);
      toast.error("Failed to download PDF. Please try again.");
    }
  };

  const getDifficultyBadge = (diff: string) => {
    const colors = {
      'easy': 'bg-emerald-100 text-emerald-700 border-emerald-200',
      'medium': 'bg-orange-100 text-orange-700 border-orange-200',
      'hard': 'bg-red-100 text-red-700 border-red-200',
      'very-hard': 'bg-purple-100 text-purple-700 border-purple-200'
    };
    return <Badge className={`${colors[diff as keyof typeof colors] || 'bg-gray-100 text-gray-700 border-gray-200'} border font-medium`}>
      {diff.replace('-', ' ').toUpperCase()}
    </Badge>;
  };

  const getDifficultyColor = (diff: string) => {
    const colors = {
      'easy': 'from-emerald-500 to-green-600',
      'medium': 'from-orange-500 to-yellow-600',
      'hard': 'from-red-500 to-pink-600',
      'very-hard': 'from-purple-500 to-indigo-600'
    };
    return colors[diff as keyof typeof colors] || 'from-gray-500 to-gray-600';
  };

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return 'text-emerald-600';
    if (percentage >= 60) return 'text-blue-600';
    if (percentage >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreMessage = (percentage: number) => {
    if (percentage >= 90) return "Outstanding! You're mastering TNPSC concepts! 🏆";
    if (percentage >= 80) return "Excellent work! You're well prepared! 🌟";
    if (percentage >= 70) return "Great job! Keep up the good work! 👏";
    if (percentage >= 60) return "Good effort! Review and improve! 📚";
    if (percentage >= 40) return "Fair performance. More practice needed! 💪";
    return "Keep studying! You'll improve with practice! 📖";
  };

  if (!quizStarted) {
    const itemCount = isImageMode ? (pageRange.end - pageRange.start + 1) : (pageRange.end - pageRange.start + 1);
    const totalQuestions = itemCount * questionsPerPage;

    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4">
        <Card className="max-w-4xl mx-auto p-8 shadow-2xl border-0 bg-white/90 backdrop-blur-sm">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className={`p-4 rounded-full bg-gradient-to-r ${getDifficultyColor(difficulty)} shadow-lg`}>
                {isImageMode ? (
                  <ImageIcon className="h-8 w-8 text-white" />
                ) : (
                  <Brain className="h-8 w-8 text-white" />
                )}
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  TNPSC Smart Quiz
                </h1>
                <p className="text-gray-600 mt-1">
                  {isImageMode ? 'Image Analysis Quiz' : 'Enhanced PDF Quiz'}
                </p>
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-2xl mb-8 border border-blue-100">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="bg-white p-4 rounded-xl shadow-sm">
                    <div className="text-2xl font-bold text-indigo-600 mb-1">{itemCount}</div>
                    <div className="text-sm text-gray-600">{isImageMode ? 'Images' : 'Pages'}</div>
                  </div>
                </div>
                <div className="text-center">
                  <div className="bg-white p-4 rounded-xl shadow-sm">
                    <div className="text-2xl font-bold text-green-600 mb-1">{totalQuestions}</div>
                    <div className="text-sm text-gray-600">Questions</div>
                  </div>
                </div>
                <div className="text-center">
                  <div className="bg-white p-4 rounded-xl shadow-sm">
                    <div className="text-2xl font-bold text-orange-600 mb-1">{questionsPerPage}</div>
                    <div className="text-sm text-gray-600">Per {isImageMode ? 'Image' : 'Page'}</div>
                  </div>
                </div>
                <div className="text-center">
                  <div className="bg-white p-4 rounded-xl shadow-sm flex items-center justify-center">
                    {getDifficultyBadge(difficulty)}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-2xl mb-8 border border-purple-100">
              <div className="flex items-center gap-3 mb-3">
                <Target className="h-5 w-5 text-purple-600" />
                <h3 className="text-lg font-semibold text-purple-800">Quiz Overview</h3>
              </div>
              <p className="text-purple-700 leading-relaxed">
                Ready to test your TNPSC knowledge on {isImageMode ? `images ${pageRange.start} to ${pageRange.end}` : `pages ${pageRange.start} to ${pageRange.end}`}?
                <br />
                This <strong>{difficulty.replace('-', ' ')}</strong> level quiz will challenge your understanding with carefully crafted questions.
              </p>
            </div>

            {isGenerating && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-2xl mb-8 border border-green-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
                  <h3 className="text-lg font-semibold text-green-800">Generating Questions...</h3>
                </div>
                <Progress value={generationProgress} className="mb-2" />
                <p className="text-sm text-green-700">
                  AI is analyzing your content and creating personalized questions. Please wait...
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={startQuiz}
                disabled={isGenerating}
                className={`bg-gradient-to-r ${getDifficultyColor(difficulty)} hover:shadow-lg transition-all duration-200 px-8 py-4 text-lg font-medium`}
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                    Generating Quiz...
                  </>
                ) : (
                  <>
                    <Play className="h-5 w-5 mr-3" />
                    Start Quiz Challenge
                  </>
                )}
              </Button>
              
              <Button 
                onClick={onBackToAnalyzer} 
                variant="outline" 
                className="px-8 py-4 text-lg font-medium border-2 hover:bg-gray-50"
              >
                <ArrowLeft className="h-5 w-5 mr-3" />
                Back to Analyzer
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (quizCompleted && quizResult) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 p-4">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Results Header */}
          <Card className="p-8 shadow-2xl border-0 bg-white/90 backdrop-blur-sm">
            <div className="text-center">
              <div className="flex items-center justify-center gap-4 mb-6">
                <div className="p-4 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 shadow-lg">
                  <Trophy className="h-10 w-10 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
                    Quiz Complete!
                  </h1>
                  <p className="text-gray-600 mt-1">TNPSC Practice Results</p>
                </div>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-8 rounded-2xl mb-6 border border-blue-100">
                <div className={`text-7xl font-bold mb-4 ${getScoreColor(quizResult.percentage)}`}>
                  {quizResult.percentage}%
                </div>
                <div className="text-xl text-gray-700 mb-3">
                  {quizResult.score} out of {quizResult.totalQuestions} questions correct
                </div>
                <div className="text-lg font-medium text-gray-600 bg-white/70 px-6 py-3 rounded-xl">
                  {getScoreMessage(quizResult.percentage)}
                </div>
              </div>

              <div className="flex gap-3 justify-center flex-wrap mb-6">
                {getDifficultyBadge(difficulty)}
                <Badge className="bg-blue-100 text-blue-700 border border-blue-200 font-medium">
                  {isImageMode ? `Images ${pageRange.start}-${pageRange.end}` : `Pages ${pageRange.start}-${pageRange.end}`}
                </Badge>
                <Badge className="bg-purple-100 text-purple-700 border border-purple-200 font-medium">
                  <Clock className="h-3 w-3 mr-1" />
                  {questions.length} Questions
                </Badge>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button onClick={handleDownloadQuestions} variant="outline" className="px-6 py-3 border-2 hover:bg-blue-50">
                  <Download className="h-4 w-4 mr-2" />
                  Download Questions PDF
                </Button>
                <Button onClick={onBackToAnalyzer} variant="outline" className="px-6 py-3 border-2 hover:bg-gray-50">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Analyzer
                </Button>
                <Button onClick={onReset} variant="outline" className="px-6 py-3 border-2 hover:bg-green-50">
                  <Sparkles className="h-4 w-4 mr-2" />
                  New Quiz
                </Button>
              </div>
            </div>
          </Card>

          {/* Detailed Results */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <Target className="h-6 w-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-800">Answer Review</h2>
            </div>
            
            {quizResult.answers.map((answer: any, index: number) => (
              <Card key={index} className={`p-6 shadow-lg border-0 ${
                answer.isCorrect 
                  ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-l-green-500' 
                  : 'bg-gradient-to-r from-red-50 to-pink-50 border-l-4 border-l-red-500'
              }`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {answer.isCorrect ? (
                      <div className="p-2 bg-green-100 rounded-full">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      </div>
                    ) : (
                      <div className="p-2 bg-red-100 rounded-full">
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                      </div>
                    )}
                    <span className="text-lg font-semibold text-gray-800">Question {index + 1}</span>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {getDifficultyBadge(answer.question.difficulty)}
                    <Badge className="bg-purple-100 text-purple-700 border border-purple-200 font-medium">
                      {isImageMode ? `Image ${answer.question.pageNumber}` : `Page ${answer.question.pageNumber}`}
                    </Badge>
                    <Badge className="bg-gray-100 text-gray-700 border border-gray-200 font-medium">
                      {answer.question.tnpscGroup}
                    </Badge>
                  </div>
                </div>
                
                <div className="bg-white/70 p-4 rounded-xl mb-4">
                  <p className="text-gray-800 text-lg leading-relaxed">{answer.question.question}</p>
                </div>
                
                <div className="space-y-3">
                  <div className={`p-4 rounded-xl ${
                    answer.isCorrect ? 'bg-green-100 border border-green-200' : 'bg-red-100 border border-red-200'
                  }`}>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-700">Your Answer:</span>
                      <span className={`font-medium ${answer.isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                        {answer.userAnswer}
                      </span>
                    </div>
                  </div>
                  
                  {!answer.isCorrect && (
                    <div className="p-4 bg-green-100 border border-green-200 rounded-xl">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-700">Correct Answer:</span>
                        <span className="font-medium text-green-700">{answer.correctAnswer}</span>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Quiz Header */}
        <Card className="p-6 shadow-xl border-0 bg-white/90 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-full bg-gradient-to-r ${getDifficultyColor(difficulty)} shadow-lg`}>
                {isImageMode ? (
                  <ImageIcon className="h-5 w-5 text-white" />
                ) : (
                  <Brain className="h-5 w-5 text-white" />
                )}
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">TNPSC Quiz Challenge</h1>
                <p className="text-gray-600 text-sm">
                  Question {currentQuestionIndex + 1} of {questions.length}
                </p>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              {getDifficultyBadge(difficulty)}
              <Badge className="bg-blue-100 text-blue-700 border border-blue-200 font-medium">
                {Math.round(progress)}% Complete
              </Badge>
            </div>
          </div>

          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Progress</span>
              <span>{currentQuestionIndex + 1}/{questions.length}</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          <div className="grid grid-cols-10 gap-1 mb-4">
            {questions.map((_, index) => (
              <div
                key={index}
                className={`h-2 rounded-full ${
                  index === currentQuestionIndex
                    ? 'bg-blue-600'
                    : userAnswers.some(a => a.questionIndex === index)
                    ? 'bg-green-500'
                    : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </Card>

        {/* Current Question */}
        <Card className="p-8 shadow-xl border-0 bg-white/90 backdrop-blur-sm">
          <div className="mb-6">
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-800 leading-relaxed">
                Question {currentQuestionIndex + 1}
              </h2>
              <div className="flex gap-2 flex-wrap">
                <Badge className="bg-purple-100 text-purple-700 border border-purple-200 font-medium">
                  {isImageMode ? `Image ${currentQuestion.pageNumber}` : `Page ${currentQuestion.pageNumber}`}
                </Badge>
                <Badge className="bg-gray-100 text-gray-700 border border-gray-200 font-medium">
                  {currentQuestion.tnpscGroup}
                </Badge>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-6 rounded-2xl mb-8 border border-gray-200">
              <p className="text-gray-800 text-lg leading-relaxed">{currentQuestion.question}</p>
            </div>
            
            <RadioGroup value={selectedOption} onValueChange={handleAnswerSelect}>
              <div className="space-y-4">
                {currentQuestion.options?.map((option, index) => (
                  <div key={index} className="group">
                    <div className={`flex items-center space-x-4 p-6 rounded-2xl border-2 transition-all duration-200 cursor-pointer hover:shadow-md ${
                      selectedOption === option 
                        ? 'border-blue-500 bg-blue-50 shadow-lg' 
                        : 'border-gray-200 bg-white hover:border-blue-300'
                    }`}>
                      <RadioGroupItem value={option} id={`option-${index}`} className="w-5 h-5" />
                      <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                        <div className="flex items-start gap-3">
                          <span className={`font-bold text-lg px-3 py-1 rounded-full ${
                            selectedOption === option 
                              ? 'bg-blue-500 text-white' 
                              : 'bg-gray-200 text-gray-700'
                          }`}>
                            {String.fromCharCode(65 + index)}
                          </span>
                          <span className="text-gray-800 text-lg leading-relaxed">{option}</span>
                        </div>
                      </Label>
                    </div>
                  </div>
                ))}
              </div>
            </RadioGroup>
            
            {!selectedOption && (
              <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <p className="text-amber-700 text-center font-medium">
                  👆 Please select an option to continue
                </p>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center pt-6 border-t border-gray-200">
            <Button
              onClick={handlePreviousQuestion}
              variant="outline"
              disabled={currentQuestionIndex === 0}
              className="px-6 py-3 border-2 hover:bg-gray-50"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>

            <Button
              onClick={handleNextQuestion}
              className={`px-8 py-3 bg-gradient-to-r ${getDifficultyColor(difficulty)} hover:shadow-lg transition-all duration-200 font-medium`}
            >
              {currentQuestionIndex === questions.length - 1 ? (
                <>
                  <Award className="h-4 w-4 mr-2" />
                  Submit Quiz
                </>
              ) : (
                <>
                  Next Question
                  <ArrowLeft className="h-4 w-4 ml-2 rotate-180" />
                </>
              )}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default EnhancedQuizMode;
