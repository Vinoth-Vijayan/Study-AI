
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Download, Brain, FileText, Zap } from "lucide-react";
import { AnalysisResult } from "./StudyAssistant";
import { downloadPDF } from "@/utils/pdfUtils";
import { toast } from "sonner";

interface AnalysisResultsProps {
  result: AnalysisResult;
  onReset: () => void;
  selectedFiles: File[];
  onGenerateQuestions: () => void;
  onStartQuiz: () => void;
  isGeneratingQuestions: boolean;
}

const AnalysisResults = ({ 
  result, 
  onReset, 
  selectedFiles, 
  onGenerateQuestions, 
  onStartQuiz,
  isGeneratingQuestions 
}: AnalysisResultsProps) => {
  const handleDownloadAnalysis = async () => {
    try {
      await downloadPDF({
        title: `TNPSC Study Analysis - ${result.mainTopic || 'Study Material'}`,
        content: [{
          question: "Study Analysis",
          userAnswer: "Analysis Report",
          correctAnswer: result.summary,
          isCorrect: true,
          questionIndex: 0
        }],
        type: 'analysis'
      });
      toast.success("Analysis downloaded successfully!");
    } catch (error) {
      toast.error("Failed to download analysis. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <Card className="p-4 md:p-6 bg-white/90 backdrop-blur-sm shadow-xl border-0">
            <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
                  <Button
                    onClick={onReset}
                    variant="ghost"
                    className="text-gray-600 hover:text-gray-800 p-2"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Upload New Files
                  </Button>
                </div>
                
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Brain className="h-5 w-5 text-blue-600" />
                    <h2 className="text-xl md:text-2xl font-bold text-gray-800">
                      {result.mainTopic || "TNPSC Study Analysis"}
                    </h2>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
                      Source Files: {selectedFiles.length}
                    </Badge>
                    <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                      Analysis Complete
                    </Badge>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    onClick={onGenerateQuestions}
                    disabled={isGeneratingQuestions}
                    className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 flex-1"
                  >
                    {isGeneratingQuestions ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Generating Questions...
                      </>
                    ) : (
                      <>
                        <Zap className="h-4 w-4 mr-2" />
                        Start Interactive Quiz
                      </>
                    )}
                  </Button>
                  
                  <Button
                    onClick={handleDownloadAnalysis}
                    variant="outline"
                    className="border-2 hover:bg-gray-50"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Analysis
                  </Button>
                </div>
              </div>

              {selectedFiles.length > 0 && (
                <div className="w-full sm:w-48 flex-shrink-0">
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

          {/* Key Points */}
          {result.keyPoints && result.keyPoints.length > 0 && (
            <Card className="p-4 md:p-6 bg-white/90 backdrop-blur-sm shadow-lg border-0">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5 text-green-600" />
                Key Points
              </h3>
              <div className="grid gap-3">
                {result.keyPoints.map((point, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">
                      {index + 1}
                    </div>
                    <p className="text-gray-700 leading-relaxed">{point}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Summary */}
          {result.summary && (
            <Card className="p-4 md:p-6 bg-white/90 backdrop-blur-sm shadow-lg border-0">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Summary</h3>
              <p className="text-gray-700 leading-relaxed">{result.summary}</p>
            </Card>
          )}

          {/* TNPSC Relevance */}
          {result.tnpscRelevance && (
            <Card className="p-4 md:p-6 bg-gradient-to-r from-purple-50 to-blue-50 shadow-lg border-0">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">TNPSC Relevance</h3>
              <p className="text-gray-700 leading-relaxed">{result.tnpscRelevance}</p>
            </Card>
          )}

          {/* Study Points */}
          {result.studyPoints && result.studyPoints.length > 0 && (
            <Card className="p-4 md:p-6 bg-white/90 backdrop-blur-sm shadow-lg border-0">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Study Points</h3>
              <div className="space-y-4">
                {result.studyPoints.map((point, index) => (
                  <div key={index} className="border-l-4 border-blue-500 pl-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2">
                      <h4 className="font-semibold text-gray-800">{point.title}</h4>
                      <Badge 
                        className={
                          point.importance === 'high' 
                            ? 'bg-red-100 text-red-700 hover:bg-red-100' 
                            : point.importance === 'medium'
                            ? 'bg-orange-100 text-orange-700 hover:bg-orange-100'
                            : 'bg-green-100 text-green-700 hover:bg-green-100'
                        }
                      >
                        {point.importance} priority
                      </Badge>
                    </div>
                    <p className="text-gray-700 mb-2">{point.description}</p>
                    {point.tnpscRelevance && (
                      <p className="text-sm text-purple-700 bg-purple-50 p-2 rounded">
                        <strong>TNPSC Context:</strong> {point.tnpscRelevance}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* TNPSC Categories */}
          {result.tnpscCategories && result.tnpscCategories.length > 0 && (
            <Card className="p-4 md:p-6 bg-white/90 backdrop-blur-sm shadow-lg border-0">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">TNPSC Categories</h3>
              <div className="flex flex-wrap gap-2">
                {result.tnpscCategories.map((category, index) => (
                  <Badge key={index} variant="outline" className="text-sm">
                    {category}
                  </Badge>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalysisResults;
