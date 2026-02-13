"use client";

import dynamic from "next/dynamic";
import { Globe, Crosshair, Zap, Shield, Search } from "lucide-react";
import PageHero from "@/components/layout/PageHero";

const FleetCommandNexus = dynamic(
    () => import("@/components/admin/master/FleetCommandNexus").then(mod => mod.FleetCommandNexus),
    { ssr: false }
);

export default function NexusMapPage() {
    return (
        <main className="min-h-screen bg-[#050505] pb-24">
            <PageHero
                title="TACTICAL OVERWATCH"
                subtitle="Geospatial Asset Tracking & Neural Alignment"
                images={[]} // Will use default or visual settings
                height="40vh"
            />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-10">
                <div className="grid grid-cols-1 gap-8">
                    {/* Primary Command Interface */}
                    <div className="bg-[#0A0A0A]/80 backdrop-blur-2xl border border-white/5 rounded-[3rem] p-8 shadow-2xl">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                            <div>
                                <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase">Nexus v2.0 Tactical Map</h2>
                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em] mt-1">Live Satellite Uplink • Sector Alpha-9</p>
                            </div>
                            <div className="flex gap-2">
                                <div className="px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center gap-2">
                                    <Zap size={14} className="text-blue-500" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-blue-500">Signal: Optimal</span>
                                </div>
                                <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-2">
                                    <Shield size={14} className="text-emerald-500" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Encryption: Active</span>
                                </div>
                            </div>
                        </div>

                        {/* We use the upgraded FleetCommandNexus here */}
                        <FleetCommandNexus />
                    </div>

                    {/* Secondary Intelligence Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                            { label: "Neural Drift", value: "0.04%", status: "Nominal", icon: Crosshair },
                            { label: "Active Uplinks", value: "Satellite", status: "Secure", icon: Globe },
                            { label: "Data Throughput", value: "4.2 GB/s", status: "High", icon: Search },
                            { label: "Sync Integrity", value: "99.9%", status: "Stable", icon: Shield }
                        ].map((item, i) => (
                            <div key={i} className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl group hover:bg-white/[0.04] transition-all">
                                <div className="flex justify-between items-start mb-4">
                                    <item.icon size={20} className="text-gray-500 group-hover:text-blue-400 transition-colors" />
                                    <span className="text-[8px] font-black uppercase text-emerald-500 tracking-widest">{item.status}</span>
                                </div>
                                <div className="text-2xl font-black text-white italic tracking-tighter mb-1">{item.value}</div>
                                <div className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">{item.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </main>
    );
}
