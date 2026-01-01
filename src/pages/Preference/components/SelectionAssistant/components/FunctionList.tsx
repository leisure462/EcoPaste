import { Button, Flex, Input, Popconfirm, Switch, Tag } from "antd";
import { useTranslation } from "react-i18next";
import { useSnapshot } from "valtio";
import ProList from "@/components/ProList";
import ProListItem from "@/components/ProListItem";
import UnoIcon from "@/components/UnoIcon";
import { selectionAssistantStore } from "@/stores/selection-assistant";

const AgentList = () => {
    const { agents } = useSnapshot(selectionAssistantStore);
    const { t } = useTranslation();

    const handleToggle = (id: string, enabled: boolean) => {
        const index = selectionAssistantStore.agents.findIndex((a) => a.id === id);
        if (index !== -1) {
            selectionAssistantStore.agents[index].enabled = enabled;
        }
    };

    const handleDelete = (id: string) => {
        const index = selectionAssistantStore.agents.findIndex((a) => a.id === id);
        if (index !== -1) {
            selectionAssistantStore.agents.splice(index, 1);
        }
    };

    const handleAddCustomAgent = () => {
        const newId = `agent_${Date.now()}`;
        selectionAssistantStore.agents.push({
            id: newId,
            name: t("preference.selection_assistant.agents.default_name"),
            icon: "i-lucide:sparkles",
            enabled: true,
            order: selectionAssistantStore.agents.length,
            isBuiltin: false,
            prompt: "",
        });
    };

    const handleNameChange = (id: string, name: string) => {
        const index = selectionAssistantStore.agents.findIndex((a) => a.id === id);
        if (index !== -1) {
            selectionAssistantStore.agents[index].name = name;
        }
    };

    const handlePromptChange = (id: string, prompt: string) => {
        const index = selectionAssistantStore.agents.findIndex((a) => a.id === id);
        if (index !== -1) {
            selectionAssistantStore.agents[index].prompt = prompt;
        }
    };

    // 预设功能的中文名映射
    const builtinLabels: Record<string, string> = {
        translate: "翻译",
        explain: "解释",
        summarize: "总结",
        search: "搜索",
        copy: "复制",
    };

    return (
        <ProList header={t("preference.selection_assistant.agents.title")}>
            {/* 工具栏预览 */}
            <ProListItem title={t("preference.selection_assistant.agents.preview")}>
                <Flex
                    align="center"
                    className="bg-color-3 rounded-full px-3 py-2 border border-solid border-color-4"
                    gap={8}
                    wrap="wrap"
                >
                    {agents
                        .filter((a) => a.enabled)
                        .sort((a, b) => a.order - b.order)
                        .map((agent) => (
                            <Tag
                                className="flex items-center gap-1 cursor-pointer m-0 rounded-full px-3 py-1"
                                key={agent.id}
                            >
                                <UnoIcon name={agent.icon} size={14} />
                                <span>{builtinLabels[agent.id] || agent.name}</span>
                            </Tag>
                        ))}
                </Flex>
            </ProListItem>

            {/* 添加自定义 Agent 按钮 */}
            <ProListItem>
                <Button
                    icon={<UnoIcon name="i-lucide:plus" />}
                    onClick={handleAddCustomAgent}
                    type="primary"
                >
                    {t("preference.selection_assistant.agents.add_custom")}
                </Button>
            </ProListItem>

            {/* Agent 列表 */}
            {agents.map((agent) => (
                <ProListItem
                    key={agent.id}
                    title={
                        <Flex align="center" gap="small">
                            <UnoIcon name={agent.icon} size={16} />
                            {agent.isBuiltin ? (
                                <>
                                    <span>{builtinLabels[agent.id] || agent.name}</span>
                                    <Tag color="blue" className="text-xs">
                                        {t("preference.selection_assistant.agents.builtin")}
                                    </Tag>
                                </>
                            ) : (
                                <Input
                                    className="w-32"
                                    value={agent.name}
                                    onChange={(e) => handleNameChange(agent.id, e.target.value)}
                                    placeholder={t("preference.selection_assistant.agents.name_placeholder")}
                                    size="small"
                                />
                            )}
                        </Flex>
                    }
                >
                    <Flex align="center" gap="small">
                        <Switch
                            checked={agent.enabled}
                            onChange={(checked) => handleToggle(agent.id, checked)}
                        />
                        {!agent.isBuiltin && (
                            <Popconfirm
                                title={t("preference.selection_assistant.agents.delete_confirm")}
                                onConfirm={() => handleDelete(agent.id)}
                                okText={t("preference.selection_assistant.agents.confirm")}
                                cancelText={t("preference.selection_assistant.agents.cancel")}
                            >
                                <Button
                                    type="text"
                                    danger
                                    icon={<UnoIcon name="i-lucide:trash-2" size={16} />}
                                />
                            </Popconfirm>
                        )}
                    </Flex>
                </ProListItem>
            ))}

            {/* 自定义 Agent 提示词编辑 */}
            {agents.filter((a) => !a.isBuiltin).map((agent) => (
                <ProListItem
                    key={`prompt_${agent.id}`}
                    title={`${agent.name} ${t("preference.selection_assistant.agents.prompt")}`}
                    description={t("preference.selection_assistant.agents.prompt_hint")}
                >
                    <Input.TextArea
                        className="w-80"
                        rows={3}
                        value={agent.prompt || ""}
                        onChange={(e) => handlePromptChange(agent.id, e.target.value)}
                        placeholder={t("preference.selection_assistant.agents.prompt_placeholder")}
                    />
                </ProListItem>
            ))}
        </ProList>
    );
};

export default AgentList;
