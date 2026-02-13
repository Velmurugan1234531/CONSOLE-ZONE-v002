"use client";

import { useEffect, useState } from "react";
import {
    Search, Loader2, ArrowLeft, LayoutGrid, List as ListIcon,
    Calendar as CalendarIcon, FileText, AlertTriangle, CheckCircle2,
    Clock, Monitor as MonitorIcon, Plus, ChevronRight, TrendingUp,
    Zap, Activity, RefreshCw, Terminal, Monitor, Gamepad2,
    Database, Trash2, Globe, type LucideIcon
} from "lucide-react";
import Link from "next/link";
import { getAllRentals, updateRentalStatus, updateRental } from "@/services/admin";
import { format } from "date-fns";
import dynamic from 'next/dynamic';

const RentalCalendar = dynamic(() => import("@/components/admin/RentalCalendar").then(mod => mod.RentalCalendar), { ssr: false });
const RentalStats = dynamic(() => import("@/components/admin/RentalStats").then(mod => mod.RentalStats), { ssr: false });
const RentalFinancials = dynamic(() => import("@/components/admin/RentalFinancials").then(mod => mod.RentalFinancials), { ssr: false });
const ConsoleStockManager = dynamic(() => import("@/components/admin/ConsoleStockManager").then(mod => mod.ConsoleStockManager), { ssr: false });
const FleetManager = dynamic(() => import("@/components/admin/FleetManager").then(mod => mod.FleetManager), { ssr: false });
const ManualBooking = dynamic(() => import("@/components/admin/ManualBooking").then(mod => mod.ManualBooking), { ssr: false });

import { ReturnModal } from "@/components/admin/ReturnModal";
import { AssignUnitModal } from "@/components/admin/AssignUnitModal";
import { getCatalogSettings, saveCatalogSettings, resetCatalogSettings, type CatalogSettings } from '@/services/catalog-settings';
import { getControllerSettings, saveControllerSettings, resetControllerSettings, type ControllerSettings } from '@/services/controller-settings';
import { getAllDevices } from "@/services/admin";
import { Device } from "@/types";
import { motion, AnimatePresence } from "framer-motion";

type ViewType = 'monitor' | 'ledger' | 'booking' | 'calendar' | 'fleet' | 'engine';

export default function RentalsPage() {
    const [rentals, setRentals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeView, setActiveView] = useState<ViewType>('monitor');
    const [activeTab, setActiveTab] = useState('all');
    const [searchTerm, setSearchTerm] = useState("");

    const [selectedRentalForReturn, setSelectedRentalForReturn] = useState<any>(null);
    const [selectedRentalForAssignment, setSelectedRentalForAssignment] = useState<any>(null);
    const [editingRental, setEditingRental] = useState<any>(null);
    const [isUpdating, setIsUpdating] = useState(false);

    // Engine States
    const [catalogSettings, setCatalogSettings] = useState<CatalogSettings>(getCatalogSettings());
    const [controllerSettings, setControllerSettings] = useState<ControllerSettings>(getControllerSettings());
    const [devices, setDevices] = useState<Device[]>([]);
    const [fleetHealth, setFleetHealth] = useState(0);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const params = new URLSearchParams(window.location.search);
        const view = params.get('view') as ViewType;
        if (view && ['monitor', 'ledger', 'booking', 'calendar', 'fleet', 'engine'].includes(view)) {
            setActiveView(view);
        }
    }, []);

    const fetchRentals = async () => {
        setLoading(true);
        try {
            // We use allSettled to allow one to fail without crashing the other
            const [rentalsResult, devicesResult] = await Promise.allSettled([
                getAllRentals(),
                getAllDevices()
            ]);

            const rentalsData = rentalsResult.status === 'fulfilled' ? rentalsResult.value : [];
            const devicesData = devicesResult.status === 'fulfilled' ? devicesResult.value : [];

            if (rentalsResult.status === 'rejected') {
                console.warn("Rentals fetch failed (using empty fallback):", rentalsResult.reason);
            }

            setRentals(rentalsData || []);
            setDevices(devicesData || []);

            // Calculate average health
            if (devicesData && devicesData.length > 0) {
                const avg = devicesData.reduce((acc: number, d: Device) => acc + (d.health || 0), 0) / devicesData.length;
                setFleetHealth(Math.round(avg));
            }
        } catch (error) {
            console.error("Critical error in fetchRentals:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRentals();
    }, []);

    const handleReturn = async (data: { damageCharges: number; lateFees: number; notes: string }) => {
        if (!selectedRentalForReturn) return;
        try {
            // In a real app, we'd also record the fees and notes
            await updateRentalStatus(selectedRentalForReturn.id, 'completed');
            setSelectedRentalForReturn(null);
            fetchRentals();
            alert("Rental Returned & Stock Released!");
        } catch (error) {
            alert("Failed to update status");
        }
    };

    const handleUpdateRental = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingRental) return;

        setIsUpdating(true);
        try {
            await updateRental(editingRental.id, {
                status: editingRental.status
            });
            await fetchRentals();
            setEditingRental(null);
        } catch (error) {
            console.error("Failed to update rental:", error);
            alert("Error updating rental.");
        } finally {
            setIsUpdating(false);
        }
    };

    const tabs = [
        { id: 'all', label: 'All' },
        { id: 'active', label: 'Active' },
        { id: 'overdue', label: 'Overdue' },
        { id: 'completed', label: 'History' }
    ];

    const filteredRentals = rentals.filter(r => {
        const matchesTab = activeTab === 'all' || r.status === activeTab;
        const matchesSearch = r.user?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.product?.name?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesTab && matchesSearch;
    });

    const activeRentals = rentals.filter(r => r.status === 'active' || r.status === 'overdue');

    if (!mounted) {
        return <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center font-mono text-xs uppercase tracking-[0.4em] animate-pulse">
            Establishing Secure Link...
        </div>;
    }

    return (
        <div className="flex flex-col h-screen overflow-hidden bg-[#050505] text-white">

            {/* Unified Master Topbar */}
            <header className="z-30 bg-[#0a0a0a] border-b border-white/10 shadow-2xl">
                <div className="px-6 py-4 flex flex-col gap-4">
                    {/* Level 1: Identity and Controls */}
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-6">
                            <div>
                                <h1 className="text-xl font-black text-white uppercase tracking-tighter leading-none mb-1">Rental Master Control</h1>
                                <p className="text-[9px] text-gray-500 font-mono flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#06B6D4] animate-pulse"></span>
                                    LIVE DEPLOYMENT TERMINAL
                                </p>
                            </div>

                            {/* View Switcher Taps */}
                            <div className="bg-white/5 p-1 rounded-xl border border-white/10 flex">
                                <button
                                    onClick={() => setActiveView('monitor')}
                                    className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeView === 'monitor' ? 'bg-[#06B6D4] text-black shadow-[0_0_15px_rgba(6,182,212,0.3)]' : 'text-gray-500 hover:text-white'}`}
                                >
                                    <MonitorIcon size={12} /> Monitor
                                </button>
                                <button
                                    onClick={() => setActiveView('ledger')}
                                    className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeView === 'ledger' ? 'bg-[#8B5CF6] text-white shadow-[0_0_15px_rgba(139,92,246,0.3)]' : 'text-gray-500 hover:text-white'}`}
                                >
                                    <ListIcon size={12} /> Ledger
                                </button>
                                <button
                                    onClick={() => setActiveView('booking')}
                                    className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeView === 'booking' ? 'bg-orange-500 text-white shadow-[0_0_15px_rgba(249,115,22,0.3)]' : 'text-gray-500 hover:text-white'}`}
                                >
                                    <Plus size={12} /> New Booking
                                </button>
                                <button
                                    onClick={() => setActiveView('calendar')}
                                    className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeView === 'calendar' ? 'bg-green-500 text-white shadow-[0_0_15px_rgba(34,197,94,0.3)]' : 'text-gray-500 hover:text-white'}`}
                                >
                                    <CalendarIcon size={12} /> Calendar
                                </button>
                                <button
                                    onClick={() => setActiveView('fleet')}
                                    className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeView === 'fleet' ? 'bg-[#8B5CF6] text-white shadow-[0_0_15px_rgba(139,92,246,0.3)]' : 'text-gray-500 hover:text-white'}`}
                                >
                                    <MonitorIcon size={12} /> Fleet Matrix
                                </button>
                                <button
                                    onClick={() => setActiveView('engine')}
                                    className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeView === 'engine' ? 'bg-orange-500 text-white shadow-[0_0_15px_rgba(249,115,22,0.3)]' : 'text-gray-500 hover:text-white'}`}
                                >
                                    <Database size={12} /> Rental Engine
                                </button>
                            </div>
                        </div>

                        {/* Search and Filters */}
                        <div className="flex items-center gap-4">
                            <div className="relative w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
                                <input
                                    placeholder="Filter ledger..."
                                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs outline-none focus:border-white/20 transition-all"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>

                            <Link
                                href="/rental"
                                target="_blank"
                                className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest text-emerald-500 hover:bg-emerald-500/20 transition-all shadow-[0_4px_20px_rgba(16,185,129,0.1)] group"
                            >
                                <Globe size={14} className="group-hover:rotate-12 transition-transform" />
                                Live View
                            </Link>
                        </div>
                    </div>

                    {/* Level 2: Real-time Metrics & Fleet Command */}
                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                        <div className="flex gap-8 items-center">
                            {/* Financial Summary */}
                            <div className="flex flex-col gap-1.5">
                                <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Deployment Health</span>
                                <RentalFinancials variant="topbar" onNavigate={() => setActiveView('ledger')} />
                            </div>

                            <div className="h-10 w-px bg-white/5"></div>

                            {/* Fleet Command */}
                            <div className="flex flex-col gap-1.5 flex-1 max-w-2xl">
                                <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Fleet Command</span>
                                <ConsoleStockManager variant="topbar" onNavigate={() => setActiveView('fleet')} />
                            </div>
                        </div>

                        <div className="flex gap-6 items-center flex-shrink-0 z-20 relative">
                            <HUDIndicator
                                label="Fleet Integrity"
                                value={`${fleetHealth}% SYNC`}
                                active={fleetHealth > 80}
                                color={fleetHealth > 80 ? "blue" : "red"}
                            />
                            <div className="text-right min-w-[60px]">
                                <p className="text-[8px] text-gray-500 font-bold uppercase tracking-widest">Active</p>
                                <p className="text-lg font-black text-[#06B6D4] leading-none">{activeRentals.length}</p>
                            </div>
                            <div className="text-right min-w-[80px]">
                                <p className="text-[8px] text-gray-500 font-bold uppercase tracking-widest">Value</p>
                                <p className="text-lg font-black text-green-500 leading-none">₹{activeRentals.reduce((sum, r) => sum + r.total_price, 0).toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto p-6 relative">
                {loading ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50">
                        <div className="flex flex-col items-center gap-3">
                            <Loader2 className="animate-spin text-[#06B6D4]" size={40} />
                            <p className="text-[10px] uppercase font-black tracking-widest text-[#06B6D4] animate-pulse">Syncing Encrypted Ledger...</p>
                        </div>
                    </div>
                ) : (
                    <>
                        {activeView === 'monitor' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                {activeRentals.map(rental => (
                                    <div key={rental.id} className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-4 hover:border-[#06B6D4]/50 transition-all group relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-24 h-24 bg-[#06B6D4]/5 blur-[40px] -z-10 group-hover:bg-[#06B6D4]/10 transition-colors"></div>
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-xl bg-black overflow-hidden border border-white/10">
                                                    <img src={rental.product?.images?.[0]} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                                </div>
                                                <div>
                                                    <h3 className="text-xs font-bold text-white group-hover:text-[#06B6D4] transition-colors truncate max-w-[120px]">{rental.product?.name}</h3>
                                                    <p className="text-[8px] text-gray-500 font-mono tracking-tighter uppercase">DEPLOYED: {rental.id.slice(0, 8)}</p>
                                                </div>
                                            </div>
                                            <span className={`text-[8px] font-black px-1.5 py-0.5 rounded border ${rental.status === 'overdue' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-[#06B6D4]/10 text-[#06B6D4] border-[#06B6D4]/20'} uppercase tracking-widest`}>
                                                {rental.status}
                                            </span>
                                        </div>

                                        <div className="space-y-2 mb-4">
                                            <div className="flex justify-between text-[9px] uppercase font-bold tracking-widest">
                                                <span className="text-gray-500">Customer</span>
                                                <span className="text-white truncate max-w-[100px]">{rental.user?.full_name}</span>
                                            </div>
                                            <div className="flex justify-between text-[9px] uppercase font-bold tracking-widest">
                                                <span className="text-gray-500">Expiring</span>
                                                <span className="text-orange-400">{format(new Date(rental.end_date), 'MMM dd')}</span>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => setSelectedRentalForReturn(rental)}
                                            className="w-full bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl py-2.5 text-[9px] font-black uppercase tracking-widest transition-all"
                                        >
                                            Process Return
                                        </button>
                                        {!rental.console_id && (
                                            <button
                                                onClick={() => setSelectedRentalForAssignment(rental)}
                                                className="w-full bg-[#8B5CF6]/20 hover:bg-[#8B5CF6]/30 border border-[#8B5CF6]/50 rounded-xl py-2.5 text-[9px] font-black uppercase tracking-widest text-[#8B5CF6] transition-all mt-2 animate-pulse"
                                            >
                                                Assign Unit
                                            </button>
                                        )}
                                    </div>
                                ))}
                                {activeRentals.length === 0 && (
                                    <div className="col-span-full h-96 flex flex-col items-center justify-center text-gray-500 border-2 border-dashed border-white/5 rounded-[2rem]">
                                        <div className="p-6 bg-white/5 rounded-full mb-4 border border-white/5">
                                            <MonitorIcon size={48} className="opacity-20" />
                                        </div>
                                        <p className="font-bold uppercase tracking-[0.3em] text-[10px]">Zero Active Deployments Detected</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeView === 'ledger' && (
                            <div className="animate-in fade-in duration-500">
                                <div className="flex gap-2 mb-6">
                                    {tabs.map(tab => (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id)}
                                            className={`px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all ${activeTab === tab.id ? 'bg-[#8B5CF6] border-[#8B5CF6] text-white shadow-[0_0_10px_rgba(139,92,246,0.2)]' : 'bg-black border-white/10 text-gray-500 hover:border-white/20'}`}
                                        >
                                            {tab.label}
                                        </button>
                                    ))}
                                </div>
                                <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                                    <table className="w-full text-left">
                                        <thead className="bg-[#050505] text-[9px] font-bold text-gray-500 uppercase tracking-widest border-b border-white/5">
                                            <tr>
                                                <th className="p-5 pl-8 text-white/40">Deployment Asset</th>
                                                <th className="p-5">Commander</th>
                                                <th className="p-5">Duration</th>
                                                <th className="p-5">Vitals</th>
                                                <th className="p-5 text-right pr-8">Allocation</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {filteredRentals.map(rental => (
                                                <tr key={rental.id} className="hover:bg-white/[0.02] transition-colors group">
                                                    <td className="p-5 pl-8">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-8 h-8 rounded bg-black border border-white/10 flex-shrink-0">
                                                                <img src={rental.product?.images?.[0]} className="w-full h-full object-cover opacity-60 group-hover:opacity-100" />
                                                            </div>
                                                            <span className="text-xs font-bold text-gray-300 group-hover:text-white transition-colors">{rental.product?.name}</span>
                                                        </div>
                                                    </td>
                                                    <td className="p-5">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-5 h-5 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[8px] font-black text-gray-500">
                                                                {(rental.user?.full_name?.[0] || 'G')}
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="text-xs text-gray-400 group-hover:text-gray-200 transition-colors">
                                                                    {rental.user?.full_name || (() => {
                                                                        if (rental.notes?.includes('[GUEST]')) {
                                                                            const nameMatch = rental.notes.match(/Name: (.*?) \|/);
                                                                            return nameMatch ? nameMatch[1] : "Guest User";
                                                                        }
                                                                        return "Guest";
                                                                    })()}
                                                                </span>
                                                                {!rental.user && rental.notes?.includes('[GUEST]') && (
                                                                    <span className="text-[8px] text-gray-600 font-mono">
                                                                        {(() => {
                                                                            const mobileMatch = rental.notes.match(/Mobile: (.*?) \|/);
                                                                            return mobileMatch ? mobileMatch[1] : "";
                                                                        })()}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-5">
                                                        <div className="flex flex-col gap-0.5">
                                                            <span className="font-mono text-[9px] text-gray-500 uppercase">Window:</span>
                                                            <span className="font-mono text-[10px] text-orange-400/80">
                                                                {format(new Date(rental.start_date), 'dd MMM')} → {format(new Date(rental.end_date), 'dd MMM')}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="p-5">
                                                        <span className={`text-[8px] font-black px-1.5 py-0.5 rounded border uppercase tracking-widest ${rental.status === 'completed' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-blue-500/10 text-blue-500 border-blue-500/20'}`}>
                                                            {rental.status}
                                                        </span>
                                                    </td>
                                                    <td className="p-5 text-right pr-8">
                                                        <div className="flex flex-col items-end gap-1">
                                                            <span className="font-mono font-bold text-green-500 text-sm">₹{rental.total_price.toLocaleString()}</span>
                                                            <button
                                                                onClick={() => setEditingRental({ ...rental })}
                                                                className="text-[9px] font-black uppercase tracking-widest text-gray-500 hover:text-white transition-colors"
                                                            >
                                                                Edit
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {activeView === 'booking' && (
                            <div className="h-full animate-in zoom-in-95 duration-300 w-full max-w-none mx-auto">
                                <ManualBooking onSuccess={() => {
                                    setActiveView('monitor');
                                    fetchRentals();
                                }} />
                            </div>
                        )}

                        {activeView === 'calendar' && (
                            <div className="animate-in fade-in duration-500 bg-[#0a0a0a] rounded-3xl border border-white/10 p-4">
                                <RentalCalendar rentals={rentals} />
                            </div>
                        )}

                        {activeView === 'fleet' && (
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
                                <MasterSection title="Hardware Matrix" description="Direct control over physical rental units and identification data." icon={<Monitor size={24} className="text-[#8B5CF6]" />}>
                                    <div className="bg-white/[0.02] border border-white/5 rounded-[2rem] p-2">
                                        <FleetManager />
                                    </div>
                                </MasterSection>

                                <MasterSection title="Master Directives" description="Issue bulk commands to the entire fleet infrastructure." icon={<Terminal size={24} className="text-red-400" />}>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        <DirectiveButton
                                            label="Global Maintenance Lockdown"
                                            description="Set all Ready units to Maintenance status."
                                            icon={AlertTriangle}
                                            color="red"
                                            onClick={() => {
                                                if (confirm("DANGER: This will pull ALL active units from circulation. Proceed?")) {
                                                    alert("Global Lockdown initiated. Signal transmitted.");
                                                }
                                            }}
                                        />
                                        <DirectiveButton
                                            label="Fleet Integrity Audit"
                                            description="Trigger health recalibration for all hardware."
                                            icon={Activity}
                                            color="blue"
                                            onClick={() => alert("Fleet Audit Signal Broadcasted.")}
                                        />
                                        <DirectiveButton
                                            label="Category Sync"
                                            description="Force sync pricing tiers across all catalog items."
                                            icon={RefreshCw}
                                            color="emerald"
                                            onClick={() => alert("Category Parameters Synchronized.")}
                                        />
                                    </div>
                                </MasterSection>
                            </div>
                        )}

                        {activeView === 'engine' && (
                            <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-8">
                                <MasterSection title="Core Pricing Engine" description="Manage global rental constants and subscription tiers." icon={<Database size={24} className="text-orange-400" />}>
                                    <div className="flex justify-end mb-6">
                                        <button
                                            onClick={() => {
                                                saveCatalogSettings(catalogSettings);
                                                saveControllerSettings(controllerSettings);
                                                alert("Rental Engine parameters saved to system core.");
                                            }}
                                            className="px-6 py-3 bg-[#EE4D2D] text-white text-[10px] font-black rounded-xl uppercase tracking-widest shadow-lg active:scale-95 transition-all"
                                        >
                                            Save Engine Configuration
                                        </button>
                                    </div>
                                    <div className="space-y-6">
                                        {Object.keys(catalogSettings).map(catName => (
                                            <div key={catName} className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-orange-500/30 transition-all">
                                                <div className="flex items-center justify-between mb-6">
                                                    <h4 className="text-white font-black text-sm uppercase tracking-tighter flex items-center gap-3">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></div>
                                                        {catName} Engine Params
                                                    </h4>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                    {(['daily', 'weekly', 'monthly'] as const).map((plan) => {
                                                        const planConfig = (catalogSettings as any)[catName][plan];
                                                        if (!planConfig) return null;

                                                        return (
                                                            <div key={plan} className="p-4 bg-black/40 rounded-xl border border-white/5 space-y-4">
                                                                <div className="flex items-center justify-between pb-2 border-b border-white/5">
                                                                    <label className="text-[9px] text-gray-500 uppercase font-black tracking-widest">{plan} Rate</label>
                                                                    <div className="flex items-center gap-1">
                                                                        <span className="text-[10px] font-mono text-orange-400">₹</span>
                                                                        <input
                                                                            type="number"
                                                                            value={planConfig.price}
                                                                            onChange={(e) => {
                                                                                const newVal = Number(e.target.value);
                                                                                setCatalogSettings(prev => ({
                                                                                    ...prev,
                                                                                    [catName]: { ...prev[catName], [plan]: { ...planConfig, price: newVal } }
                                                                                }));
                                                                            }}
                                                                            className="w-20 bg-transparent text-white text-sm font-black outline-none"
                                                                        />
                                                                    </div>
                                                                </div>
                                                                <textarea
                                                                    placeholder="Plan Features (Bullet points)"
                                                                    rows={4}
                                                                    value={planConfig.features.join('\n')}
                                                                    onChange={(e) => {
                                                                        const newFeatures = e.target.value.split('\n');
                                                                        setCatalogSettings(prev => ({
                                                                            ...prev,
                                                                            [catName]: { ...prev[catName], [plan]: { ...planConfig, features: newFeatures } }
                                                                        }));
                                                                    }}
                                                                    className="w-full bg-transparent p-0 text-gray-400 text-[10px] outline-none resize-none font-mono"
                                                                />
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </MasterSection>

                                <MasterSection title="Peripherals Control" description="Global addon rate calibration." icon={<Gamepad2 size={24} className="text-blue-400" />}>
                                    <div className="bg-white/5 border border-white/10 rounded-[2rem] p-8">
                                        <div className="flex items-center justify-between mb-8">
                                            <div className="space-y-3 flex-1">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Max Allocation Per Client</label>
                                                <input
                                                    type="number"
                                                    value={controllerSettings.maxQuantity}
                                                    onChange={(e) => setControllerSettings({ ...controllerSettings, maxQuantity: Number(e.target.value) })}
                                                    className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold outline-none focus:border-[#3B82F6] transition-all bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"
                                                />
                                            </div>
                                            <button
                                                onClick={() => {
                                                    resetControllerSettings();
                                                    setControllerSettings(getControllerSettings());
                                                    alert("Peripherals Matrix Reset.");
                                                }}
                                                className="px-4 py-2 bg-red-500/10 text-red-500 text-[10px] font-black rounded-lg uppercase tracking-widest hover:bg-red-500/20 transition-all ml-8"
                                            >
                                                Reset Matrix
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <PeripheralPricingCard title="DS4 Core" pricing={controllerSettings.pricing.ps4} onChange={(newP) => setControllerSettings({ ...controllerSettings, pricing: { ...controllerSettings.pricing, ps4: newP } })} />
                                            <PeripheralPricingCard title="DualSense Matrix" pricing={controllerSettings.pricing.ps5} onChange={(newP) => setControllerSettings({ ...controllerSettings, pricing: { ...controllerSettings.pricing, ps5: newP } })} />
                                        </div>
                                    </div>
                                </MasterSection>
                            </div>
                        )}
                    </>
                )}
            </main>

            {/* Modals */}
            {selectedRentalForReturn && (
                <ReturnModal
                    rental={selectedRentalForReturn}
                    onClose={() => setSelectedRentalForReturn(null)}
                    onConfirm={handleReturn}
                />
            )}

            {selectedRentalForAssignment && (
                <AssignUnitModal
                    rental={selectedRentalForAssignment}
                    onClose={() => setSelectedRentalForAssignment(null)}
                    onAssign={() => {
                        setSelectedRentalForAssignment(null);
                        fetchRentals();
                    }}
                />
            )}

            {editingRental && (
                <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-[#0A0A0A] border border-white/10 w-full max-w-md rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
                        <h2 className="text-sm font-black uppercase tracking-widest mb-4 flex items-center gap-2">
                            Edit Rental
                        </h2>
                        <form onSubmit={handleUpdateRental} className="space-y-4">
                            <div>
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Status</label>
                                <select
                                    value={editingRental.status}
                                    onChange={e => setEditingRental({ ...editingRental, status: e.target.value })}
                                    className="w-full bg-black border border-white/10 rounded-xl p-3 text-white text-xs font-bold outline-none focus:border-[#8B5CF6] appearance-none"
                                >
                                    <option value="active">Active</option>
                                    <option value="overdue">Overdue</option>
                                    <option value="completed">Completed</option>
                                    <option value="cancelled">Cancelled</option>
                                </select>
                            </div>
                            <div className="flex gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setEditingRental(null)}
                                    className="flex-1 bg-white/5 hover:bg-white/10 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors text-white"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isUpdating}
                                    className="flex-1 bg-[#8B5CF6] hover:bg-[#7C3AED] py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors disabled:opacity-50 text-white shadow-[0_0_15px_rgba(139,92,246,0.3)]"
                                >
                                    {isUpdating ? "Saving..." : "Save Changes"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

// Shared UI Components from Master Control
function HUDIndicator({ label, value, active, color }: { label: string, value: string, active: boolean, color: 'blue' | 'emerald' | 'orange' | 'red' | 'purple' }) {
    const colors = {
        blue: 'text-blue-400 border-blue-400/20 bg-blue-400/5',
        emerald: 'text-emerald-400 border-emerald-400/20 bg-emerald-400/5',
        orange: 'text-orange-400 border-orange-400/20 bg-orange-400/5',
        red: 'text-red-400 border-red-400/20 bg-red-400/5',
        purple: 'text-[#8B5CF6] border-[#8B5CF6]/20 bg-[#8B5CF6]/5',
    };

    return (
        <div className={`px-4 py-2 rounded-xl border ${colors[color]} flex flex-col gap-0.5 min-w-[120px]`}>
            <span className="text-[8px] font-black uppercase tracking-[0.2em] opacity-60">{label}</span>
            <div className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${active ? 'animate-pulse' : ''} bg-current`}></div>
                <span className="text-[10px] font-black uppercase tracking-widest">{value}</span>
            </div>
        </div>
    );
}

function MasterSection({ title, description, icon, children }: { title: string, description: string, icon: React.ReactNode, children: React.ReactNode }) {
    return (
        <section className="bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] p-8 lg:p-10 relative overflow-hidden group/sec">
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none group-hover/sec:scale-110 transition-transform duration-1000">
                {icon}
            </div>
            <div className="space-y-2 mb-8 border-b border-white/10 pb-6">
                <div className="flex items-center gap-3">
                    {icon}
                    <h2 className="text-xl font-black uppercase tracking-tight italic">{title}</h2>
                </div>
                <p className="text-gray-500 text-xs font-mono uppercase tracking-widest">{description}</p>
            </div>
            {children}
        </section>
    );
}

function DirectiveButton({ label, description, icon: Icon, color, onClick }: { label: string, description: string, icon: LucideIcon, color: 'red' | 'blue' | 'emerald', onClick: () => void }) {
    const colors = {
        red: 'border-red-500/10 hover:border-red-500/30 bg-red-500/5 hover:bg-red-500/10 text-red-500',
        blue: 'border-blue-500/10 hover:border-blue-500/30 bg-blue-500/5 hover:bg-blue-500/10 text-blue-500',
        emerald: 'border-emerald-500/10 hover:border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-500',
    };

    return (
        <button
            onClick={onClick}
            className={`p-6 rounded-3xl border transition-all text-left flex flex-col gap-3 group ${colors[color]}`}
        >
            <div className={`p-3 rounded-xl border ${colors[color]} w-fit group-hover:scale-110 transition-transform`}>
                <Icon size={18} />
            </div>
            <div>
                <h4 className="text-xs font-black uppercase tracking-tight">{label}</h4>
                <p className="text-[9px] opacity-60 font-bold uppercase tracking-widest leading-relaxed mt-1">{description}</p>
            </div>
        </button>
    );
}

function PeripheralPricingCard({ title, pricing, onChange }: { title: string, pricing: any, onChange: (newP: any) => void }) {
    return (
        <div className="space-y-4">
            <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-[pulse_2s_infinite]"></div>
                {title} Peripheral Map
            </h4>
            <div className="space-y-3">
                {['DAILY', 'WEEKLY', 'MONTHLY'].map((plan) => (
                    <div key={plan} className="flex items-center justify-between p-4 bg-black/40 rounded-xl border border-white/5">
                        <label className="text-[10px] text-gray-500 uppercase font-black tracking-widest">{plan}</label>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-mono text-blue-400">₹</span>
                            <input
                                type="number"
                                value={(pricing as any)[plan]}
                                onChange={(e) => onChange({ ...pricing, [plan]: Number(e.target.value) })}
                                className="w-16 bg-transparent text-white text-sm font-black outline-none text-right"
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
