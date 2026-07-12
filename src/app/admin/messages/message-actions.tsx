"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface MessageActionsProps {
  id: string;
  isRead: boolean;
}

export function MessageActions({ id, isRead }: MessageActionsProps) {
  const router = useRouter();

  async function markAsRead() {
    const response = await fetch("/api/messages", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });

    if (!response.ok) {
      toast.error("Bir hata oluştu.");
    } else {
      router.refresh();
    }
  }

  async function handleDelete() {
    const response = await fetch(`/api/messages?id=${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      toast.error("Bir hata oluştu.");
    } else {
      toast.success("Mesaj silindi.");
      router.refresh();
    }
  }

  return (
    <div className="flex gap-1">
      {!isRead && (
        <Button variant="ghost" size="sm" onClick={markAsRead}>
          Okundu
        </Button>
      )}
      <Button
        variant="ghost"
        size="sm"
        className="text-destructive hover:text-destructive"
        onClick={handleDelete}
      >
        Sil
      </Button>
    </div>
  );
}
