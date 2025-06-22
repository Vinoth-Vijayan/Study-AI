
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import NavigationHeader from "./components/NavigationHeader";
import StudyAssistant from "./components/StudyAssistant";
import StudyHistory from "./components/StudyHistory";
import UserProfile from "./components/UserProfile";

const queryClient = new QueryClient();

const App = () => {
  const [currentView, setCurrentView] = useState("study");

  const renderCurrentView = () => {
    switch (currentView) {
      case "history":
        return <StudyHistory />;
      case "profile":
        return <UserProfile />;
      default:
        return <StudyAssistant />;
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
          <NavigationHeader 
            currentView={currentView} 
            onViewChange={setCurrentView}
          />
          {renderCurrentView()}
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
