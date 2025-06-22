
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, BookOpen, CheckCircle, AlertCircle, Circle, HelpCircle } from "lucide-react";
import { AnalysisResult } from "./StudyAssistant";

interface AnalysisResultsProps {
  result: AnalysisResult;
  onReset: () => void;
  selectedFiles: File[];
  onGenerateQuestions: () => void;
  isGeneratingQuestions: boolean;
}

const AnalysisResults = ({ 
  result, 
  onReset, 
  selectedFiles, 
  onGenerateQuestions, 
  isGeneratingQuestions 
}: AnalysisResultsProps) => {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header with files preview */}
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
                  <div className="flex gap-2 mb-2">
                    <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                      Language: {result.language || 'english'}
                    </Badge>
                    <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
                      Source Files: {selectedFiles.length}
                    </Badge>
                    {result.tnpscCategories && result.tnpscCategories.length > 0 && (
                      <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100">
                        TNPSC Relevant
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg mb-4">
                  <h3 className="font-semibold text-gray-800 mb-2">Main Topic</h3>
                  <p className="text-lg text-gray-700">{result.mainTopic || "Study Material"}</p>
                  {result.tnpscCategories && result.tnpscCategories.length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm font-medium text-gray-600 mb-1">TNPSC Categories:</p>
                      <div className="flex flex-wrap gap-1">
                        {result.tnpscCategories.map((category, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {category}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <Button
                  onClick={onGenerateQuestions}
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
                      Generate TNPSC Questions
                    </>
                  )}
                </Button>
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

          {/* Key Points Section */}
          {result.keyPoints && result.keyPoints.length > 0 && (
            <Card className="p-6 bg-white/80 backdrop-blur-sm shadow-lg border-0">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Key Points</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {result.keyPoints.map((point, index) => (
                  <div
                    key={index}
                    className="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400"
                  >
                    <p className="text-gray-700 text-sm">{point}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Study Points */}
          {result.studyPoints && result.studyPoints.length > 0 && (
            <Card className="p-6 bg-white/80 backdrop-blur-sm shadow-lg border-0">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Detailed Study Points for TNPSC</h3>
              <div className="space-y-4">
                {result.studyPoints.map((point, index) => (
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
          )}

          {/* Summary */}
          <Card className="p-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg border-0">
            <h3 className="text-xl font-bold mb-3">Summary</h3>
            <p className="text-blue-50 leading-relaxed">{result.summary}</p>
            {result.tnpscRelevance && (
              <div className="mt-4 p-4 bg-white/10 rounded-lg">
                <h4 className="font-semibold mb-2">TNPSC Exam Relevance</h4>
                <p className="text-blue-100">{result.tnpscRelevance}</p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AnalysisResults;
