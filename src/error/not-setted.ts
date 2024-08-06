export class NotSettedError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'NotSettedError';
    }
}