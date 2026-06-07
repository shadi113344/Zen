import { toBlob } from "html-to-image";

/**
 * Render a DOM node to a PNG Blob entirely on-device (G2/G3 share artefacts).
 * Nothing is uploaded — the bytes never leave the browser.
 */
export async function nodeToPngBlob(node: HTMLElement): Promise<Blob> {
  const blob = await toBlob(node, { pixelRatio: 2, cacheBust: true });
  if (!blob) throw new Error("Could not render image");
  return blob;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export interface ShareResult {
  method: "share" | "download";
}

/** Web Share with a file when supported (mobile), else a download fallback. */
export async function shareImage(blob: Blob, filename: string, text?: string): Promise<ShareResult> {
  const file = new File([blob], filename, { type: "image/png" });
  const nav = navigator as Navigator & { canShare?: (data: ShareData) => boolean };
  if (typeof nav.share === "function" && nav.canShare?.({ files: [file] })) {
    try {
      await nav.share({ files: [file], text });
      return { method: "share" };
    } catch (err) {
      // User dismissed the share sheet — treat as done, don't also download.
      if (err instanceof Error && err.name === "AbortError") return { method: "share" };
      // Any other failure: fall through to download.
    }
  }
  downloadBlob(blob, filename);
  return { method: "download" };
}

export async function shareNodeAsPng(
  node: HTMLElement,
  filename: string,
  text?: string,
): Promise<ShareResult> {
  const blob = await nodeToPngBlob(node);
  return shareImage(blob, filename, text);
}
