interface WebhookOption {
    name: string;
    url: string;
}

export const webhookOptions: WebhookOption[] = [
    {
        name: "Takmir PSL",
        url: import.meta.env.VITE_TAKMIR_WEBHOOK_URL
    },
    {
        name: "Ittaqullah",
        url: import.meta.env.VITE_ITTAQULLAH_WEBHOOK_URL
    },
    {
        name: "Test (Bias)",
        url: import.meta.env.VITE_TEST_BIAS
    }
];

webhookOptions.forEach(option => {
    if (!option.url) {
        console.error(`Missing webhook URL for ${option.name}. Please check your environment variables.`);
    }
});