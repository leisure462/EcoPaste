import { proxy } from "valtio";
import type { SelectionAssistantStore } from "@/types/selection-assistant";

// 默认功能列表
const defaultFunctions = [
    {
        id: "translate",
        name: "翻译",
        icon: "i-lucide:languages",
        enabled: true,
        order: 0,
        isBuiltin: true,
        prompt: "请将以下文本翻译成中文，如果已经是中文则翻译成英文：\n\n{{text}}",
        apiProvider: "openai" as const,
    },
    {
        id: "explain",
        name: "解释",
        icon: "i-lucide:book-open",
        enabled: true,
        order: 1,
        isBuiltin: true,
        prompt: "请解释以下内容的含义：\n\n{{text}}",
        apiProvider: "openai" as const,
    },
    {
        id: "summarize",
        name: "总结",
        icon: "i-lucide:file-text",
        enabled: true,
        order: 2,
        isBuiltin: true,
        prompt: "请总结以下内容的要点：\n\n{{text}}",
        apiProvider: "openai" as const,
    },
    {
        id: "search",
        name: "搜索",
        icon: "i-lucide:search",
        enabled: true,
        order: 3,
        isBuiltin: true,
    },
    {
        id: "copy",
        name: "复制",
        icon: "i-lucide:copy",
        enabled: true,
        order: 4,
        isBuiltin: true,
    },
];

export const selectionAssistantStore = proxy<SelectionAssistantStore>({
    enabled: false,

    trigger: {
        mode: "selection",
        shortcut: "Alt+Q",
    },

    toolbar: {
        compactMode: false,
        followToolbar: true,
        rememberSize: false,
        autoClose: false,
        autoTop: false,
        opacity: 100,
    },

    functions: defaultFunctions,

    apiKeys: {
        openai: "",
        gemini: "",
        custom: [],
    },

    appFilter: {
        mode: "off",
        apps: [],
    },
});
