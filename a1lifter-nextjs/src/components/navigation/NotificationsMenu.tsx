"use client"

import { useEffect, useRef, useState } from "react"
import { Bell, Loader2, CheckCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  useNotifications,
  useUnreadNotificationsCount,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  Notification,
} from "@/hooks/api/use-notifications"
import { useRealtimeNotifications } from "@/hooks/api/use-realtime"
import { formatDistanceToNow } from "date-fns"
import { toast } from "sonner"

interface NotificationsMenuProps {
  userId: string
}

export function NotificationsMenu({ userId }: NotificationsMenuProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const buttonRef = useRef<HTMLButtonElement | null>(null)

  const { data: notifications = [], isLoading } = useNotifications(userId)
  const { data: unreadFromServer } = useUnreadNotificationsCount(userId)
  const { unreadCount, setUnreadCount } = useRealtimeNotifications(userId)

  const markAsRead = useMarkNotificationRead(userId)
  const markAll = useMarkAllNotificationsRead(userId)

  const [badgeCount, setBadgeCount] = useState(0)

  // Sync real-time state with server snapshots
  useEffect(() => {
    if (typeof unreadFromServer === "number") {
      setBadgeCount(unreadFromServer)
      setUnreadCount(unreadFromServer)
    }
  }, [unreadFromServer, setUnreadCount])

  useEffect(() => {
    setBadgeCount(unreadCount)
  }, [unreadCount])

  // Close when clicking outside
  useEffect(() => {
    if (!open) return

    const handleClick = (event: MouseEvent) => {
      const target = event.target as Node
      if (
        containerRef.current &&
        !containerRef.current.contains(target) &&
        buttonRef.current &&
        !buttonRef.current.contains(target)
      ) {
        setOpen(false)
      }
    }

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClick)
    document.addEventListener("keydown", handleKey)
    return () => {
      document.removeEventListener("mousedown", handleClick)
      document.removeEventListener("keydown", handleKey)
    }
  }, [open])

  const handleMarkRead = async (notification: Notification) => {
    if (notification.isRead) return

    try {
      await markAsRead.mutateAsync({ notificationId: notification.id, isRead: true })
      setUnreadCount((prev) => Math.max(0, prev - 1))
      setBadgeCount((prev) => Math.max(0, prev - 1))
    } catch (error) {
      toast.error("Failed to update notification", {
        description: error instanceof Error ? error.message : "Unknown error",
      })
    }
  }

  const handleMarkAll = async () => {
    try {
      await markAll.mutateAsync()
      setUnreadCount(0)
      setBadgeCount(0)
      toast.success("All notifications marked as read")
    } catch (error) {
      toast.error("Failed to mark notifications", {
        description: error instanceof Error ? error.message : "Unknown error",
      })
    }
  }

  return (
    <div className="relative" ref={containerRef}>
      <Button
        ref={buttonRef}
        variant="ghost"
        size="icon"
        aria-label="Notifications"
        onClick={() => setOpen((prev) => !prev)}
      >
        <Bell className="h-5 w-5" />
        {badgeCount > 0 && (
          <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-red-500 px-1 text-xs font-semibold text-white">
            {badgeCount > 9 ? "9+" : badgeCount}
          </span>
        )}
      </Button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 rounded-md border border-slate-200 bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">Notifications</p>
              <p className="text-xs text-slate-500">Stay up to date with your competitions</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1"
              onClick={handleMarkAll}
              disabled={badgeCount === 0 || markAll.isPending}
            >
              {markAll.isPending ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <CheckCheck className="h-3 w-3" />
              )}
              <span className="sr-only">Mark all read</span>
            </Button>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center gap-2 py-6 text-sm text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading notifications
              </div>
            ) : notifications.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-slate-500">
                Nothing new right now. You’ll see competition updates here.
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {notifications.map((notification) => {
                  const timeAgo = formatDistanceToNow(new Date(notification.createdAt), {
                    addSuffix: true,
                  })

                  return (
                    <li
                      key={notification.id}
                      className={`px-4 py-3 ${notification.isRead ? "bg-white" : "bg-slate-50"}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-slate-900">{notification.title}</p>
                          <p className="text-sm text-slate-600">{notification.message}</p>
                          <span className="text-xs text-slate-400">{timeAgo}</span>
                        </div>
                        {!notification.isRead && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs"
                            onClick={() => handleMarkRead(notification)}
                            disabled={markAsRead.isPending}
                          >
                            Mark read
                          </Button>
                        )}
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
