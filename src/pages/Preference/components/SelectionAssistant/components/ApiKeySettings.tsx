import { Input } from "antd";
import { useTranslation } from "react-i18next";
import { useSnapshot } from "valtio";
import ProList from "@/components/ProList";
import { selectionAssistantStore } from "@/stores/selection-assistant";

const ApiKeySettings = () => {
    const { apiKeys } = useSnapshot(selectionAssistantStore);
    const { t } = useTranslation();

    return (
        <ProList header={t("preference.selection_assistant.api.title")}>
            <ProList.Item
                description={t("preference.selection_assistant.api.openai_hint")}
                title="OpenAI API Key"
            >
                <Input.Password
                    className="w-60"
                    onChange={(e) => {
                        selectionAssistantStore.apiKeys.openai = e.target.value;
                    }}
                    placeholder="sk-..."
                    value={apiKeys.openai}
                />
            </ProList.Item>

            <ProList.Item
                description={t("preference.selection_assistant.api.gemini_hint")}
                title="Google Gemini API Key"
            >
                <Input.Password
                    className="w-60"
                    onChange={(e) => {
                        selectionAssistantStore.apiKeys.gemini = e.target.value;
                    }}
                    placeholder="AIza..."
                    value={apiKeys.gemini}
                />
            </ProList.Item>
        </ProList>
    );
};

export default ApiKeySettings;
