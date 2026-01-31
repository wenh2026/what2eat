"use client";

import { Home, Compass, PieChart, Camera, Heart } from "lucide-react";
import { cn } from "@/lib/utils";

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onCameraClick: () => void;
}

export function BottomNav({ activeTab, onTabChange, onCameraClick }: BottomNavProps) {
  return (
    <div className="absolute bottom-0 left-0 right-0 bg-white/90 dark:bg-card/95 backdrop-blur-md border-t border-orange-100 dark:border-border px-6 py-2 pb-6 z-50 flex justify-between items-center max-w-md mx-auto">
      
      {/* Home */}
      <button 
        onClick={() => onTabChange("home")}
        className={cn("flex flex-col items-center gap-1 transition-colors", activeTab === "home" ? "text-primary" : "text-muted-foreground")}
      >
        <Home className="w-6 h-6" />
        <span className="text-[10px] font-bold">首页</span>
      </button>

      {/* Explore */}
      <button 
        onClick={() => onTabChange("explore")}
        className={cn("flex flex-col items-center gap-1 transition-colors", activeTab === "explore" ? "text-primary" : "text-muted-foreground")}
      >
        <Compass className="w-6 h-6" />
        <span className="text-[10px] font-bold">发现</span>
      </button>

      {/* Center Camera Button */}
      <div className="relative -top-5">
        <button 
          onClick={onCameraClick}
          className="w-16 h-16 bg-primary rounded-full shadow-lg shadow-orange-200 dark:shadow-none flex items-center justify-center text-white hover:scale-105 active:scale-95 transition-all border-4 border-white dark:border-background"
        >
          <Camera className="w-8 h-8" />
        </button>
      </div>

      {/* Favorites */}
      <button 
        onClick={() => onTabChange("favorites")}
        className={cn("flex flex-col items-center gap-1 transition-colors", activeTab === "favorites" ? "text-primary" : "text-muted-foreground")}
      >
        <Heart className="w-6 h-6" />
        <span className="text-[10px] font-bold">收藏</span>
      </button>

      {/* Profile */}
      <button 
        onClick={() => onTabChange("profile")}
        className={cn("flex flex-col items-center gap-1 transition-colors", activeTab === "profile" ? "text-primary" : "text-muted-foreground")}
      >
        <PieChart className="w-6 h-6" />
        <span className="text-[10px] font-bold">我的</span>
      </button>
    </div>
  );
}
