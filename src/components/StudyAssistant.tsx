
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, FileText, Image, Brain, Zap, BookOpen, Target, Sparkles } from "lucide-react";
import { toast } from "sonner";
import ModernQuizMode from "./ModernQuizMode";
import QuickAnalysisMode from "./QuickAnalysisMode";

export interface Question {
  question: string;
  options?: string[];
  answer?: string;
  type: "mcq" | "short_answer" | "true_false";
  difficulty: string;
  tnpscGroup: string;
  explanation?: string;
}

export interface QuestionResult {
  questions: Question[];
  summary: string;
  keyPoints: string[];
  difficulty: string;
  pageRange?: { start: number; end: number };
}

const StudyAssistant = () => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [currentMode, setCurrentMode] = useState<'upload' | 'analysis' | 'quiz'>('upload');
  const [analysisResult, setAnalysisResult] = useState<QuestionResult | null>(null);
  const [difficulty, setDifficulty] = useState<string>("medium");
  const [outputLanguage, setOutputLanguage] = useState<"english" | "tamil">("english");

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const validFiles = files.filter(file => 
      file.type === 'application/pdf' || file.type.startsWith('image/')
    );
    
    if (validFiles.length !== files.length) {
      toast.error("Please upload only PDF or image files");
    }
    
    if (validFiles.length > 0) {
      setSelectedFiles(validFiles);
      toast.success(`${validFiles.length} file(s) uploaded successfully!`);
    }
  };

  const handleStartAnalysis = () => {
    if (selectedFiles.length === 0) {
      toast.error("Please upload files first");
      return;
    }
    setCurrentMode('analysis');
  };

  const handleStartQuiz = (result: QuestionResult) => {
    setAnalysisResult(result);
    setCurrentMode('quiz');
  };

  const handleReset = () => {
    setSelectedFiles([]);
    setCurrentMode('upload');
    setAnalysisResult(null);
  };

  const getFileTypeStats = () => {
    const pdfs = selectedFiles.filter(f => f.type === 'application/pdf').length;
    const images = selectedFiles.filter(f => f.type.startsWith('image/')).length;
    return { pdfs, images };
  };

  if (currentMode === 'quiz' && analysisResult) {
    return (
      <ModernQuizMode
        result={analysisResult}
        onReset={handleReset}
        onBackToAnalysis={() => setCurrentMode('analysis')}
        difficulty={difficulty}
        outputLanguage={outputLanguage}
      />
    );
  }

  if (currentMode === 'analysis') {
    return (
      <QuickAnalysisMode
        files={selectedFiles}
        difficulty={difficulty}
        outputLanguage={outputLanguage}
        onStartQuiz={handleStartQuiz}
        onReset={handleReset}
      />
    );
  }

  const { pdfs, images } = getFileTypeStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="container mx-auto px-4 py-6 md:py-12">
        <div className="max-w-4xl mx-auto space-y-6 md:space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="p-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full shadow-xl">
                <Brain className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  TNPSC Study Assistant
                </h1>
                <p className="text-gray-600 mt-2">Smart AI-powered study companion for competitive exams</p>
              </div>
            </div>
          </div>

          {/* Settings */}
          <Card className="p-6 bg-white/80 backdrop-blur-sm shadow-xl border-0">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Target className="h-5 w-5 text-blue-600" />
                Study Preferences
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty Level</label>
                  <Select value={difficulty} onValueChange={setDifficulty}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">🟢 Easy - Basic concepts</SelectItem>
                      <SelectItem value="medium">🟡 Medium - Standard level</SelectItem>
                      <SelectItem value="hard">🔴 Hard - Advanced topics</SelectItem>
                      <SelectItem value="very-hard">⚫ Expert - Challenging</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Output Language</label>
                  <Select value={outputLanguage} onValueChange={(value: "english" | "tamil") => setOutputLanguage(value)}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="english">🇬🇧 English</SelectItem>
                      <SelectItem value="tamil">🇮🇳 Tamil</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </Card>

          {/* File Upload */}
          <Card className="p-8 bg-white/80 backdrop-blur-sm shadow-xl border-0">
            <div className="space-y-6">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <Upload className="h-6 w-6 text-blue-600" />
                  <h3 className="text-xl font-semibold text-gray-800">Upload Study Materials</h3>
                </div>
                <p className="text-gray-600">Upload PDFs and images for AI-powered analysis and quiz generation</p>
              </div>

              <div className="border-2 border-dashed border-blue-300 rounded-2xl p-8 hover:border-blue-400 transition-colors">
                <input
                  type="file"
                  multiple
                  accept=".pdf,image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer block">
                  <div className="text-center space-y-4">
                    <div className="flex justify-center gap-4">
                      <div className="p-3 bg-blue-100 rounded-full">
                        <FileText className="h-6 w-6 text-blue-600" />
                      </div>
                      <div className="p-3 bg-green-100 rounded-full">
                        <Image className="h-6 w-6 text-green-600" />
                      </div>
                    </div>
                    <div>
                      <p className="text-lg font-medium text-gray-700">
                        Drop files here or click to browse
                      </p>
                      <p className="text-sm text-gray-500 mt-2">
                        Supports PDF documents and image files (JPG, PNG, etc.)
                      </p>
                    </div>
                  </div>
                </label>
              </div>

              {selectedFiles.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl border border-green-200">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="h-4 w-4 text-green-600" />
                        <span className="font-medium text-green-800">Files Ready for Analysis</span>
                      </div>
                      <div className="flex gap-4 text-sm text-green-700">
                        {pdfs > 0 && (
                          <div className="flex items-center gap-1">
                            <FileText className="h-4 w-4" />
                            <span>{pdfs} PDF{pdfs > 1 ? 's' : ''}</span>
                          </div>
                        )}
                        {images > 0 && (
                          <div className="flex items-center gap-1">
                            <Image className="h-4 w-4" />
                            <span>{images} Image{images > 1 ? 's' : ''}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {selectedFiles.map((file, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        {file.type === 'application/pdf' ? (
                          <FileText className="h-4 w-4 text-red-600" />
                        ) : (
                          <Image className="h-4 w-4 text-blue-600" />
                        )}
                        <span className="text-sm text-gray-700 truncate flex-1">{file.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {(file.size / 1024 / 1024).toFixed(1)}MB
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Action Buttons */}
          {selectedFiles.length > 0 && (
            <Card className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 shadow-xl border-0">
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  onClick={handleStartAnalysis}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                  size="lg"
                >
                  <Zap className="h-5 w-5 mr-3" />
                  Start Smart Analysis
                </Button>
                
                <Button
                  onClick={handleReset}
                  variant="outline"
                  className="px-8 py-6 text-lg font-semibold border-2 hover:bg-gray-50"
                  size="lg"
                >
                  <BookOpen className="h-5 w-5 mr-3" />
                  Clear & Restart
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudyAssistant;
