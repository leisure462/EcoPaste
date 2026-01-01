import { useTranslation } from "react-i18next";
import { useSnapshot } from "valtio";
import ProList from "@/components/ProList";
import ProSwitch from "@/components/ProSwitch";
import { selectionAssistantStore } from "@/stores/selection-assistant";
import TriggerMode from "./components/TriggerMode";
import WindowSettings from "./components/WindowSettings";
import FunctionList from "./components/FunctionList";
import ApiKeySettings from "./components/ApiKeySettings";

const SelectionAssistant = () => {
    const { enabled, appFilter } = useSnapshot(selectionAssistantStore);
    const { t } = useTranslation();

    return (
        <>
            {/* 启用开关 */}
            <ProList header={t("preference.selection_assistant.title")}>
                <ProSwitch
                    onChange={(value) => {
                        selectionAssistantStore.enabled = value;
                    }}
                    title={t("preference.selection_assistant.enable")}
                    value={enabled}
                />
            </ProList>

            {/* 工具栏设置 */}
            <ProList header={t("preference.selection_assistant.toolbar.title")}>
                <TriggerMode />
            </ProList>

            {/* 功能窗口设置 */}
            <WindowSettings />

            {/* 功能列表 */}
            <FunctionList />

            {/* API Key 设置 */}
            <ApiKeySettings />

            {/* 高级设置 - 应用筛选 */}
            <ProList header={t("preference.selection_assistant.advanced.title")}>
                <ProSwitch
                    description={t("preference.selection_assistant.advanced.app_filter_hint")}
                    onChange={(value) => {
                        selectionAssistantStore.appFilter.mode = value ? "whitelist" : "off";
                    }}
                    title={t("preference.selection_assistant.advanced.app_filter")}
                    value={appFilter.mode !== "off"}
                />
            </ProList>
        </>
    );
};

export default SelectionAssistant;
