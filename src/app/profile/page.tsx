"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, signOut as firebaseSignOut } from "firebase/auth";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Loader2, LogOut, User, Mail, ShieldCheck, Gamepad2, History, AlertCircle } from "lucide-react";
import Link from "next/link";
import PageHero from "@/components/layout/PageHero";
import { useVisuals } from "@/context/visuals-context";
import { getUserRentals } from "@/services/rentals";
import KYCForm from "@/components/KYCForm";
import { format } from "date-fns";
import NeuralRoadmap from "@/components/profile/NeuralRoadmap";

export default function ProfilePage() {
    const [user, setUser] = useState<any>(null);
    const [rentals, setRentals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<any>(null);
    const [showKYC, setShowKYC] = useState(false);

    const router = useRouter();
    const { settings } = useVisuals();

    useEffect(() => {
        if (!auth) {
            setLoading(false);
            return;
        }

        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                const currentUser = {
                    ...firebaseUser,
                    id: firebaseUser.uid,
                    user_metadata: {
                        full_name: firebaseUser.displayName,
                        avatar_url: firebaseUser.photoURL
                    }
                };
                setUser(currentUser);

                // Fetch Profile details (for KYC status)
                // Note: This will use the placeholder Supabase client if not configured
                // but we keep the logic for future compatibility or if it's partially working
                try {
                    setProfile({ kyc_status: 'NOT_SUBMITTED', neural_sync_xp: 750 });
                    setRentals([]); // Fallback during migration
                } catch (e) {
                    console.error("Failed to load data", e);
                }
                setLoading(false);
            } else {
                // Check Demo Session
                const demoUser = localStorage.getItem('DEMO_USER_SESSION');
                if (demoUser) {
                    const parsed = JSON.parse(demoUser);
                    setUser(parsed);
                    setProfile({ kyc_status: 'NOT_SUBMITTED', neural_sync_xp: 750 });
                    setLoading(false);
                } else {
                    router.push("/login");
                }
            }
        });

        return () => unsubscribe();
    }, [router]);

    const handleSignOut = async () => {
        setLoading(true);
        try {
            if (auth) {
                await firebaseSignOut(auth);
            }
            localStorage.removeItem('DEMO_USER_SESSION');
            router.push("/");
            router.refresh();
        } catch (error) {
            console.error("Logout error:", error);
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#050505] flex items-center justify-center">
                <Loader2 className="animate-spin text-[#A855F7]" size={40} />
            </div>
        );
    }

    const KycStatusBadge = () => {
        const status = profile?.kyc_status || 'NOT_SUBMITTED';
        switch (status) {
            case 'APPROVED':
                return (
                    <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                        <ShieldCheck size={14} className="text-emerald-500" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500">Verified Operative</span>
                    </div>
                );
            case 'PENDING':
                return (
                    <div className="flex items-center gap-2 px-3 py-1 bg-yellow-500/10 border border-yellow-500/20 rounded-full">
                        <Loader2 size={14} className="text-yellow-500 animate-spin" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-yellow-500">Verification Pending</span>
                    </div>
                );
            case 'REJECTED':
                return (
                    <div className="flex items-center gap-2 px-3 py-1 bg-red-500/10 border border-red-500/20 rounded-full">
                        <AlertCircle size={14} className="text-red-500" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500">Verification Failed</span>
                    </div>
                );
            default:
                return (
                    <div className="flex items-center gap-2 px-3 py-1 bg-gray-500/10 border border-gray-500/20 rounded-full">
                        <div className="w-2 h-2 rounded-full bg-gray-500" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Unverified</span>
                    </div>
                );
        }
    };

    return (
        <div className="min-h-screen bg-[#050505] font-display">
            <PageHero
                title="OPERATIVE PROFILE"
                subtitle="Authorized Clearance & Records"
                images={settings?.pageBackgrounds?.profile || []}
                height="100vh"
            />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-24 relative z-20 pb-32">
                <div className="max-w-4xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-[#0A0A0A] border border-white/10 rounded-[3rem] overflow-hidden shadow-2xl"
                    >
                        {/* Header/Identity Strip */}
                        <div className="p-8 md:p-12 border-b border-white/5 flex flex-col md:flex-row items-center gap-8 bg-gradient-to-br from-white/[0.02] to-transparent">
                            <div className="w-32 h-32 rounded-3xl bg-[#0A0A0A] border-4 border-[#1A1A1A] overflow-hidden shadow-2xl shrink-0">
                                {user?.user_metadata?.avatar_url ? (
                                    <img src={user.user_metadata.avatar_url} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-[#1A1A1A] flex items-center justify-center">
                                        <User size={48} className="text-gray-700" />
                                    </div>
                                )}
                            </div>
                            <div className="text-center md:text-left flex-1">
                                <h1 className="text-3xl font-black text-white italic tracking-tighter uppercase mb-2">
                                    {user?.user_metadata?.full_name || user?.email?.split('@')[0]}
                                </h1>
                                <div className="flex flex-wrap justify-center md:justify-start items-center gap-4">
                                    <KycStatusBadge />
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500">System Online</span>
                                    </div>
                                </div>
                            </div>

                            {/* KYC Action Button */}
                            {(!profile?.kyc_status || profile.kyc_status === 'NOT_SUBMITTED' || profile.kyc_status === 'REJECTED') && !showKYC && (
                                <div className="ml-auto">
                                    <button
                                        onClick={() => setShowKYC(true)}
                                        className="px-6 py-3 bg-[#A855F7] hover:bg-[#9333EA] border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-white transition-all shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:shadow-[0_0_30px_rgba(168,85,247,0.5)] flex items-center gap-2"
                                    >
                                        <ShieldCheck size={16} />
                                        Complete Verification
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* KYC Form Section (Expandable) */}
                        <AnimatePresence>
                            {showKYC && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="border-b border-white/5 bg-white/[0.02]"
                                >
                                    <div className="p-8 md:p-12 relative">
                                        <button
                                            onClick={() => setShowKYC(false)}
                                            className="absolute top-8 right-8 text-gray-500 hover:text-white transition-colors"
                                        >
                                            Close
                                        </button>
                                        <div className="max-w-2xl mx-auto">
                                            <div className="mb-8 text-center">
                                                <h3 className="text-xl font-black text-white uppercase italic tracking-widest mb-2">Identity Verification</h3>
                                                <p className="text-gray-400 text-xs">Complete protocols to access restricted gear.</p>
                                            </div>
                                            <KYCForm onSuccess={() => {
                                                setShowKYC(false);
                                                setProfile({ ...profile, kyc_status: 'PENDING' });
                                                alert("KYC Submitted Successfully!");
                                            }} />
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Content */}
                        <div className="p-8 md:p-12 space-y-12">
                            {/* Neural Sync Level */}
                            <div className="space-y-4">
                                <h2 className="text-sm font-black uppercase tracking-[0.3em] text-[#A855F7]">Neural Sync Roadmap</h2>
                                <NeuralRoadmap xp={profile?.neural_sync_xp || 0} />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Account Details */}
                                <div className="space-y-6">
                                    <h2 className="text-sm font-black uppercase tracking-[0.3em] text-[#A855F7] mb-4">Account Intelligence</h2>

                                    <div className="bg-white/5 border border-white/5 rounded-2xl p-6 space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <Mail size={18} className="text-gray-500" />
                                                <div>
                                                    <div className="text-[10px] font-black uppercase tracking-widest text-gray-600">Email Link</div>
                                                    <div className="text-sm text-white font-medium">{user?.email}</div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <ShieldCheck size={18} className="text-gray-500" />
                                                <div>
                                                    <div className="text-[10px] font-black uppercase tracking-widest text-gray-600">Status</div>
                                                    <div className="text-sm text-green-500 font-bold uppercase tracking-wider">Active</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleSignOut}
                                        className="w-full py-4 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-500 font-black uppercase tracking-[0.2em] rounded-2xl flex items-center justify-center gap-3 transition-all group"
                                    >
                                        <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
                                        <span>Terminate Session</span>
                                    </button>
                                </div>

                                {/* Activity */}
                                <div className="space-y-6">
                                    <h2 className="text-sm font-black uppercase tracking-[0.3em] text-[#A855F7] mb-4">Mission Logs</h2>

                                    {rentals.length === 0 ? (
                                        <div className="bg-white/5 border border-white/5 rounded-2xl p-6 flex flex-col items-center justify-center text-center space-y-4 min-h-[200px]">
                                            <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center">
                                                <History size={24} className="text-gray-700" />
                                            </div>
                                            <div>
                                                <div className="text-sm text-gray-400 font-medium">No active missions found.</div>
                                                <div className="text-[10px] text-gray-600 uppercase tracking-widest mt-2">Start your first deployment</div>
                                            </div>
                                            <Link href="/rental" className="pt-2">
                                                <button className="px-6 py-2 bg-[#A855F7]/20 hover:bg-[#A855F7]/30 border border-[#A855F7]/30 text-[#A855F7] text-[10px] font-black uppercase tracking-[0.2em] rounded-lg transition-all">
                                                    Browse Gear
                                                </button>
                                            </Link>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {rentals.map((rental) => (
                                                <div key={rental.id} className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-5 hover:border-white/20 transition-all group">
                                                    <div className="flex justify-between items-start mb-4">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-12 h-12 rounded-xl bg-black border border-white/10 overflow-hidden">
                                                                <img src={rental.product?.images?.[0] || rental.product?.image} className="w-full h-full object-cover" />
                                                            </div>
                                                            <div>
                                                                <h3 className="text-sm font-bold text-white group-hover:text-[#A855F7] transition-colors">{rental.product?.name}</h3>
                                                                <p className="text-[10px] text-gray-500 font-mono">
                                                                    ID: {rental.id.slice(0, 8)} • {format(new Date(rental.start_date), 'MMM dd')} - {format(new Date(rental.end_date), 'MMM dd')}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded border ${rental.status === 'active' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                                                            rental.status === 'overdue' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                                                                'bg-gray-500/10 text-gray-400 border-gray-500/20'
                                                            }`}>
                                                            {rental.status}
                                                        </span>
                                                    </div>

                                                    {/* Assigned Unit Details */}
                                                    <div className="bg-white/5 rounded-xl p-3 mb-3 border border-white/5 flex justify-between items-center">
                                                        <div>
                                                            <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mb-1">Assigned Unit</p>
                                                            {rental.console ? (
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                                                    <span className="text-xs text-white font-mono">{rental.console.name} (SN: {rental.console.serial_number})</span>
                                                                </div>
                                                            ) : (
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                                                                    <span className="text-xs text-yellow-500 font-mono">Pending Assignment</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                        {rental.status === 'active' && (
                                                            <button
                                                                onClick={() => alert("Report Issue feature coming soon! Contact support for immediate help.")}
                                                                className="text-[9px] text-red-400 hover:text-red-300 font-bold uppercase tracking-widest underline decoration-dotted"
                                                            >
                                                                Report Issue
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
