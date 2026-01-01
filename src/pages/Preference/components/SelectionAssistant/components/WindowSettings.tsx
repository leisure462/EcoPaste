import { Slider } from "antd";
import { useTranslation } from "react-i18next";
import { useSnapshot } from "valtio";
import ProList from "@/components/ProList";
import ProSwitch from "@/components/ProSwitch";
import { selectionAssistantStore } from "@/stores/selection-assistant";

const WindowSettings = () => {
    const { toolbar } = useSnapshot(selectionAssistantStore);
    const { t } = useTranslation();

    return (
        <ProList header={t("preference.selection_assistant.window.title")}>
            <ProSwitch
                onChange={(value) => {
                    selectionAssistantStore.toolbar.followToolbar = value;
                }}
                title={t("preference.selection_assistant.window.follow_toolbar")}
                value={toolbar.followToolbar}
            />

            <ProSwitch
                description={t("preference.selection_assistant.window.remember_size_hint")}
                onChange={(value) => {
                    selectionAssistantStore.toolbar.rememberSize = value;
                }}
                title={t("preference.selection_assistant.window.remember_size")}
                value={toolbar.rememberSize}
            />

            <ProSwitch
                description={t("preference.selection_assistant.window.auto_close_hint")}
                onChange={(value) => {
                    selectionAssistantStore.toolbar.autoClose = value;
                }}
                title={t("preference.selection_assistant.window.auto_close")}
                value={toolbar.autoClose}
            />

            <ProSwitch
                onChange={(value) => {
                    selectionAssistantStore.toolbar.autoTop = value;
                }}
                title={t("preference.selection_assistant.window.auto_top")}
                value={toolbar.autoTop}
            />

            <ProList.Item title={t("preference.selection_assistant.window.opacity")}>
                <Slider
                    className="w-40"
                    max={100}
                    min={20}
                    onChange={(value) => {
                        selectionAssistantStore.toolbar.opacity = value;
                    }}
                    value={toolbar.opacity}
                />
                <span className="ml-2 w-12 text-right">{toolbar.opacity}%</span>
            </ProList.Item>
        </ProList>
    );
};

export default WindowSettings;
