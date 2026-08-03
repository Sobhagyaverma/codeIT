import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { copyText, roomCodeOf } from "./roomLinks";
import type { Room } from "./types";

type Props = {
  open: boolean;
  room: Room | null;
  shareUrl: string;
  enterPath?: string;
  onClose: () => void;
};

function CopyIconButton({
  onCopy,
  label,
}: {
  onCopy: () => Promise<boolean>;
  label: string;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      title={copied ? "Copied" : label}
      aria-label={copied ? "Copied" : label}
      onClick={() => {
        void onCopy().then((ok) => {
          if (!ok) return;
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1600);
        });
      }}
      className="flex items-center justify-center rounded-md p-2 text-outline transition-colors hover:bg-primary/10 hover:text-primary"
    >
      <span className="material-symbols-outlined text-[20px]">
        {copied ? "check" : "content_copy"}
      </span>
    </button>
  );
}

/** Stitch invite modal — matches CodeRoom Invite screen. */
export default function InviteModal({
  open,
  room,
  shareUrl,
  enterPath,
  onClose,
}: Props) {
  const navigate = useNavigate();
  const roomCode = room ? roomCodeOf(room) : "";

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !room) return null;

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-center justify-center overflow-hidden font-body-md text-body-md text-on-background antialiased">
      <div className="pointer-events-none absolute inset-0 z-0 bg-[linear-gradient(to_right,rgba(152,141,159,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(152,141,159,0.05)_1px,transparent_1px)] bg-[size:24px_24px]" />
      <div className="pointer-events-none absolute top-[-10%] left-[-10%] z-0 h-[50%] w-[50%] rounded-full bg-primary-container/20 blur-[120px] mix-blend-screen" />
      <div className="pointer-events-none absolute right-[-10%] bottom-[-10%] z-0 h-[60%] w-[60%] rounded-full bg-secondary-container/20 blur-[150px] mix-blend-screen" />
      <button
        type="button"
        aria-label="Close overlay"
        className="absolute inset-0 z-10 bg-background/60 backdrop-blur-md"
        onClick={onClose}
      />

      <div className="relative z-20 mx-margin-mobile w-full max-w-[520px]">
        <div className="relative flex flex-col overflow-hidden rounded-2xl border border-outline-variant/30 bg-surface-container/80 shadow-[0_0_40px_-10px_rgba(183,109,255,0.2)] backdrop-blur-xl">
          <div className="pointer-events-none absolute inset-0 rounded-2xl border border-primary/10" />

          <div className="relative z-10 border-b border-outline-variant/20 px-8 pt-10 pb-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/20 bg-primary-container/10 text-primary">
                  <span className="material-symbols-outlined">
                    rocket_launch
                  </span>
                </div>
                <h2 className="font-headline-lg-mobile text-headline-lg-mobile tracking-tight text-primary md:font-headline-lg md:text-headline-lg">
                  Room created
                </h2>
              </div>
              <div className="flex items-center gap-2 rounded-full border border-outline-variant/30 bg-surface-container-high px-3 py-1.5">
                <div className="h-2 w-2 rounded-full bg-primary-fixed shadow-[0_0_8px_rgba(240,219,255,0.8)]" />
                <span className="font-label-md text-label-md text-[12px] text-primary-fixed">
                  Connected
                </span>
              </div>
            </div>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Invite friends to code together in this CodeRoom.
            </p>
          </div>

          <div className="relative z-10 flex flex-col gap-6 p-8">
            <div>
              <label className="mb-2 block font-label-md text-label-md text-on-tertiary-fixed-variant">
                Room Code
              </label>
              <div className="flex items-center justify-between rounded-lg border border-outline-variant/40 bg-surface-container-highest p-1 pl-4 transition-colors focus-within:border-primary focus-within:shadow-[0_0_0_2px_rgba(183,109,255,0.2)]">
                <span className="font-code-sm text-code-sm tracking-wider text-on-surface">
                  {roomCode}
                </span>
                <CopyIconButton
                  label="Copy Code"
                  onCopy={() => copyText(roomCode)}
                />
              </div>
            </div>
            <div>
              <label className="mb-2 block font-label-md text-label-md text-on-tertiary-fixed-variant">
                Share Link
              </label>
              <div className="flex items-center justify-between rounded-lg border border-outline-variant/40 bg-surface-container-highest p-1 pl-4 transition-colors focus-within:border-primary focus-within:shadow-[0_0_0_2px_rgba(183,109,255,0.2)]">
                <span className="truncate pr-4 font-code-sm text-code-sm text-on-surface">
                  {shareUrl}
                </span>
                <CopyIconButton
                  label="Copy URL"
                  onCopy={() => copyText(shareUrl)}
                />
              </div>
            </div>
          </div>

          <div className="relative z-10 flex flex-col gap-4 px-8 pt-4 pb-10 sm:flex-row">
            <button
              type="button"
              onClick={onClose}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-primary/50 px-6 py-3 font-label-md text-label-md text-primary transition-colors hover:bg-primary/10 sm:w-1/2"
            >
              <span className="material-symbols-outlined text-[20px]">
                close
              </span>
              Close
            </button>
            <button
              type="button"
              onClick={() => {
                if (enterPath) navigate(enterPath);
                onClose();
              }}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary-container px-6 py-3 font-label-md text-label-md font-bold text-on-primary-container shadow-[0_0_20px_rgba(183,109,255,0.15)] transition-all hover:shadow-[0_0_15px_rgba(183,109,255,0.4)] sm:w-1/2"
            >
              Enter CodeRoom
              <span className="material-symbols-outlined text-[20px]">
                arrow_forward
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
