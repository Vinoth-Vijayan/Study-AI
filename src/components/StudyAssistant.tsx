
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, BookOpen, Brain, FileImage, Languages } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import ImageUpload from "./ImageUpload";
import AnalysisResults from "./AnalysisResults";
import { analyzeImage } from "@/services/geminiService";
import { toast } from "sonner";

export interface StudyPoint {
  title: string;
  description: string;
  importance: "high" | "medium" | "low";
}

export interface AnalysisResult {
  mainTopic: string;
  studyPoints: StudyPoint[];
  summary: string;
  language: string;
}

const StudyAssistant = () => {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [outputLanguage, setOutputLanguage] = useState<"english" | "tamil">("english");

  const handleImageSelect = (file: File) => {
    setSelectedImage(file);
    setAnalysisResult(null);
  };

  const handleAnalyze = async () => {
    if (!selectedImage) {
      toast.error("Please select an image first");
      return;
    }

    setIsAnalyzing(true);
    try {
      const result = await analyzeImage(selectedImage, outputLanguage);
      setAnalysisResult(result);
      toast.success("Analysis completed successfully!");
    } catch (error) {
      console.error("Analysis failed:", error);
      toast.error("Failed to analyze image. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setSelectedImage(null);
    setAnalysisResult(null);
  };

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
          Upload a scanned page in Tamil or English, and I'll extract the key study points for you
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
                  Upload Your Study Material
                </h2>
                <p className="text-gray-600">
                  Select a scanned page or image of your study material
                </p>
              </div>

              <ImageUpload 
                onImageSelect={handleImageSelect}
                selectedImage={selectedImage}
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
                  Choose the language for your study points and summary
                </p>
              </div>

              {selectedImage && (
                <div className="flex gap-4 justify-center">
                  <Button
                    onClick={handleAnalyze}
                    disabled={isAnalyzing}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-3 rounded-lg shadow-lg transition-all duration-200 transform hover:scale-105"
                  >
                    {isAnalyzing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <BookOpen className="h-4 w-4 mr-2" />
                        Analyze for Study Points
                      </>
                    )}
                  </Button>
                  
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
          <AnalysisResults 
            result={analysisResult}
            onReset={handleReset}
            selectedImage={selectedImage}
          />
        )}
      </div>
    </div>
  );
};

export default StudyAssistant;
