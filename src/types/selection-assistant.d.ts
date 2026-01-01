// 划词助手触发方式
export type SelectionTriggerMode = "selection" | "ctrl" | "shortcut";

// 应用筛选模式
export type AppFilterMode = "off" | "whitelist" | "blacklist";

// 自定义 Agent
export interface CustomAgent {
    id: string;
    name: string;
    icon: string;
    enabled: boolean;
    order: number;
    isBuiltin: boolean;
    prompt?: string;
}

// OpenAI 格式 API 配置
export interface APIConfig {
    baseUrl: string;
    apiKey: string;
    model: string;
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
        compactMode: boolean;
        followToolbar: boolean;
        rememberSize: boolean;
        autoClose: boolean;
        autoTop: boolean;
        opacity: number;
    };

    // Agent 列表（内置 + 自定义）
    agents: CustomAgent[];

    // API 配置（OpenAI 兼容格式）
    apiConfig: APIConfig;

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
    apiConfig: APIConfig;
}

// AI 响应
export interface AIResponse {
    success: boolean;
    content?: string;
    error?: string;
}
