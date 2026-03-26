declare namespace NodeJs {
    interface ProcessEnv {
        JWT_SECRET: string;
        DATABASE_URL: string;
        RESEND_API_KEY: string;
        RESEND_FROM_EMAIL: string;
        NEXT_PUBLIC_APP_URL: string;
        EMAIL_PROVIDER?: 'resend' | 'smtp';
        SMTP_HOST?: string;
        SMTP_PORT?: string;
        SMTP_USER?: string;
        SMTP_PASSWORD?: string;
        SMTP_SECURE?: string;
        SMTP_FROM_EMAIL?: string;
        ADMIN_EMAILS?: string;
        PLATFORM_NAME?: string;
        PLATFORM_SUPPORT_EMAIL?: string;
    }
}

declare var process: {
    env: NodeJs.ProcessEnv;
};
