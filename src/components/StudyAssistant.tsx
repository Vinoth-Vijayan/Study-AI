import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, Image, Settings, Languages, Brain, Zap } from "lucide-react";
import { analyzeImage, analyzeMultipleImages } from "@/services/geminiService";
import { toast } from "sonner";
import AnalysisResults from "./AnalysisResults";
import QuestionResults from "./QuestionResults";
import ModernQuizMode from "./ModernQuizMode";
import QuickAnalysisMode from "./QuickAnalysisMode";

export interface AnalysisResult {
  keyPoints: string[];
  summary: string;
  tnpscRelevance: string;
  studyPoints: StudyPoint[];
  tnpscCategories: string[];
  language?: string;
  mainTopic?: string;
}

export interface StudyPoint {
  title: string;
  description: string;
  importance: "high" | "medium" | "low";
  tnpscRelevance?: string;
}

export interface Question {
  question: string;
  options?: string[];
  answer: string;
  type: "mcq" | "true_false" | "short_answer";
  difficulty: string;
  tnpscGroup: string;
  explanation?: string;
}

export interface QuestionResult {
  questions: Question[];
  summary: string;
  keyPoints: string[];
  difficulty: string;
  totalQuestions?: number;
}

const StudyAssistant = () => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult[]>([]);
  const [questionResult, setQuestionResult] = useState<QuestionResult | null>(null);
  const [currentView, setCurrentView] = useState<"upload" | "analysis" | "questions" | "quiz" | "quick-analysis">("upload");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [difficulty, setDifficulty] = useState("medium");
  const [outputLanguage, setOutputLanguage] = useState<"english" | "tamil">("english");

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;
    
    const fileArray = Array.from(files);
    const validFiles = fileArray.filter(file => 
      file.type.startsWith('image/') || file.type === 'application/pdf'
    );
    
    if (validFiles.length !== fileArray.length) {
      toast.error("Only image files (PNG, JPG, etc.) and PDF files are supported");
    }
    
    setSelectedFiles(validFiles);
  };

  const analyzeFiles = async () => {
    if (selectedFiles.length === 0) {
      toast.error("Please select files to analyze");
      return;
    }

    setIsAnalyzing(true);
    try {
      const results: AnalysisResult[] = [];
      
      for (const file of selectedFiles) {
        if (file.type.startsWith('image/')) {
          const result = await analyzeImage(file, outputLanguage);
          results.push({
            ...result,
            language: outputLanguage,
            mainTopic: result.studyPoints?.[0]?.title || "Study Material"
          });
        }
      }
      
      setAnalysisResults(results);
      setCurrentView("analysis");
      toast.success("Analysis completed successfully!");
    } catch (error) {
      console.error("Analysis error:", error);
      toast.error("Failed to analyze files. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generateQuestions = async () => {
    if (analysisResults.length === 0) return;
    
    setIsGeneratingQuestions(true);
    try {
      const result = await analyzeMultipleImages(selectedFiles, difficulty, outputLanguage);
      setQuestionResult({
        ...result,
        totalQuestions: result.questions?.length || 0
      });
      setCurrentView("questions");
      toast.success("Questions generated successfully!");
    } catch (error) {
      console.error("Question generation error:", error);
      toast.error("Failed to generate questions. Please try again.");
    } finally {
      setIsGeneratingQuestions(false);
    }
  };

  const startQuickAnalysis = () => {
    if (selectedFiles.length === 0) {
      toast.error("Please select files first");
      return;
    }
    setCurrentView("quick-analysis");
  };

  const handleQuickAnalysisQuiz = (result: QuestionResult) => {
    setQuestionResult({
      ...result,
      totalQuestions: result.questions?.length || 0
    });
    setCurrentView("quiz");
  };

  const resetToUpload = () => {
    setSelectedFiles([]);
    setAnalysisResults([]);
    setQuestionResult(null);
    setCurrentView("upload");
  };

  if (currentView === "quick-analysis") {
    return (
      <QuickAnalysisMode
        files={selectedFiles}
        difficulty={difficulty}
        outputLanguage={outputLanguage}
        onStartQuiz={handleQuickAnalysisQuiz}
        onReset={resetToUpload}
      />
    );
  }

  if (currentView === "quiz" && questionResult) {
    return (
      <ModernQuizMode
        result={questionResult}
        onReset={resetToUpload}
        onBackToAnalysis={() => setCurrentView("analysis")}
        difficulty={difficulty}
        outputLanguage={outputLanguage}
      />
    );
  }

  if (currentView === "questions" && questionResult) {
    return (
      <QuestionResults
        result={questionResult}
        onReset={resetToUpload}
        selectedFiles={selectedFiles}
      />
    );
  }

  if (currentView === "analysis" && analysisResults.length > 0) {
    return (
      <AnalysisResults
        result={analysisResults[0]}
        onReset={resetToUpload}
        selectedFiles={selectedFiles}
        onGenerateQuestions={generateQuestions}
        isGeneratingQuestions={isGeneratingQuestions}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full">
                <Brain className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                TNPSC Study AI
              </h1>
            </div>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Upload your study materials and get AI-powered analysis, key points, and practice questions for TNPSC preparation
            </p>
          </div>

          <Card className="p-8 bg-white/80 backdrop-blur-sm shadow-2xl border-0 mb-8">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Difficulty Level
                  </label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="w-full p-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                    <option value="very-hard">Very Hard</option>
                  </select>
                </div>

                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Output Language
                  </label>
                  <select
                    value={outputLanguage}
                    onChange={(e) => setOutputLanguage(e.target.value as "english" | "tamil")}
                    className="w-full p-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none"
                  >
                    <option value="english">English</option>
                    <option value="tamil">தமிழ் (Tamil)</option>
                  </select>
                </div>
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 transition-colors">
                <input
                  type="file"
                  multiple
                  accept="image/*,application/pdf"
                  onChange={(e) => handleFileSelect(e.target.files)}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-lg font-medium text-gray-700 mb-2">
                    Upload Your Study Materials
                  </p>
                  <p className="text-gray-500">
                    Images (PNG, JPG) and PDF files supported
                  </p>
                </label>
              </div>

              {selectedFiles.length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-800">
                    Selected Files ({selectedFiles.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {selectedFiles.map((file, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        {file.type.startsWith('image/') ? (
                          <Image className="h-5 w-5 text-blue-600" />
                        ) : (
                          <FileText className="h-5 w-5 text-red-600" />
                        )}
                        <span className="text-sm text-gray-700 truncate">
                          {file.name}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 pt-4">
                    <Button
                      onClick={analyzeFiles}
                      disabled={isAnalyzing}
                      className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-6 text-lg font-semibold"
                    >
                      {isAnalyzing ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <Settings className="h-5 w-5 mr-3" />
                          Detailed Analysis
                        </>
                      )}
                    </Button>

                    <Button
                      onClick={startQuickAnalysis}
                      variant="outline"
                      className="flex-1 border-2 border-green-500 text-green-600 hover:bg-green-50 py-6 text-lg font-semibold"
                    >
                      <Zap className="h-5 w-5 mr-3" />
                      Quick Quiz
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default StudyAssistant;
