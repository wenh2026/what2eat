import { openai } from "@/lib/openai";
import { NextResponse } from "next/server";

export const runtime = 'edge';

export async function POST(request: Request) {
  try {
    const { image } = await request.json();

    if (!image) {
      return NextResponse.json(
        { error: "Image data is required" },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
       // Mock response for demo
       await new Promise((resolve) => setTimeout(resolve, 2000));
       return NextResponse.json({
         ingredients: ["鸡蛋", "西红柿", "青椒", "剩米饭"],
         recommendations: [
           {
             name: "黄金蛋炒饭",
             desc: "隔夜饭的华丽转身，金黄诱人，粒粒分明。",
             reason: "看你有剩米饭和鸡蛋，这是最快手又好吃的选择！"
           },
           {
             name: "西红柿炒鸡蛋",
             desc: "国民神菜，酸甜可口，拌饭一绝。",
             reason: "经典的红黄搭配，营养均衡又下饭。"
           }
         ]
       });
    }

    const systemPrompt = `你是一个专业的食材分析师和创意大厨。
    任务：
    1. 识别图片中的食材（冰箱内部或购物袋）。
    2. 基于这些食材，推荐 2-3 道可行的菜谱。
    3. 输出纯 JSON 格式：
    {
      "ingredients": ["食材1", "食材2"],
      "recommendations": [
        { "name": "菜名", "desc": "描述", "reason": "推荐理由" }
      ]
    }`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // Vision model
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: [
            { type: "text", text: "请看看我这些食材能做什么好吃的？" },
            {
              type: "image_url",
              image_url: {
                "url": image, // Base64 or URL
              },
            },
          ],
        },
      ],
      max_tokens: 500,
    });

    const content = response.choices[0].message.content;
    
    // Parse JSON safely (handling potential markdown fences)
    const cleanContent = content?.replace(/```json|```/g, "").trim();
    const result = JSON.parse(cleanContent || "{}");

    return NextResponse.json(result);
  } catch (error) {
    console.error("Vision API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
