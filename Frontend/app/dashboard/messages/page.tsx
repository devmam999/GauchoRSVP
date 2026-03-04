"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ErrorNotice } from "@/components/ui/error-notice";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getCurrentUser } from "@/lib/auth/current-user";
import { ImagePlus, Send, Trash2 } from "lucide-react";

type RegisteredUser = {
  id: string;
  username: string;
  email: string;
};

type MessageThread = {
  userId: string;
  username: string;
  email: string;
  lastMessage: string;
  lastMessageAt: number;
};

type MessageItem = {
  id: string;
  senderId: string;
  recipientId: string;
  text: string;
  imageUrl: string | null;
  createdAt: number;
};

function initials(label: string) {
  return label
    .split(" ")
    .map((part) => part[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function toFriendlyMessageError(rawMessage: string, targetUsername?: string) {
  const fallbackName = targetUsername?.trim() || "This user";
  if (rawMessage.includes("You cannot message this user.")) {
    return `${fallbackName} has blocked you.`;
  }
  if (rawMessage.includes("You blocked this user.")) {
    return `You blocked ${fallbackName}. Unblock them to continue messaging.`;
  }
  return rawMessage;
}

export default function MessagesPage() {
  const apiBaseUrl = process.env.NEXT_PUBLIC_CONVEX_HTTP_URL?.replace(/\/$/, "") ?? "";
  const searchParams = useSearchParams();
  const preselectedUserId = searchParams.get("userId");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [users, setUsers] = useState<RegisteredUser[]>([]);
  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(preselectedUserId);
  const [blockedIds, setBlockedIds] = useState<Set<string>>(new Set());
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [draft, setDraft] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      setError("No active user session found. Please log in again.");
      setLoading(false);
      return;
    }
    setCurrentUserId(user.id);
  }, []);

  useEffect(() => {
    if (!preselectedUserId) return;
    setSelectedUserId(preselectedUserId);
  }, [preselectedUserId]);

  const selectedUser = useMemo(
    () => users.find((user) => user.id === selectedUserId) ?? null,
    [users, selectedUserId]
  );

  useEffect(() => {
    if (!apiBaseUrl || !currentUserId) return;
    const activeUserId = currentUserId;
    let isMounted = true;

    async function loadBaseData() {
      try {
        setLoading(true);
        setError(null);
        const [usersRes, threadsRes, blocksRes] = await Promise.all([
          fetch(`${apiBaseUrl}/friends/registered-users`),
          fetch(`${apiBaseUrl}/message?userId=${encodeURIComponent(activeUserId)}`),
          fetch(`${apiBaseUrl}/block?userId=${encodeURIComponent(activeUserId)}`),
        ]);

        const usersPayload = (await usersRes.json()) as {
          users?: RegisteredUser[];
          error?: string;
        };
        const threadsPayload = (await threadsRes.json()) as {
          threads?: MessageThread[];
          error?: string;
        };
        const blocksPayload = (await blocksRes.json()) as {
          blocked?: Array<{ blockedId: string }>;
          error?: string;
        };

        if (!usersRes.ok) {
          throw new Error(usersPayload.error ?? "Could not fetch users.");
        }
        if (!threadsRes.ok) {
          throw new Error(threadsPayload.error ?? "Could not fetch message threads.");
        }
        if (!blocksRes.ok) {
          throw new Error(blocksPayload.error ?? "Could not fetch block list.");
        }

        if (!isMounted) return;
        const allUsers = (usersPayload.users ?? []).filter((user) => user.id !== activeUserId);
        setUsers(allUsers);
        setThreads(threadsPayload.threads ?? []);
        setBlockedIds(new Set((blocksPayload.blocked ?? []).map((entry) => entry.blockedId)));
        setSelectedUserId((current) => current ?? allUsers[0]?.id ?? null);
      } catch (loadError) {
        if (!isMounted) return;
        const message = loadError instanceof Error ? loadError.message : "Could not load messages.";
        setError(message);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    void loadBaseData();
    return () => {
      isMounted = false;
    };
  }, [apiBaseUrl, currentUserId]);

  useEffect(() => {
    if (!apiBaseUrl || !currentUserId || !selectedUserId) {
      setMessages([]);
      return;
    }
    const activeUserId = currentUserId;
    const activeSelectedUserId = selectedUserId;
    let isMounted = true;

    async function loadConversation() {
      try {
        const res = await fetch(
          `${apiBaseUrl}/message?userId=${encodeURIComponent(
            activeUserId
          )}&otherUserId=${encodeURIComponent(activeSelectedUserId)}`
        );
        const payload = (await res.json()) as { messages?: MessageItem[]; error?: string };
        if (!res.ok) {
          if (isMounted) {
            const pretty = toFriendlyMessageError(
              payload.error ?? "Could not load conversation.",
              selectedUser?.username
            );
            setError(pretty);
          }
          return;
        }
        if (isMounted) {
          setMessages(payload.messages ?? []);
        }
      } catch {
        if (isMounted) {
          setError("Could not load conversation.");
        }
      }
    }

    void loadConversation();
    return () => {
      isMounted = false;
    };
  }, [apiBaseUrl, currentUserId, selectedUserId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const isSelectedBlocked = selectedUserId ? blockedIds.has(selectedUserId) : false;

  const deleteMessage = async (messageId: string) => {
    if (!apiBaseUrl || !currentUserId) return;
    try {
      const res = await fetch(`${apiBaseUrl}/deleteMsg`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUserId,
          messageId,
        }),
      });
      const payload = (await res.json()) as { error?: string };
      if (!res.ok) {
        throw new Error(payload.error ?? "Could not delete message.");
      }
      setMessages((prev) => prev.filter((message) => message.id !== messageId));
    } catch (deleteError) {
      const message =
        deleteError instanceof Error ? deleteError.message : "Could not delete message.";
      setError(message);
    }
  };

  const sendMessage = async () => {
    if (!apiBaseUrl || !currentUserId || !selectedUserId || sending) return;
    if (!draft.trim() && !imageFile) return;
    if (blockedIds.has(selectedUserId)) {
      setError(
        toFriendlyMessageError("You blocked this user.", selectedUser?.username)
      );
      return;
    }

    setSending(true);
    setError(null);
    try {
      if (imageFile) {
        const form = new FormData();
        form.append("senderId", currentUserId);
        form.append("recipientId", selectedUserId);
        if (draft.trim()) {
          form.append("text", draft.trim());
        }
        form.append("image", imageFile);

        const res = await fetch(`${apiBaseUrl}/messageIMG`, {
          method: "POST",
          body: form,
        });
        const payload = (await res.json()) as { error?: string };
        if (!res.ok) {
          throw new Error(payload.error ?? "Could not send image message.");
        }
      } else {
        const res = await fetch(`${apiBaseUrl}/message`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            senderId: currentUserId,
            recipientId: selectedUserId,
            text: draft.trim(),
          }),
        });
        const payload = (await res.json()) as { error?: string };
        if (!res.ok) {
          throw new Error(payload.error ?? "Could not send message.");
        }
      }

      setDraft("");
      setImageFile(null);

      const [conversationRes, threadsRes] = await Promise.all([
        fetch(
          `${apiBaseUrl}/message?userId=${encodeURIComponent(
            currentUserId
          )}&otherUserId=${encodeURIComponent(selectedUserId)}`
        ),
        fetch(`${apiBaseUrl}/message?userId=${encodeURIComponent(currentUserId)}`),
      ]);
      const conversationPayload = (await conversationRes.json()) as { messages?: MessageItem[] };
      const threadsPayload = (await threadsRes.json()) as { threads?: MessageThread[] };
      setMessages(conversationPayload.messages ?? []);
      setThreads(threadsPayload.threads ?? []);
    } catch (sendError) {
      const message =
        sendError instanceof Error ? sendError.message : "Could not send message.";
      setError(toFriendlyMessageError(message, selectedUser?.username));
    } finally {
      setSending(false);
    }
  };

  const handleBlockToggle = async () => {
    if (!apiBaseUrl || !currentUserId || !selectedUserId) return;
    const shouldBlock = !blockedIds.has(selectedUserId);
    const res = await fetch(`${apiBaseUrl}/block`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: shouldBlock ? "block" : "unblock",
        blockerId: currentUserId,
        blockedId: selectedUserId,
      }),
    });
    const payload = (await res.json()) as { error?: string };
    if (!res.ok) {
      setError(payload.error ?? "Could not update block status.");
      return;
    }

    setBlockedIds((prev) => {
      const next = new Set(prev);
      if (shouldBlock) {
        next.add(selectedUserId);
      } else {
        next.delete(selectedUserId);
      }
      return next;
    });
  };

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.16),transparent_40%),radial-gradient(circle_at_top_right,rgba(168,85,247,0.14),transparent_38%),radial-gradient(circle_at_bottom,rgba(14,165,233,0.12),transparent_35%)]" />
      <DashboardHeader />
      <main className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 gap-4 px-3 pb-6 pt-4 sm:px-5 sm:pt-6">
        <section className="w-full max-w-sm rounded-2xl border border-border/70 bg-card/75 p-3 shadow-[0_16px_50px_rgba(0,0,0,0.35)] backdrop-blur-md">
          <h1 className="px-1 pb-3 text-lg font-semibold text-foreground">Messages</h1>
          <ScrollArea className="h-[70vh] pr-2">
            <div className="space-y-2">
              {users.map((user) => {
                const thread = threads.find((item) => item.userId === user.id);
                const active = user.id === selectedUserId;
                return (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => setSelectedUserId(user.id)}
                    className={`w-full rounded-xl border px-3 py-2 text-left transition-all duration-200 hover:scale-[1.01] ${
                      active
                        ? "border-primary/60 bg-primary/10"
                        : "border-border/70 bg-background/40 hover:bg-muted/60"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-medium text-foreground">{user.username}</div>
                      {blockedIds.has(user.id) ? (
                        <span className="text-xs text-destructive">Blocked</span>
                      ) : null}
                    </div>
                    <p className="truncate text-xs text-muted-foreground">
                      {thread?.lastMessage || user.email}
                    </p>
                  </button>
                );
              })}
              {users.length === 0 ? (
                <p className="px-2 py-6 text-sm text-muted-foreground">No other users found.</p>
              ) : null}
            </div>
          </ScrollArea>
        </section>

        <section className="flex min-w-0 flex-1 flex-col rounded-2xl border border-border/70 bg-card/75 shadow-[0_16px_50px_rgba(0,0,0,0.35)] backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
            {selectedUser ? (
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-primary/80 text-primary-foreground">
                    {initials(selectedUser.username)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-foreground">{selectedUser.username}</p>
                  <p className="text-xs text-muted-foreground">{selectedUser.email}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Select a user to start chatting.</p>
            )}
            {selectedUser ? (
              <Button
                variant="outline"
                className="rounded-full"
                onClick={handleBlockToggle}
              >
                {isSelectedBlocked ? "Unblock" : "Block"}
              </Button>
            ) : null}
          </div>

          <ScrollArea className="h-[58vh] px-4 py-4">
            <div className="space-y-3">
              {messages.map((message) => {
                const mine = message.senderId === currentUserId;
                return (
                  <div
                    key={message.id}
                    className={`flex ${mine ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`group relative max-w-[75%] rounded-2xl px-3 py-2 text-sm shadow ${
                        mine
                          ? "bg-primary text-primary-foreground"
                          : "border border-border/70 bg-background/60 text-foreground"
                      }`}
                    >
                      <button
                        type="button"
                        className={`absolute -top-2 ${
                          mine ? "-left-2" : "-right-2"
                        } rounded-full border border-border/70 bg-background/90 p-1 text-muted-foreground opacity-0 transition-opacity duration-200 hover:text-destructive group-hover:opacity-100`}
                        onClick={() => deleteMessage(message.id)}
                        aria-label="Delete message"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                      {message.text ? <p className="whitespace-pre-wrap">{message.text}</p> : null}
                      {message.imageUrl ? (
                        <img
                          src={message.imageUrl}
                          alt="Shared image"
                          className="mt-2 max-h-72 rounded-lg border border-border/60 object-cover"
                        />
                      ) : null}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          <div className="border-t border-border/60 px-3 py-3">
            {error ? (
              <ErrorNotice
                className="mb-2"
                title="Message issue"
                message={error}
                onDismiss={() => setError(null)}
              />
            ) : null}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Input
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder={
                  isSelectedBlocked
                    ? "Unblock this user to send a message."
                    : "Type your message..."
                }
                disabled={!selectedUserId || isSelectedBlocked}
              />
              <label className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-background/60 px-3 py-2 text-xs text-foreground transition-all duration-200 hover:scale-105">
                <ImagePlus className="h-3.5 w-3.5" />
                Image
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={!selectedUserId || isSelectedBlocked}
                  onChange={(event) => setImageFile(event.target.files?.[0] ?? null)}
                />
              </label>
              <Button
                onClick={sendMessage}
                disabled={sending || !selectedUserId || isSelectedBlocked}
                className="gap-1.5 rounded-full"
              >
                <Send className="h-3.5 w-3.5" />
                {sending ? "Sending..." : "Send"}
              </Button>
            </div>
            {imageFile ? (
              <p className="mt-2 text-xs text-muted-foreground">
                Image attached: {imageFile.name}
              </p>
            ) : null}
          </div>
        </section>
      </main>
      {loading ? (
        <div className="pointer-events-none fixed inset-0 z-30 grid place-items-center bg-background/30 backdrop-blur-[1px]">
          <div className="rounded-lg border border-border/60 bg-card/80 px-4 py-2 text-sm text-muted-foreground">
            Loading messages...
          </div>
        </div>
      ) : null}
    </div>
  );
}
