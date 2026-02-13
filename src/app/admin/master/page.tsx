"use client";

import { useState, useEffect } from "react";
import {
    Globe,
    Lock,
    Zap,
    Percent,
    Tag,
    AlertTriangle,
    Type,
    ImageIcon,
    Save,
    Megaphone,
    Search,
    Download,
    RefreshCw,
    Trash2,
    Gamepad2,
    LucideIcon,
    Info,
    DollarSign,
    Truck,
    Cpu,
    Activity,
    Shield,
    Terminal,
    Radio,
    Key,
    Database,
    LayoutDashboard,
    ShoppingBag,
    ShieldCheck,
    CheckCircle2,
    AlertCircle,
    Monitor,
    CreditCard,
    Crosshair,
    Fingerprint,
    Users
} from "lucide-react";
import { getMarketplaceSettings, saveMarketplaceSettings, resetMarketplaceSettings, type MarketplaceSettings } from '@/services/marketplace-settings';
import { getSiteSettings, saveSiteSettings, resetSiteSettings, fetchSiteSettings, type SiteSettings } from '@/services/site-settings';
import { getBusinessSettings, saveBusinessSettings, resetBusinessSettings, type BusinessSettings } from '@/services/business-settings';
import { motion, AnimatePresence } from "framer-motion";
import { getAllDevices, getSystemMetrics, getFleetAnalytics, getRevenueAnalytics } from "@/services/admin";
import { Device } from "@/types";
import dynamic from 'next/dynamic';

const NexusTerminal = dynamic(() => import("@/components/admin/NexusTerminal").then(mod => mod.NexusTerminal), { ssr: false });
const SystemPulse = dynamic(() => import("@/components/admin/SystemPulse").then(mod => mod.SystemPulse), { ssr: false });
const RentalCommandNexus = dynamic(() => import("@/components/admin/master/RentalCommandNexus").then(mod => mod.RentalCommandNexus), { ssr: false });
const FleetCommandNexus = dynamic(() => import("@/components/admin/master/FleetCommandNexus").then(mod => mod.FleetCommandNexus), { ssr: false });
const KYCCommandNexus = dynamic(() => import("@/components/admin/master/KYCCommandNexus").then(mod => mod.KYCCommandNexus), { ssr: false });

const RevenueChart = dynamic(() => import("@/components/admin/AnalyticsCharts").then(mod => mod.RevenueChart), { ssr: false });
const HealthPieChart = dynamic(() => import("@/components/admin/AnalyticsCharts").then(mod => mod.HealthPieChart), { ssr: false });
const LatencyChart = dynamic(() => import("@/components/admin/AnalyticsCharts").then(mod => mod.LatencyChart), { ssr: false });

import { getKYCStats } from "@/services/admin";
import { CommandNexusCard } from "@/components/admin/CommandNexusCard";

export default function MasterControlPage() {
    const [activeTab, setActiveTab] = useState("system");
    const [isLoadingSettings, setIsLoadingSettings] = useState(true);
    const [mounted, setMounted] = useState(false);


    // Marketplace Settings State
    const [marketplaceSettings, setMarketplaceSettings] = useState<MarketplaceSettings>(getMarketplaceSettings());

    // Site Settings State (Starts with cached/default, then fetches)
    const [siteSettings, setSiteSettings] = useState<SiteSettings>(getSiteSettings());

    // Business Settings State
    const [businessSettings, setBusinessSettings] = useState<BusinessSettings>(getBusinessSettings());

    // Fleet Metrics
    const [devices, setDevices] = useState<Device[]>([]);
    const [fleetHealth, setFleetHealth] = useState(0);

    // System Nexus State
    const [systemMetrics, setSystemMetrics] = useState<any>(null);
    const [isTerminalOpen, setIsTerminalOpen] = useState(true);
    const [fleetAnalytics, setFleetAnalytics] = useState<any>(null);
    const [revenueData, setRevenueData] = useState<any[]>([]);
    const [kycStats, setKycStats] = useState({ pending: 0, approvalRate: 0 });

    useEffect(() => {
        setMounted(true);
        const load = async () => {
            try {
                // Fetch all data with individual fallback protection
                const [settings, allDevices, metrics, fleetStats, revenue, kStats] = await Promise.all([
                    fetchSiteSettings().catch(e => (console.error("Dashboard: fetchSiteSettings failed", e), null)),
                    getAllDevices().catch(e => (console.error("Dashboard: getAllDevices failed", e), [])),
                    getSystemMetrics().catch(e => (console.error("Dashboard: getSystemMetrics failed", e), null)),
                    getFleetAnalytics().catch(e => (console.error("Dashboard: getFleetAnalytics failed", e), null)),
                    getRevenueAnalytics(7).catch(e => (console.error("Dashboard: getRevenueAnalytics failed", e), { total: 0, growth: 0, data: [] })),
                    getKYCStats().catch(e => (console.error("Dashboard: getKYCStats failed", e), { pending: 0, approved: 0, rejected: 0, approvalRate: 0 }))
                ]);

                if (kStats) setKycStats(kStats);
                if (settings) setSiteSettings(settings);
                if (allDevices) {
                    setDevices(allDevices);
                    // Calculate average health
                    if (allDevices.length > 0) {
                        const avg = allDevices.reduce((acc: number, d: Device) => acc + (d.health || 0), 0) / allDevices.length;
                        setFleetHealth(Math.round(avg));
                    }
                }
                if (metrics) setSystemMetrics(metrics);
                if (fleetStats) setFleetAnalytics(fleetStats);
                if (revenue) setRevenueData(revenue.data || []);
            } catch (error) {
                console.error("Critical dashboard load failure:", error);
            } finally {
                setIsLoadingSettings(false);
            }
        };
        load();
    }, []);

    // SEO Settings State
    const [selectedSeoPage, setSelectedSeoPage] = useState('home');

    // Save All Settings
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
    const handleSaveSettings = async () => {
        setSaveStatus('saving');
        try {
            saveMarketplaceSettings(marketplaceSettings);
            await saveSiteSettings(siteSettings);
            saveBusinessSettings(businessSettings);

            setSaveStatus('success');
            setTimeout(() => setSaveStatus('idle'), 3000);
        } catch (error) {
            console.error('Failed to save settings:', error);
            setSaveStatus('error');
            setTimeout(() => setSaveStatus('idle'), 5000);
        }
    };

    if (!mounted) {
        return <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center font-mono text-xs uppercase tracking-[0.4em] animate-pulse">
            Establishing Secure Link...
        </div>;
    }

    return (
        <div className="min-h-screen bg-[#050505] text-white p-6 lg:p-10 space-y-10 custom-scrollbar overflow-x-hidden">
            {/* HUD Header */}
            <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-[#3B82F6]/20 via-[#8B5CF6]/20 to-[#3B82F6]/20 rounded-[3rem] blur-xl opacity-50 group-hover:opacity-75 transition duration-1000"></div>
                <div className="relative bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] p-8 lg:p-12 overflow-hidden">
                    <div className="absolute top-0 right-0 w-[500px] h-full bg-gradient-to-l from-[#3B82F6]/5 to-transparent pointer-events-none"></div>

                    <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-10">
                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-2xl shadow-[0_0_20px_rgba(59,130,246,0.2)]">
                                    <Cpu size={32} className="text-[#3B82F6] animate-pulse" />
                                </div>
                                <div>
                                    <h1 className="text-5xl font-black uppercase italic tracking-tighter leading-none">
                                        MASTER <span className="text-[#3B82F6]">CONTROL</span>
                                    </h1>
                                    <p className="text-gray-500 font-mono text-xs uppercase tracking-[0.3em] mt-2 ml-1">Central Intelligence Hub // V4.2.0</p>
                                </div>
                            </div>

                            {/* HUD Indicators */}
                            <div className="flex flex-wrap gap-4 pt-4">
                                <HUDIndicator
                                    label="Fleet Signal"
                                    value={`${devices.length} UNITS ONLINE`}
                                    active={devices.length > 0}
                                    color="emerald"
                                />
                                <HUDIndicator
                                    label="Integrity Core"
                                    value={`${fleetHealth}% SYNC`}
                                    active={fleetHealth > 80}
                                    color={fleetHealth > 80 ? "blue" : "red"}
                                />
                                <HUDIndicator
                                    label="System Status"
                                    value={siteSettings.maintenanceMode ? "OFFLINE" : "OPERATIONAL"}
                                    active={!siteSettings.maintenanceMode}
                                    color={siteSettings.maintenanceMode ? "red" : "emerald"}
                                />
                                <HUDIndicator
                                    label="Launch Protocols"
                                    value={siteSettings.holidayMode ? "PAUSED" : "ACTIVE"}
                                    active={!siteSettings.holidayMode}
                                    color={siteSettings.holidayMode ? "orange" : "blue"}
                                />
                                <HUDIndicator
                                    label="SEO Transmission"
                                    value="ENCRYPTED"
                                    active={true}
                                    color="purple"
                                />
                                <HUDIndicator
                                    label="Identity Pulse"
                                    value={`${kycStats.pending} PENDING`}
                                    active={kycStats.pending > 0}
                                    color={kycStats.pending > 10 ? "red" : "purple"}
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-4 min-w-[300px]">
                            <button
                                onClick={handleSaveSettings}
                                disabled={saveStatus === 'saving'}
                                className={`group relative px-8 py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-sm overflow-hidden transition-all active:scale-95 flex items-center justify-center gap-3 ${saveStatus === 'success' ? 'bg-emerald-500 text-white' :
                                    saveStatus === 'error' ? 'bg-red-500 text-white' :
                                        'bg-white text-black hover:bg-[#3B82F6] hover:text-white'
                                    }`}
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] pointer-events-none"></div>
                                {saveStatus === 'saving' ? <RefreshCw className="animate-spin" size={20} /> : <Save size={20} />}
                                <span>
                                    {saveStatus === 'saving' ? 'Pushing Updates...' :
                                        saveStatus === 'success' ? 'Protocol Saved' :
                                            saveStatus === 'error' ? 'Sync Failed' :
                                                'Push Master Config'}
                                </span>
                            </button>
                            <div className="flex gap-2">
                                <button onClick={() => window.location.reload()} className="flex-1 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:text-white hover:bg-white/10 transition-all flex items-center justify-center gap-2">
                                    <RefreshCw size={12} /> Reload
                                </button>
                                <button onClick={() => {
                                    if (confirm('Wipe local settings cache?')) {
                                        resetSiteSettings();
                                        window.location.reload();
                                    }
                                }} className="flex-1 py-3 bg-red-500/5 border border-red-500/10 rounded-xl text-[10px] font-bold uppercase tracking-widest text-red-500/60 hover:text-red-500 hover:bg-red-500/10 transition-all flex items-center justify-center gap-2">
                                    <Trash2 size={12} /> Purge
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Tabs */}
            <div className="flex flex-col lg:flex-row gap-8 items-start">
                <nav className="w-full lg:w-72 space-y-2 lg:sticky lg:top-10">
                    <NavTab id="system" icon={Zap} label="Launch Protocols" active={activeTab} onClick={setActiveTab} />
                    <NavTab id="transmission" icon={Radio} label="Transmission" active={activeTab} onClick={setActiveTab} />
                    <NavTab id="optimization" icon={Shield} label="Optimization" active={activeTab} onClick={setActiveTab} />
                    <NavTab id="nexus" icon={Terminal} label="System Nexus" active={activeTab} onClick={setActiveTab} />
                    <NavTab id="rental-nexus" icon={Crosshair} label="RENTAL CMDR" active={activeTab} onClick={setActiveTab} />
                    <NavTab id="global-ops" icon={Globe} label="Global Ops" active={activeTab} onClick={setActiveTab} />
                    <NavTab id="commerce" icon={DollarSign} label="Commerce Hub" active={activeTab} onClick={setActiveTab} />
                    <NavTab id="marketplace" icon={Tag} label="Trade-In Matrix" active={activeTab} onClick={setActiveTab} />
                    <NavTab id="security" icon={Lock} label="Admin Security" active={activeTab} onClick={setActiveTab} />
                    <NavTab id="identity" icon={Fingerprint} label="Identity Hub" active={activeTab} onClick={setActiveTab} />
                </nav>

                <main className="flex-1 w-full min-h-[600px]">
                    <AnimatePresence mode="wait">
                        {/* SYSTEM & LAUNCH CONTROL */}
                        {activeTab === 'system' && (
                            <motion.div key="system" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8 pb-20">
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                    <div className="lg:col-span-2">
                                        <CommandNexusCard
                                            title="Neural Momentum"
                                            subtitle="Analytical trajectory of system transmissions"
                                            icon={Zap}
                                            statusColor="purple"
                                        >
                                            <div className="h-[300px] w-full mt-6 bg-white/5 rounded-3xl p-6 border border-white/5 backdrop-blur-sm">
                                                <RevenueChart revenueData={revenueData} />
                                            </div>
                                        </CommandNexusCard>
                                    </div>
                                    <div className="flex flex-col gap-8">
                                        <CommandNexusCard
                                            title="Fleet Health"
                                            subtitle="Neural integrity distribution"
                                            icon={Shield}
                                            statusColor="emerald"
                                        >
                                            <HealthPieChart fleetAnalytics={fleetAnalytics} fleetHealth={fleetHealth} />
                                        </CommandNexusCard>

                                        <CommandNexusCard
                                            title="Neural Pulse"
                                            subtitle="Real-time predictive stability"
                                            icon={Activity}
                                            statusColor="blue"
                                        >
                                            <div className="space-y-4 pt-4">
                                                <MetricBar label="Stability Index" value={systemMetrics?.neural?.healthScore || 98} max={100} unit="%" />
                                                <MetricBar label="Predictive Sync" value={(systemMetrics?.neural?.predictiveAccuracy || 0.94) * 100} max={100} unit="%" />
                                            </div>
                                        </CommandNexusCard>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    <CommandNexusCard
                                        title="System Telemetry"
                                        subtitle="Live activity hub and events"
                                        icon={Terminal}
                                        statusColor="blue"
                                        className="h-[430px]"
                                    >
                                        <div className="h-[320px] mt-2">
                                            <SystemPulse />
                                        </div>
                                    </CommandNexusCard>

                                    <div className="space-y-8">
                                        <CommandNexusCard
                                            title="Availability Controls"
                                            subtitle="Global accessibility states"
                                            icon={Zap}
                                            statusColor="orange"
                                        >
                                            <div className="space-y-4 pt-4">
                                                <ProtocolToggle
                                                    title="Maintenance Mode"
                                                    description="Lock storefront for updates"
                                                    active={siteSettings.maintenanceMode}
                                                    onToggle={() => setSiteSettings({ ...siteSettings, maintenanceMode: !siteSettings.maintenanceMode })}
                                                    color="red"
                                                />
                                                <ProtocolToggle
                                                    title="Holiday Protocol"
                                                    description="Pause new rental discoverability"
                                                    active={siteSettings.holidayMode}
                                                    onToggle={() => setSiteSettings({ ...siteSettings, holidayMode: !siteSettings.holidayMode })}
                                                    color="orange"
                                                />
                                            </div>
                                        </CommandNexusCard>

                                        <div className="grid grid-cols-2 gap-4">
                                            <button onClick={() => alert('Wipe cache?')} className="p-4 bg-white/5 border border-white/5 rounded-3xl hover:bg-white/10 transition-all text-left flex items-center gap-3 group">
                                                <RefreshCw size={16} className="text-blue-400 group-hover:rotate-180 transition-transform duration-500" />
                                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 group-hover:text-white">Flush Cache</span>
                                            </button>
                                            <button onClick={() => alert('Broadcast Alert?')} className="p-4 bg-white/5 border border-white/5 rounded-3xl hover:bg-white/10 transition-all text-left flex items-center gap-3 group">
                                                <Megaphone size={16} className="text-purple-400 group-hover:scale-110 transition-transform" />
                                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 group-hover:text-white">Broadcast</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* TRANSMISSION (TITLES, DESCRIPTION, ANNOUNCEMENTS) */}
                        {activeTab === 'transmission' && (
                            <motion.div key="transmission" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                                <CommandNexusCard title="Brand Transmission" subtitle="Global identifiers transmitted to client browsers" icon={Radio} statusColor="purple">
                                    <div className="space-y-8 mt-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <HUDInput
                                                label="Platform Hostname"
                                                value={siteSettings.siteTitle}
                                                onChange={(val) => setSiteSettings({ ...siteSettings, siteTitle: val })}
                                                placeholder="Console Zone"
                                            />
                                            <HUDInput
                                                label="Sub-Identity Tag"
                                                value={siteSettings.siteDescription}
                                                onChange={(val) => setSiteSettings({ ...siteSettings, siteDescription: val })}
                                                placeholder="Premium Gaming Hub"
                                            />
                                        </div>
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Global Announcement Broadcaster</label>
                                                <Megaphone size={14} className="text-[#8B5CF6]" />
                                            </div>
                                            <textarea
                                                value={siteSettings.announcement}
                                                onChange={(e) => setSiteSettings({ ...siteSettings, announcement: e.target.value })}
                                                rows={4}
                                                className="w-full bg-black/40 border border-white/10 rounded-2xl p-6 text-white outline-none focus:border-[#8B5CF6] transition-all resize-none font-mono text-sm leading-relaxed"
                                                placeholder="Message to display at the top of every page..."
                                            />
                                        </div>
                                    </div>
                                </CommandNexusCard>
                            </motion.div>
                        )}

                        {/* OPTIMIZATION (SEO) */}
                        {activeTab === 'optimization' && (
                            <motion.div key="optimization" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                                <CommandNexusCard title="SEO Protocols" subtitle="Manage metadata and search engine visibility descriptors" icon={Globe} statusColor="emerald">
                                    <div className="space-y-8 mt-6">
                                        <div className="flex flex-wrap gap-2 p-1 bg-white/5 rounded-xl w-fit">
                                            {Object.keys(siteSettings.seo || {}).map(pageKey => (
                                                <button
                                                    key={pageKey}
                                                    onClick={() => setSelectedSeoPage(pageKey)}
                                                    className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${selectedSeoPage === pageKey ? 'bg-[#3B82F6] text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                                                >
                                                    {pageKey}
                                                </button>
                                            ))}
                                        </div>

                                        <div className="bg-black/20 border border-white/5 rounded-3xl p-8 space-y-6 relative overflow-hidden group/seo backdrop-blur-md">
                                            <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none group-hover/seo:opacity-10 transition-opacity">
                                                <Globe size={120} />
                                            </div>

                                            <h4 className="flex items-center gap-3 text-xs font-black uppercase text-gray-400 tracking-widest">
                                                <Globe size={16} className="text-[#3B82F6]" />
                                                Transmitting: <span className="text-white italic">{selectedSeoPage} metadata</span>
                                            </h4>

                                            <div className="space-y-6 relative z-10">
                                                <HUDInput
                                                    label="Meta Title Tag"
                                                    value={siteSettings.seo?.[selectedSeoPage]?.title || ''}
                                                    onChange={(val) => setSiteSettings({
                                                        ...siteSettings,
                                                        seo: {
                                                            ...siteSettings.seo,
                                                            [selectedSeoPage]: { ...siteSettings.seo[selectedSeoPage], title: val }
                                                        }
                                                    })}
                                                />
                                                <div className="space-y-3">
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Meta Description Protocol</label>
                                                    <textarea
                                                        value={siteSettings.seo?.[selectedSeoPage]?.description || ''}
                                                        onChange={(e) => setSiteSettings({
                                                            ...siteSettings,
                                                            seo: {
                                                                ...siteSettings.seo,
                                                                [selectedSeoPage]: { ...siteSettings.seo[selectedSeoPage], description: e.target.value }
                                                            }
                                                        })}
                                                        rows={3}
                                                        className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white outline-none focus:border-[#3B82F6] transition-all resize-none text-sm"
                                                    />
                                                </div>
                                                <HUDInput
                                                    label="Encrypted Keywords"
                                                    value={siteSettings.seo?.[selectedSeoPage]?.keywords || ''}
                                                    onChange={(val) => setSiteSettings({
                                                        ...siteSettings,
                                                        seo: {
                                                            ...siteSettings.seo,
                                                            [selectedSeoPage]: { ...siteSettings.seo[selectedSeoPage], keywords: val }
                                                        }
                                                    })}
                                                    placeholder="comma, separated, list"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </CommandNexusCard>
                            </motion.div>
                        )}

                        {/* COMMERCE HUB */}
                        {activeTab === 'commerce' && (
                            <motion.div key="commerce" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                                <CommandNexusCard title="Commerce Logistics" subtitle="Fiscal parameters and operational logistics protocols" icon={ShoppingBag} statusColor="emerald">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mt-6">
                                        <div className="space-y-8">
                                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500 border-l-2 border-emerald-500 pl-4 py-1">Financial Coefficients</h4>
                                            <div className="grid grid-cols-1 gap-6">
                                                <HUDInput
                                                    label="Security Deposit Sync"
                                                    value={siteSettings.securityDeposit.toString()}
                                                    onChange={(val) => setSiteSettings({ ...siteSettings, securityDeposit: Number(val) })}
                                                    type="number"
                                                />
                                                <HUDInput
                                                    label="Global Logistics Tax (%)"
                                                    value={siteSettings.taxRate.toString()}
                                                    onChange={(val) => setSiteSettings({ ...siteSettings, taxRate: Number(val) })}
                                                    type="number"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-8">
                                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400 border-l-2 border-blue-400 pl-4 py-1">Rental Logic Protocols</h4>
                                            <div className="grid grid-cols-1 gap-6">
                                                <HUDInput
                                                    label="Minimum Transmission Units (Days)"
                                                    value={siteSettings.minRentalDays.toString()}
                                                    onChange={(val) => setSiteSettings({ ...siteSettings, minRentalDays: Number(val) })}
                                                    type="number"
                                                />
                                                <HUDInput
                                                    label="Gratis Delivery Threshold"
                                                    value={siteSettings.freeDeliveryThreshold.toString()}
                                                    onChange={(val) => setSiteSettings({ ...siteSettings, freeDeliveryThreshold: Number(val) })}
                                                    type="number"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </CommandNexusCard>

                                <CommandNexusCard title="Financial Protocols" subtitle="Global taxes, platform fees, and violation penalties" icon={DollarSign} statusColor="emerald">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                                        <HUDInput
                                            label="Global Tax Rate (%)"
                                            value={businessSettings.finance.taxRate.toString()}
                                            onChange={(val) => setBusinessSettings({ ...businessSettings, finance: { ...businessSettings.finance, taxRate: Number(val) } })}
                                            type="number"
                                        />
                                        <HUDInput
                                            label="Platform Fee (₹/Order)"
                                            value={businessSettings.finance.platformFee.toString()}
                                            onChange={(val) => setBusinessSettings({ ...businessSettings, finance: { ...businessSettings.finance, platformFee: Number(val) } })}
                                            type="number"
                                        />
                                        <HUDInput
                                            label="Violation Penalty (₹/Day)"
                                            value={businessSettings.finance.lateFeePerDay.toString()}
                                            onChange={(val) => setBusinessSettings({ ...businessSettings, finance: { ...businessSettings.finance, lateFeePerDay: Number(val) } })}
                                            type="number"
                                            className="!text-red-500"
                                        />
                                    </div>
                                </CommandNexusCard>
                            </motion.div>
                        )}

                        {/* TRADE-IN MATRIX */}
                        {activeTab === 'marketplace' && (
                            <motion.div key="marketplace" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                                <CommandNexusCard title="Trade-In Matrix" subtitle="Define value coefficients for peer-to-peer asset acquisition" icon={RefreshCw} statusColor="orange">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mt-6">
                                        <div className="space-y-8">
                                            <HUDInput
                                                label="Acquisition Fee (%)"
                                                value={marketplaceSettings.tradeInFee.toString()}
                                                onChange={(val) => setMarketplaceSettings({ ...marketplaceSettings, tradeInFee: Number(val) })}
                                                type="number"
                                            />
                                            <div className="flex items-center justify-between p-4 bg-orange-500/5 border border-orange-500/10 rounded-2xl">
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-[10px] font-black uppercase text-orange-500">Enable Trade-In Uplink</span>
                                                    <span className="text-[8px] text-gray-500 uppercase font-bold tracking-widest">Public discovery of sell module</span>
                                                </div>
                                                <button
                                                    onClick={() => setMarketplaceSettings({ ...marketplaceSettings, enableTradeIn: !marketplaceSettings.enableTradeIn })}
                                                    className={`w-12 h-6 rounded-full p-1 transition-colors ${marketplaceSettings.enableTradeIn ? 'bg-orange-500' : 'bg-white/10'}`}
                                                >
                                                    <div className={`w-4 h-4 rounded-full bg-white transition-transform ${marketplaceSettings.enableTradeIn ? 'translate-x-6' : 'translate-x-0'}`} />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="space-y-6">
                                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400 border-l-2 border-blue-400 pl-4 py-1">Assessed Value Tiers</h4>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                {Object.entries(marketplaceSettings.payoutTiers).map(([key, value]) => (
                                                    <HUDInput
                                                        key={key}
                                                        label={key}
                                                        value={value.toString()}
                                                        onChange={(val) => setMarketplaceSettings({
                                                            ...marketplaceSettings,
                                                            payoutTiers: { ...marketplaceSettings.payoutTiers, [key]: Number(val) }
                                                        })}
                                                        type="number"
                                                    />
                                                ))}
                                            </div>
                                            <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-2xl">
                                                <p className="text-[10px] text-blue-400 font-mono italic">NOTICE: Payout estimations will sync globally across user mission profiles.</p>
                                            </div>
                                        </div>
                                    </div>
                                </CommandNexusCard>
                            </motion.div>
                        )}

                        {/* SYSTEM NEXUS */}
                        {activeTab === 'nexus' && (
                            <motion.div key="nexus" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                                <CommandNexusCard title="Integration Matrix" subtitle="Real-time status of critical system pipelines" icon={Activity} statusColor="blue">
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
                                        <NexusCard label="Supabase DB" status={systemMetrics?.integrations?.supabase} icon={Database} color="emerald" />
                                        <NexusCard label="Razorpay API" status={systemMetrics?.integrations?.razorpay} icon={CreditCard} color="blue" />
                                        <NexusCard label="AI Engine" status={systemMetrics?.integrations?.ai_core} icon={Cpu} color="purple" />
                                        <NexusCard label="Edge Runtime" status="active" icon={Zap} color="orange" />
                                    </div>
                                </CommandNexusCard>

                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                    <div className="lg:col-span-2">
                                        <div className="grid grid-cols-1 gap-8">
                                            <CommandNexusCard title="Feedback Loop" subtitle="Real-time terminal transmission" icon={Terminal} statusColor="purple">
                                                <div className="h-[400px] mt-4">
                                                    <NexusTerminal />
                                                </div>
                                            </CommandNexusCard>
                                            <CommandNexusCard title="Latency Telemetry" subtitle="Real-time response times" icon={Activity} statusColor="blue">
                                                <div className="h-[200px] w-full mt-4 bg-white/5 rounded-3xl p-6 border border-white/5 backdrop-blur-sm">
                                                    <LatencyChart data={systemMetrics?.latencySeries || []} />
                                                </div>
                                            </CommandNexusCard>
                                        </div>
                                    </div>
                                    <div className="space-y-8">
                                        <CommandNexusCard title="Core Metrics" subtitle="System load and latency" icon={Zap} statusColor="emerald">
                                            <div className="space-y-6 pt-4">
                                                <MetricBar label="Global Latency" value={systemMetrics?.database?.latency || 0} max={100} unit="ms" />
                                                <MetricBar label="Traffic Load" value={(systemMetrics?.traffic?.load || 0) * 100} max={100} unit="%" />
                                                <MetricBar label="Pool Saturation" value={systemMetrics?.database?.pool || 0} max={100} unit="%" />
                                            </div>
                                        </CommandNexusCard>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* SECURITY PROTOCOLS */}
                        {activeTab === 'security' && (
                            <motion.div key="security" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8 pb-20">
                                <CommandNexusCard title="Security Protocols" subtitle="Core administrative access and authentication overrides" icon={Lock} statusColor="red">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mt-6">
                                        <div className="space-y-8">
                                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500 border-l-2 border-red-500 pl-4 py-1">Access Authorization</h4>
                                            <div className="grid grid-cols-1 gap-4">
                                                <ProtocolToggle
                                                    title="2FA Enforcement"
                                                    description="Strictly require 2FA for all administrative nodes"
                                                    active={true}
                                                    onToggle={() => { }}
                                                    color="red"
                                                />
                                                <ProtocolToggle
                                                    title="IP Whitelisting"
                                                    description="Restrict access to authorized sector coordinates"
                                                    active={false}
                                                    onToggle={() => { }}
                                                    color="red"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-8">
                                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400 border-l-2 border-blue-400 pl-4 py-1">Threat Mitigation</h4>
                                            <div className="grid grid-cols-1 gap-4">
                                                <div className="p-4 bg-red-500/5 border border-red-500/10 rounded-2xl flex items-center justify-between group">
                                                    <div className="flex flex-col gap-1">
                                                        <span className="text-[10px] font-black uppercase text-red-500">Atomic Force Logout</span>
                                                        <span className="text-[8px] text-gray-500 uppercase font-bold tracking-widest">Terminate all active sessions</span>
                                                    </div>
                                                    <button onClick={() => alert('Atomic logout initiated.')} className="px-4 py-2 bg-red-500 text-white text-[9px] font-black uppercase rounded-lg hover:bg-red-600 transition-colors">Execute</button>
                                                </div>
                                                <div className="p-4 bg-white/5 border border-white/5 rounded-2xl flex items-center justify-center gap-2">
                                                    <Shield size={14} className="text-gray-500" />
                                                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-500 italic">Security Level: Maximum</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CommandNexusCard>

                                <div className="p-24 bg-[#0a0a0a] border-2 border-dashed border-white/5 rounded-[3rem] flex flex-col items-center justify-center text-center opacity-40 grayscale uppercase">
                                    <Lock size={48} className="text-gray-700 mb-6" />
                                    <h3 className="text-xl font-black text-white tracking-tighter italic">Encrypted Sector</h3>
                                    <p className="text-[9px] text-gray-500 max-w-xs mt-4 tracking-[0.2em] font-black font-mono">End-to-end encryption verified // console-zone-v4</p>
                                </div>
                            </motion.div>
                        )}

                        {/* IDENTITY HUB */}
                        {activeTab === 'identity' && (
                            <motion.div key="identity" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                                <KYCCommandNexus />
                            </motion.div>
                        )}

                        {/* GLOBAL OPERATIONS (MAP) */}
                        {activeTab === 'global-ops' && (
                            <motion.div key="global-ops" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                                <FleetCommandNexus />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </main>
            </div>
        </div >
    );
}

// Sub-components

function NavTab({ id, icon: Icon, label, active, onClick }: { id: string, icon: LucideIcon, label: string, active: string, onClick: (id: string) => void }) {
    const isActive = active === id;
    return (
        <button
            onClick={() => onClick(id)}
            className={`w-full group flex items-center gap-4 px-6 py-4 rounded-2xl transition-all relative overflow-hidden ${isActive ? 'bg-[#3B82F6] text-white shadow-[0_10px_30px_rgba(59,130,246,0.3)]' : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
        >
            {isActive && (
                <motion.div layoutId="nav-bg" className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-400" />
            )}
            <Icon size={18} className={`relative z-10 transition-transform ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
            <span className={`relative z-10 text-[11px] font-black uppercase tracking-[0.15em] ${isActive ? 'translate-x-1' : 'group-hover:translate-x-1'} transition-transform`}>
                {label}
            </span>
        </button>
    );
}



function HUDIndicator({ label, value, active, color }: { label: string, value: string, active: boolean, color: 'blue' | 'emerald' | 'orange' | 'red' | 'purple' }) {
    const colors = {
        blue: 'text-blue-400 border-blue-400/20 bg-blue-400/5',
        emerald: 'text-emerald-400 border-emerald-400/20 bg-emerald-400/5',
        orange: 'text-orange-400 border-orange-400/20 bg-orange-400/5',
        red: 'text-red-400 border-red-400/20 bg-red-400/5',
        purple: 'text-[#8B5CF6] border-[#8B5CF6]/20 bg-[#8B5CF6]/5',
    };

    return (
        <div className={`px-4 py-2 rounded-xl border ${colors[color]} flex flex-col gap-0.5`}>
            <span className="text-[8px] font-black uppercase tracking-[0.2em] opacity-60">{label}</span>
            <div className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${active ? 'animate-pulse' : ''} bg-current`}></div>
                <span className="text-[10px] font-black uppercase tracking-widest">{value}</span>
            </div>
        </div>
    );
}

function HUDInput({ label, value, onChange, placeholder, type = "text", className = "" }: { label: string, value: string, onChange: (val: string) => void, placeholder?: string, type?: string, className?: string }) {
    return (
        <div className="space-y-3 flex-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">{label}</label>
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className={`w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold outline-none focus:border-[#3B82F6] transition-all bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] ${className}`}
            />
        </div>
    );
}

function ProtocolToggle({ title, description, active, onToggle, color, showToggle = true }: { title: string, description: string, active: boolean, onToggle: () => void, color: 'red' | 'orange' | 'blue', showToggle?: boolean }) {
    const colors = {
        red: active ? 'border-red-500/30 bg-red-500/10 text-red-500' : 'border-white/10 bg-white/5 text-gray-500',
        orange: active ? 'border-orange-500/30 bg-orange-500/10 text-orange-500' : 'border-white/10 bg-white/5 text-gray-500',
        blue: active ? 'border-blue-500/30 bg-blue-500/10 text-blue-500' : 'border-white/10 bg-white/5 text-gray-500'
    };

    return (
        <button
            onClick={onToggle}
            className={`flex items-center justify-between p-6 rounded-3xl border transition-all text-left group ${colors[color]}`}
        >
            <div className="space-y-2">
                <h4 className="text-sm font-black uppercase tracking-tighter">{title}</h4>
                <p className="text-[10px] opacity-60 font-bold max-w-[250px] leading-relaxed uppercase tracking-widest">{description}</p>
            </div>
            {showToggle && (
                <div className={`w-14 h-8 rounded-full transition-all flex items-center p-1 ${active ? (color === 'red' ? 'bg-red-500' : color === 'orange' ? 'bg-orange-500' : 'bg-blue-500') : 'bg-gray-800'}`}>
                    <div className={`w-6 h-6 rounded-full bg-white transform transition-transform ${active ? 'translate-x-6' : 'translate-x-0'} shadow-lg`} />
                </div>
            )}
        </button>
    );
}

function CommandButton({ label, icon: Icon, onClick }: { label: string, icon: LucideIcon, onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className="flex items-center justify-between p-5 bg-[#0a0a0a] border border-white/10 rounded-2xl hover:bg-white/5 hover:border-white/20 transition-all text-gray-400 hover:text-white group"
        >
            <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
            <Icon size={16} className="group-hover:scale-110 transition-transform" />
        </button>
    );
}

function NexusCard({ label, status, icon: Icon, color }: { label: string, status: string, icon: LucideIcon, color: string }) {
    const isOnline = status === 'operational' || status === 'active';
    return (
        <div className="bg-black/20 backdrop-blur-md border border-white/5 rounded-2xl p-5 flex flex-col gap-4 group hover:border-[#3B82F6]/30 hover:bg-white/5 transition-all duration-500">
            <div className="flex items-center justify-between">
                <div className={`p-2 bg-white/5 rounded-lg text-${color}-400 group-hover:scale-110 transition-transform`}>
                    <Icon size={16} />
                </div>
                <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.5)]'}`} />
                </div>
            </div>
            <div className="flex flex-col gap-1">
                <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">{label}</span>
                <span className={`text-[11px] font-mono uppercase italic tracking-tighter ${isOnline ? 'text-white/90' : 'text-red-500'}`}>{status || 'Offline'}</span>
            </div>
        </div>
    );
}

function MetricBar({ label, value, max, unit }: { label: string, value: number, max: number, unit: string }) {
    const percentage = (value / max) * 100;
    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between text-[8px] font-black uppercase tracking-[0.2em]">
                <span className="text-gray-500">{label}</span>
                <span className="text-white italic">{value}{unit}</span>
            </div>
            <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    className={`h-full ${percentage > 80 ? 'bg-red-500' : percentage > 50 ? 'bg-amber-400' : 'bg-[#3B82F6]'}`}
                />
            </div>
        </div>
    );
}

