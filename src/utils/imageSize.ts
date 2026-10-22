import { readFileSync } from "node:fs";

/** Intrinsic size of a WebP, JPEG or PNG file, read from its header. */
export function imageSize(path: string): { width: number; height: number } | undefined {
	let b: Buffer;
	try {
		b = readFileSync(path);
	} catch {
		return undefined;
	}
	if (b.toString("ascii", 0, 4) === "RIFF" && b.toString("ascii", 8, 12) === "WEBP") {
		const format = b.toString("ascii", 12, 16);
		if (format === "VP8 ")
			return { width: b.readUInt16LE(26) & 0x3fff, height: b.readUInt16LE(28) & 0x3fff };
		if (format === "VP8L") {
			const bits = b.readUInt32LE(21);
			return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
		}
		if (format === "VP8X")
			return { width: b.readUIntLE(24, 3) + 1, height: b.readUIntLE(27, 3) + 1 };
	}
	if (b[0] === 0x89 && b.toString("ascii", 1, 4) === "PNG") {
		return { width: b.readUInt32BE(16), height: b.readUInt32BE(20) };
	}
	if (b[0] === 0xff && b[1] === 0xd8) {
		// JPEG: walk the segments to the first start-of-frame marker.
		let i = 2;
		while (i + 9 < b.length) {
			const marker = b[i + 1] ?? 0;
			const size = b.readUInt16BE(i + 2);
			if (
				marker >= 0xc0 &&
				marker <= 0xcf &&
				marker !== 0xc4 &&
				marker !== 0xc8 &&
				marker !== 0xcc
			) {
				return { width: b.readUInt16BE(i + 7), height: b.readUInt16BE(i + 5) };
			}
			i += 2 + size;
		}
	}
	return undefined;
}
