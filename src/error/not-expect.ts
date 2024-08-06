export class NotExpectError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'NotExpectError';
    }
}