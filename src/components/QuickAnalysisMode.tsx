
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, BookOpen, Brain, HelpCircle, CheckCircle, AlertCircle, Circle } from "lucide-react";
import { AnalysisResult, QuestionResult } from "./StudyAssistant";
import { generateQuestionsFromAnalysis } from "@/services/geminiService";
import { toast } from "sonner";
import ModernQuizMode from "./ModernQuizMode";

interface QuickAnalysisModeProps {
  analysisResult: AnalysisResult;
  selectedFiles: File[];
  outputLanguage: "english" | "tamil";
  onReset: () => void;
}

type AnalysisStage = "keypoints" | "questions";

const QuickAnalysisMode = ({ 
  analysisResult, 
  selectedFiles, 
  outputLanguage, 
  onReset 
}: QuickAnalysisModeProps) => {
  const [stage, setStage] = useState<AnalysisStage>("keypoints");
  const [questionResult, setQuestionResult] = useState<QuestionResult | null>(null);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [showQuizMode, setShowQuizMode] = useState(false);

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

  const handleStartQuiz = () => {
    setShowQuizMode(true);
  };

  const getImportanceIcon = (importance: string) => {
    switch (importance) {
      case "high":
        return <CheckCircle className="h-4 w-4 text-red-500" />;
      case "medium":
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      default:
        return <Circle className="h-4 w-4 text-blue-500" />;
    }
  };

  const getImportanceBadge = (importance: string) => {
    switch (importance) {
      case "high":
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">High Priority</Badge>;
      case "medium":
        return <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100">Medium Priority</Badge>;
      default:
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Low Priority</Badge>;
    }
  };

  const getDifficultyBadge = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Easy</Badge>;
      case "medium":
        return <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100">Medium</Badge>;
      case "hard":
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Hard</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100">{difficulty}</Badge>;
    }
  };

  if (showQuizMode) {
    return (
      <ModernQuizMode
        analysisResult={analysisResult}
        selectedFiles={selectedFiles}
        outputLanguage={outputLanguage}
        onReset={onReset}
        onBack={() => setShowQuizMode(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Header */}
          <Card className="p-6 bg-white/80 backdrop-blur-sm shadow-lg border-0">
            <div className="flex items-start gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <Button
                    onClick={onReset}
                    variant="ghost"
                    className="text-gray-600 hover:text-gray-800"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Upload New Files
                  </Button>
                </div>
                
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <BookOpen className="h-5 w-5 text-blue-600" />
                    <h2 className="text-2xl font-bold text-gray-800">TNPSC Analysis Results</h2>
                  </div>
                  <div className="flex gap-2 mb-2 flex-wrap">
                    <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                      Language: {analysisResult.language}
                    </Badge>
                    <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
                      Source Files: {selectedFiles.length}
                    </Badge>
                    {analysisResult.tnpscCategories && analysisResult.tnpscCategories.length > 0 && (
                      <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100">
                        TNPSC Relevant
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg mb-4">
                  <h3 className="font-semibold text-gray-800 mb-2">Main Topic</h3>
                  <p className="text-lg text-gray-700">{analysisResult.mainTopic}</p>
                  {analysisResult.tnpscCategories && analysisResult.tnpscCategories.length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm font-medium text-gray-600 mb-1">TNPSC Categories:</p>
                      <div className="flex flex-wrap gap-1">
                        {analysisResult.tnpscCategories.map((category, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {category}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 flex-wrap">
                  <Button
                    onClick={handleGenerateQuestions}
                    disabled={isGeneratingQuestions}
                    className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white"
                  >
                    {isGeneratingQuestions ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Generating Questions...
                      </>
                    ) : (
                      <>
                        <HelpCircle className="h-4 w-4 mr-2" />
                        Generate Questions
                      </>
                    )}
                  </Button>

                  <Button
                    onClick={handleStartQuiz}
                    className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white"
                  >
                    <Brain className="h-4 w-4 mr-2" />
                    Start Interactive Quiz
                  </Button>
                </div>
              </div>

              {selectedFiles.length > 0 && (
                <div className="w-48 flex-shrink-0">
                  <div className="text-sm font-medium text-gray-700 mb-2">Source Files</div>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {selectedFiles.slice(0, 3).map((file, index) => (
                      <div key={index} className="text-xs text-gray-600 truncate">
                        {file.name}
                      </div>
                    ))}
                    {selectedFiles.length > 3 && (
                      <div className="text-xs text-gray-500">
                        +{selectedFiles.length - 3} more files
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </Card>

          {stage === "keypoints" && (
            <>
              {/* Study Points */}
              <Card className="p-6 bg-white/80 backdrop-blur-sm shadow-lg border-0">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Key Study Points for TNPSC</h3>
                <div className="space-y-4">
                  {analysisResult.studyPoints.map((point, index) => (
                    <div
                      key={index}
                      className="p-4 bg-white rounded-lg shadow-sm border-l-4 border-blue-400 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {getImportanceIcon(point.importance)}
                          <h4 className="font-semibold text-gray-800">{point.title}</h4>
                        </div>
                        {getImportanceBadge(point.importance)}
                      </div>
                      <p className="text-gray-700 leading-relaxed mb-2">{point.description}</p>
                      {point.tnpscRelevance && (
                        <div className="mt-2 p-2 bg-yellow-50 rounded border-l-2 border-yellow-400">
                          <p className="text-sm text-yellow-800">
                            <strong>TNPSC Relevance:</strong> {point.tnpscRelevance}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </Card>

              {/* Summary */}
              <Card className="p-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg border-0">
                <h3 className="text-xl font-bold mb-3">Summary</h3>
                <p className="text-blue-50 leading-relaxed">{analysisResult.summary}</p>
              </Card>
            </>
          )}

          {stage === "questions" && questionResult && (
            <Card className="p-6 bg-white/80 backdrop-blur-sm shadow-lg border-0">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-800">Practice Questions</h3>
                <div className="flex gap-2">
                  <Badge className="bg-green-100 text-green-700">
                    Total: {questionResult.totalQuestions}
                  </Badge>
                  <Button
                    onClick={handleStartQuiz}
                    className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white"
                  >
                    <Brain className="h-4 w-4 mr-2" />
                    Start Quiz
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                {questionResult.questions.map((question, index) => (
                  <div key={index} className="p-4 bg-white rounded-lg shadow-sm border">
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="font-semibold text-gray-800">Question {index + 1}</h4>
                      <div className="flex gap-2">
                        {getDifficultyBadge(question.difficulty)}
                        <Badge className="bg-purple-100 text-purple-700">
                          {question.tnpscGroup}
                        </Badge>
                      </div>
                    </div>
                    
                    <p className="text-gray-700 mb-4">{question.question}</p>
                    
                    {question.options && question.options.length > 0 && (
                      <div className="space-y-2 mb-4">
                        <p className="font-medium text-gray-700">Options:</p>
                        {question.options.map((option, optIndex) => (
                          <div key={optIndex} className="p-2 bg-gray-50 rounded border-l-2 border-gray-300">
                            <span className="font-medium text-gray-600">
                              {String.fromCharCode(65 + optIndex)}.
                            </span>
                            <span className="ml-2 text-gray-700">{option}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {question.answer && (
                      <div className="p-3 bg-green-50 rounded border-l-4 border-green-400">
                        <p className="text-sm font-medium text-green-800">
                          <strong>Answer:</strong> {question.answer}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuickAnalysisMode;
