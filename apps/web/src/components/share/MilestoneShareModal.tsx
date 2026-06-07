import { useRef, useState } from "react";
import { Modal } from "@/components/Modal";
import { ShareCard } from "@/components/share/ShareCard";
import { useToast } from "@/components/Toast";
import { shareNodeAsPng } from "@/lib/share-image";

interface MilestoneShareModalProps {
  open: boolean;
  onClose: () => void;
  streakDays: number;
  caption: string;
  /** When present, the user may opt to reveal it; hidden by default. */
  habitName?: string;
  accent?: string;
}

/**
 * G2 share flow: previews the {@link ShareCard} and exports it to PNG.
 * The activity name is hidden by default and only baked into the image
 * if the user toggles it on. Nothing touches the network.
 */
export function MilestoneShareModal({
  open,
  onClose,
  streakDays,
  caption,
  habitName,
  accent,
}: MilestoneShareModalProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [revealName, setRevealName] = useState(false);
  const [busy, setBusy] = useState(false);
  const { showToast } = useToast();

  const onShare = async () => {
    if (!cardRef.current) return;
    setBusy(true);
    try {
      const res = await shareNodeAsPng(cardRef.current, `mottazen-${streakDays}-days.png`, caption);
      if (res.method === "download") showToast("Image saved");
    } catch {
      showToast("Could not create image");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Share milestone">
      <div className="share-modal">
        <div className="share-modal__stage">
          <ShareCard
            ref={cardRef}
            bigNumber={String(streakDays)}
            bigUnit="days"
            caption={caption}
            subtitle={revealName && habitName ? habitName : undefined}
            accent={accent}
            dots={streakDays}
          />
        </div>

        <label className="share-modal__toggle">
          <input
            type="checkbox"
            checked={revealName}
            onChange={(e) => setRevealName(e.target.checked)}
            disabled={!habitName}
          />
          Show activity name
        </label>

        <p className="share-modal__privacy muted-text">
          The activity name stays hidden unless you turn it on. The image is created on your device —
          nothing is uploaded.
        </p>

        <button type="button" className="btn btn--primary btn--block" onClick={onShare} disabled={busy}>
          {busy ? "Preparing…" : "Share image"}
        </button>
      </div>
    </Modal>
  );
}
