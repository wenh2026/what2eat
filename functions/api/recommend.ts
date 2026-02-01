export async function onRequestPost({ request, env }: { request: Request; env: Record<string, string | undefined> }) {
  try {
    const { mood } = await request.json().catch(() => ({ mood: undefined }));

    const apiKey = env.OPENAI_API_KEY;
    if (!apiKey) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      return Response.json({
        name: "演示模式：红烧肉",
        desc: "检测到未配置 API Key。这是演示数据：肥而不腻，入口即化，经典下饭菜！",
        reason: "因为你看起来需要一点肉类能量！",
      });
    }

    const systemPrompt = `你是一个美食推荐助手 "吃啥AI"。
你的性格：热情、温暖、有点幽默，像个懂吃的老朋友。
任务：根据用户的心情或需求，推荐一道具体的菜。
输出格式：必须是纯 JSON，包含字段：
- name: 菜名 (比如 "麻婆豆腐")
- desc: 简短诱人的描述 (20-30字)
- reason: 推荐理由 (结合用户心情，俏皮一点)
不要输出 Markdown 代码块，只输出 JSON 字符串。`;

    const userPrompt = `我现在的心情/需求是：${mood || "随便，不知道吃啥"}。请帮我决定吃什么！`;

    const resp = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.8,
        stream: false,
      }),
    });

    if (!resp.ok) {
      const text = await resp.text().catch(() => "");
      return Response.json(
        { error: "Upstream error", status: resp.status, detail: text.slice(0, 500) },
        { status: 502 }
      );
    }

    const data = (await resp.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };

    const content = data.choices?.[0]?.message?.content ?? "{}";
    let result: unknown;
    try {
      result = JSON.parse(content);
    } catch {
      result = {
        name: "AI 出了点小差错",
        desc: "它太饿了，没能吐出正确的菜单。",
        reason: "请再试一次！",
      };
    }

    return Response.json(result);
  } catch {
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

