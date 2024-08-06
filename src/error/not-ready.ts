export class NotReadyError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'NotReadyError';
    }
}