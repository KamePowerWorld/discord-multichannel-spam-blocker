export class NotExpectError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "NotExpectError";
    }
}

export class NotFoundError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "NotFoundError";
    }
}

export class NotReadyError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'NotReadyError';
    }
}

export class NotSettedError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "NotSettedError";
    }
}
