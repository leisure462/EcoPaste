import { useEffect, useState } from "react";
import { listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import { useSnapshot } from "valtio";
import { selectionAssistantStore } from "@/stores/selection-assistant";
import UnoIcon from "@/components/UnoIcon";
import { callAI } from "@/utils/ai-api";

interface SelectionEvent {
    text: string;
    x: number;
    y: number;
    trigger: string;
}

const SelectionToolbar = () => {
    const { agents, apiConfig } = useSnapshot(selectionAssistantStore);
    const [selectedText, setSelectedText] = useState("");
    const [loading, setLoading] = useState(false);

    // 获取启用的 agents
    const enabledAgents = agents.filter((a) => a.enabled).sort((a, b) => a.order - b.order);

    // 预设功能的中文名映射
    const builtinLabels: Record<string, string> = {
        translate: "翻译",
        explain: "解释",
        summarize: "总结",
        search: "搜索",
        copy: "复制",
    };

    useEffect(() => {
        // 监听选区事件
        const unlisten = listen<SelectionEvent>("selection:text-selected", (event) => {
            const { text } = event.payload;
            setSelectedText(text);
        });

        return () => {
            unlisten.then((fn) => fn());
        };
    }, []);

    const handleAgentClick = async (agentId: string, prompt?: string) => {
        if (!selectedText) return;

        // 处理特殊 agent
        if (agentId === "copy") {
            await navigator.clipboard.writeText(selectedText);
            return;
        }

        if (agentId === "search") {
            const url = `https://www.google.com/search?q=${encodeURIComponent(selectedText)}`;
            window.open(url, "_blank");
            return;
        }

        // AI 功能
        if (prompt) {
            setLoading(true);
            try {
                const response = await callAI({
                    text: selectedText,
                    prompt,
                    apiConfig: selectionAssistantStore.apiConfig,
                });
                if (response.success && response.content) {
                    // TODO: 显示结果弹窗
                    console.log("AI Response:", response.content);
                }
            } catch (error) {
                console.error("AI error:", error);
            } finally {
                setLoading(false);
            }
        }
    };

    return (
        <div className="flex items-center gap-2 px-3 py-2 bg-opacity-95 backdrop-blur-sm rounded-full shadow-lg border border-solid border-gray-600">
            {enabledAgents.map((agent) => (
                <button
                    key={agent.id}
                    className="flex items-center gap-1 px-3 py-1 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors text-white text-sm cursor-pointer border-none"
                    onClick={() => handleAgentClick(agent.id, agent.prompt)}
                    disabled={loading}
                >
                    <UnoIcon name={agent.icon} size={14} />
                    <span>{builtinLabels[agent.id] || agent.name}</span>
                </button>
            ))}
        </div>
    );
};

export default SelectionToolbar;
