
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, HelpCircle, CheckCircle, AlertTriangle, Brain } from "lucide-react";
import { QuestionResult } from "./StudyAssistant";

interface QuestionResultsProps {
  result: QuestionResult;
  onReset: () => void;
  selectedImage: File | null;
}

const QuestionResults = ({ result, onReset, selectedImage }: QuestionResultsProps) => {
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

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "mcq":
        return <Badge variant="secondary">Multiple Choice</Badge>;
      case "short":
        return <Badge variant="secondary">Short Answer</Badge>;
      case "essay":
        return <Badge variant="secondary">Essay</Badge>;
      default:
        return <Badge variant="secondary">{type}</Badge>;
    }
  };

  const getDifficultyIcon = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "medium":
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case "hard":
        return <Brain className="h-4 w-4 text-red-500" />;
      default:
        return <HelpCircle className="h-4 w-4 text-gray-500" />;
    }
  };

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
                Upload New Image
              </Button>
            </div>
            
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <HelpCircle className="h-5 w-5 text-green-600" />
                <h2 className="text-2xl font-bold text-gray-800">TNPSC Practice Questions</h2>
              </div>
              <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                Total Questions: {result.totalQuestions}
              </Badge>
            </div>
          </div>

          {selectedImage && (
            <div className="w-48 flex-shrink-0">
              <img
                src={URL.createObjectURL(selectedImage)}
                alt="Source material"
                className="w-full h-32 object-cover rounded-lg shadow-md"
              />
            </div>
          )}
        </div>
      </Card>

      {/* Questions */}
      <div className="space-y-4">
        {result.questions.map((question, index) => (
          <Card key={index} className="p-6 bg-white/80 backdrop-blur-sm shadow-lg border-0">
            <div className="mb-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  {getDifficultyIcon(question.difficulty)}
                  <h3 className="text-lg font-semibold text-gray-800">
                    Question {index + 1}
                  </h3>
                </div>
                <div className="flex gap-2">
                  {getDifficultyBadge(question.difficulty)}
                  {getTypeBadge(question.type)}
                  <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100">
                    {question.tnpscGroup}
                  </Badge>
                </div>
              </div>
              
              <p className="text-gray-700 leading-relaxed mb-4">{question.question}</p>
              
              {question.options && question.options.length > 0 && (
                <div className="space-y-2 mb-4">
                  <p className="font-medium text-gray-700">Options:</p>
                  {question.options.map((option, optIndex) => (
                    <div 
                      key={optIndex} 
                      className="p-2 bg-gray-50 rounded border-l-2 border-gray-300"
                    >
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
          </Card>
        ))}
      </div>
    </div>
  );
};

export default QuestionResults;
