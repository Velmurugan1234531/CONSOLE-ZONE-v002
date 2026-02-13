"use client";

import { useState, useEffect } from "react";

import { motion } from "framer-motion";
import {
    LayoutDashboard,
    ShoppingBag,
    Palette,
    Globe,
    Users,
    Tag,
    Settings,
    ArrowRight,
    Search,
    Wrench,
    ShieldCheck,
    TrendingUp,
    TrendingDown,
    Activity,
    CreditCard,
    Package,
    ArrowUpRight,
    Clock,
    Monitor,
    ChevronRight,
    Loader2,
    Zap,
    FileText,
    Bell
} from "lucide-react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { getAdminStats, getRevenueAnalytics, RevenueDataPoint, getDashboardActivity } from "@/services/admin";
import { formatDistanceToNow } from "date-fns";
import dynamic from 'next/dynamic';

const DashboardRevenueChart = dynamic(() => import("@/components/admin/AnalyticsCharts").then(mod => mod.DashboardRevenueChart), { ssr: false });
const ActivityBarChart = dynamic(() => import("@/components/admin/AnalyticsCharts").then(mod => mod.ActivityBarChart), { ssr: false });

const ADMIN_MODULES = [
    {
        title: "Trade-In Center",
        description: "Manage sell requests and trade-in values.",
        icon: <Tag size={24} />,
        href: "/admin/buy",
        color: "bg-green-500/10 text-green-500 border-green-500/20"
    },
    {
        title: "Appearance Editor",
        description: "Customize site visuals, colors, and layout.",
        icon: <Palette size={24} />,
        href: "/admin/appearance",
        color: "bg-purple-500/10 text-purple-500 border-purple-500/20"
    },
    {
        title: "Brand & SEO",
        description: "Update site identity, metadata, and footer.",
        icon: <Globe size={24} />,
        href: "/admin/brand",
        color: "bg-pink-500/10 text-pink-500 border-pink-500/20"
    },
    {
        title: "Services Manager",
        description: "Update service offerings and pricing.",
        icon: <Wrench size={24} />,
        href: "/admin/services", // Check if this exists
        color: "bg-orange-500/10 text-orange-500 border-orange-500/20"
    },
    {
        title: "User Management",
        description: "View registered users and permissions.",
        icon: <Users size={24} />,
        href: "/admin/users",
        color: "bg-teal-500/10 text-teal-500 border-teal-500/20"
    }
];

export default function AdminDashboard() {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const { data: stats } = useQuery({
        queryKey: ['adminStats'],
        queryFn: getAdminStats,
        initialData: null
    });

    const { data: revenueData = [] } = useQuery({
        queryKey: ['revenueAnalytics'],
        queryFn: () => getRevenueAnalytics(),
        select: (data) => data.data
    });

    const { data: activity = [] } = useQuery({
        queryKey: ['dashboardActivity'],
        queryFn: getDashboardActivity
    });

    // Loading state is now less critical since we have defaults/initialData, 
    // but for the first load we might want a spinner if crucial data is missing.
    // However, the original code wanted a full blocking load. 
    // With React Query, it's better to show UI skeleton or just let it hydrate.
    // We'll keep a simple check for the critical 'stats' to avoid layout shifts.
    const loading = !stats;

    if (!mounted || loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[#050505]">
                <Loader2 className="animate-spin text-[#8B5CF6]" size={48} />
                <p className="text-gray-500 font-mono text-sm animate-pulse uppercase tracking-widest">Initialising Mission Control...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen text-white space-y-10 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#8B5CF6]/20 border border-[#8B5CF6]/30 flex items-center justify-center">
                            <Zap className="text-[#8B5CF6]" size={24} />
                        </div>
                        <h1 className="text-4xl font-black uppercase italic tracking-tighter">
                            Mission <span className="text-[#8B5CF6]">Control</span>
                        </h1>
                    </div>
                    <p className="text-gray-500 font-mono text-xs uppercase tracking-[0.3em] mt-2 pl-[52px]">
                        System Nexus • <span className="text-emerald-500">Live Feedback Loop</span>
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-white/10 transition-all">
                        <Activity size={14} /> System Logs
                    </button>
                    <button
                        onClick={() => {
                            const products = localStorage.getItem('console_zone_products_v1');
                            if (products) {
                                navigator.clipboard.writeText(products);
                                alert("Data copied to clipboard! Please paste it in the chat.");
                            } else {
                                alert("No local data found to export.");
                            }
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-[#8B5CF6] border border-[#8B5CF6]/30 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-[#7C3AED] transition-all shadow-[0_4px_20px_rgba(139,92,246,0.3)]"
                    >
                        <ArrowUpRight size={14} /> Export Data
                    </button>
                </div>
            </div>

            {/* Triple-Track Quick Stats Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* 1. RENTAL TRACK */}
                <div className="bg-[#0a0a0a] border border-white/5 p-8 rounded-[3rem] relative overflow-hidden group hover:border-blue-500/30 transition-all">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                                <Clock size={24} />
                            </div>
                            <div>
                                <h3 className="text-sm font-black uppercase tracking-widest text-white">Rental Fleet</h3>
                                <p className="text-[10px] text-gray-500 font-mono">Operations Track • 01</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                            <span className="text-[9px] font-black uppercase tracking-widest text-blue-500">Live Fleet</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-8">
                        {[
                            { label: "Active", val: stats?.rentals?.active || 0, color: "text-blue-500" },
                            { label: "Due Today", val: stats?.rentals?.dueToday || 0, color: "text-amber-500" },
                            { label: "Late", val: stats?.rentals?.late || 0, color: "text-red-500" },
                        ].map((item, idx) => (
                            <div key={idx} className="space-y-1">
                                <p className="text-[9px] font-black uppercase tracking-widest text-gray-500">{item.label}</p>
                                <p className={`text-2xl font-black italic ${item.color}`}>{item.val}</p>
                            </div>
                        ))}
                    </div>

                    <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(stats?.rentals?.active / (stats?.rentals?.active + 5)) * 100}%` }}
                            className="h-full bg-blue-500"
                        />
                    </div>
                </div>

                {/* 2. SHOP TRACK */}
                <Link href="/admin/invoices" className="bg-[#0a0a0a] border border-white/5 p-8 rounded-[3rem] relative overflow-hidden group hover:border-emerald-500/30 transition-all">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                                <ShoppingBag size={24} />
                            </div>
                            <div>
                                <h3 className="text-sm font-black uppercase tracking-widest text-white">Retail Shop</h3>
                                <p className="text-[10px] text-gray-500 font-mono">Commerce Track • 02</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[9px] font-black uppercase tracking-widest text-emerald-500">Stock Sync</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-8">
                        {[
                            { label: "Revenue", val: `₹${(stats?.shop?.totalSales || 0).toLocaleString()}`, color: "text-white" },
                            { label: "New Orders", val: stats?.shop?.newOrders || 0, color: "text-emerald-500" },
                            { label: "OOS Items", val: stats?.shop?.outOfStock || 0, color: "text-red-500" },
                        ].map((item, idx) => (
                            <div key={idx} className="space-y-1">
                                <p className="text-[9px] font-black uppercase tracking-widest text-gray-500">{item.label}</p>
                                <p className={`text-xl font-black italic truncate ${item.color}`}>{item.val}</p>
                            </div>
                        ))}
                    </div>

                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
                        <span>Daily Sales Quota</span>
                        <span className="text-white">72%</span>
                    </div>
                </Link>

                {/* 3. SERVICE TRACK */}
                <div className="bg-[#0a0a0a] border border-white/5 p-8 rounded-[3rem] relative overflow-hidden group hover:border-[#8B5CF6]/30 transition-all">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-[#8B5CF6]/10 text-[#8B5CF6] flex items-center justify-center">
                                <Wrench size={24} />
                            </div>
                            <div>
                                <h3 className="text-sm font-black uppercase tracking-widest text-white">Service Desk</h3>
                                <p className="text-[10px] text-gray-500 font-mono">Task Track • 03</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1 bg-[#8B5CF6]/10 border border-[#8B5CF6]/20 rounded-full">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#8B5CF6] animate-pulse" />
                            <span className="text-[9px] font-black uppercase tracking-widest text-[#8B5CF6]">Active Desk</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-8">
                        {[
                            { label: "Active Tickets", val: stats?.services?.activeTickets || 0, color: "text-[#8B5CF6]" },
                            { label: "Appointments", val: stats?.services?.pendingAppointments || 0, color: "text-white" },
                        ].map((item, idx) => (
                            <div key={idx} className="space-y-1">
                                <p className="text-[9px] font-black uppercase tracking-widest text-gray-500">{item.label}</p>
                                <p className={`text-2xl font-black italic ${item.color}`}>{item.val}</p>
                            </div>
                        ))}
                    </div>

                    <div className="flex gap-1.5">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className={`flex-1 h-1.5 rounded-full ${i <= (stats?.services?.activeTickets || 0) ? 'bg-[#8B5CF6]' : 'bg-white/5'}`} />
                        ))}
                    </div>
                </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-[#0a0a0a] border border-white/5 rounded-[3rem] p-8 space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-xl font-black uppercase italic tracking-tight">Revenue Projection</h3>
                            <p className="text-xs font-mono text-gray-500 uppercase tracking-widest">7-Day Financial Trajectory</p>
                        </div>
                        <select className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest outline-none focus:border-[#8B5CF6]">
                            <option>Last 7 Days</option>
                            <option>Last 30 Days</option>
                        </select>
                    </div>

                    <div className="h-[300px] w-full pt-4">
                        <DashboardRevenueChart revenueData={revenueData} />
                    </div>
                </div>

                {/* Triple-Track Heatmap */}
                <div className="bg-[#0a0a0a] border border-white/5 p-8 rounded-[3rem] space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-black uppercase tracking-widest text-white">Triple-Track Heatmap</h3>
                            <p className="text-[10px] text-gray-500 font-mono">Popularity: Rental vs. Sales</p>
                        </div>
                        <Activity size={18} className="text-[#8B5CF6]" />
                    </div>

                    <div className="h-[250px] w-full">
                        <ActivityBarChart data={[
                            { name: "PS5", rentals: 45, sales: 12 },
                            { name: "XBOX", rentals: 32, sales: 8 },
                            { name: "PC", rentals: 15, sales: 55 },
                            { name: "VR", rentals: 25, sales: 10 },
                            { name: "Games", rentals: 80, sales: 95 },
                        ]} />
                    </div>

                    <div className="flex items-center gap-4 text-[9px] font-black uppercase tracking-widest">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-blue-500" />
                            <span className="text-gray-400">Rental Vol</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500" />
                            <span className="text-gray-400">Sales Vol</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-20">
                {/* Recent Activity Feed */}
                <div className="bg-[#0a0a0a] border border-white/5 rounded-[3rem] p-8 space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-black uppercase italic tracking-tight">Activity Feed</h3>
                        <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[9px] font-black uppercase tracking-widest text-emerald-500">Live Sync</span>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {activity.length === 0 ? (
                            <div className="py-12 text-center text-gray-500 italic uppercase text-[10px] tracking-widest">
                                No recent site activity detected
                            </div>
                        ) : (
                            activity.map((item, i) => (
                                <motion.div
                                    key={item.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-[#8B5CF6]/30 transition-all group"
                                >
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${item.type === 'RENTAL' ? 'bg-blue-500/10 text-blue-500' :
                                        item.type === 'SALE' ? 'bg-emerald-500/10 text-emerald-500' :
                                            'bg-[#8B5CF6]/10 text-[#8B5CF6]'
                                        }`}>
                                        {item.type === 'RENTAL' ? <Clock size={18} /> :
                                            item.type === 'SALE' ? <CreditCard size={18} /> :
                                                <ShieldCheck size={18} />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-0.5">
                                            <p className="text-xs font-black uppercase tracking-tight text-white group-hover:text-[#8B5CF6] transition-colors truncate">
                                                {item.title}
                                            </p>
                                            <span className="text-[9px] font-mono text-gray-500 whitespace-nowrap ml-2">
                                                {formatDistanceToNow(new Date(item.date), { addSuffix: true })}
                                            </span>
                                        </div>
                                        <p className="text-[10px] text-gray-500 truncate">{item.description}</p>
                                    </div>
                                    <button className="p-2 text-gray-600 hover:text-white transition-colors">
                                        <ChevronRight size={14} />
                                    </button>
                                </motion.div>
                            ))
                        )}
                    </div>

                    <button className="w-full py-3 border border-white/5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 hover:bg-white/5 hover:text-white transition-all">
                        Synchronise Logs
                    </button>
                </div>

                {/* Subsystems & Comms */}
                <div className="flex flex-col gap-8">
                    {/* Module Quick Nav */}
                    <div className="bg-[#0a0a0a] border border-white/5 rounded-[3rem] p-8 space-y-6 flex-1">
                        <h3 className="text-xl font-black uppercase italic tracking-tight">Command Subsystems</h3>
                        <div className="grid grid-cols-2 gap-4">
                            {[
                                { title: "Trade-In", href: "/admin/buy", icon: <Tag size={18} />, color: "text-green-500" },
                                { title: "Appearance", href: "/admin/appearance", icon: <Palette size={18} />, color: "text-purple-500" },
                                { title: "SEO Hub", href: "/admin/brand", icon: <Globe size={18} />, color: "text-pink-500" },
                                { title: "Ledger", href: "/admin/invoices", icon: <FileText size={18} />, color: "text-[#8B5CF6]" },
                                { title: "User Matrix", href: "/admin/users", icon: <Users size={18} />, color: "text-teal-500" },
                                { title: "Comms Hub", href: "/admin/notifications", icon: <Bell size={18} />, color: "text-blue-500" },
                            ].map((module, i) => (
                                <Link href={module.href} key={i}>
                                    <div className="p-4 bg-white/5 border border-white/5 rounded-2xl flex items-center gap-3 hover:bg-white/10 hover:border-[#8B5CF6]/30 transition-all group">
                                        <div className={`${module.color} group-hover:scale-110 transition-transform`}>{module.icon}</div>
                                        <span className="text-sm font-bold uppercase tracking-tighter">{module.title}</span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* System Broadcast Card */}
                    <div className="bg-gradient-to-br from-[#8B5CF6]/5 to-transparent border border-[#8B5CF6]/10 rounded-[3rem] p-8 flex flex-col justify-center gap-4 relative overflow-hidden group min-h-[160px]">
                        {/* Decorative Scanline Animation */}
                        <motion.div
                            animate={{ y: [0, 200, 0] }}
                            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                            className="absolute inset-x-0 h-px bg-[#8B5CF6]/20 z-0"
                        />
                        <div className="relative z-10 space-y-2">
                            <div className="flex items-center gap-2 text-[#8B5CF6]">
                                <Activity size={18} className="animate-pulse" />
                                <span className="text-xs font-black uppercase tracking-[0.4em]">Broadcast Node</span>
                            </div>
                            <h4 className="text-2xl font-black uppercase italic tracking-tighter leading-none">Global Site Announcement Live</h4>
                        </div>
                        <Link href="/admin/notifications" className="relative z-10 mt-2 bg-white text-black px-6 py-3 rounded-xl font-black uppercase text-xs tracking-[0.2em] w-fit hover:bg-[#8B5CF6] hover:text-white transition-all">
                            DEPLOY COMMS
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
