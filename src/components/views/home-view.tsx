"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Utensils, X, ChefHat, CloudSun } from "lucide-react";
import { cn } from "@/lib/utils";

const MOODS = [
  { id: "healthy", label: "💪 减肥/轻食", color: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800" },
  { id: "spicy", label: "🌶️ 想吃辣", color: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800" },
  { id: "quick", label: "⚡ 搞快点", color: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800" },
  { id: "comfort", label: "🍜 暖心胃", color: "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800" },
  { id: "rich", label: "🍖 大餐一顿", color: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800" },
  { id: "drink", label: "🍺 下酒菜", color: "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800" },
];

interface HomeViewProps {
    onNavigateToExplore: () => void;
}

export function HomeView({ onNavigateToExplore }: HomeViewProps) {
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<{ name: string; desc: string } | null>(null);

  const handleDecide = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mood: selectedMood }),
      });
      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error("Failed to get recommendation", error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-6 relative px-4 pb-24 overflow-y-auto">
      
      {/* Seasonal Widget (Mini) */}
      <motion.button
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={onNavigateToExplore}
        className="w-full max-w-sm bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-100 dark:border-green-800 rounded-xl p-3 flex items-center justify-between shadow-sm"
      >
        <div className="flex items-center gap-3">
            <div className="p-2 bg-white dark:bg-green-900/40 rounded-lg shadow-sm">
                <CloudSun className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div className="text-left">
                <p className="text-xs font-bold text-green-800 dark:text-green-300 uppercase tracking-wider">今日节气 · 立春</p>
                <p className="text-sm text-green-700 dark:text-green-400">宜吃春笋，忌酸辣</p>
            </div>
        </div>
        <div className="text-xs font-bold text-green-600 dark:text-green-400 bg-white/50 dark:bg-black/30 px-2 py-1 rounded-md">去发现 &rarr;</div>
      </motion.button>

      {/* Header */}
      <header className="text-center space-y-2 mt-4">
        <div className="inline-flex items-center gap-2 bg-white/50 dark:bg-card/50 backdrop-blur-sm px-4 py-1 rounded-full border border-orange-200 dark:border-border">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-orange-800 dark:text-orange-200">今天吃啥 AI</span>
        </div>
        <h1 className="text-4xl font-black text-foreground tracking-tight">
          不知道<br /><span className="text-primary">吃什么？</span>
        </h1>
      </header>

      {/* Main Interaction Area */}
      <div className="relative w-full aspect-square max-w-[280px] flex items-center justify-center my-4">
        {/* Pulsing Background */}
        <motion.div 
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ repeat: Infinity, duration: 3 }}
          className="absolute inset-0 bg-primary/10 rounded-full blur-3xl"
        />
        
        {/* The Pot/Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleDecide}
          disabled={isGenerating}
          className="relative w-48 h-48 bg-gradient-to-br from-primary to-orange-600 rounded-full shadow-xl flex flex-col items-center justify-center text-white z-10 border-4 border-orange-200 dark:border-secondary group overflow-hidden"
        >
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/food.png')] opacity-10" />
          {isGenerating ? (
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            >
              <ChefHat className="w-16 h-16" />
            </motion.div>
          ) : (
            <>
              <Utensils className="w-12 h-12 mb-2 group-hover:rotate-12 transition-transform" />
              <span className="text-xl font-bold">帮我选</span>
            </>
          )}
        </motion.button>
      </div>

      {/* Mood Selectors */}
      <div className="flex flex-wrap gap-2 justify-center w-full max-w-sm">
        {MOODS.map((mood) => (
          <button
            key={mood.id}
            onClick={() => setSelectedMood(mood.id === selectedMood ? null : mood.id)}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-bold transition-all border",
              selectedMood === mood.id 
                ? "bg-foreground text-background border-foreground scale-105 shadow-md"
                : `${mood.color} hover:opacity-80`
            )}
          >
            {mood.label}
          </button>
        ))}
      </div>

      {/* Result Modal */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm"
          >
            <div className="bg-card w-full max-w-sm rounded-3xl p-6 shadow-2xl relative overflow-hidden border border-border">
              <button 
                onClick={() => setResult(null)}
                className="absolute top-4 right-4 p-2 bg-secondary/50 rounded-full hover:bg-secondary transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              
              <div className="text-center pt-4">
                <span className="inline-block px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-full text-xs font-bold mb-4">
                  ✨ AI 推荐
                </span>
                <h2 className="text-3xl font-black text-foreground mb-4">{result.name}</h2>
                <div className="w-full h-48 bg-secondary/30 rounded-xl mb-4 overflow-hidden relative group">
                  <div className="absolute inset-0 flex items-center justify-center text-muted-foreground bg-secondary/20">
                    <Utensils className="w-12 h-12 opacity-20" />
                  </div>
                </div>
                <p className="text-foreground/80 leading-relaxed mb-6">
                  {result.desc}
                </p>
                <div className="flex gap-3">
                  <button className="flex-1 py-3 bg-secondary/50 text-foreground font-bold rounded-xl hover:bg-secondary transition-colors">
                    不喜欢
                  </button>
                  <button className="flex-1 py-3 bg-primary text-white font-bold rounded-xl shadow-lg hover:bg-orange-600 transition-colors">
                    就吃这个!
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
