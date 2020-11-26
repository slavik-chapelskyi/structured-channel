export type MessageType = 'x-channel-internal-reply' | 'x-channel-internal-hello' | string;

export type MessagePayload = string | number | any[] | Record<string, any>;

export interface MessageData {
  id: number;
  type: MessageType;
  payload?: MessagePayload;
  error?: any;
  result?: Record<string, any>;
}
