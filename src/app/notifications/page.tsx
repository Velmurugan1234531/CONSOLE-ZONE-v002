"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Bell,
    CheckCircle2,
    AlertCircle,
    Info,
    X,
    Trash2,
    Check,
    BellOff,
    Zap,
    Circle
} from "lucide-react";
import { getNotifications, markAsRead, markAllAsRead, deleteNotification } from "@/services/notifications";
import { Notification, NotificationType } from "@/types";
import { formatDistanceToNow } from "date-fns";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [userId, setUserId] = useState<string | null>(null);

    useEffect(() => {
        if (!auth) {
            setLoading(false);
            return;
        }
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            if (firebaseUser) {
                setUserId(firebaseUser.uid);
                loadNotifications(firebaseUser.uid);
            } else {
                const demoUser = localStorage.getItem('DEMO_USER_SESSION');
                if (demoUser) {
                    const uid = JSON.parse(demoUser).id;
                    setUserId(uid);
                    loadNotifications(uid);
                } else {
                    setLoading(false);
                }
            }
        });
        return () => unsubscribe();
    }, []);

    const loadNotifications = async (uid?: string) => {
        setLoading(true);
        try {
            const data = await getNotifications(uid || userId || undefined);
            setNotifications(data);
        } catch (error) {
            console.error("NotificationsPage: loadNotifications failed:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAsRead = async (id: string) => {
        try {
            await markAsRead(id);
            setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
        } catch (error) {
            console.error(error);
        }
    };

    const handleMarkAllRead = async () => {
        if (!userId) return;
        try {
            await markAllAsRead(userId);
            setNotifications(notifications.map(n => ({ ...n, read: true })));
        } catch (error) {
            console.error(error);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await deleteNotification(id);
            setNotifications(notifications.filter(n => n.id !== id));
        } catch (error) {
            console.error(error);
        }
    };

    const getTypeStyles = (type: NotificationType, read: boolean) => {
        if (read) return 'text-gray-500 bg-white/[0.02] border-white/5';
        switch (type) {
            case 'success': return 'text-emerald-400 bg-emerald-400/5 border-emerald-400/20 shadow-[0_0_15px_rgba(52,211,153,0.1)]';
            case 'warning': return 'text-amber-400 bg-amber-400/5 border-amber-400/20 shadow-[0_0_15px_rgba(251,191,36,0.1)]';
            case 'error': return 'text-red-400 bg-red-400/5 border-red-400/20 shadow-[0_0_15px_rgba(248,113,113,0.1)]';
            default: return 'text-[#8B5CF6] bg-[#8B5CF6]/5 border-[#8B5CF6]/20 shadow-[0_0_15px_rgba(139,92,246,0.1)]';
        }
    };

    const getTypeIcon = (type: NotificationType) => {
        switch (type) {
            case 'success': return <CheckCircle2 size={18} />;
            case 'warning': return <AlertCircle size={18} />;
            case 'error': return <AlertCircle size={18} />;
            default: return <Info size={18} />;
        }
    };

    return (
        <div className="min-h-screen bg-black text-white p-6 md:p-12 pb-32 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-12">
                <div>
                    <h1 className="text-4xl font-black italic uppercase tracking-tighter flex items-center gap-4">
                        <Bell className="text-[#8B5CF6]" size={32} />
                        Nexus <span className="text-[#8B5CF6]">Alerts</span>
                    </h1>
                    <p className="text-gray-500 font-mono text-xs uppercase tracking-[0.3em] mt-2">
                        System Feed • <span className="text-emerald-500">Live Sync</span>
                    </p>
                </div>

                {notifications.some(n => !n.read) && (
                    <button
                        onClick={handleMarkAllRead}
                        className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:border-[#8B5CF6]/50 transition-all group"
                        title="Mark all as read"
                    >
                        <Check className="text-gray-400 group-hover:text-[#8B5CF6]" size={20} />
                    </button>
                )}
            </div>

            {/* List */}
            <div className="space-y-4">
                {loading ? (
                    <div className="py-20 flex flex-col items-center justify-center space-y-4">
                        <Zap className="text-[#8B5CF6] animate-pulse" size={32} />
                        <p className="font-mono text-[10px] text-gray-500 uppercase tracking-widest">Scanning Signal Frequencies...</p>
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="py-20 flex flex-col items-center justify-center space-y-4 bg-[#050505] border border-dashed border-white/5 rounded-3xl">
                        <BellOff className="text-gray-700" size={48} />
                        <p className="font-mono text-xs text-gray-500 uppercase tracking-widest text-center">
                            Void Detected.<br />
                            <span className="text-[10px] opacity-50">No active transmissions in this sector.</span>
                        </p>
                    </div>
                ) : (
                    <AnimatePresence mode="popLayout">
                        {notifications.map((n, index) => (
                            <motion.div
                                key={n.id}
                                layout
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ delay: index * 0.05 }}
                                className={`group relative p-6 rounded-[2rem] border transition-all ${getTypeStyles(n.type, n.read)}`}
                            >
                                <div className="flex gap-5">
                                    <div className="mt-1">
                                        {getTypeIcon(n.type)}
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <div className="flex items-center justify-between">
                                            <h3 className={`text-sm font-black uppercase tracking-tight ${n.read ? 'text-gray-400' : 'text-white'}`}>
                                                {n.title}
                                            </h3>
                                            <span className="text-[10px] font-mono opacity-40 uppercase">
                                                {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                                            </span>
                                        </div>
                                        <p className={`text-xs leading-relaxed ${n.read ? 'text-gray-600' : 'text-gray-400'}`}>
                                            {n.message}
                                        </p>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="absolute top-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {!n.read && (
                                        <button
                                            onClick={() => handleMarkAsRead(n.id)}
                                            className="p-2 bg-black/50 border border-white/5 rounded-lg text-[#8B5CF6] hover:bg-[#8B5CF6] hover:text-white transition-all shadow-xl"
                                        >
                                            <Check size={14} />
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleDelete(n.id)}
                                        className="p-2 bg-black/50 border border-white/5 rounded-lg text-gray-500 hover:text-red-500 transition-all"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>

                                {/* Unread Indicator Dot */}
                                {!n.read && (
                                    <div className="absolute -left-1 top-1/2 -translate-y-1/2">
                                        <div className="w-2 h-8 rounded-full bg-[#8B5CF6] blur-[2px] opacity-50" />
                                        <Circle className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[#8B5CF6] fill-[#8B5CF6]" size={8} />
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </AnimatePresence>
                )}
            </div>

            {/* Background Grain/FX */}
            <div className="fixed inset-0 pointer-events-none z-[-1] opacity-20">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] brightness-100 contrast-150" />
            </div>
        </div>
    );
}
