import { getAllMessages } from "@/lib/db";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { MessageActions } from "./message-actions";

export default async function AdminMessagesPage() {
  const messages = await getAllMessages();

  return (
    <div>
      <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Mesajlar</h1>

      <div className="space-y-3 sm:space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`border rounded-lg p-3 sm:p-4 ${
              !msg.is_read ? "bg-blue-50/50 border-blue-200" : ""
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="font-medium text-sm sm:text-base">{msg.name}</span>
                  <span className="text-xs sm:text-sm text-muted-foreground truncate">
                    {msg.email}
                  </span>
                  {!msg.is_read && <Badge variant="default">Yeni</Badge>}
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground mb-2">
                  {format(new Date(msg.created_at), "d MMM yyyy HH:mm", {
                    locale: tr,
                  })}
                </p>
                <p className="text-xs sm:text-sm whitespace-pre-wrap">{msg.message}</p>
              </div>
              <MessageActions id={msg.id} isRead={msg.is_read} />
            </div>
          </div>
        ))}
        {messages.length === 0 && (
          <p className="text-center text-muted-foreground py-8">
            Henüz mesaj bulunmuyor.
          </p>
        )}
      </div>
    </div>
  );
}
