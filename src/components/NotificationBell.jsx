import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const containerRef = useRef(null);

  const token = sessionStorage.getItem("token");

  const loadNotifications = useCallback(async () => {
    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/notifications`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Unable to load notifications");
      }

      const data = await response.json();

      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadNotifications();

    const interval = setInterval(loadNotifications, 30000);

    return () => clearInterval(interval);
  }, [loadNotifications]);

  useEffect(() => {
    function handleOutsideClick(event) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  const markAsRead = async (id) => {
    try {
      const response = await fetch(`${API_URL}/notifications/${id}/read`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to mark notification as read");
      }

      await loadNotifications();
    } catch (err) {
      setError(err.message);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch(`${API_URL}/notifications/read-all`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to mark notifications as read");
      }

      await loadNotifications();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      await markAsRead(notification._id);
    }

    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen((previous) => !previous);
          loadNotifications();
        }}
        className="relative flex h-10 w-10 items-center justify-center rounded-full text-[#194C35] hover:bg-[#E7F0DC]"
        aria-label={`Notifications, ${unreadCount} unread`}
        aria-expanded={open}
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
          <path d="M10 21h4" />
        </svg>

        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-[#E2E8DD] bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-[#E2E8DD] px-4 py-3">
            <h3 className="font-semibold text-[#194C35]">Notifications</h3>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="text-xs font-semibold text-[#194C35] hover:underline"
              >
                Mark all as read
              </button>
            )}
          </div>

          {error && (
            <p role="alert" className="px-4 py-2 text-xs text-red-600">
              {error}
            </p>
          )}

          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <p className="p-5 text-center text-sm text-gray-500">
                Loading notifications...
              </p>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-2xl">🔔</p>
                <p className="mt-2 text-sm text-gray-500">
                  No notifications yet
                </p>
              </div>
            ) : (
              notifications.map((notification) => {
                const content = (
                  <div
                    className={`border-b border-gray-100 px-4 py-3 transition hover:bg-[#F3F7EF] ${
                      !notification.isRead ? "bg-[#F0F6EA]" : "bg-white"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {!notification.isRead && (
                        <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[#194C35]" />
                      )}

                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-[#194C35]">
                          {notification.title}
                        </p>

                        <p className="mt-1 text-xs leading-relaxed text-gray-600">
                          {notification.message}
                        </p>

                        <p className="mt-2 text-[11px] text-gray-400">
                          {new Date(notification.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                );

                return notification.link?.startsWith("/") &&
                  !notification.link.startsWith("//") ? (
                  <Link
                    key={notification._id}
                    to={notification.link}
                    onClick={() => handleNotificationClick(notification)}
                    className="block"
                  >
                    {content}
                  </Link>
                ) : (
                  <button
                    key={notification._id}
                    type="button"
                    onClick={() => handleNotificationClick(notification)}
                    className="block w-full text-left"
                  >
                    {content}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
