"use client";

import { Leaf, MapPin, CloudSun } from "lucide-react";
import { SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";

export function SeasonalDrawer() {
  const currentSeason = "立春"; // Mock data
  const currentRegion = "江南"; // Mock data
  
  const recommendations = [
    { name: "春笋", benefit: "鲜嫩爽口，通便排毒", dishes: ["油焖笋", "腌笃鲜"] },
    { name: "荠菜", benefit: "护肝明目，补钙", dishes: ["荠菜豆腐羹", "荠菜鲜肉馄饨"] },
    { name: "河蚌", benefit: "滋阴清热", dishes: ["咸肉河蚌豆腐汤"] },
  ];

  return (
    <div className="h-full flex flex-col gap-6">
      <SheetHeader>
        <div className="flex items-center gap-2 text-primary mb-2">
          <CloudSun className="w-5 h-5" />
          <span className="font-bold">时令 · 节气</span>
        </div>
        <SheetTitle className="text-3xl font-black text-left flex items-baseline gap-3">
          {currentSeason} 
          <span className="text-sm font-normal text-muted-foreground flex items-center gap-1">
            <MapPin className="w-3 h-3" /> {currentRegion}
          </span>
        </SheetTitle>
        <SheetDescription className="text-left">
          “阳和起蛰，品物皆春。” 此时节应多吃升发阳气的食物。
        </SheetDescription>
      </SheetHeader>

      <div className="flex-1 overflow-y-auto pr-2 space-y-4">
        <h3 className="font-bold text-lg flex items-center gap-2">
          <Leaf className="w-4 h-4 text-green-600" /> 
          当季推荐
        </h3>
        
        <div className="grid gap-4">
          {recommendations.map((item) => (
            <div key={item.name} className="bg-secondary/20 p-4 rounded-xl border border-secondary/50">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-bold text-lg text-foreground">{item.name}</h4>
                <span className="text-xs px-2 py-1 bg-white/50 rounded-full text-foreground/70">{item.benefit}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {item.dishes.map(dish => (
                  <span key={dish} className="text-sm bg-white px-2 py-1 rounded-md text-primary shadow-sm">
                    {dish}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="bg-orange-50 p-4 rounded-xl mt-6">
          <h4 className="font-bold text-orange-800 mb-2 text-sm">💡 饮食小贴士</h4>
          <p className="text-sm text-orange-700/80 leading-relaxed">
            春季肝气旺盛，宜少吃酸，多吃甘味食物以养脾气。建议多食红枣、蜂蜜、山药。
          </p>
        </div>
      </div>
    </div>
  );
}
