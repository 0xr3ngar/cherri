class AssertError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "AssertError";
    }
}

const assert: (condition: boolean, message: string) => asserts condition = (
    condition: boolean,
    message: string,
) => {
    if (!condition) {
        throw new AssertError(`Assertion failed: ${message}`);
    }
};

const assertDefined = <T>(value: T | null | undefined, entity: string) => {
    assert(
        value != null || value != null,
        `"${entity}" to have a defined value`,
    );
    return value;
};

export { assertDefined };
