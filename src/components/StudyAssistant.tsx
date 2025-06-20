import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, BookOpen, Brain, FileImage, Languages, FileText } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ImageUpload from "./ImageUpload";
import AnalysisResults from "./AnalysisResults";
import QuestionResults from "./QuestionResults";
import PdfAnalyzer from "./PdfAnalyzer";
import EnhancedQuizMode from "./EnhancedQuizMode";
import { analyzeMultipleFiles, generateQuestions } from "@/services/geminiService";
import { toast } from "sonner";

export interface StudyPoint {
  title: string;
  description: string;
  importance: "high" | "medium" | "low";
  tnpscRelevance: string;
}

export interface AnalysisResult {
  mainTopic: string;
  studyPoints: StudyPoint[];
  summary: string;
  language: string;
  tnpscCategories: string[];
}

export interface Question {
  question: string;
  options?: string[];
  answer?: string;
  type: "mcq" | "short" | "essay";
  difficulty: "easy" | "medium" | "hard";
  tnpscGroup: string;
}

export interface QuestionResult {
  questions: Question[];
  totalQuestions: number;
}

const StudyAssistant = () => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [questionResult, setQuestionResult] = useState<QuestionResult | null>(null);
  const [outputLanguage, setOutputLanguage] = useState<"english" | "tamil">("english");
  const [activeTab, setActiveTab] = useState("analysis");
  const [showPdfAnalyzer, setShowPdfAnalyzer] = useState(false);
  const [showEnhancedQuiz, setShowEnhancedQuiz] = useState(false);
  const [quizConfig, setQuizConfig] = useState<{
    pageRange: { start: number; end: number };
    difficulty: string;
    questionsPerPage: number;
  } | null>(null);

  const handleFilesSelect = (files: File[]) => {
    setSelectedFiles(files);
    setAnalysisResult(null);
    setQuestionResult(null);
  };

  const handleAnalyze = async () => {
    if (selectedFiles.length === 0) {
      toast.error("Please select at least one file first");
      return;
    }

    setIsAnalyzing(true);
    try {
      const result = await analyzeMultipleFiles(selectedFiles, outputLanguage);
      setAnalysisResult(result);
      toast.success("Analysis completed successfully!");
    } catch (error) {
      console.error("Analysis failed:", error);
      toast.error("Failed to analyze files. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGenerateQuestions = async () => {
    if (selectedFiles.length === 0 || !analysisResult) {
      toast.error("Please analyze the files first");
      return;
    }

    setIsGeneratingQuestions(true);
    try {
      const result = await generateQuestions(selectedFiles[0], analysisResult, outputLanguage);
      setQuestionResult(result);
      setActiveTab("questions");
      toast.success("Questions generated successfully!");
    } catch (error) {
      console.error("Question generation failed:", error);
      toast.error("Failed to generate questions. Please try again.");
    } finally {
      setIsGeneratingQuestions(false);
    }
  };

  const handleReset = () => {
    setSelectedFiles([]);
    setAnalysisResult(null);
    setQuestionResult(null);
    setActiveTab("analysis");
    setShowPdfAnalyzer(false);
    setShowEnhancedQuiz(false);
    setQuizConfig(null);
  };

  const handlePdfAnalysis = () => {
    const pdfFile = selectedFiles.find(file => file.type === 'application/pdf');
    if (pdfFile) {
      setShowPdfAnalyzer(true);
    } else {
      toast.error("Please select a PDF file for page-by-page analysis");
    }
  };

  const handleStartEnhancedQuiz = (
    pageRange: { start: number; end: number },
    difficulty: string,
    questionsPerPage: number
  ) => {
    setQuizConfig({ pageRange, difficulty, questionsPerPage });
    setShowEnhancedQuiz(true);
  };

  // If showing PDF analyzer
  if (showPdfAnalyzer) {
    const pdfFile = selectedFiles.find(file => file.type === 'application/pdf');
    if (pdfFile) {
      return (
        <div className="container mx-auto px-4 py-8">
          <PdfAnalyzer
            file={pdfFile}
            onReset={handleReset}
            onStartQuiz={handleStartEnhancedQuiz}
            outputLanguage={outputLanguage}
          />
        </div>
      );
    }
  }

  // If showing enhanced quiz
  if (showEnhancedQuiz && quizConfig) {
    const pdfFile = selectedFiles.find(file => file.type === 'application/pdf');
    if (pdfFile) {
      return (
        <div className="container mx-auto px-4 py-8">
          <EnhancedQuizMode
            file={pdfFile}
            pageRange={quizConfig.pageRange}
            difficulty={quizConfig.difficulty}
            questionsPerPage={quizConfig.questionsPerPage}
            outputLanguage={outputLanguage}
            onReset={handleReset}
            onBackToAnalyzer={() => setShowEnhancedQuiz(false)}
          />
        </div>
      );
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full">
            <Brain className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Ram's Studies
          </h1>
        </div>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          TNPSC Group 1, 2 & 4 Exam Preparation - Upload study materials (images & PDFs) and get key points & practice questions
        </p>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto">
        {!analysisResult ? (
          <Card className="p-8 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <div className="space-y-6">
              <div className="text-center">
                <FileImage className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                  Upload Your Study Materials
                </h2>
                <p className="text-gray-600">
                  Select multiple images and PDFs of your TNPSC study materials
                </p>
              </div>

              <ImageUpload 
                onFilesSelect={handleFilesSelect}
                selectedFiles={selectedFiles}
              />

              {/* Language Selection */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <div className="flex items-center gap-2 mb-4">
                  <Languages className="h-5 w-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-800">Output Language</h3>
                </div>
                <RadioGroup
                  value={outputLanguage}
                  onValueChange={(value) => setOutputLanguage(value as "english" | "tamil")}
                  className="flex gap-6"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="english" id="english" />
                    <Label htmlFor="english" className="font-medium">English</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="tamil" id="tamil" />
                    <Label htmlFor="tamil" className="font-medium">தமிழ் (Tamil)</Label>
                  </div>
                </RadioGroup>
                <p className="text-sm text-gray-600 mt-2">
                  Choose the language for your study points and questions
                </p>
              </div>

              {selectedFiles.length > 0 && (
                <div className="flex gap-4 justify-center flex-wrap">
                  <Button
                    onClick={handleAnalyze}
                    disabled={isAnalyzing}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-3 rounded-lg shadow-lg transition-all duration-200 transform hover:scale-105"
                  >
                    {isAnalyzing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Analyzing for TNPSC...
                      </>
                    ) : (
                      <>
                        <BookOpen className="h-4 w-4 mr-2" />
                        Analyze for TNPSC Exam
                      </>
                    )}
                  </Button>

                  {selectedFiles.some(file => file.type === 'application/pdf') && (
                    <Button
                      onClick={handlePdfAnalysis}
                      variant="outline"
                      className="px-6 py-3 border-2 border-green-500 text-green-600 hover:bg-green-50"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      PDF Page Analysis
                    </Button>
                  )}
                  
                  <Button
                    onClick={handleReset}
                    variant="outline"
                    className="px-6 py-3"
                  >
                    Reset
                  </Button>
                </div>
              )}
            </div>
          </Card>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="analysis">Study Points</TabsTrigger>
              <TabsTrigger value="questions">Practice Questions</TabsTrigger>
            </TabsList>
            
            <TabsContent value="analysis">
              <AnalysisResults 
                result={analysisResult}
                onReset={handleReset}
                selectedFiles={selectedFiles}
                onGenerateQuestions={handleGenerateQuestions}
                isGeneratingQuestions={isGeneratingQuestions}
              />
            </TabsContent>
            
            <TabsContent value="questions">
              {questionResult ? (
                <QuestionResults 
                  result={questionResult}
                  onReset={handleReset}
                  selectedFiles={selectedFiles}
                />
              ) : (
                <Card className="p-8 text-center">
                  <p className="text-gray-600 mb-4">No questions generated yet.</p>
                  <Button
                    onClick={handleGenerateQuestions}
                    disabled={isGeneratingQuestions}
                    className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700"
                  >
                    {isGeneratingQuestions ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Generating Questions...
                      </>
                    ) : (
                      "Generate TNPSC Questions"
                    )}
                  </Button>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
};

export default StudyAssistant;
