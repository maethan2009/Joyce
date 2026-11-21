/** Client-side anti-spam helpers (honeypot + minimum submit delay). */

export function createFormGuard(minDelayMs = 2500) {
  const openedAt = Date.now();
  return {
    openedAt,
    /** Hidden honeypot field name — must stay empty */
    honeypotName: 'website_url_confirm' as const,
    validate(honeypotValue: string): string | null {
      if (honeypotValue?.trim()) return 'Soumission rejetée.';
      if (Date.now() - openedAt < minDelayMs) {
        return 'Veuillez patienter quelques secondes avant d’envoyer.';
      }
      return null;
    },
  };
}

export async function compressImageForUpload(
  file: File,
  options: { maxWidth?: number; quality?: number; maxBytes?: number } = {},
): Promise<Blob> {
  const maxWidth = options.maxWidth ?? 1600;
  const quality = options.quality ?? 0.82;
  const maxBytes = options.maxBytes ?? 900_000;

  if (!file.type.startsWith('image/')) return file;

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxWidth / bitmap.width);
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();

  let q = quality;
  let blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', q));
  while (blob && blob.size > maxBytes && q > 0.45) {
    q -= 0.1;
    blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', q));
  }
  return blob ?? file;
}
