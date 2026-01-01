import type { LANGUAGE } from "@/constants";

// 划词助手触发方式
export type SelectionTriggerMode = "selection" | "ctrl" | "shortcut";

// 应用筛选模式
export type AppFilterMode = "off" | "whitelist" | "blacklist";

// AI 服务提供商
export type AIProvider = "openai" | "gemini" | "custom";

// 功能项
export interface FunctionItem {
    id: string;
    name: string;
    icon: string;
    enabled: boolean;
    order: number;
    isBuiltin: boolean;
    prompt?: string;
    apiProvider?: AIProvider;
}

// 自定义 API 配置
export interface CustomAPIConfig {
    id: string;
    name: string;
    apiKey: string;
    baseUrl: string;
    model?: string;
}

// 划词助手状态
export interface SelectionAssistantStore {
    // 启用状态
    enabled: boolean;

    // 触发设置
    trigger: {
        mode: SelectionTriggerMode;
        shortcut: string;
    };

    // 工具栏设置
    toolbar: {
        compactMode: boolean;    // 紧凑模式
        followToolbar: boolean;  // 跟随工具栏
        rememberSize: boolean;   // 记住大小
        autoClose: boolean;      // 自动关闭
        autoTop: boolean;        // 自动置顶
        opacity: number;         // 透明度 0-100
    };

    // 功能列表
    functions: FunctionItem[];

    // API Keys 配置
    apiKeys: {
        openai?: string;
        gemini?: string;
        custom: CustomAPIConfig[];
    };

    // 应用筛选
    appFilter: {
        mode: AppFilterMode;
        apps: string[];
    };
}

// 划词事件 payload
export interface SelectionEventPayload {
    text: string;
    x: number;
    y: number;
}

// AI 请求参数
export interface AIRequestParams {
    text: string;
    prompt: string;
    provider: AIProvider;
    customConfig?: CustomAPIConfig;
}

// AI 响应
export interface AIResponse {
    success: boolean;
    content?: string;
    error?: string;
}
