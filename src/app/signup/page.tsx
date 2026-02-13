"use client";

import { useState } from "react";
import { auth } from "@/lib/firebase";
import {
    createUserWithEmailAndPassword,
    updateProfile,
    signInWithPopup,
    GoogleAuthProvider,
    OAuthProvider
} from "firebase/auth";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, UserPlus, Mail, Lock, Chrome, ArrowLeft, User, Apple } from "lucide-react";
import PageHero from "@/components/layout/PageHero";
import { useVisuals } from "@/context/visuals-context";

export default function SignupPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [fullName, setFullName] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const router = useRouter();
    const { settings } = useVisuals();
    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (!auth) throw new Error("Auth service unavailable");
            const { user } = await createUserWithEmailAndPassword(auth, email, password);
            if (user) {
                await updateProfile(user, {
                    displayName: fullName
                });
                // Set session cookie for middleware
                document.cookie = `firebase-session=${user.uid}; path=/; max-age=3600; SameSite=Lax`;
            }
            setSuccess(true);
            setLoading(false);
        } catch (err: any) {
            setError(err.message || "Signup failed. Please try again.");
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setLoading(true);
        setError(null);

        const provider = new GoogleAuthProvider();
        try {
            if (!auth) throw new Error("Auth service unavailable");
            const { user } = await signInWithPopup(auth, provider);
            // Set session cookie for middleware
            document.cookie = `firebase-session=${user.uid}; path=/; max-age=3600; SameSite=Lax`;
            router.push("/");
            router.refresh();
        } catch (err: any) {
            setError(err.message || "Google registration failed.");
            setLoading(false);
        }
    };

    const handleAppleLogin = async () => {
        setLoading(true);
        setError(null);

        const provider = new OAuthProvider("apple.com");
        try {
            if (!auth) throw new Error("Auth service unavailable");
            const { user } = await signInWithPopup(auth, provider);
            // Set session cookie for middleware
            document.cookie = `firebase-session=${user.uid}; path=/; max-age=3600; SameSite=Lax`;
            router.push("/");
            router.refresh();
        } catch (err: any) {
            setError(err.message || "Apple authentication failed.");
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-[#050505] relative overflow-hidden font-display">
                <PageHero
                    title="VERIFICATION"
                    subtitle="Confirm Your Identity"
                    images={settings?.pageBackgrounds?.signup || []}
                    height="45vh"
                />

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-24 relative z-20 pb-20">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="w-full max-w-md mx-auto bg-[#0A0A0A]/80 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-10 text-center shadow-2xl"
                    >
                        <div className="w-20 h-20 bg-[#A855F7]/20 border border-[#A855F7]/40 rounded-full flex items-center justify-center mx-auto mb-8">
                            <Mail className="text-[#A855F7]" size={32} />
                        </div>
                        <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase mb-4">Verification Sent</h2>
                        <p className="text-gray-400 text-sm leading-relaxed mb-8 font-medium">
                            We've sent an encrypted verification link to <span className="text-white font-bold">{email}</span>.
                            Please confirm your identity to complete the enlistment.
                        </p>
                        <Link href="/login">
                            <button className="w-full py-5 bg-[#A855F7] text-white font-black uppercase tracking-[0.2em] rounded-2xl transition-all shadow-[0_10px_30px_rgba(168,85,247,0.3)] hover:shadow-[0_10px_40px_rgba(168,85,247,0.4)]">
                                Proceed to Login
                            </button>
                        </Link>
                    </motion.div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#050505] relative overflow-hidden font-display">
            <PageHero
                title="JOIN THE ZONE"
                subtitle="New Operative Enlistment"
                images={settings?.pageBackgrounds?.signup || []}
                height="45vh"
            />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-24 relative z-20 pb-20">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-md mx-auto"
                >
                    {/* Back to Home */}
                    <div className="mb-6 flex justify-center">
                        <Link
                            href="/"
                            className="inline-flex items-center gap-2 text-gray-500 hover:text-[#A855F7] transition-colors group"
                        >
                            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                            <span className="text-xs font-black uppercase tracking-widest">Back to Hub</span>
                        </Link>
                    </div>

                    <div className="bg-[#0A0A0A]/80 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8 md:p-10 shadow-2xl">
                        <div className="text-center mb-10">
                            <h1 className="text-4xl font-black text-white italic tracking-tighter uppercase mb-2">
                                JOIN THE <span className="text-[#A855F7]">ZONE</span>
                            </h1>
                            <p className="text-gray-500 text-xs font-black uppercase tracking-[0.2em]">New Operative Enlistment</p>
                        </div>

                        {error && (
                            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-xs font-bold uppercase tracking-wider text-center">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSignup} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 ml-4">Full Name</label>
                                <div className="relative group">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-[#A855F7] transition-colors" size={18} />
                                    <input
                                        type="text"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        placeholder="Enter your name"
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-gray-600 focus:outline-none focus:border-[#A855F7]/50 focus:bg-white/[0.08] transition-all"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 ml-4">Email Address</label>
                                <div className="relative group">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-[#A855F7] transition-colors" size={18} />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="Enter your email"
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-gray-600 focus:outline-none focus:border-[#A855F7]/50 focus:bg-white/[0.08] transition-all"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 ml-4">Password</label>
                                <div className="relative group">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-[#A855F7] transition-colors" size={18} />
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Minimum 6 characters"
                                        minLength={6}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-gray-600 focus:outline-none focus:border-[#A855F7]/50 focus:bg-white/[0.08] transition-all"
                                        required
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-5 bg-[#A855F7] hover:bg-[#9333EA] text-white font-black uppercase tracking-[0.2em] rounded-2xl flex items-center justify-center gap-3 transition-all shadow-[0_10px_30px_rgba(168,85,247,0.3)] hover:shadow-[0_10px_40px_rgba(168,85,247,0.4)] disabled:opacity-50 disabled:cursor-not-allowed group"
                            >
                                {loading ? (
                                    <Loader2 className="animate-spin" size={20} />
                                ) : (
                                    <>
                                        <span>Complete Enlistment</span>
                                        <UserPlus size={20} className="group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="relative my-10">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-white/5"></div>
                            </div>
                            <div className="relative flex justify-center text-[10px] font-black uppercase tracking-[0.2em]">
                                <span className="bg-[#0A0A0A] px-4 text-gray-600">Secure Link</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={handleGoogleLogin}
                                disabled={loading}
                                className="py-4 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-black uppercase tracking-[0.2em] rounded-2xl flex items-center justify-center gap-3 transition-all group"
                            >
                                <Chrome size={20} className="group-hover:scale-110 transition-transform" />
                                <span className="hidden sm:inline">Google</span>
                            </button>

                            <button
                                onClick={handleAppleLogin}
                                disabled={loading}
                                className="py-4 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-black uppercase tracking-[0.2em] rounded-2xl flex items-center justify-center gap-3 transition-all group"
                            >
                                <Apple size={20} className="group-hover:scale-110 transition-transform" />
                                <span className="hidden sm:inline">Apple</span>
                            </button>
                        </div>

                        <p className="mt-10 text-center text-gray-500/80 text-[10px] font-black uppercase tracking-[0.2em]">
                            Already enroled?{" "}
                            <Link href="/login" className="text-[#A855F7] hover:underline">Return to Mission</Link>
                        </p>
                    </div>

                    {/* Footer terms */}
                    <p className="mt-8 text-center text-gray-600 text-[10px] font-bold uppercase tracking-[0.2em]">
                        By joining, you agree to our Terms of Engagement
                    </p>
                </motion.div>
            </div>
        </div>
    );
}
