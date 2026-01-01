import { Button, Flex, Switch, Tag } from "antd";
import { useTranslation } from "react-i18next";
import { useSnapshot } from "valtio";
import ProList from "@/components/ProList";
import ProListItem from "@/components/ProListItem";
import UnoIcon from "@/components/UnoIcon";
import { selectionAssistantStore } from "@/stores/selection-assistant";

const FunctionList = () => {
    const { functions } = useSnapshot(selectionAssistantStore);
    const { t } = useTranslation();

    const handleToggle = (id: string, enabled: boolean) => {
        const index = selectionAssistantStore.functions.findIndex((f) => f.id === id);
        if (index !== -1) {
            selectionAssistantStore.functions[index].enabled = enabled;
        }
    };

    const handleAddCustom = () => {
        const newId = `custom_${Date.now()}`;
        selectionAssistantStore.functions.push({
            id: newId,
            name: t("preference.selection_assistant.functions.new_function"),
            icon: "i-lucide:sparkles",
            enabled: true,
            order: selectionAssistantStore.functions.length,
            isBuiltin: false,
            prompt: "",
            apiProvider: "openai",
        });
    };

    // 预设功能的图标和中文名映射
    const builtinLabels: Record<string, string> = {
        translate: "翻译",
        explain: "解释",
        summarize: "总结",
        search: "搜索",
        copy: "复制",
    };

    return (
        <ProList header={t("preference.selection_assistant.functions.title")}>
            {/* 预览条 */}
            <ProListItem>
                <Flex align="center" className="bg-color-3 rounded-lg p-2" gap="small">
                    {functions
                        .filter((f) => f.enabled)
                        .sort((a, b) => a.order - b.order)
                        .map((func) => (
                            <Tag
                                className="flex items-center gap-1 cursor-pointer"
                                key={func.id}
                            >
                                <UnoIcon name={func.icon} size={14} />
                                <span>{builtinLabels[func.id] || func.name}</span>
                            </Tag>
                        ))}
                </Flex>
            </ProListItem>

            {/* 添加自定义功能按钮 */}
            <ProListItem>
                <Button
                    icon={<UnoIcon name="i-lucide:plus" />}
                    onClick={handleAddCustom}
                    type="primary"
                >
                    {t("preference.selection_assistant.functions.add_custom")}
                </Button>
            </ProListItem>

            {/* 功能列表 */}
            {functions.map((func) => (
                <ProListItem
                    key={func.id}
                    title={
                        <Flex align="center" gap="small">
                            <UnoIcon name={func.icon} size={16} />
                            <span>{builtinLabels[func.id] || func.name}</span>
                            {func.isBuiltin && (
                                <Tag color="blue" className="text-xs">
                                    内置
                                </Tag>
                            )}
                        </Flex>
                    }
                >
                    <Switch
                        checked={func.enabled}
                        onChange={(checked) => handleToggle(func.id, checked)}
                    />
                </ProListItem>
            ))}
        </ProList>
    );
};

export default FunctionList;
