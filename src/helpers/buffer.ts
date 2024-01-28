export function convertToArray(bufferOrArray: Buffer | number[]): number[] | null {
    if (Array.isArray(bufferOrArray)) {
        return bufferOrArray;
    }

    if (!Buffer.isBuffer(bufferOrArray)) {
        return null;
    }

    const result: number[] = [];

    for (let i = 0; i < bufferOrArray.length; i += 4) {
        result.push(bufferOrArray.readFloatLE(i));
    }

    return result;
}
