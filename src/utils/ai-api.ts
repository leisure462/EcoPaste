import { fetch } from "@tauri-apps/plugin-http";
import type { APIConfig, AIRequestParams, AIResponse } from "@/types/selection-assistant";

/**
 * 调用 AI API（使用 OpenAI 兼容格式）
 */
export async function callAI(params: AIRequestParams): Promise<AIResponse> {
    const { text, prompt, apiConfig } = params;

    if (!apiConfig.apiKey) {
        return { success: false, error: "API Key 未配置" };
    }

    try {
        const response = await fetch(`${apiConfig.baseUrl}/v1/chat/completions`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiConfig.apiKey}`,
            },
            body: JSON.stringify({
                model: apiConfig.model || "gpt-3.5-turbo",
                messages: [
                    {
                        role: "user",
                        content: prompt.replace("{{text}}", text),
                    },
                ],
                stream: false,
            }),
        });

        const data = await response.json();

        if (data.error) {
            return { success: false, error: data.error.message };
        }

        return {
            success: true,
            content: data.choices?.[0]?.message?.content || "",
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}

/**
 * 在浏览器中搜索
 */
export function searchInBrowser(text: string, engine = "google") {
    const encodedText = encodeURIComponent(text);
    let url = "";

    switch (engine) {
        case "google":
            url = `https://www.google.com/search?q=${encodedText}`;
            break;
        case "bing":
            url = `https://www.bing.com/search?q=${encodedText}`;
            break;
        case "baidu":
            url = `https://www.baidu.com/s?wd=${encodedText}`;
            break;
        default:
            url = `https://www.google.com/search?q=${encodedText}`;
    }

    // 使用 Tauri 打开 URL
    import("@tauri-apps/plugin-opener").then((opener) => {
        opener.openUrl(url);
    });
}
