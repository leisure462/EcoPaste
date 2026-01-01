import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { getCurrentWindow, PhysicalPosition } from "@tauri-apps/api/window";
import { useEffect, useState } from "react";
import { useSnapshot } from "valtio";
import UnoIcon from "@/components/UnoIcon";
import { selectionAssistantStore } from "@/stores/selection-assistant";
import { callAI } from "@/utils/ai-api";

interface SelectionEvent {
  x: number;
  y: number;
}

const SelectionToolbar = () => {
  const { agents, toolbar } = useSnapshot(selectionAssistantStore);
  const [loading, setLoading] = useState(false);

  // 紧凑模式
  const compactMode = toolbar.compactMode;

  // 获取启用的 agents
  const enabledAgents = agents.filter((a) => a.enabled).sort((a) => a.order);

  // 预设功能的中文名映射
  const builtinLabels: Record<string, string> = {
    copy: "复制",
    explain: "解释",
    search: "搜索",
    summarize: "总结",
    translate: "翻译",
  };

  useEffect(() => {
    const window = getCurrentWindow();

    // 监听显示工具栏事件
    const unlistenShowToolbar = listen<SelectionEvent>(
      "selection:show-toolbar",
      async (event) => {
        const { x, y } = event.payload;

        try {
          // 移动窗口到鼠标位置（稍微偏移一点，避免遮挡选区）
          await window.setPosition(new PhysicalPosition(x + 10, y + 10));
          // 显示窗口
          await window.show();
          await window.setFocus();
          // 窗口已显示
        } catch (error) {
          console.error("Failed to show toolbar:", error);
        }
      },
    );

    // 监听窗口失焦事件，自动隐藏
    const unlistenBlur = window.onFocusChanged(({ payload: focused }) => {
      if (!focused) {
        window.hide();
        // 窗口自动隐藏
      }
    });

    return () => {
      unlistenShowToolbar.then((fn) => fn());
      unlistenBlur.then((fn) => fn());
    };
  }, []);

  // 隐藏工具栏
  const hideToolbar = async () => {
    const window = getCurrentWindow();
    await window.hide();
    // 窗口已隐藏
  };

  // 处理 Agent 点击
  const handleAgentClick = async (agentId: string, prompt?: string) => {
    try {
      // 先获取选中的文本
      const selectedText = await invoke<string>(
        "plugin:eco-selection|get_selected_text",
      );

      if (!selectedText) {
        console.warn("No text selected");
        await hideToolbar();
        return;
      }

      // 处理特殊 agent
      if (agentId === "copy") {
        await navigator.clipboard.writeText(selectedText);
        await hideToolbar();
        return;
      }

      if (agentId === "search") {
        const url = `https://www.google.com/search?q=${encodeURIComponent(selectedText)}`;
        const { openUrl } = await import("@tauri-apps/plugin-opener");
        await openUrl(url);
        await hideToolbar();
        return;
      }

      // AI 功能
      if (prompt) {
        setLoading(true);
        try {
          const response = await callAI({
            apiConfig: selectionAssistantStore.apiConfig,
            prompt,
            text: selectedText,
          });
          if (response.success && response.content) {
            // TODO: 显示结果弹窗
            console.log("AI Response:", response.content);
            // 可以将结果复制到剪贴板
            await navigator.clipboard.writeText(response.content);
          }
        } catch (error) {
          console.error("AI error:", error);
        } finally {
          setLoading(false);
        }
      }

      await hideToolbar();
    } catch (error) {
      console.error("handleAgentClick error:", error);
      await hideToolbar();
    }
  };

  return (
    <div
      className="flex items-center gap-1 rounded-lg border border-gray-600 border-solid bg-gray-800 bg-opacity-95 px-2 py-1.5 shadow-xl backdrop-blur-sm"
      data-tauri-drag-region
      style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
    >
      {enabledAgents.map((agent) => (
        <button
          className="flex cursor-pointer items-center justify-center gap-1 rounded-md border-none bg-gray-700 px-2 py-1 text-white text-xs transition-colors hover:bg-gray-600"
          disabled={loading}
          key={agent.id}
          onClick={() => handleAgentClick(agent.id, agent.prompt)}
          title={builtinLabels[agent.id] || agent.name}
        >
          <UnoIcon name={agent.icon} size={16} />
          {/* 紧凑模式只显示图标 */}
          {!compactMode && <span>{builtinLabels[agent.id] || agent.name}</span>}
        </button>
      ))}
    </div>
  );
};

export default SelectionToolbar;
