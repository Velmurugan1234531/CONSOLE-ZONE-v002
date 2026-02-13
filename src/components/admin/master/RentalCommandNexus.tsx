"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Activity, AlertTriangle, Play, Pause, Shield, Zap,
    Crosshair, Terminal, Radio, Globe, BarChart3,
    Battery, BatteryCharging, AlertOctagon, Lock, Unlock,
    TrendingUp, Users, Calendar
} from "lucide-react";
import { Device, Rental } from "@/types";
import { getAllRentals, getAllDevices } from "@/services/admin";
import { format } from "date-fns";
import dynamic from 'next/dynamic';

const InventoryForecastChart = dynamic(() => import("@/components/admin/AnalyticsCharts").then(mod => mod.InventoryForecastChart), { ssr: false });
import { CommandNexusCard } from "../CommandNexusCard";

export function RentalCommandNexus() {
    const [devices, setDevices] = useState<Device[]>([]);
    const [rentals, setRentals] = useState<Rental[]>([]);
    const [loading, setLoading] = useState(true);

    // Command States
    const [lockdownMode, setLockdownMode] = useState(false);
    const [surgePricing, setSurgePricing] = useState(false);
    const [recoveryMode, setRecoveryMode] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [d, r] = await Promise.all([getAllDevices(), getAllRentals()]);
            setDevices(d || []);
            setRentals(r || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    // Derived Metrics
    const totalFleet = devices.length;
    const activeRentals = rentals.filter(r => r.status === 'active').length;
    const overdueRentals = rentals.filter(r => r.status === 'overdue').length;
    const utilization = totalFleet > 0 ? Math.round((activeRentals / totalFleet) * 100) : 0;

    const availableStock = devices.filter(d => d.status?.toLowerCase() === 'ready').length;

    if (!mounted) return null;

    // Grid Status Color
    const getGridStatus = (device: Device) => {
        if (device.status?.toLowerCase() === 'rented') return 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.6)] animate-pulse';
        if (device.status?.toLowerCase() === 'ready') return 'bg-emerald-500';
        if (device.status?.toLowerCase() === 'maintenance') return 'bg-amber-500';
        return 'bg-red-500 animate-pulse';
    };

    if (loading) return <div className="text-center py-20 text-[#8B5CF6] font-mono animate-pulse uppercase tracking-[0.3em]">Initializing Nexus Uplink...</div>;

    return (
        <div className="space-y-12 animate-in fade-in duration-500">
            {/* Top HUD */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <MetricCard
                    label="Fleet Utilization"
                    value={`${utilization}%`}
                    icon={Activity}
                    color="text-[#8B5CF6]"
                    detail={`${activeRentals} / ${totalFleet} Units Active`}
                />
                <MetricCard
                    label="Deployment Readiness"
                    value={availableStock.toString()}
                    icon={Zap}
                    color="text-emerald-500"
                    detail="Units Standing By"
                />
                <MetricCard
                    label="Critical Alerts"
                    value={overdueRentals.toString()}
                    icon={AlertTriangle}
                    color="text-red-500"
                    detail="Overdue / Maintenance"
                    alert={overdueRentals > 0}
                />
                <MetricCard
                    label="Projected Revenue"
                    value="₹12.4k"
                    icon={TrendingUp}
                    color="text-blue-500"
                    detail="Next 24 Hours (Est.)"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* LEFT: Fleet Overwatch (The Grid) */}
                <div className="lg:col-span-2">
                    <CommandNexusCard title="Fleet Overwatch" subtitle="Real-time global position of localized hardware units" icon={Crosshair} statusColor="blue">
                        <div className="flex justify-between items-center mb-6 mt-6">
                            <div className="flex gap-4">
                                <span className="flex items-center gap-1 text-[9px] uppercase font-black text-emerald-500"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Ready</span>
                                <span className="flex items-center gap-1 text-[9px] uppercase font-black text-blue-500"><div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" /> Active</span>
                                <span className="flex items-center gap-1 text-[9px] uppercase font-black text-amber-500"><div className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Maint.</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-8 md:grid-cols-12 gap-2 h-[250px] overflow-y-auto custom-scrollbar p-2 bg-black/40 rounded-3xl border border-white/5">
                            {devices.map((device, i) => (
                                <TooltipWrapper key={device.id} content={`${device.model} (${device.serialNumber}) - ${device.status}`}>
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ delay: i * 0.005 }}
                                        className={`aspect-square rounded-md ${getGridStatus(device)} opacity-80 hover:opacity-100 hover:scale-125 transition-all cursor-pointer border border-black/20`}
                                    />
                                </TooltipWrapper>
                            ))}
                        </div>
                    </CommandNexusCard>
                </div>

                {/* RIGHT: Command Protocols */}
                <div>
                    <CommandNexusCard title="Command Protocols" subtitle="Define automated matching constraints" icon={Shield} statusColor="red">
                        <div className="flex flex-col gap-4 mt-6">
                            <CommandSwitch
                                label="LOCKDOWN MODE"
                                desc="Halt all new outbound rentals"
                                active={lockdownMode}
                                onClick={() => setLockdownMode(!lockdownMode)}
                                color="red"
                            />
                            <CommandSwitch
                                label="SURGE PRICING"
                                desc="+10% Dynamic Rate Adjustment"
                                active={surgePricing}
                                onClick={() => setSurgePricing(!surgePricing)}
                                color="orange"
                            />
                            <CommandSwitch
                                label="RECOVERY OPS"
                                desc="Auto-dispatch overdue notices"
                                active={recoveryMode}
                                onClick={() => setRecoveryMode(!recoveryMode)}
                                color="blue"
                            />
                        </div>
                    </CommandNexusCard>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-20">
                {/* Live Operations Log */}
                <CommandNexusCard title="Live Operation Feed" subtitle="Real-time terminal transmission of fleet events" icon={Terminal} statusColor="emerald">
                    <div className="h-[250px] flex flex-col mt-6">
                        <div className="flex-1 overflow-y-auto font-mono text-[10px] space-y-2 p-4 custom-scrollbar bg-black/60 rounded-3xl border border-white/10">
                            {rentals.slice(0, 20).map((rental, i) => (
                                <div key={rental.id} className="flex gap-2 text-gray-500 border-b border-white/5 pb-1">
                                    <span className="text-blue-500/50">[{format(new Date(rental.start_date), 'HH:mm:ss')}]</span>
                                    <span className={rental.status === 'overdue' ? 'text-red-500 font-black' : 'text-gray-400'}>
                                        {rental.status === 'overdue' ? 'ALRT »' : 'INFO »'} RENTAL_ID:{rental.id.slice(0, 8).toUpperCase()} IS_{rental.status.toUpperCase()}
                                    </span>
                                </div>
                            ))}
                            {rentals.length === 0 && (
                                <div className="p-12 text-center text-gray-700 animate-pulse italic uppercase tracking-widest font-black">
                                    Scanning for data transmissions...
                                </div>
                            )}
                        </div>
                    </div>
                </CommandNexusCard>

                {/* Predictive Logistics */}
                <CommandNexusCard title="Inventory Forecast" subtitle="Predictive modelling of asset availability" icon={TrendingUp} statusColor="blue">
                    <div className="h-[250px] w-full mt-6 bg-black/40 rounded-3xl p-6 border border-white/5">
                        <InventoryForecastChart />
                    </div>
                </CommandNexusCard>
            </div>
        </div>
    );
}

// --- Sub-components ---

function MetricCard({ label, value, icon: Icon, color, detail, alert }: any) {
    return (
        <div className={`bg-[#0A0A0A] border ${alert ? 'border-red-500/50 animate-pulse bg-red-900/10' : 'border-white/10'} rounded-2xl p-5 flex items-center gap-4 relative overflow-hidden group`}>
            <div className={`p-3 rounded-xl bg-white/5 ${color} group-hover:scale-110 transition-transform`}>
                <Icon size={24} />
            </div>
            <div>
                <div className="text-gray-500 text-[10px] uppercase font-black tracking-widest">{label}</div>
                <div className={`text-2xl font-black ${color} tracking-tighter`}>{value}</div>
                <div className="text-gray-600 text-[9px] uppercase font-bold mt-1">{detail}</div>
            </div>
        </div>
    );
}

function CommandSwitch({ label, desc, active, onClick, color }: any) {
    const colors: any = {
        red: 'bg-red-500 shadow-red-500/50',
        amber: 'bg-amber-500 shadow-amber-500/50',
        blue: 'bg-blue-500 shadow-blue-500/50',
    };

    return (
        <button
            onClick={onClick}
            className={`flex items-center justify-between p-4 rounded-xl border transition-all ${active ? `border-${color}-500 bg-${color}-500/10` : 'border-white/5 bg-white/5 hover:bg-white/10'}`}
        >
            <div className="text-left">
                <div className={`text-sm font-black uppercase tracking-wider ${active ? `text-${color}-500` : 'text-gray-300'}`}>{label}</div>
                <div className="text-[10px] text-gray-500 font-bold uppercase">{desc}</div>
            </div>
            <div className={`w-12 h-6 rounded-full p-1 transition-colors ${active ? colors[color] || 'bg-white' : 'bg-black border border-white/20'}`}>
                <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${active ? 'translate-x-6' : 'translate-x-0'}`} />
            </div>
        </button>
    );
}

function TooltipWrapper({ children, content }: any) {
    return (
        <div className="group/tooltip relative">
            {children}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black border border-white/20 text-white text-[10px] uppercase font-bold whitespace-nowrap rounded pointer-events-none opacity-0 group-hover/tooltip:opacity-100 transition-opacity z-50">
                {content}
            </div>
        </div>
    );
}
