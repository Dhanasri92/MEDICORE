import React, { useState, useEffect } from 'react';
import {
  Search,
  Bell,
  MessageSquare,
  ChevronDown,
  Menu,
  LogOut,
  User as UserIcon,
  Check,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../api/client.js';
import { Notification } from '../../types/index.js';

interface TopbarProps {
  onToggleSidebar: () => void;
  onSearch?: (query: string) => void;
}

export const Topbar: React.FC<TopbarProps> = ({ onToggleSidebar, onSearch }) => {
  const { user, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    async function fetchNotifications() {
      if (!user) return;
      try {
        const res = await api.get('/notifications');
        if (res.success) {
          setNotifications(res.data.notifications || []);
          setUnreadCount(res.data.unreadCount || 0);
        }
      } catch {
        // ignore
      }
    }
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, [user]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // ignore
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.post('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      // ignore
    }
  };

  return (
    <header className="sticky top-0 z-30 h-20 bg-white/80 backdrop-blur-md border-b border-[#E9EDF2] px-6 flex items-center justify-between transition-all">
      {/* Left: Mobile Toggle & Global Search Bar */}
      <div className="flex items-center gap-4 flex-1 max-w-xl">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-xl text-[#9298A1] hover:text-[#171B22] hover:bg-[#F5F6F8] transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Search Input matching MediKit */}
        <div className="relative w-full max-w-md hidden sm:block">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9298A1]" />
          <input
            type="text"
            placeholder="Search for Files, Patient or Files"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (onSearch) onSearch(e.target.value);
            }}
            className="w-full pl-11 pr-4 py-2.5 rounded-full bg-[#F5F6F8] border-none text-xs font-medium text-[#171B22] placeholder-[#9298A1] focus:outline-none focus:ring-2 focus:ring-[#329BFA]/30 transition-all"
          />
        </div>
      </div>

      {/* Right: Message, Notification, Profile */}
      <div className="flex items-center gap-3">
        {/* Message Bubble Icon */}
        <button
          className="w-10 h-10 rounded-full bg-[#F5F6F8] hover:bg-[#E9EDF2] flex items-center justify-center text-[#171B22] transition-colors"
          title="Direct Messages"
        >
          <MessageSquare className="w-4 h-4 text-[#171B22]" />
        </button>

        {/* Notifications Icon with Badge */}
        <div className="relative">
          <button
            onClick={() => setShowNotifMenu(!showNotifMenu)}
            className="w-10 h-10 rounded-full bg-[#F5F6F8] hover:bg-[#E9EDF2] flex items-center justify-center text-[#171B22] transition-colors relative"
            title="Notifications"
          >
            <Bell className="w-4 h-4 text-[#171B22]" />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#FF5E7E] ring-2 ring-white" />
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifMenu && (
            <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-2xl border border-[#E9EDF2] py-3 z-50 animate-fade-in">
              <div className="flex items-center justify-between px-4 pb-2 border-b border-[#F0F3F7]">
                <span className="text-xs font-bold text-[#171B22]">Notifications</span>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[11px] font-semibold text-[#329BFA] hover:underline"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-[#F5F6F8]">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-xs text-[#9298A1]">
                    No new notifications
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => handleMarkAsRead(n.id)}
                      className={`p-3 text-xs cursor-pointer hover:bg-[#F8FAFC] transition-colors ${
                        !n.isRead ? 'bg-[#EBF5FE]/40' : ''
                      }`}
                    >
                      <div className="font-bold text-[#171B22] flex items-center justify-between">
                        <span>{n.title}</span>
                        {!n.isRead && (
                          <span className="w-1.5 h-1.5 rounded-full bg-[#329BFA]" />
                        )}
                      </div>
                      <p className="text-[11px] text-[#9298A1] mt-0.5 leading-relaxed">{n.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Widget */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-3 pl-2 pr-1 py-1 rounded-full hover:bg-[#F5F6F8] transition-colors"
          >
            {/* Avatar image */}
            <div className="w-10 h-10 rounded-full overflow-hidden bg-[#329BFA]/10 shrink-0 border border-[#E9EDF2]">
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.firstName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-bold text-xs text-[#329BFA]">
                  {user?.firstName?.[0]}
                  {user?.lastName?.[0]}
                </div>
              )}
            </div>

            {/* User name & role label */}
            <div className="text-left hidden md:block">
              <div className="text-xs font-bold text-[#171B22] leading-tight">
                {user?.role === 'DOCTOR' ? `Dr. ${user.firstName}` : `${user?.firstName} ${user?.lastName}`}
              </div>
              <div className="text-[11px] font-medium text-[#9298A1]">
                {user?.role === 'ADMIN' ? 'Admin' : user?.role === 'DOCTOR' ? 'Doctor' : 'Patient'}
              </div>
            </div>

            <ChevronDown className="w-4 h-4 text-[#9298A1] mr-1 hidden md:block" />
          </button>

          {/* Profile Dropdown */}
          {showProfileMenu && (
            <div className="absolute right-0 mt-3 w-52 bg-white rounded-2xl shadow-2xl border border-[#E9EDF2] py-2 z-50 animate-fade-in">
              <div className="px-4 py-2 border-b border-[#F0F3F7]">
                <p className="text-xs font-bold text-[#171B22]">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-[11px] text-[#9298A1] truncate">{user?.email}</p>
              </div>

              <button
                onClick={() => {
                  setShowProfileMenu(false);
                  logout();
                }}
                className="w-full text-left px-4 py-2.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
