"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, Zap, Check, Trash2, BellOff, X, Info, CheckCircle2, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getNotifications, getUnreadCount, markAsRead, deleteNotification } from "@/services/notifications";
import { Notification, NotificationType } from "@/types";
import { formatDistanceToNow } from "date-fns";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";

export default function NotificationBell() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!auth) return;
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            if (firebaseUser) {
                setUserId(firebaseUser.uid);
                updateCounts(firebaseUser.uid);
            } else {
                const demoUser = localStorage.getItem('DEMO_USER_SESSION');
                if (demoUser) {
                    const uid = JSON.parse(demoUser).id;
                    setUserId(uid);
                    updateCounts(uid);
                } else {
                    setUserId(null);
                    setUnreadCount(0);
                    setNotifications([]);
                }
            }
        });

        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            unsubscribe();
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const updateCounts = async (uid: string) => {
        const count = await getUnreadCount(uid);
        setUnreadCount(count);
    };

    const toggleDropdown = async () => {
        if (!isOpen && userId) {
            setLoading(true);
            setIsOpen(true);
            const data = await getNotifications(userId);
            setNotifications(data.slice(0, 5)); // Only show last 5 in dropdown
            setLoading(false);
        } else {
            setIsOpen(false);
        }
    };

    const handleMarkAsRead = async (id: string) => {
        await markAsRead(id);
        setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
        if (userId) updateCounts(userId);
    };

    const getTypeIcon = (type: NotificationType) => {
        switch (type) {
            case 'success': return <CheckCircle2 size={14} className="text-emerald-400" />;
            case 'warning': return <AlertCircle size={14} className="text-amber-400" />;
            case 'error': return <AlertCircle size={14} className="text-red-400" />;
            default: return <Info size={14} className="text-[#A855F7]" />;
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={toggleDropdown}
                className="relative p-2 text-gray-300 hover:text-[#A855F7] transition-all group"
            >
                <Bell size={20} className="group-hover:rotate-12 transition-transform" />
                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 h-3.5 w-3.5 bg-red-500 text-[8px] font-black text-white rounded-full flex items-center justify-center border-2 border-[#050505] animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 mt-3 w-80 bg-[#0a0a0a]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50"
                    >
                        <div className="px-4 py-3 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-[#A855F7]">Recent Alerts</h3>
                            <Link
                                href="/notifications"
                                onClick={() => setIsOpen(false)}
                                className="text-[9px] font-mono text-gray-500 hover:text-white uppercase"
                            >
                                View All
                            </Link>
                        </div>

                        <div className="max-h-[300px] overflow-y-auto custom-scrollbar p-2">
                            {loading ? (
                                <div className="py-12 flex flex-col items-center justify-center space-y-2">
                                    <Zap className="text-[#A855F7] animate-spin" size={20} />
                                    <span className="text-[9px] font-mono text-gray-600 uppercase">Synchronizing...</span>
                                </div>
                            ) : notifications.length === 0 ? (
                                <div className="py-12 text-center">
                                    <BellOff className="mx-auto text-gray-800 mb-2" size={24} />
                                    <p className="text-[10px] text-gray-600 uppercase font-black">Void Sector • No Alerts</p>
                                </div>
                            ) : (
                                <div className="space-y-1">
                                    {notifications.map((n) => (
                                        <div
                                            key={n.id}
                                            className={`group relative p-3 rounded-xl border transition-all ${n.read ? 'bg-transparent border-transparent' : 'bg-white/[0.03] border-white/5'}`}
                                        >
                                            <div className="flex gap-3">
                                                <div className="mt-0.5">{getTypeIcon(n.type)}</div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <p className={`text-[11px] font-bold truncate ${n.read ? 'text-gray-500' : 'text-white'}`}>
                                                            {n.title}
                                                        </p>
                                                        <span className="text-[8px] font-mono text-gray-600 whitespace-nowrap">
                                                            {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                                                        </span>
                                                    </div>
                                                    <p className={`text-[10px] mt-0.5 line-clamp-2 leading-relaxed ${n.read ? 'text-gray-600' : 'text-gray-400'}`}>
                                                        {n.message}
                                                    </p>
                                                </div>
                                            </div>

                                            {!n.read && (
                                                <button
                                                    onClick={() => handleMarkAsRead(n.id)}
                                                    className="absolute top-2 right-2 p-1.5 bg-black/50 border border-white/5 rounded-md text-[#A855F7] opacity-0 group-hover:opacity-100 transition-all hover:bg-[#A855F7] hover:text-white"
                                                >
                                                    <Check size={10} />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <Link
                            href="/notifications"
                            onClick={() => setIsOpen(false)}
                            className="block py-3 text-center bg-white/[0.03] border-t border-white/5 hover:bg-white/[0.06] transition-all"
                        >
                            <span className="text-[9px] font-black uppercase tracking-widest text-[#A855F7]">Enter Communications Hub</span>
                        </Link>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
