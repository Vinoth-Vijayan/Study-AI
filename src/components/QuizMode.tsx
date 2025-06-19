
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ArrowLeft, CheckCircle, AlertTriangle, Brain, HelpCircle, Trophy, Target } from "lucide-react";
import { QuestionResult, Question } from "./StudyAssistant";
import { toast } from "sonner";

interface QuizModeProps {
  result: QuestionResult;
  onReset: () => void;
  onBackToResults: () => void;
  selectedImage: File | null;
}

interface UserAnswer {
  questionIndex: number;
  selectedOption: string;
}

interface QuizResult {
  score: number;
  totalQuestions: number;
  percentage: number;
  answers: {
    question: Question;
    userAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
    questionIndex: number;
  }[];
}

const QuizMode = ({ result, onReset, onBackToResults, selectedImage }: QuizModeProps) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [selectedOption, setSelectedOption] = useState<string>("");
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);

  // Filter only MCQ questions for the quiz
  const mcqQuestions = result.questions.filter(q => q.type === "mcq" && q.options && q.options.length > 0);
  const currentQuestion = mcqQuestions[currentQuestionIndex];

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

  const handleAnswerSelect = (value: string) => {
    setSelectedOption(value);
  };

  const handleNextQuestion = () => {
    if (!selectedOption) {
      toast.error("Please select an answer before proceeding");
      return;
    }

    // Save the answer
    const newAnswer: UserAnswer = {
      questionIndex: currentQuestionIndex,
      selectedOption: selectedOption
    };

    const updatedAnswers = [...userAnswers.filter(a => a.questionIndex !== currentQuestionIndex), newAnswer];
    setUserAnswers(updatedAnswers);

    if (currentQuestionIndex < mcqQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      // Check if we have a saved answer for the next question
      const savedAnswer = updatedAnswers.find(a => a.questionIndex === currentQuestionIndex + 1);
      setSelectedOption(savedAnswer?.selectedOption || "");
    } else {
      // Quiz completed, calculate results
      calculateResults(updatedAnswers);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      // Load the saved answer for the previous question
      const savedAnswer = userAnswers.find(a => a.questionIndex === currentQuestionIndex - 1);
      setSelectedOption(savedAnswer?.selectedOption || "");
    }
  };

  const calculateResults = (answers: UserAnswer[]) => {
    const results = answers.map(answer => {
      const question = mcqQuestions[answer.questionIndex];
      const isCorrect = answer.selectedOption === question.answer;
      
      return {
        question,
        userAnswer: answer.selectedOption,
        correctAnswer: question.answer || "",
        isCorrect,
        questionIndex: answer.questionIndex
      };
    });

    const score = results.filter(r => r.isCorrect).length;
    const percentage = Math.round((score / mcqQuestions.length) * 100);

    setQuizResult({
      score,
      totalQuestions: mcqQuestions.length,
      percentage,
      answers: results
    });

    setQuizCompleted(true);
    toast.success("Quiz completed! Check your results below.");
  };

  const getPerformanceMessage = (percentage: number) => {
    if (percentage >= 80) return "Excellent! You have a strong understanding of the topic.";
    if (percentage >= 60) return "Good work! Review the incorrect answers to improve further.";
    if (percentage >= 40) return "Fair performance. Focus on studying the key concepts more thoroughly.";
    return "Needs improvement. Consider reviewing the study material again.";
  };

  const getImprovementSuggestions = (incorrectAnswers: any[]) => {
    const suggestions = [];
    
    if (incorrectAnswers.length > 0) {
      const hardQuestions = incorrectAnswers.filter(a => a.question.difficulty === "hard");
      const mediumQuestions = incorrectAnswers.filter(a => a.question.difficulty === "medium");
      
      if (hardQuestions.length > 0) {
        suggestions.push("Focus more on advanced concepts and analytical thinking for difficult questions.");
      }
      
      if (mediumQuestions.length > 0) {
        suggestions.push("Strengthen your understanding of core concepts for medium-level questions.");
      }

      const groupCounts = incorrectAnswers.reduce((acc, a) => {
        acc[a.question.tnpscGroup] = (acc[a.question.tnpscGroup] || 0) + 1;
        return acc;
      }, {});

      const mostMissedGroup = Object.keys(groupCounts).reduce((a, b) => 
        groupCounts[a] > groupCounts[b] ? a : b
      );

      suggestions.push(`Pay special attention to ${mostMissedGroup} related topics.`);
    }

    return suggestions;
  };

  if (mcqQuestions.length === 0) {
    return (
      <Card className="p-8 text-center">
        <HelpCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-800 mb-2">No Quiz Questions Available</h3>
        <p className="text-gray-600 mb-4">
          There are no multiple-choice questions available for the quiz mode.
        </p>
        <Button onClick={onBackToResults} variant="outline">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Results
        </Button>
      </Card>
    );
  }

  if (quizCompleted && quizResult) {
    const incorrectAnswers = quizResult.answers.filter(a => !a.isCorrect);
    const suggestions = getImprovementSuggestions(incorrectAnswers);

    return (
      <div className="space-y-6">
        {/* Results Summary */}
        <Card className="p-6 bg-white/80 backdrop-blur-sm shadow-lg border-0">
          <div className="text-center mb-6">
            <Trophy className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Quiz Results</h2>
            <div className="text-6xl font-bold mb-2">
              <span className={quizResult.percentage >= 60 ? "text-green-600" : "text-red-600"}>
                {quizResult.percentage}%
              </span>
            </div>
            <p className="text-lg text-gray-600">
              {quizResult.score} out of {quizResult.totalQuestions} questions correct
            </p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <p className="text-center text-gray-700 font-medium">
              {getPerformanceMessage(quizResult.percentage)}
            </p>
          </div>

          <div className="flex gap-4 justify-center">
            <Button onClick={onBackToResults} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Questions
            </Button>
            <Button onClick={onReset} variant="outline">
              Upload New Image
            </Button>
          </div>
        </Card>

        {/* Improvement Suggestions */}
        {suggestions.length > 0 && (
          <Card className="p-6 bg-blue-50/80 backdrop-blur-sm shadow-lg border-0">
            <div className="flex items-center gap-2 mb-4">
              <Target className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-blue-800">Areas for Improvement</h3>
            </div>
            <ul className="space-y-2">
              {suggestions.map((suggestion, index) => (
                <li key={index} className="flex items-start gap-2 text-blue-700">
                  <span className="text-blue-500 mt-1">•</span>
                  {suggestion}
                </li>
              ))}
            </ul>
          </Card>
        )}

        {/* Answer Review */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-gray-800">Answer Review</h3>
          {quizResult.answers.map((answer, index) => (
            <Card key={index} className={`p-4 ${answer.isCorrect ? 'bg-green-50/80' : 'bg-red-50/80'} backdrop-blur-sm shadow-lg border-0`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  {answer.isCorrect ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                  )}
                  <span className="font-medium text-gray-800">Question {index + 1}</span>
                </div>
                <div className="flex gap-2">
                  {getDifficultyBadge(answer.question.difficulty)}
                  <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100">
                    {answer.question.tnpscGroup}
                  </Badge>
                </div>
              </div>
              
              <p className="text-gray-700 mb-3">{answer.question.question}</p>
              
              <div className="space-y-2">
                <div className={`p-2 rounded ${answer.isCorrect ? 'bg-green-100' : 'bg-red-100'}`}>
                  <span className="font-medium text-gray-700">Your Answer: </span>
                  <span className={answer.isCorrect ? 'text-green-700' : 'text-red-700'}>
                    {answer.userAnswer}
                  </span>
                </div>
                
                {!answer.isCorrect && (
                  <div className="p-2 bg-green-100 rounded">
                    <span className="font-medium text-gray-700">Correct Answer: </span>
                    <span className="text-green-700">{answer.correctAnswer}</span>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quiz Header */}
      <Card className="p-6 bg-white/80 backdrop-blur-sm shadow-lg border-0">
        <div className="flex items-start gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <Button
                onClick={onBackToResults}
                variant="ghost"
                className="text-gray-600 hover:text-gray-800"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Results
              </Button>
            </div>
            
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Brain className="h-5 w-5 text-blue-600" />
                <h2 className="text-2xl font-bold text-gray-800">TNPSC Quiz Mode</h2>
              </div>
              <div className="flex gap-2">
                <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
                  Question {currentQuestionIndex + 1} of {mcqQuestions.length}
                </Badge>
                <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100">
                  Progress: {Math.round(((currentQuestionIndex + 1) / mcqQuestions.length) * 100)}%
                </Badge>
              </div>
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

      {/* Current Question */}
      <Card className="p-6 bg-white/80 backdrop-blur-sm shadow-lg border-0">
        <div className="mb-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              {getDifficultyIcon(currentQuestion.difficulty)}
              <h3 className="text-lg font-semibold text-gray-800">
                Question {currentQuestionIndex + 1}
              </h3>
            </div>
            <div className="flex gap-2">
              {getDifficultyBadge(currentQuestion.difficulty)}
              <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100">
                {currentQuestion.tnpscGroup}
              </Badge>
            </div>
          </div>
          
          <p className="text-gray-700 leading-relaxed mb-6">{currentQuestion.question}</p>
          
          <RadioGroup value={selectedOption} onValueChange={handleAnswerSelect}>
            <div className="space-y-3">
              {currentQuestion.options?.map((option, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <RadioGroupItem value={option} id={`option-${index}`} />
                  <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                    <span className="font-medium text-gray-600 mr-2">
                      {String.fromCharCode(65 + index)}.
                    </span>
                    <span className="text-gray-700">{option}</span>
                  </Label>
                </div>
              ))}
            </div>
          </RadioGroup>
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center mt-6">
          <Button
            onClick={handlePreviousQuestion}
            variant="outline"
            disabled={currentQuestionIndex === 0}
          >
            Previous
          </Button>
          
          <div className="flex gap-2">
            {mcqQuestions.map((_, index) => (
              <div
                key={index}
                className={`w-3 h-3 rounded-full ${
                  index === currentQuestionIndex
                    ? 'bg-blue-600'
                    : userAnswers.some(a => a.questionIndex === index)
                    ? 'bg-green-500'
                    : 'bg-gray-300'
                }`}
              />
            ))}
          </div>

          <Button
            onClick={handleNextQuestion}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
          >
            {currentQuestionIndex === mcqQuestions.length - 1 ? 'Submit Quiz' : 'Next'}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default QuizMode;
