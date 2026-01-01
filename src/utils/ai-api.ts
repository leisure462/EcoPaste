import { fetch } from "@tauri-apps/plugin-http";
import type { AIProvider, AIRequestParams, AIResponse, CustomAPIConfig } from "@/types/selection-assistant";
import { selectionAssistantStore } from "@/stores/selection-assistant";

// OpenAI API 调用
async function callOpenAI(
    text: string,
    prompt: string,
    apiKey: string
): Promise<AIResponse> {
    try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: "gpt-3.5-turbo",
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

// Gemini API 调用
async function callGemini(
    text: string,
    prompt: string,
    apiKey: string
): Promise<AIResponse> {
    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [{ text: prompt.replace("{{text}}", text) }],
                        },
                    ],
                }),
            }
        );

        const data = await response.json();

        if (data.error) {
            return { success: false, error: data.error.message };
        }

        return {
            success: true,
            content: data.candidates?.[0]?.content?.parts?.[0]?.text || "",
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}

// 自定义 API 调用（兼容 OpenAI 格式）
async function callCustomAPI(
    text: string,
    prompt: string,
    config: CustomAPIConfig
): Promise<AIResponse> {
    try {
        const response = await fetch(`${config.baseUrl}/v1/chat/completions`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${config.apiKey}`,
            },
            body: JSON.stringify({
                model: config.model || "gpt-3.5-turbo",
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
 * 调用 AI API
 */
export async function callAI(params: AIRequestParams): Promise<AIResponse> {
    const { text, prompt, provider, customConfig } = params;
    const { apiKeys } = selectionAssistantStore;

    switch (provider) {
        case "openai":
            if (!apiKeys.openai) {
                return { success: false, error: "OpenAI API Key 未配置" };
            }
            return callOpenAI(text, prompt, apiKeys.openai);

        case "gemini":
            if (!apiKeys.gemini) {
                return { success: false, error: "Gemini API Key 未配置" };
            }
            return callGemini(text, prompt, apiKeys.gemini);

        case "custom":
            if (!customConfig) {
                return { success: false, error: "自定义 API 配置缺失" };
            }
            return callCustomAPI(text, prompt, customConfig);

        default:
            return { success: false, error: "不支持的 AI 服务商" };
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
