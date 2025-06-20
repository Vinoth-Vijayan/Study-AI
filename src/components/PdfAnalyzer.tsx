
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, ArrowRight, FileText, Download, Brain, HelpCircle } from "lucide-react";
import { AnalysisResult } from "./StudyAssistant";
import { generatePageAnalysis } from "@/services/geminiService";
import { downloadPDF } from "@/utils/pdfUtils";
import { toast } from "sonner";

interface PdfAnalyzerProps {
  file: File;
  onReset: () => void;
  onStartQuiz: (pageRange: { start: number; end: number }, difficulty: string, questionsPerPage: number) => void;
  outputLanguage: "english" | "tamil";
}

interface PageAnalysis {
  page: number;
  keyPoints: string[];
  summary: string;
  importance: "high" | "medium" | "low";
  tnpscRelevance: string;
}

const PdfAnalyzer = ({ file, onReset, onStartQuiz, outputLanguage }: PdfAnalyzerProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(100); // This would be determined from PDF
  const [pageAnalyses, setPageAnalyses] = useState<Map<number, PageAnalysis>>(new Map());
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [quizStartPage, setQuizStartPage] = useState<number>(1);
  const [quizEndPage, setQuizEndPage] = useState<number>(10);
  const [quizDifficulty, setQuizDifficulty] = useState<string>("medium");
  const [questionsPerPage, setQuestionsPerPage] = useState<number>(10);

  const getCurrentPageAnalysis = async () => {
    if (pageAnalyses.has(currentPage)) {
      return pageAnalyses.get(currentPage);
    }

    setIsAnalyzing(true);
    try {
      const analysis = await generatePageAnalysis(file, currentPage, outputLanguage);
      const newAnalyses = new Map(pageAnalyses);
      newAnalyses.set(currentPage, analysis);
      setPageAnalyses(newAnalyses);
      toast.success(`Page ${currentPage} analysis completed!`);
      return analysis;
    } catch (error) {
      console.error("Page analysis failed:", error);
      toast.error("Failed to analyze page. Please try again.");
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleDownloadKeyPoints = async () => {
    try {
      const allAnalyses = Array.from(pageAnalyses.values());
      if (allAnalyses.length === 0) {
        toast.error("No analyses available to download. Please analyze some pages first.");
        return;
      }
      
      await downloadPDF({
        title: `TNPSC Key Points - ${file.name}`,
        content: allAnalyses,
        type: 'keypoints'
      });
      toast.success("Key points PDF downloaded successfully!");
    } catch (error) {
      console.error("Download failed:", error);
      toast.error("Failed to download PDF. Please try again.");
    }
  };

  const handleStartQuiz = () => {
    if (quizStartPage > quizEndPage) {
      toast.error("Start page cannot be greater than end page");
      return;
    }
    
    onStartQuiz(
      { start: quizStartPage, end: quizEndPage },
      quizDifficulty,
      questionsPerPage
    );
  };

  const currentAnalysis = pageAnalyses.get(currentPage);

  return (
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
                <FileText className="h-5 w-5 text-blue-600" />
                <h2 className="text-2xl font-bold text-gray-800">PDF Analysis - TNPSC</h2>
              </div>
              <div className="flex gap-2">
                <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
                  File: {file.name}
                </Badge>
                <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100">
                  Total Pages: {totalPages}
                </Badge>
                <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                  Analyzed Pages: {pageAnalyses.size}
                </Badge>
              </div>
            </div>

            <Button
              onClick={handleDownloadKeyPoints}
              variant="outline"
              className="mr-3"
              disabled={pageAnalyses.size === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Download All Key Points PDF
            </Button>
          </div>
        </div>
      </Card>

      {/* Page Navigation */}
      <Card className="p-6 bg-white/80 backdrop-blur-sm shadow-lg border-0">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Page Navigation</h3>
          <div className="flex items-center gap-3">
            <Button
              onClick={() => handlePageChange(currentPage - 1)}
              variant="outline"
              disabled={currentPage === 1}
              size="sm"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            
            <span className="text-sm font-medium text-gray-600">
              Page {currentPage} of {totalPages}
            </span>
            
            <Button
              onClick={() => handlePageChange(currentPage + 1)}
              variant="outline"
              disabled={currentPage === totalPages}
              size="sm"
            >
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <input
            type="number"
            min="1"
            max={totalPages}
            value={currentPage}
            onChange={(e) => handlePageChange(parseInt(e.target.value) || 1)}
            className="w-20 px-3 py-2 border border-gray-300 rounded-md text-sm"
            placeholder="Page"
          />
          
          <Button
            onClick={getCurrentPageAnalysis}
            disabled={isAnalyzing}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
          >
            {isAnalyzing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Analyzing Page {currentPage}...
              </>
            ) : (
              <>
                <Brain className="h-4 w-4 mr-2" />
                Analyze Page {currentPage}
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* Current Page Analysis */}
      {currentAnalysis && (
        <Card className="p-6 bg-white/80 backdrop-blur-sm shadow-lg border-0">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-800">Page {currentPage} - Key Points</h3>
            <Badge className={`${
              currentAnalysis.importance === 'high' ? 'bg-red-100 text-red-700' :
              currentAnalysis.importance === 'medium' ? 'bg-orange-100 text-orange-700' :
              'bg-blue-100 text-blue-700'
            }`}>
              {currentAnalysis.importance.toUpperCase()} Priority
            </Badge>
          </div>

          <div className="space-y-4">
            <div className="bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-400">
              <h4 className="font-semibold text-yellow-800 mb-2">TNPSC Relevance</h4>
              <p className="text-yellow-700">{currentAnalysis.tnpscRelevance}</p>
            </div>

            <div>
              <h4 className="font-semibold text-gray-800 mb-3">Key Study Points:</h4>
              <ul className="space-y-2">
                {currentAnalysis.keyPoints.map((point, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-blue-500 mt-1">•</span>
                    <span className="text-gray-700">{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-2">Summary</h4>
              <p className="text-blue-700">{currentAnalysis.summary}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Quiz Configuration */}
      <Card className="p-6 bg-gradient-to-r from-green-50 to-blue-50 shadow-lg border-0">
        <div className="flex items-center gap-2 mb-4">
          <HelpCircle className="h-5 w-5 text-green-600" />
          <h3 className="text-xl font-bold text-gray-800">Configure Quiz</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Start Page</label>
            <input
              type="number"
              min="1"
              max={totalPages}
              value={quizStartPage}
              onChange={(e) => setQuizStartPage(parseInt(e.target.value) || 1)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">End Page</label>
            <input
              type="number"
              min="1"
              max={totalPages}
              value={quizEndPage}
              onChange={(e) => setQuizEndPage(parseInt(e.target.value) || 1)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty</label>
            <Select value={quizDifficulty} onValueChange={setQuizDifficulty}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="easy">Easy</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="hard">Hard</SelectItem>
                <SelectItem value="very-hard">Very Hard</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Questions per Page</label>
            <Select value={questionsPerPage.toString()} onValueChange={(value) => setQuestionsPerPage(parseInt(value))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5 Questions</SelectItem>
                <SelectItem value="10">10 Questions</SelectItem>
                <SelectItem value="15">15 Questions</SelectItem>
                <SelectItem value="20">20 Questions</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex gap-4">
          <Button
            onClick={handleStartQuiz}
            className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700"
          >
            <Brain className="h-4 w-4 mr-2" />
            Start Quiz (Pages {quizStartPage}-{quizEndPage})
          </Button>
          
          <div className="text-sm text-gray-600 flex items-center">
            Total Questions: {(quizEndPage - quizStartPage + 1) * questionsPerPage}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default PdfAnalyzer;
