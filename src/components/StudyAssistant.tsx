
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, BookOpen, Brain, FileImage, Languages, FileText, File, Image } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import ImageUpload from "./ImageUpload";
import AnalysisResults from "./AnalysisResults";
import QuestionResults from "./QuestionResults";
import PdfAnalyzer from "./PdfAnalyzer";
import QuickAnalysisMode from "./QuickAnalysisMode";
import ModernQuizMode from "./ModernQuizMode";
import { analyzeMultipleFiles, generateQuestionsFromAnalysis } from "@/services/geminiService";
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
  type: "mcq" | "true_false" | "short_answer";
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
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [questionResult, setQuestionResult] = useState<QuestionResult | null>(null);
  const [outputLanguage, setOutputLanguage] = useState<"english" | "tamil">("english");
  const [activeTab, setActiveTab] = useState("analysis");
  const [showPdfAnalyzer, setShowPdfAnalyzer] = useState(false);
  const [showImageAnalyzer, setShowImageAnalyzer] = useState(false);
  const [showEnhancedQuiz, setShowEnhancedQuiz] = useState(false);
  const [quizConfig, setQuizConfig] = useState<{
    pageRange: { start: number; end: number };
    difficulty: string;
    questionsPerPage: number;
  } | null>(null);
  const [fileInfo, setFileInfo] = useState<{
    totalPages: number;
    imageCount: number;
    pdfCount: number;
  }>({ totalPages: 0, imageCount: 0, pdfCount: 0 });
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);

  // Calculate file statistics
  useEffect(() => {
    const pdfFiles = selectedFiles.filter(file => file.type === 'application/pdf');
    const imageFiles = selectedFiles.filter(file => file.type.startsWith('image/'));
    
    // For now, we'll estimate pages - in a real app, you'd use PDF.js to get actual page count
    const estimatedPages = pdfFiles.length * 100; // Placeholder - should be actual PDF page count
    
    setFileInfo({
      totalPages: estimatedPages,
      imageCount: imageFiles.length,
      pdfCount: pdfFiles.length
    });
  }, [selectedFiles]);

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
    if (!analysisResult) {
      toast.error("Please analyze files first before generating questions");
      return;
    }

    setIsGeneratingQuestions(true);
    try {
      const result = await generateQuestionsFromAnalysis(analysisResult, outputLanguage);
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
    setShowImageAnalyzer(false);
    setShowEnhancedQuiz(false);
    setQuizConfig(null);
    setFileInfo({ totalPages: 0, imageCount: 0, pdfCount: 0 });
  };

  const handlePdfAnalysis = () => {
    const pdfFile = selectedFiles.find(file => file.type === 'application/pdf');
    if (pdfFile) {
      setShowPdfAnalyzer(true);
    } else {
      toast.error("Please select a PDF file for page-by-page analysis");
    }
  };

  const handleImageAnalysis = () => {
    const imageFiles = selectedFiles.filter(file => file.type.startsWith('image/'));
    if (imageFiles.length > 0) {
      setShowImageAnalyzer(true);
    } else {
      toast.error("Please select image files for page-by-page analysis");
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

  const handleStartImageQuiz = (
    imageIndexes: number[],
    difficulty: string,
    questionsPerImage: number
  ) => {
    console.log("Starting image quiz with:", { imageIndexes, difficulty, questionsPerImage });
    
    // Convert image indexes to page range format for consistency
    setQuizConfig({ 
      pageRange: { start: Math.min(...imageIndexes) + 1, end: Math.max(...imageIndexes) + 1 }, 
      difficulty, 
      questionsPerPage: questionsPerImage 
    });
    setShowEnhancedQuiz(true);
  };

  // If showing PDF analyzer
  if (showPdfAnalyzer) {
    const pdfFile = selectedFiles.find(file => file.type === 'application/pdf');
    if (pdfFile) {
      return (
        <div className="container mx-auto px-4 py-4 md:py-8">
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

  // If showing Image analyzer
  if (showImageAnalyzer) {
    const imageFiles = selectedFiles.filter(file => file.type.startsWith('image/'));
    if (imageFiles.length > 0) {
      return (
        <div className="container mx-auto px-4 py-4 md:py-8">
          <ImageAnalyzer
            files={imageFiles}
            onReset={handleReset}
            onStartQuiz={handleStartImageQuiz}
            outputLanguage={outputLanguage}
          />
        </div>
      );
    }
  }

  // If showing enhanced quiz
  if (showEnhancedQuiz && quizConfig) {
    const pdfFile = selectedFiles.find(file => file.type === 'application/pdf');
    const imageFiles = selectedFiles.filter(file => file.type.startsWith('image/'));
    
    if (pdfFile) {
      return (
        <div className="container mx-auto px-4 py-4 md:py-8">
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
    } else if (imageFiles.length > 0) {
      return (
        <div className="container mx-auto px-4 py-4 md:py-8">
          <EnhancedQuizMode
            file={imageFiles[0]} // Use first image as representative
            pageRange={quizConfig.pageRange}
            difficulty={quizConfig.difficulty}
            questionsPerPage={quizConfig.questionsPerPage}
            outputLanguage={outputLanguage}
            onReset={handleReset}
            onBackToAnalyzer={() => setShowEnhancedQuiz(false)}
            isImageMode={true}
            imageFiles={imageFiles}
          />
        </div>
      );
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-4 md:py-8">
        {/* Header */}
        <div className="text-center mb-6 md:mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-2 md:p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full">
              <Brain className="h-6 w-6 md:h-8 md:w-8 text-white" />
            </div>
            <h1 className="text-2xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Ram's Studies
            </h1>
          </div>
          <p className="text-sm md:text-lg text-gray-600 max-w-2xl mx-auto px-4">
            TNPSC Group 1, 2 & 4 Exam Preparation - Upload study materials (images & PDFs) and get key points & practice questions
          </p>
        </div>

        {/* Main Content */}
        <div className="max-w-6xl mx-auto">
          {!analysisResult ? (
            <Card className="p-4 md:p-8 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <div className="space-y-6">
                <div className="text-center">
                  <FileImage className="h-10 w-10 md:h-12 md:w-12 text-gray-400 mx-auto mb-4" />
                  <h2 className="text-xl md:text-2xl font-semibold text-gray-800 mb-2">
                    Upload Your Study Materials
                  </h2>
                  <p className="text-sm md:text-base text-gray-600">
                    Select multiple images and PDFs of your TNPSC study materials
                  </p>
                </div>

                <ImageUpload 
                  onFilesSelect={handleFilesSelect}
                  selectedFiles={selectedFiles}
                />

                {/* File Statistics */}
                {selectedFiles.length > 0 && (
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 md:p-6 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <File className="h-5 w-5 text-blue-600" />
                      File Statistics
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                      <div className="bg-white/50 p-3 rounded-lg">
                        <div className="text-xl md:text-2xl font-bold text-blue-600">{selectedFiles.length}</div>
                        <div className="text-xs md:text-sm text-gray-600">Total Files</div>
                      </div>
                      <div className="bg-white/50 p-3 rounded-lg">
                        <div className="text-xl md:text-2xl font-bold text-green-600">{fileInfo.imageCount}</div>
                        <div className="text-xs md:text-sm text-gray-600">Images</div>
                      </div>
                      <div className="bg-white/50 p-3 rounded-lg">
                        <div className="text-xl md:text-2xl font-bold text-red-600">{fileInfo.pdfCount}</div>
                        <div className="text-xs md:text-sm text-gray-600">PDFs</div>
                      </div>
                      <div className="bg-white/50 p-3 rounded-lg">
                        <div className="text-xl md:text-2xl font-bold text-purple-600">
                          {fileInfo.pdfCount > 0 ? "~" + fileInfo.totalPages : fileInfo.imageCount}
                        </div>
                        <div className="text-xs md:text-sm text-gray-600">
                          {fileInfo.pdfCount > 0 ? "Est. Pages" : "Pages"}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Language Selection */}
                <div className="bg-gray-50 p-4 md:p-6 rounded-lg">
                  <div className="flex items-center gap-2 mb-4">
                    <Languages className="h-5 w-5 text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-800">Output Language</h3>
                  </div>
                  <RadioGroup
                    value={outputLanguage}
                    onValueChange={(value) => setOutputLanguage(value as "english" | "tamil")}
                    className="flex flex-col md:flex-row gap-4 md:gap-6"
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
                  <div className="space-y-4">
                    {/* Quick Actions */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <Button
                        onClick={handleAnalyze}
                        disabled={isAnalyzing}
                        className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white py-3 md:py-4 rounded-lg shadow-lg transition-all duration-200 transform hover:scale-105"
                      >
                        {isAnalyzing ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Analyzing...
                          </>
                        ) : (
                          <>
                            <BookOpen className="h-4 w-4 mr-2" />
                            Quick Analysis
                          </>
                        )}
                      </Button>

                      {fileInfo.pdfCount > 0 && (
                        <Button
                          onClick={handlePdfAnalysis}
                          className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white py-3 md:py-4 rounded-lg shadow-lg"
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          PDF Analysis
                        </Button>
                      )}

                      {fileInfo.imageCount > 0 && (
                        <Button
                          onClick={handleImageAnalysis}
                          className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white py-3 md:py-4 rounded-lg shadow-lg"
                        >
                          <Image className="h-4 w-4 mr-2" />
                          Image Analysis
                        </Button>
                      )}
                      
                      <Button
                        onClick={handleReset}
                        variant="outline"
                        className="py-3 md:py-4 border-2 hover:bg-gray-50"
                      >
                        Reset All
                      </Button>
                    </div>

                    {/* Feature Highlights */}
                    <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 md:p-6 rounded-lg">
                      <h3 className="text-lg font-semibold text-gray-800 mb-3">Available Features</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-blue-100 text-blue-700 text-xs">PDF</Badge>
                          <span>Page-by-page PDF analysis & quiz</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-purple-100 text-purple-700 text-xs">IMAGE</Badge>
                          <span>Image-by-image analysis & quiz</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-green-100 text-green-700 text-xs">QUIZ</Badge>
                          <span>Customizable difficulty levels</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-orange-100 text-orange-700 text-xs">SMART</Badge>
                          <span>TNPSC-focused content analysis</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="analysis" className="text-sm md:text-base">Study Points</TabsTrigger>
                <TabsTrigger value="questions" className="text-sm md:text-base">Practice Questions</TabsTrigger>
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
                  <Card className="p-6 md:p-8 text-center">
                    <p className="text-gray-600 mb-4">Generate questions from your analysis or use advanced analyzers.</p>
                    <div className="flex flex-col md:flex-row gap-4 justify-center">
                      <Button
                        onClick={handleGenerateQuestions}
                        disabled={!analysisResult || isGeneratingQuestions}
                        className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700"
                      >
                        {isGeneratingQuestions ? "Generating..." : "Generate Questions"}
                      </Button>
                      
                      {fileInfo.pdfCount > 0 && (
                        <Button
                          onClick={handlePdfAnalysis}
                          className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                        >
                          Advanced PDF Quiz
                        </Button>
                      )}
                      
                      {fileInfo.imageCount > 0 && (
                        <Button
                          onClick={handleImageAnalysis}
                          className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
                        >
                          Advanced Image Quiz
                        </Button>
                      )}
                    </div>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudyAssistant;
