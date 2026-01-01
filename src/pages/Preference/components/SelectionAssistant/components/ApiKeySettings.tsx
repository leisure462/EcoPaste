import { Button, Input, message } from "antd";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useSnapshot } from "valtio";
import ProList from "@/components/ProList";
import ProListItem from "@/components/ProListItem";
import UnoIcon from "@/components/UnoIcon";
import { selectionAssistantStore } from "@/stores/selection-assistant";

const ApiSettings = () => {
    const { apiConfig } = useSnapshot(selectionAssistantStore);
    const { t } = useTranslation();
    const [testing, setTesting] = useState(false);

    const handleTestApi = async () => {
        const { baseUrl, apiKey, model } = selectionAssistantStore.apiConfig;

        if (!apiKey) {
            message.error(t("preference.selection_assistant.api.key_required"));
            return;
        }

        setTesting(true);
        try {
            const response = await fetch(`${baseUrl}/v1/chat/completions`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${apiKey}`,
                },
                body: JSON.stringify({
                    model: model || "gpt-3.5-turbo",
                    messages: [{ role: "user", content: "Hi" }],
                    max_tokens: 5,
                }),
            });

            const data = await response.json();

            if (response.ok && data.choices) {
                message.success(t("preference.selection_assistant.api.test_success"));
            } else {
                message.error(data.error?.message || t("preference.selection_assistant.api.test_failed"));
            }
        } catch (error) {
            message.error(t("preference.selection_assistant.api.test_failed"));
        } finally {
            setTesting(false);
        }
    };

    return (
        <ProList header={t("preference.selection_assistant.api.title")}>
            <ProListItem
                title="API Base URL"
                description={t("preference.selection_assistant.api.base_url_hint")}
            >
                <Input
                    className="w-72"
                    value={apiConfig.baseUrl}
                    onChange={(e) => {
                        selectionAssistantStore.apiConfig.baseUrl = e.target.value;
                    }}
                    placeholder="https://api.openai.com"
                />
            </ProListItem>

            <ProListItem
                title="API Key"
                description={t("preference.selection_assistant.api.key_hint")}
            >
                <Input.Password
                    className="w-72"
                    value={apiConfig.apiKey}
                    onChange={(e) => {
                        selectionAssistantStore.apiConfig.apiKey = e.target.value;
                    }}
                    placeholder="sk-..."
                />
            </ProListItem>

            <ProListItem
                title={t("preference.selection_assistant.api.model")}
                description={t("preference.selection_assistant.api.model_hint")}
            >
                <Input
                    className="w-48"
                    value={apiConfig.model}
                    onChange={(e) => {
                        selectionAssistantStore.apiConfig.model = e.target.value;
                    }}
                    placeholder="gpt-3.5-turbo"
                />
            </ProListItem>

            <ProListItem title={t("preference.selection_assistant.api.test")}>
                <Button
                    type="primary"
                    icon={<UnoIcon name="i-lucide:flask-conical" />}
                    loading={testing}
                    onClick={handleTestApi}
                >
                    {t("preference.selection_assistant.api.test_button")}
                </Button>
            </ProListItem>
        </ProList>
    );
};

export default ApiSettings;
