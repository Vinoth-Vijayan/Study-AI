
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, ArrowRight, Image, Download, Brain, HelpCircle, Target, Zap } from "lucide-react";
import { analyzeImage } from "@/services/geminiService";
import { downloadPDF } from "@/utils/pdfUtils";
import { toast } from "sonner";

interface ImageAnalyzerProps {
  files: File[];
  onReset: () => void;
  onStartQuiz: (imageIndexes: number[], difficulty: string, questionsPerImage: number) => void;
  outputLanguage: "english" | "tamil";
}

interface ImageAnalysis {
  imageIndex: number;
  keyPoints: string[];
  summary: string;
  importance: "high" | "medium" | "low";
  tnpscRelevance: string;
  categories: string[];
}

const ImageAnalyzer = ({ files, onReset, onStartQuiz, outputLanguage }: ImageAnalyzerProps) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageAnalyses, setImageAnalyses] = useState<Map<number, ImageAnalysis>>(new Map());
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedImages, setSelectedImages] = useState<number[]>([]);
  const [quizDifficulty, setQuizDifficulty] = useState<string>("medium");
  const [questionsPerImage, setQuestionsPerImage] = useState<number>(10);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const getCurrentImageAnalysis = async () => {
    if (imageAnalyses.has(currentImageIndex)) {
      return imageAnalyses.get(currentImageIndex);
    }

    setIsAnalyzing(true);
    try {
      const analysis = await analyzeImage(files[currentImageIndex], outputLanguage);
      const imageAnalysis: ImageAnalysis = {
        imageIndex: currentImageIndex,
        keyPoints: analysis.studyPoints.map(point => point.title + ": " + point.description),
        summary: analysis.summary,
        importance: "high",
        tnpscRelevance: `Relevant for TNPSC preparation covering ${analysis.tnpscCategories?.join(', ')}`,
        categories: analysis.tnpscCategories || []
      };
      
      const newAnalyses = new Map(imageAnalyses);
      newAnalyses.set(currentImageIndex, imageAnalysis);
      setImageAnalyses(newAnalyses);
      toast.success(`Image ${currentImageIndex + 1} analysis completed!`);
      return imageAnalysis;
    } catch (error) {
      console.error("Image analysis failed:", error);
      toast.error("Failed to analyze image. Please try again.");
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  };

  const analyzeAllImages = async () => {
    setIsAnalyzing(true);
    try {
      for (let i = 0; i < files.length; i++) {
        if (!imageAnalyses.has(i)) {
          const analysis = await analyzeImage(files[i], outputLanguage);
          const imageAnalysis: ImageAnalysis = {
            imageIndex: i,
            keyPoints: analysis.studyPoints.map(point => point.title + ": " + point.description),
            summary: analysis.summary,
            importance: "high",
            tnpscRelevance: `Relevant for TNPSC preparation covering ${analysis.tnpscCategories?.join(', ')}`,
            categories: analysis.tnpscCategories || []
          };
          
          const newAnalyses = new Map(imageAnalyses);
          newAnalyses.set(i, imageAnalysis);
          setImageAnalyses(newAnalyses);
        }
      }
      toast.success("All images analyzed successfully!");
    } catch (error) {
      console.error("Batch analysis failed:", error);
      toast.error("Failed to analyze all images. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDownloadKeyPoints = async () => {
    try {
      const analysesToDownload = selectedImages.length > 0 
        ? selectedImages.map(i => imageAnalyses.get(i)).filter(Boolean)
        : Array.from(imageAnalyses.values());
      
      if (analysesToDownload.length === 0) {
        toast.error("No analyses available to download. Please analyze some images first.");
        return;
      }
      
      await downloadPDF({
        title: `TNPSC Key Points - Images Analysis`,
        content: analysesToDownload,
        type: 'keypoints'
      });
      toast.success("Key points PDF downloaded successfully!");
    } catch (error) {
      console.error("Download failed:", error);
      toast.error("Failed to download PDF. Please try again.");
    }
  };

  const handleStartQuiz = () => {
    const imagesToQuiz = selectedImages.length > 0 ? selectedImages : Array.from({length: files.length}, (_, i) => i);
    onStartQuiz(imagesToQuiz, quizDifficulty, questionsPerImage);
  };

  const handleImageChange = (newIndex: number) => {
    if (newIndex >= 0 && newIndex < files.length) {
      setCurrentImageIndex(newIndex);
    }
  };

  const toggleImageSelection = (index: number) => {
    setSelectedImages(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const currentAnalysis = imageAnalyses.get(currentImageIndex);
  const allCategories = Array.from(new Set(
    Array.from(imageAnalyses.values()).flatMap(analysis => analysis.categories)
  ));

  const filteredAnalyses = selectedCategory === "all" 
    ? Array.from(imageAnalyses.values())
    : Array.from(imageAnalyses.values()).filter(analysis => 
        analysis.categories.includes(selectedCategory)
      );

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <Card className="p-4 md:p-6 bg-white/80 backdrop-blur-sm shadow-lg border-0">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Button
              onClick={onReset}
              variant="ghost"
              className="text-gray-600 hover:text-gray-800 text-sm md:text-base"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Upload
            </Button>
            
            <Button
              onClick={handleDownloadKeyPoints}
              variant="outline"
              size="sm"
              disabled={imageAnalyses.size === 0}
              className="text-xs md:text-sm"
            >
              <Download className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
              Download Selected
            </Button>
          </div>
          
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Image className="h-5 w-5 text-blue-600" />
              <h2 className="text-xl md:text-2xl font-bold text-gray-800">Image Analysis</h2>
            </div>
            
            {/* File Info Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
              <div className="bg-blue-50 p-2 md:p-3 rounded-lg text-center">
                <Image className="h-4 w-4 md:h-5 md:w-5 text-blue-600 mx-auto mb-1" />
                <div className="text-xs md:text-sm font-medium text-blue-700">
                  {files.length} Images
                </div>
              </div>
              <div className="bg-green-50 p-2 md:p-3 rounded-lg text-center">
                <div className="text-lg md:text-xl font-bold text-green-600">{imageAnalyses.size}</div>
                <div className="text-xs md:text-sm text-green-700">Analyzed</div>
              </div>
              <div className="bg-purple-50 p-2 md:p-3 rounded-lg text-center">
                <div className="text-lg md:text-xl font-bold text-purple-600">{selectedImages.length}</div>
                <div className="text-xs md:text-sm text-purple-700">Selected</div>
              </div>
              <div className="bg-orange-50 p-2 md:p-3 rounded-lg text-center">
                <Target className="h-4 w-4 md:h-5 md:w-5 text-orange-600 mx-auto mb-1" />
                <div className="text-xs md:text-sm text-orange-700">TNPSC Ready</div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Category Filter */}
      {allCategories.length > 0 && (
        <Card className="p-4 md:p-6 bg-white/80 backdrop-blur-sm shadow-lg border-0">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-3">
            <h3 className="text-base md:text-lg font-semibold text-gray-800">Filter by Category:</h3>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full md:w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {allCategories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </Card>
      )}

      {/* Image Navigation */}
      <Card className="p-4 md:p-6 bg-white/80 backdrop-blur-sm shadow-lg border-0">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base md:text-lg font-semibold text-gray-800">Navigate Images</h3>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => handleImageChange(currentImageIndex - 1)}
                variant="outline"
                disabled={currentImageIndex === 0}
                size="sm"
              >
                <ArrowLeft className="h-3 w-3 md:h-4 md:w-4" />
              </Button>
              
              <span className="text-sm font-medium text-gray-600 px-2">
                {currentImageIndex + 1} / {files.length}
              </span>
              
              <Button
                onClick={() => handleImageChange(currentImageIndex + 1)}
                variant="outline"
                disabled={currentImageIndex === files.length - 1}
                size="sm"
              >
                <ArrowRight className="h-3 w-3 md:h-4 md:w-4" />
              </Button>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
            <div className="flex items-center gap-2 flex-1">
              <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Go to:</label>
              <input
                type="number"
                min="1"
                max={files.length}
                value={currentImageIndex + 1}
                onChange={(e) => handleImageChange((parseInt(e.target.value) || 1) - 1)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                placeholder="Image"
              />
            </div>
            
            <div className="flex gap-2">
              <Button
                onClick={getCurrentImageAnalysis}
                disabled={isAnalyzing}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
              >
                {isAnalyzing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Brain className="h-4 w-4 mr-2" />
                    Analyze Current
                  </>
                )}
              </Button>
              
              <Button
                onClick={analyzeAllImages}
                disabled={isAnalyzing}
                variant="outline"
              >
                Analyze All
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Current Image Analysis */}
      {currentAnalysis && (
        <Card className="p-4 md:p-6 bg-white/80 backdrop-blur-sm shadow-lg border-0">
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
              <h3 className="text-lg md:text-xl font-bold text-gray-800">
                Image {currentImageIndex + 1} - Key Points
              </h3>
              <div className="flex gap-2">
                <Badge className={`w-fit ${
                  currentAnalysis.importance === 'high' ? 'bg-red-100 text-red-700' :
                  currentAnalysis.importance === 'medium' ? 'bg-orange-100 text-orange-700' :
                  'bg-blue-100 text-blue-700'
                }`}>
                  {currentAnalysis.importance.toUpperCase()} Priority
                </Badge>
                <Button
                  onClick={() => toggleImageSelection(currentImageIndex)}
                  variant={selectedImages.includes(currentImageIndex) ? "default" : "outline"}
                  size="sm"
                >
                  {selectedImages.includes(currentImageIndex) ? "Selected" : "Select"}
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-yellow-50 p-3 md:p-4 rounded-lg border-l-4 border-yellow-400">
                <h4 className="font-semibold text-yellow-800 mb-2 flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  TNPSC Relevance
                </h4>
                <p className="text-yellow-700 text-sm md:text-base">{currentAnalysis.tnpscRelevance}</p>
              </div>

              <div>
                <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <Zap className="h-4 w-4 text-blue-500" />
                  Key Study Points:
                </h4>
                <div className="space-y-2">
                  {currentAnalysis.keyPoints.map((point, index) => (
                    <div key={index} className="flex items-start gap-2 p-2 bg-gray-50 rounded">
                      <span className="text-blue-500 mt-1 font-bold text-sm">{index + 1}.</span>
                      <span className="text-gray-700 text-sm md:text-base">{point}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-blue-50 p-3 md:p-4 rounded-lg">
                <h4 className="font-semibold text-blue-800 mb-2">Summary</h4>
                <p className="text-blue-700 text-sm md:text-base">{currentAnalysis.summary}</p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Quiz Configuration */}
      <Card className="p-4 md:p-6 bg-gradient-to-r from-green-50 to-blue-50 shadow-lg border-0">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-green-600" />
            <h3 className="text-lg md:text-xl font-bold text-gray-800">Configure Practice Quiz</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty</label>
              <Select value={quizDifficulty} onValueChange={setQuizDifficulty}>
                <SelectTrigger className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">🟢 Easy</SelectItem>
                  <SelectItem value="medium">🟡 Medium</SelectItem>
                  <SelectItem value="hard">🔴 Hard</SelectItem>
                  <SelectItem value="very-hard">⚫ Very Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Questions/Image</label>
              <Select value={questionsPerImage.toString()} onValueChange={(value) => setQuestionsPerImage(parseInt(value))}>
                <SelectTrigger className="text-sm">
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

          <div className="bg-white/50 p-3 md:p-4 rounded-lg">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center mb-4">
              <div>
                <div className="text-lg md:text-xl font-bold text-blue-600">
                  {selectedImages.length || files.length}
                </div>
                <div className="text-xs md:text-sm text-gray-600">Images</div>
              </div>
              <div>
                <div className="text-lg md:text-xl font-bold text-green-600">
                  {(selectedImages.length || files.length) * questionsPerImage}
                </div>
                <div className="text-xs md:text-sm text-gray-600">Total Questions</div>
              </div>
              <div>
                <div className="text-lg md:text-xl font-bold text-purple-600">{quizDifficulty.toUpperCase()}</div>
                <div className="text-xs md:text-sm text-gray-600">Difficulty</div>
              </div>
              <div>
                <div className="text-lg md:text-xl font-bold text-orange-600">TNPSC</div>
                <div className="text-xs md:text-sm text-gray-600">Focused</div>
              </div>
            </div>
            
            <Button
              onClick={handleStartQuiz}
              className="w-full bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 py-3 md:py-4"
            >
              <Brain className="h-4 w-4 mr-2" />
              Start Practice Quiz
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ImageAnalyzer;
