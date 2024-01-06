export type Action = 'create' | 'join' | 'watch';

export interface IControllerPayload {
    title: string;
    year: string;
    action?: Action;
    ai?: boolean;
    host?: boolean;
    roomId?: string;
}
