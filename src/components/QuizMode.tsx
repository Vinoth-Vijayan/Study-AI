
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CheckCircle, XCircle, RotateCcw } from "lucide-react";
import { QuestionResult } from "./StudyAssistant";

interface QuizModeProps {
  result: QuestionResult;
  onReset: () => void;
  onBackToResults: () => void;
  selectedFiles: File[];
}

const QuizMode = ({ result, onReset, onBackToResults, selectedFiles }: QuizModeProps) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);

  const mcqQuestions = result.questions.filter(q => q.type === "mcq" && q.options && q.options.length > 0);

  const handleAnswerSelect = (answer: string) => {
    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestion] = answer;
    setSelectedAnswers(newAnswers);
  };

  const handleNext = () => {
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

  if (showResults) {
    return (
      <Card className="p-6 max-w-4xl mx-auto">
        <div className="text-center space-y-6">
          <div className="flex items-center justify-center gap-2 mb-4">
            <CheckCircle className="h-8 w-8 text-green-500" />
            <h2 className="text-2xl font-bold">Quiz Completed!</h2>
          </div>
          
          <div className="text-6xl font-bold text-blue-600">
            {score}/{mcqQuestions.length}
          </div>
          
          <div className="text-xl text-gray-600">
            Your Score: {Math.round((score / mcqQuestions.length) * 100)}%
          </div>
          
          <div className="flex gap-4 justify-center">
            <Button onClick={handleRestart} className="bg-blue-600 hover:bg-blue-700">
              <RotateCcw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
            <Button onClick={onBackToResults} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Questions
            </Button>
            <Button onClick={onReset} variant="outline">
              Upload New Files
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  if (mcqQuestions.length === 0) {
    return (
      <Card className="p-6 max-w-4xl mx-auto text-center">
        <p className="text-gray-600 mb-4">No multiple-choice questions available for quiz mode.</p>
        <Button onClick={onBackToResults}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Questions
        </Button>
      </Card>
    );
  }

  const question = mcqQuestions[currentQuestion];

  return (
    <Card className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <Button onClick={onBackToResults} variant="ghost">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Questions
          </Button>
          <Badge variant="outline">
            Question {currentQuestion + 1} of {mcqQuestions.length}
          </Badge>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentQuestion + 1) / mcqQuestions.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <h3 className="text-xl font-semibold mb-4">{question.question}</h3>
          <div className="flex gap-2 mb-4">
            <Badge className="bg-orange-100 text-orange-700">
              {question.difficulty}
            </Badge>
            <Badge className="bg-purple-100 text-purple-700">
              {question.tnpscGroup}
            </Badge>
          </div>
        </div>

        <div className="space-y-3">
          {question.options?.map((option, index) => (
            <button
              key={index}
              onClick={() => handleAnswerSelect(option)}
              className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                selectedAnswers[currentQuestion] === option
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <span className="font-medium mr-3">
                {String.fromCharCode(65 + index)}.
              </span>
              {option}
            </button>
          ))}
        </div>

        <div className="flex justify-end">
          <Button 
            onClick={handleNext}
            disabled={!selectedAnswers[currentQuestion]}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {currentQuestion < mcqQuestions.length - 1 ? 'Next Question' : 'Finish Quiz'}
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default QuizMode;
