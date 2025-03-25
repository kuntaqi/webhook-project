export interface Message {
    id: string;
    content: any;
    webhook_url: string;
    status: 'pending' | 'sent' | 'failed';
    created_at: string;
    updated_at: string;
    user_id: string;
}

export interface Database {
    public: {
        Tables: {
            messages: {
                Row: Message;
                Insert: Omit<Message, 'id' | 'created_at' | 'updated_at'>;
                Update: Partial<Omit<Message, 'id' | 'created_at' | 'updated_at'>>;
            };
        };
    };
}