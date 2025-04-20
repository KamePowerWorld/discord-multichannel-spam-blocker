/**
 *
 */
export class NotExpectError extends Error {
    /**
     *
     * @param message
     */
    constructor(message: string) {
        super(message);
        this.name = 'NotExpectError';
    }
}

/**
 *
 */
export class NotFoundError extends Error {
    /**
     *
     * @param message
     */
    constructor(message: string) {
        super(message);
        this.name = 'NotFoundError';
    }
}

/**
 *
 */
export class NotReadyError extends Error {
    /**
     *
     * @param message
     */
    constructor(message: string) {
        super(message);
        this.name = 'NotReadyError';
    }
}

/**
 *
 */
export class NotSettedError extends Error {
    /**
     *
     * @param message
     */
    constructor(message: string) {
        super(message);
        this.name = 'NotSettedError';
    }
}
