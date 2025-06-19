
import { useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ImageUploadProps {
  onImageSelect: (file: File) => void;
  selectedImage: File | null;
}

const ImageUpload = ({ onImageSelect, selectedImage }: ImageUploadProps) => {
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));
    
    if (imageFile) {
      onImageSelect(imageFile);
    }
  }, [onImageSelect]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      onImageSelect(file);
    }
  };

  const removeImage = () => {
    onImageSelect(null as any);
  };

  return (
    <div className="space-y-4">
      {!selectedImage ? (
        <Card
          className="border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors cursor-pointer bg-gray-50/50"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          <label className="block p-12 text-center cursor-pointer">
            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <div className="text-lg font-medium text-gray-700 mb-2">
              Drop your image here or click to browse
            </div>
            <div className="text-sm text-gray-500">
              Supports JPG, PNG, GIF up to 10MB
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </label>
        </Card>
      ) : (
        <Card className="p-4 bg-white shadow-md">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-gray-800">Selected Image</h3>
            <Button
              onClick={removeImage}
              variant="ghost"
              size="sm"
              className="text-red-500 hover:text-red-600 hover:bg-red-50"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="relative">
            <img
              src={URL.createObjectURL(selectedImage)}
              alt="Selected study material"
              className="w-full max-h-96 object-contain rounded-lg shadow-sm"
            />
          </div>
          
          <div className="mt-3 text-sm text-gray-600">
            <span className="font-medium">{selectedImage.name}</span>
            <span className="ml-2">
              ({(selectedImage.size / 1024 / 1024).toFixed(2)} MB)
            </span>
          </div>
        </Card>
      )}
    </div>
  );
};

export default ImageUpload;
