function getBase64(input: Uint8Array): string {
    if (typeof Buffer !== 'undefined') {
        return Buffer.from(input).toString('base64');
    }

    let binary = '';
    for (const byte of input) {
        binary += String.fromCharCode(byte);
    }
    return btoa(binary);
}

function fromBase64(base64: string): Uint8Array {
    if (typeof Buffer !== 'undefined') {
        return new Uint8Array(Buffer.from(base64, 'base64'));
    }

    const binary = atob(base64);
    return Uint8Array.from(binary, char => char.charCodeAt(0));
}

export function encodeBase64Url(value: string): string {
    const bytes = new TextEncoder().encode(value);
    return getBase64(bytes)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/g, '');
}

export function decodeBase64Url(value: string): string {
    const base64 = value
        .replace(/-/g, '+')
        .replace(/_/g, '/')
        .padEnd(Math.ceil(value.length / 4) * 4, '=');
    const bytes = fromBase64(base64);
    return new TextDecoder().decode(bytes);
}
