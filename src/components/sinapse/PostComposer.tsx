import { useRef, useState } from "react";
import { Image as ImageIcon, Loader2, Trash2, Video, X } from "lucide-react";
import { toast } from "sonner";
import { Avatar } from "./Avatar";
import type { SinapseProfile } from "@/hooks/useAuth";

interface ComposerProps {
  profile: SinapseProfile | null;
  onSubmit: (
    content: string,
    media?: File | null,
  ) => Promise<{ error?: string; warning?: string } | void>;
  onClose: () => void;
}

export const PostComposer = ({ profile, onSubmit, onClose }: ComposerProps) => {
  const [value, setValue] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const submit = async () => {
    const trimmed = value.trim();
    if ((!trimmed && !attachment) || sending) return;
    if (trimmed.length > 2000) {
      toast.error("Post muito longo (máx. 2000)");
      return;
    }
    setSending(true);
    const res = await onSubmit(trimmed, attachment);
    setSending(false);
    if (res && "error" in res && res.error) {
      toast.error(res.error);
    } else {
      if (res && "warning" in res && res.warning) {
        toast.warning(res.warning);
      }
      toast.success("Publicado!");
      setValue("");
      setAttachment(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      onClose();
    }
  };

  const attachmentLabel = attachment
    ? attachment.type.startsWith("video/")
      ? "Vídeo selecionado"
      : "Foto selecionada"
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm">
      <div className="mx-auto mt-16 flex w-full max-w-[440px] flex-col rounded-3xl border border-hairline bg-surface-overlay p-4 shadow-glow">
        <header className="mb-3 flex items-center justify-between">
          <button
            onClick={onClose}
            className="rounded-full p-1.5 hover:bg-secondary"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
          <button
            onClick={submit}
            disabled={(!value.trim() && !attachment) || sending}
            className="flex items-center gap-1.5 rounded-full bg-foreground px-4 py-1.5 text-xs font-semibold text-background disabled:opacity-50"
          >
            {sending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Publicar
          </button>
        </header>

        <div className="flex gap-3">
          <Avatar
            name={profile?.display_name ?? "Você"}
            url={profile?.avatar_url}
            size="sm"
          />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">
              {profile?.display_name ?? "Você"}
            </p>
            <p className="text-[11px] text-text-faint">
              @{profile?.handle ?? "voce"}
            </p>
            <textarea
              autoFocus
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="O que está acontecendo na Módulo?"
              rows={6}
              maxLength={2000}
              className="mt-2 w-full resize-none bg-transparent text-base placeholder:text-text-faint focus:outline-none"
            />
            {attachment && (
              <div className="mb-2 flex items-center justify-between rounded-xl border border-hairline bg-secondary px-3 py-2 text-xs text-text-subtle">
                <span className="flex items-center gap-2 truncate">
                  {attachment.type.startsWith("video/") ? (
                    <Video className="h-4 w-4" />
                  ) : (
                    <ImageIcon className="h-4 w-4" />
                  )}
                  <span className="truncate">
                    {attachmentLabel}: {attachment.name}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setAttachment(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  className="rounded-full p-1 hover:bg-accent"
                  aria-label="Remover anexo"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            )}
            <div className="flex items-center justify-between border-t border-hairline pt-2">
              <label className="flex cursor-pointer items-center gap-1.5 text-text-faint transition-smooth hover:text-foreground">
                <ImageIcon className="h-4 w-4" />
                <span className="text-[11px]">foto/vídeo</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0] ?? null;
                    if (file) {
                      const isImage = file.type.startsWith("image/");
                      const isVideo = file.type.startsWith("video/");
                      if (!isImage && !isVideo) {
                        toast.error("Envie apenas fotos ou vídeos.");
                        event.target.value = "";
                        return;
                      }
                    }
                    setAttachment(file);
                  }}
                  disabled={sending}
                />
              </label>
              <span className="text-[11px] text-text-faint">
                {value.length}/2000
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
