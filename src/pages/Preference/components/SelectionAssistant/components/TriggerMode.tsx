import { Segmented } from "antd";
import { useTranslation } from "react-i18next";
import { useSnapshot } from "valtio";
import ProList from "@/components/ProList";
import ProSwitch from "@/components/ProSwitch";
import { selectionAssistantStore } from "@/stores/selection-assistant";
import type { SelectionTriggerMode } from "@/types/selection-assistant";

const TriggerMode = () => {
    const { trigger } = useSnapshot(selectionAssistantStore);
    const { t } = useTranslation();

    const options = [
        { label: t("preference.selection_assistant.trigger.selection"), value: "selection" },
        { label: "Ctrl " + t("preference.selection_assistant.trigger.key"), value: "ctrl" },
        { label: t("preference.selection_assistant.trigger.shortcut"), value: "shortcut" },
    ];

    return (
        <>
            <ProList.Item
                description={t("preference.selection_assistant.trigger.hint")}
                title={t("preference.selection_assistant.trigger.mode")}
            >
                <Segmented
                    onChange={(value) => {
                        selectionAssistantStore.trigger.mode = value as SelectionTriggerMode;
                    }}
                    options={options}
                    value={trigger.mode}
                />
            </ProList.Item>

            <ProSwitch
                onChange={(value) => {
                    // compactMode
                    selectionAssistantStore.toolbar.compactMode = value;
                }}
                title={t("preference.selection_assistant.toolbar.compact_mode")}
                value={selectionAssistantStore.toolbar.compactMode}
            />
        </>
    );
};

export default TriggerMode;
