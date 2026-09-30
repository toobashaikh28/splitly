/**
 * Shrinks a photo in the browser before it is uploaded.
 *
 * Phone photos are often 3 to 8 MB. Hosts such as Vercel reject request bodies
 * over 4.5 MB, and receipts stay perfectly readable at ~1600 px, so we scale the
 * long edge down and re-encode as JPEG. If anything goes wrong (an unsupported
 * format, for example) the original file is returned untouched.
 */
const MAX_SIDE = 1600;
const QUALITY = 0.85;
const SKIP_UNDER_BYTES = 800 * 1024;

export async function shrinkImage(file, { maxSide = MAX_SIDE, quality = QUALITY } = {}) {
  try {
    if (!file || !file.type?.startsWith("image/")) return file;

    // "from-image" applies the camera's rotation so receipts aren't sideways.
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));

    if (scale === 1 && file.size <= SKIP_UNDER_BYTES && file.type === "image/jpeg") {
      bitmap.close?.();
      return file;
    }

    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#fff"; // JPEG has no transparency
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close?.();

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
    if (!blob || blob.size >= file.size) return file; // never make it bigger

    const name = (file.name || "receipt").replace(/\.[^.]+$/, "") + ".jpg";
    return new File([blob], name, { type: "image/jpeg" });
  } catch {
    return file;
  }
}
