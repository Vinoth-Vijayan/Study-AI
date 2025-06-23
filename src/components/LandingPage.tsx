
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Brain, FileText, Users, MessageCircle, Target, Award, TrendingUp } from "lucide-react";
import AuthModal from "./AuthModal";

const LandingPage = () => {
  const [showAuthModal, setShowAuthModal] = useState(false);

  const handleAuthClick = () => {
    setShowAuthModal(true);
  };

  const handleAuthSuccess = () => {
    // User is now authenticated, App.tsx will handle the redirect
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-sm shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                TNPSC Study Assistant
              </h1>
            </div>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={handleAuthClick}
                className="hidden md:flex"
              >
                Login
              </Button>
              <Button 
                onClick={handleAuthClick}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
            Master TNPSC Exams with AI
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Transform your TNPSC preparation with our intelligent study assistant. 
            Analyze documents, generate questions, and get personalized guidance from Arivu - your AI study companion.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg"
              onClick={handleAuthClick}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-lg px-8 py-3"
            >
              Start Learning Now
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-white/50">
        <div className="container mx-auto">
          <h3 className="text-3xl font-bold text-center mb-12 text-gray-800">
            Everything You Need to Ace TNPSC
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="p-6 hover:shadow-lg transition-shadow bg-white/80 backdrop-blur-sm">
              <div className="p-3 bg-blue-100 rounded-lg w-fit mb-4">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <h4 className="text-xl font-semibold mb-3 text-gray-800">Smart Document Analysis</h4>
              <p className="text-gray-600">
                Upload images or PDFs and get instant analysis with key points, summaries, and TNPSC relevance scores.
              </p>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow bg-white/80 backdrop-blur-sm">
              <div className="p-3 bg-purple-100 rounded-lg w-fit mb-4">
                <Brain className="h-6 w-6 text-purple-600" />
              </div>
              <h4 className="text-xl font-semibold mb-3 text-gray-800">AI Question Generator</h4>
              <p className="text-gray-600">
                Generate practice questions based on your study materials with customizable difficulty levels.
              </p>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow bg-white/80 backdrop-blur-sm">
              <div className="p-3 bg-green-100 rounded-lg w-fit mb-4">
                <MessageCircle className="h-6 w-6 text-green-600" />
              </div>
              <h4 className="text-xl font-semibold mb-3 text-gray-800">Arivu - AI Chatbot</h4>
              <p className="text-gray-600">
                Get instant answers to your questions, clarify doubts, and receive personalized study guidance.
              </p>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow bg-white/80 backdrop-blur-sm">
              <div className="p-3 bg-indigo-100 rounded-lg w-fit mb-4">
                <Target className="h-6 w-6 text-indigo-600" />
              </div>
              <h4 className="text-xl font-semibold mb-3 text-gray-800">Interactive Quizzes</h4>
              <p className="text-gray-600">
                Test your knowledge with interactive quizzes and track your progress over time.
              </p>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow bg-white/80 backdrop-blur-sm">
              <div className="p-3 bg-yellow-100 rounded-lg w-fit mb-4">
                <Award className="h-6 w-6 text-yellow-600" />
              </div>
              <h4 className="text-xl font-semibold mb-3 text-gray-800">Study History</h4>
              <p className="text-gray-600">
                Keep track of your learning journey with detailed study history and performance analytics.
              </p>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow bg-white/80 backdrop-blur-sm">
              <div className="p-3 bg-red-100 rounded-lg w-fit mb-4">
                <TrendingUp className="h-6 w-6 text-red-600" />
              </div>
              <h4 className="text-xl font-semibold mb-3 text-gray-800">Progress Tracking</h4>
              <p className="text-gray-600">
                Monitor your improvement with detailed analytics and personalized recommendations.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <Card className="p-8 md:p-12 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            <h3 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Transform Your TNPSC Preparation?
            </h3>
            <p className="text-xl mb-8 opacity-90">
              Join thousands of successful candidates who've achieved their dreams with our AI-powered study assistant.
            </p>
            <Button 
              size="lg"
              onClick={handleAuthClick}
              className="bg-white text-blue-600 hover:bg-gray-100 text-lg px-8 py-3 font-semibold"
            >
              Start Your Journey Today
            </Button>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
              <BookOpen className="h-6 w-6 text-white" />
            </div>
            <h4 className="text-2xl font-bold">TNPSC Study Assistant</h4>
          </div>
          <p className="text-gray-400 mb-6">
            Empowering TNPSC aspirants with AI-driven learning solutions
          </p>
          <div className="flex justify-center gap-6 text-sm text-gray-400">
            <span>© 2024 TNPSC Study Assistant</span>
            <span>•</span>
            <span>Powered by AI</span>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      {showAuthModal && (
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onSuccess={handleAuthSuccess}
        />
      )}
    </div>
  );
};

export default LandingPage;
