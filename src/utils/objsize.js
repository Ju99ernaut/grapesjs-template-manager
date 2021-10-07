export function objSizeMegaBytes(obj) {
    return objSizeBytes(obj) / (1024 * 1024);
}

export default function objSizeKiloBytes(obj) {
    return objSizeBytes(obj) / 1024;
}

export function objSizeBytes(obj) {
    return new TextEncoder().encode(JSON.stringify(obj)).length;
}