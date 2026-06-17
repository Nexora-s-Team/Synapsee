import { useRef, useState } from "react";
import {
  Image as ImageIcon,
  Loader2,
  Send,
  Trash2,
  Video,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Avatar } from "./Avatar";
import { useComments } from "@/hooks/usePosts";
import { timeAgo } from "@/lib/timeAgo";
import type { User } from "@supabase/supabase-js";

interface CommentsSheetProps {
  postId: string | null;
  currentUser: User | null;
  onClose: () => void;
  onViewProfile?: (userId: string) => void;
}

export const CommentsSheet = ({
  postId,
  currentUser,
  onClose,
  onViewProfile,
}: CommentsSheetProps) => {
  const { comments, loading, add, remove } = useComments(postId, currentUser);
  const [value, setValue] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!postId) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = value.trim();
    if ((!trimmed && !attachment) || sending) return;
    if (trimmed.length > 1000) {
      toast.error("Comentário muito longo (máx. 1000)");
      return;
    }
    setSending(true);
    const res = await add(trimmed, attachment);
    setSending(false);
    if (res?.error) toast.error(res.error);
    else {
      if (res && "warning" in res && res.warning) {
        toast.warning(res.warning);
      }
      setValue("");
      setAttachment(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const attachmentLabel = attachment
    ? attachment.type.startsWith("video/")
      ? "Vídeo selecionado"
      : "Foto selecionada"
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm">
      <div className="mx-auto flex h-[80vh] w-full max-w-[480px] flex-col rounded-t-3xl border-t border-hairline bg-background shadow-glow">
        <header className="flex items-center justify-between border-b border-hairline px-4 py-3">
          <h3 className="font-display text-base font-semibold">Comentários</h3>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 hover:bg-secondary"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-3">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-text-faint" />
            </div>
          ) : comments.length === 0 ? (
            <p className="py-10 text-center text-sm text-text-faint">
              Seja o primeiro a comentar.
            </p>
          ) : (
            <ul className="space-y-4">
              {comments.map((c) => (
                <li key={c.id} className="flex gap-3">
                  <div
                    className="cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => onViewProfile?.(c.user_id)}
                  >
                    <Avatar
                      name={c.author.display_name}
                      url={c.author.avatar_url}
                      size="sm"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div
                        className="flex min-w-0 items-baseline gap-2 cursor-pointer hover:opacity-85 transition-opacity"
                        onClick={() => onViewProfile?.(c.user_id)}
                      >
                        <p className="truncate text-xs font-semibold">
                          {c.author.display_name}
                        </p>
                        <span className="shrink-0 text-[10px] text-text-faint">
                          {timeAgo(c.created_at)}
                        </span>
                      </div>
                      {currentUser?.id === c.user_id && (
                        <button
                          type="button"
                          onClick={async () => {
                            const res = await remove(c.id);
                            if (res?.error) toast.error(res.error);
                          }}
                          className="rounded-full p-1 text-text-faint transition-smooth hover:bg-secondary hover:text-destructive"
                          aria-label="Apagar comentário"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    <p className="mt-0.5 text-sm leading-snug text-foreground/90">
                      {c.content}
                    </p>
                    {c.media_url && (
                      <div className="mt-2 overflow-hidden rounded-xl border border-hairline bg-secondary">
                        {c.media_type?.startsWith("video/") ? (
                          <video
                            src={c.media_url}
                            controls
                            className="max-h-72 w-full bg-black object-contain"
                          />
                        ) : (
                          <img
                            src={c.media_url}
                            alt="Anexo do comentário"
                            className="max-h-72 w-full object-cover"
                          />
                        )}
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <form
          onSubmit={submit}
          className="border-t border-hairline px-3 py-2.5"
        >
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

          <div className="flex items-center gap-2">
            <label className="flex cursor-pointer items-center gap-1.5 rounded-full bg-secondary px-3 py-2 text-xs font-semibold text-text-subtle transition-smooth hover:bg-accent">
              <ImageIcon className="h-4 w-4" />
              Foto/Vídeo
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
            <input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Adicione um comentário…"
              maxLength={1000}
              className="min-w-0 flex-1 rounded-full bg-muted px-4 py-2.5 text-sm placeholder:text-text-faint focus:outline-none"
            />
            <button
              type="submit"
              disabled={(!value.trim() && !attachment) || sending}
              className="grid h-10 w-10 place-items-center rounded-full bg-foreground text-background disabled:opacity-40"
              aria-label="Enviar"
            >
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
