import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ArrowLeft, CheckCircle, AlertTriangle, Brain, Download, Trophy, Target, Image as ImageIcon } from "lucide-react";
import { generateAdvancedQuestions, analyzeImage } from "@/services/geminiService";
import { downloadPDF } from "@/utils/pdfUtils";
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

  const startQuiz = async () => {
    setIsGenerating(true);
    try {
      let result;
      
      if (isImageMode && imageFiles.length > 0) {
        // Generate questions from images
        const allQuestions: QuizQuestion[] = [];
        
        for (let i = 0; i < imageFiles.length; i++) {
          const imageFile = imageFiles[i];
          const analysis = await analyzeImage(imageFile, outputLanguage);
          
          // Generate questions based on image analysis
          const imageQuestions = await generateQuestionsFromImageAnalysis(analysis, difficulty, questionsPerPage, i + 1);
          allQuestions.push(...imageQuestions);
        }
        
        result = { questions: allQuestions };
      } else {
        // Use existing PDF logic
        result = await generateAdvancedQuestions(
          file,
          pageRange,
          difficulty,
          questionsPerPage,
          outputLanguage
        );
      }
      
      setQuestions(result.questions);
      setQuizStarted(true);
      toast.success(`Generated ${result.questions.length} questions successfully!`);
    } catch (error) {
      console.error("Failed to generate questions:", error);
      toast.error("Failed to generate questions. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const generateQuestionsFromImageAnalysis = async (analysis: any, difficulty: string, questionsPerPage: number, imageNumber: number): Promise<QuizQuestion[]> => {
    const prompt = `
Based on this image analysis for TNPSC preparation, generate ${questionsPerPage} multiple choice questions:

Topic: ${analysis.mainTopic}
Key Points: ${analysis.studyPoints.map((point: any) => `${point.title}: ${point.description}`).join('\n')}
TNPSC Categories: ${analysis.tnpscCategories?.join(', ')}

Difficulty: ${difficulty}
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

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${import.meta.env.VITE_GEMINI_API_KEY}`, {
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

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
    const cleanedContent = content.replace(/```json\n?|\n?```/g, '').trim();
    return JSON.parse(cleanedContent);
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
      'easy': 'bg-green-100 text-green-700',
      'medium': 'bg-orange-100 text-orange-700',
      'hard': 'bg-red-100 text-red-700',
      'very-hard': 'bg-purple-100 text-purple-700'
    };
    return <Badge className={colors[diff as keyof typeof colors] || 'bg-gray-100 text-gray-700'}>
      {diff.replace('-', ' ').toUpperCase()}
    </Badge>;
  };

  if (!quizStarted) {
    return (
      <Card className="p-4 md:p-8 text-center bg-white/80 backdrop-blur-sm shadow-lg border-0">
        <div className="flex items-center gap-3 mb-6 justify-center">
          {isImageMode ? (
            <ImageIcon className="h-6 md:h-8 w-6 md:w-8 text-purple-600" />
          ) : (
            <Brain className="h-6 md:h-8 w-6 md:w-8 text-blue-600" />
          )}
          <h2 className="text-xl md:text-2xl font-bold text-gray-800">
            TNPSC {isImageMode ? 'Image' : 'Enhanced'} Quiz
          </h2>
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 md:p-6 rounded-lg mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-xl md:text-2xl font-bold text-blue-600">
                {isImageMode ? imageFiles.length : (pageRange.end - pageRange.start + 1)}
              </div>
              <div className="text-sm text-gray-600">{isImageMode ? 'Images' : 'Pages'}</div>
            </div>
            <div>
              <div className="text-xl md:text-2xl font-bold text-green-600">
                {isImageMode 
                  ? imageFiles.length * questionsPerPage
                  : (pageRange.end - pageRange.start + 1) * questionsPerPage
                }
              </div>
              <div className="text-sm text-gray-600">Questions</div>
            </div>
            <div>
              <div className="text-xl md:text-2xl font-bold text-orange-600">{questionsPerPage}</div>
              <div className="text-sm text-gray-600">Per {isImageMode ? 'Image' : 'Page'}</div>
            </div>
            <div>
              {getDifficultyBadge(difficulty)}
            </div>
          </div>
        </div>

        <p className="text-gray-600 mb-6 text-sm md:text-base">
          Ready to test your knowledge on {isImageMode ? `${imageFiles.length} images` : `pages ${pageRange.start} to ${pageRange.end}`}?<br/>
          This {difficulty.replace('-', ' ')} level quiz will challenge your understanding of TNPSC concepts.
        </p>

        <div className="flex flex-col md:flex-row gap-4 justify-center">
          <Button
            onClick={startQuiz}
            disabled={isGenerating}
            className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 px-6 md:px-8 py-3 text-sm md:text-base"
          >
            {isGenerating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Generating Questions...
              </>
            ) : (
              <>
                <Brain className="h-4 w-4 mr-2" />
                Start Quiz
              </>
            )}
          </Button>
          
          <Button onClick={onBackToAnalyzer} variant="outline" className="text-sm md:text-base">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Analyzer
          </Button>
        </div>
      </Card>
    );
  }

  if (quizCompleted && quizResult) {
    return (
      <div className="space-y-4 md:space-y-6">
        {/* Results Summary */}
        <Card className="p-4 md:p-6 bg-white/80 backdrop-blur-sm shadow-lg border-0">
          <div className="text-center mb-6">
            <Trophy className="h-8 md:h-12 w-8 md:w-12 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">Quiz Results</h2>
            <div className="text-4xl md:text-6xl font-bold mb-2">
              <span className={quizResult.percentage >= 60 ? "text-green-600" : "text-red-600"}>
                {quizResult.percentage}%
              </span>
            </div>
            <p className="text-base md:text-lg text-gray-600">
              {quizResult.score} out of {quizResult.totalQuestions} questions correct
            </p>
            <div className="flex gap-2 justify-center mt-3 flex-wrap">
              {getDifficultyBadge(difficulty)}
              <Badge className="bg-blue-100 text-blue-700 text-xs md:text-sm">
                {isImageMode ? `${imageFiles.length} Images` : `Pages ${pageRange.start}-${pageRange.end}`}
              </Badge>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-3 md:gap-4 justify-center">
            <Button onClick={handleDownloadQuestions} variant="outline" size="sm" className="text-xs md:text-sm">
              <Download className="h-3 md:h-4 w-3 md:w-4 mr-1 md:mr-2" />
              Download Questions PDF
            </Button>
            <Button onClick={onBackToAnalyzer} variant="outline" size="sm" className="text-xs md:text-sm">
              <ArrowLeft className="h-3 md:h-4 w-3 md:w-4 mr-1 md:mr-2" />
              Back to Analyzer
            </Button>
            <Button onClick={onReset} variant="outline" size="sm" className="text-xs md:text-sm">
              Upload New Files
            </Button>
          </div>
        </Card>

        {/* Detailed Results */}
        <div className="space-y-3 md:space-y-4">
          <h3 className="text-lg md:text-xl font-semibold text-gray-800">Answer Review</h3>
          {quizResult.answers.map((answer: any, index: number) => (
            <Card key={index} className={`p-3 md:p-4 ${answer.isCorrect ? 'bg-green-50/80' : 'bg-red-50/80'} backdrop-blur-sm shadow-lg border-0`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  {answer.isCorrect ? (
                    <CheckCircle className="h-4 md:h-5 w-4 md:w-5 text-green-600" />
                  ) : (
                    <AlertTriangle className="h-4 md:h-5 w-4 md:w-5 text-red-600" />
                  )}
                  <span className="font-medium text-gray-800 text-sm md:text-base">Question {index + 1}</span>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {getDifficultyBadge(answer.question.difficulty)}
                  <Badge className="bg-purple-100 text-purple-700 text-xs">
                    {isImageMode ? `Image ${answer.question.pageNumber}` : `Page ${answer.question.pageNumber}`}
                  </Badge>
                </div>
              </div>
              
              <p className="text-gray-700 mb-3 text-sm md:text-base">{answer.question.question}</p>
              
              <div className="space-y-2">
                <div className={`p-2 rounded text-sm md:text-base ${answer.isCorrect ? 'bg-green-100' : 'bg-red-100'}`}>
                  <span className="font-medium text-gray-700">Your Answer: </span>
                  <span className={answer.isCorrect ? 'text-green-700' : 'text-red-700'}>
                    {answer.userAnswer}
                  </span>
                </div>
                
                {!answer.isCorrect && (
                  <div className="p-2 bg-green-100 rounded text-sm md:text-base">
                    <span className="font-medium text-gray-700">Correct Answer: </span>
                    <span className="text-green-700">{answer.correctAnswer}</span>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Quiz Header */}
      <Card className="p-4 md:p-6 bg-white/80 backdrop-blur-sm shadow-lg border-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {isImageMode ? (
              <ImageIcon className="h-4 md:h-5 w-4 md:w-5 text-purple-600" />
            ) : (
              <Brain className="h-4 md:h-5 w-4 md:w-5 text-blue-600" />
            )}
            <h2 className="text-lg md:text-xl font-bold text-gray-800">
              TNPSC {isImageMode ? 'Image' : 'Enhanced'} Quiz
            </h2>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Badge className="bg-blue-100 text-blue-700 text-xs">
              Question {currentQuestionIndex + 1} of {questions.length}
            </Badge>
            {getDifficultyBadge(difficulty)}
          </div>
        </div>

        <div className="flex gap-1 md:gap-2 mb-4 overflow-x-auto">
          {questions.map((_, index) => (
            <div
              key={index}
              className={`w-2 md:w-3 h-2 md:h-3 rounded-full flex-shrink-0 ${
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
      <Card className="p-4 md:p-6 bg-white/80 backdrop-blur-sm shadow-lg border-0">
        <div className="mb-4">
          <div className="flex items-start justify-between mb-3">
            <h3 className="text-base md:text-lg font-semibold text-gray-800">
              Question {currentQuestionIndex + 1}
            </h3>
            <Badge className="bg-purple-100 text-purple-700 text-xs">
              {isImageMode ? `Image ${currentQuestion.pageNumber}` : `Page ${currentQuestion.pageNumber}`}
            </Badge>
          </div>
          
          <p className="text-gray-700 leading-relaxed mb-6 text-sm md:text-base">{currentQuestion.question}</p>
          
          <RadioGroup value={selectedOption} onValueChange={handleAnswerSelect}>
            <div className="space-y-3">
              {currentQuestion.options?.map((option, index) => (
                <div key={index} className="flex items-center space-x-3 p-2 md:p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <RadioGroupItem value={option} id={`option-${index}`} />
                  <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer text-sm md:text-base">
                    <span className="font-medium text-gray-600 mr-2">
                      {String.fromCharCode(65 + index)}.
                    </span>
                    <span className="text-gray-700">{option}</span>
                  </Label>
                </div>
              ))}
            </div>
          </RadioGroup>
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center mt-6">
          <Button
            onClick={handlePreviousQuestion}
            variant="outline"
            disabled={currentQuestionIndex === 0}
            size="sm"
            className="text-sm"
          >
            Previous
          </Button>

          <Button
            onClick={handleNextQuestion}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-sm"
            size="sm"
          >
            {currentQuestionIndex === questions.length - 1 ? 'Submit Quiz' : 'Next'}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default EnhancedQuizMode;
