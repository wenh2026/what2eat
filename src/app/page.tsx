"use client";

import { useState } from "react";
import { AuthDialog } from "@/components/auth-dialog";
import { BottomNav } from "@/components/bottom-nav";
import { HomeView } from "@/components/views/home-view";
import { ProfileView } from "@/components/views/profile-view";
import { ExploreView } from "@/components/views/explore-view";
import { FavoritesView } from "@/components/views/favorites-view";
import { ThemeToggle } from "@/components/theme-toggle";
import { Utensils, Download } from "lucide-react";

export default function Home() {
  const [activeTab, setActiveTab] = useState("home");
  const [showCamera, setShowCamera] = useState(false); // Can be used to trigger a camera modal

  const handleCameraClick = () => {
      // For now, just switch to home where the camera logic lives, or trigger a global camera modal
      // In this version, we'll keep the camera logic inside HomeView for simplicity
      setActiveTab("home");
      // Ideally, trigger the file input click here
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput) {
          fileInput.click();
      }
  };

  return (
    <div className="flex flex-col w-full min-h-screen bg-background relative max-w-md mx-auto shadow-sm overflow-hidden">
      
      {/* Top Bar (Logo + Auth) */}
      <div className="absolute top-0 left-0 right-0 p-4 z-40 flex justify-between items-center pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white shadow-sm">
                <Utensils className="w-5 h-5" />
            </div>
            <span className="font-black text-lg tracking-tight text-foreground/80">吃啥AI</span>
        </div>
        <div className="pointer-events-auto flex items-center gap-2">
            <a
              href="/what2eat.apk"
              download
              className="p-2 rounded-full bg-secondary/20 hover:bg-secondary/40 transition-colors text-foreground"
              aria-label="Download App"
            >
              <Download className="w-5 h-5" />
            </a>
            <ThemeToggle />
            <AuthDialog />
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 pt-16 pb-24">
        {activeTab === "home" && <HomeView onNavigateToExplore={() => setActiveTab("explore")} />}
        {activeTab === "explore" && <ExploreView />}
        {activeTab === "favorites" && <FavoritesView />}
        {activeTab === "profile" && <ProfileView />}
      </main>


      {/* Bottom Navigation */}
      <BottomNav 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
        onCameraClick={handleCameraClick}
      />
    </div>
  );
}
