
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Brain, CheckCircle, XCircle, RotateCcw, Trophy, Target } from "lucide-react";
import { QuestionResult } from "./StudyAssistant";
import { generateQuestionsFromAnalysis } from "@/services/geminiService";
import { toast } from "sonner";

interface ModernQuizModeProps {
  analysisResult: any;
  selectedFiles: File[];
  outputLanguage: "english" | "tamil";
  onReset: () => void;
  onBack: () => void;
}

type QuizStage = "keypoints" | "questions";

const ModernQuizMode = ({ 
  analysisResult, 
  selectedFiles, 
  outputLanguage, 
  onReset, 
  onBack 
}: ModernQuizModeProps) => {
  const [stage, setStage] = useState<QuizStage>("keypoints");
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [questionResult, setQuestionResult] = useState<QuestionResult | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");

  const handleGenerateQuestions = async () => {
    setIsGeneratingQuestions(true);
    try {
      const result = await generateQuestionsFromAnalysis(analysisResult, outputLanguage);
      setQuestionResult(result);
      setStage("questions");
      toast.success("Questions generated successfully!");
    } catch (error) {
      console.error("Question generation failed:", error);
      toast.error("Failed to generate questions. Please try again.");
    } finally {
      setIsGeneratingQuestions(false);
    }
  };

  const handleAnswerSelect = (answer: string) => {
    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestion] = answer;
    setSelectedAnswers(newAnswers);
  };

  const handleNext = () => {
    if (!questionResult) return;
    
    const mcqQuestions = questionResult.questions.filter(q => q.type === "mcq" && q.options && q.options.length > 0);
    
    if (currentQuestion < mcqQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      // Calculate score
      let correctCount = 0;
      mcqQuestions.forEach((q, index) => {
        if (selectedAnswers[index] === q.answer) {
          correctCount++;
        }
      });
      setScore(correctCount);
      setShowResults(true);
    }
  };

  const handleRestart = () => {
    setCurrentQuestion(0);
    setSelectedAnswers([]);
    setShowResults(false);
    setScore(0);
  };

  if (stage === "keypoints") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="container mx-auto px-4 py-8">
          <Card className="p-8 max-w-4xl mx-auto bg-white/80 backdrop-blur-sm shadow-lg border-0">
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <Button onClick={onBack} variant="ghost" className="text-gray-600 hover:text-gray-800">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Analysis
                </Button>
              </div>

              <div className="text-center mb-8">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <div className="p-3 bg-gradient-to-r from-green-500 to-blue-600 rounded-full">
                    <Brain className="h-8 w-8 text-white" />
                  </div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                    Interactive Quiz Mode
                  </h1>
                </div>
                <p className="text-gray-600 text-lg">
                  Test your knowledge with AI-generated questions based on your study material
                </p>
              </div>

              {/* Key Points Summary */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg mb-6">
                <h3 className="text-xl font-bold text-gray-800 mb-3">Study Material Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="bg-white/50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{analysisResult.studyPoints?.length || 0}</div>
                    <div className="text-sm text-gray-600">Key Study Points</div>
                  </div>
                  <div className="bg-white/50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{selectedFiles.length}</div>
                    <div className="text-sm text-gray-600">Source Files</div>
                  </div>
                </div>
                <p className="text-gray-700">{analysisResult.summary}</p>
              </div>

              {/* Difficulty Selection */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Target className="h-5 w-5 text-blue-600" />
                  Select Quiz Difficulty
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { level: "easy", label: "Easy", desc: "Basic factual questions", color: "green" },
                    { level: "medium", label: "Medium", desc: "Moderate analytical questions", color: "orange" },
                    { level: "hard", label: "Hard", desc: "Advanced critical thinking", color: "red" }
                  ].map(({ level, label, desc, color }) => (
                    <button
                      key={level}
                      onClick={() => setDifficulty(level as any)}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        difficulty === level
                          ? `border-${color}-500 bg-${color}-50`
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className={`font-semibold text-${color}-600`}>{label}</div>
                      <div className="text-sm text-gray-600 mt-1">{desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="text-center">
                <Button
                  onClick={handleGenerateQuestions}
                  disabled={isGeneratingQuestions}
                  className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white px-8 py-4 text-lg"
                >
                  {isGeneratingQuestions ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                      Generating Questions...
                    </>
                  ) : (
                    <>
                      <Brain className="h-5 w-5 mr-3" />
                      Start Quiz
                    </>
                  )}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (!questionResult) return null;

  const mcqQuestions = questionResult.questions.filter(q => q.type === "mcq" && q.options && q.options.length > 0);

  if (showResults) {
    const percentage = Math.round((score / mcqQuestions.length) * 100);
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="container mx-auto px-4 py-8">
          <Card className="p-8 max-w-4xl mx-auto bg-white/80 backdrop-blur-sm shadow-lg border-0">
            <div className="text-center space-y-6">
              <div className="flex items-center justify-center gap-3 mb-6">
                <div className="p-4 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full">
                  <Trophy className="h-10 w-10 text-white" />
                </div>
                <h2 className="text-3xl font-bold">Quiz Completed!</h2>
              </div>
              
              <div className="text-8xl font-bold text-blue-600 mb-4">
                {score}/{mcqQuestions.length}
              </div>
              
              <div className="text-2xl text-gray-600 mb-6">
                Your Score: {percentage}%
              </div>

              <div className="w-full max-w-md mx-auto mb-6">
                <Progress value={percentage} className="h-4" />
              </div>
              
              <div className="flex gap-4 justify-center flex-wrap">
                <Button onClick={handleRestart} className="bg-blue-600 hover:bg-blue-700 px-6 py-3">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
                <Button onClick={() => setStage("keypoints")} variant="outline" className="px-6 py-3">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Setup
                </Button>
                <Button onClick={onReset} variant="outline" className="px-6 py-3">
                  Upload New Files
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (mcqQuestions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="container mx-auto px-4 py-8">
          <Card className="p-8 max-w-4xl mx-auto text-center">
            <p className="text-gray-600 mb-4 text-lg">No multiple-choice questions available for quiz mode.</p>
            <Button onClick={() => setStage("keypoints")} className="px-6 py-3">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Setup
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  const question = mcqQuestions[currentQuestion];
  const progress = ((currentQuestion + 1) / mcqQuestions.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <Card className="p-8 max-w-4xl mx-auto bg-white/80 backdrop-blur-sm shadow-lg border-0">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <Button onClick={() => setStage("keypoints")} variant="ghost" className="text-gray-600 hover:text-gray-800">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Setup
              </Button>
              <Badge variant="outline" className="text-lg px-4 py-2">
                Question {currentQuestion + 1} of {mcqQuestions.length}
              </Badge>
            </div>
            
            <Progress value={progress} className="h-3 mb-4" />
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-2xl font-semibold mb-4 leading-relaxed">{question.question}</h3>
              <div className="flex gap-3 mb-6">
                <Badge className="bg-orange-100 text-orange-700 capitalize px-3 py-1">
                  {question.difficulty}
                </Badge>
                <Badge className="bg-purple-100 text-purple-700 px-3 py-1">
                  {question.tnpscGroup}
                </Badge>
              </div>
            </div>

            <div className="space-y-4">
              {question.options?.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleAnswerSelect(option)}
                  className={`w-full text-left p-6 rounded-xl border-2 transition-all duration-200 ${
                    selectedAnswers[currentQuestion] === option
                      ? 'border-blue-500 bg-blue-50 shadow-md transform scale-[1.02]'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <span className="font-bold text-lg text-blue-600 bg-blue-100 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">
                      {String.fromCharCode(65 + index)}
                    </span>
                    <span className="text-gray-800 leading-relaxed">{option}</span>
                  </div>
                </button>
              ))}
            </div>

            <div className="flex justify-end pt-6">
              <Button 
                onClick={handleNext}
                disabled={!selectedAnswers[currentQuestion]}
                className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white px-8 py-4 text-lg"
              >
                {currentQuestion < mcqQuestions.length - 1 ? 'Next Question' : 'Finish Quiz'}
                <ArrowLeft className="h-5 w-5 ml-2 rotate-180" />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ModernQuizMode;
