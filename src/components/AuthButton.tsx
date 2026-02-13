"use client";

import { auth } from "@/lib/firebase";
import { onAuthStateChanged, signOut as firebaseSignOut } from "firebase/auth";
import { Loader2, LogIn, User, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function AuthButton() {
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        // Priority: Check real Firebase session
        if (!auth) return;
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            if (firebaseUser) {
                // Adapt Firebase user object to match expected UI structure
                setUser({
                    ...firebaseUser,
                    user_metadata: {
                        full_name: firebaseUser.displayName,
                        avatar_url: firebaseUser.photoURL
                    }
                });
            } else {
                // Fallback: Check for Local Demo User
                const demoUser = localStorage.getItem('DEMO_USER_SESSION');
                if (demoUser) {
                    setUser(JSON.parse(demoUser));
                } else {
                    setUser(null);
                }
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleDemoLogin = () => {
        const demoUser = {
            id: 'demo-user-123',
            email: 'agent@console.zone',
            user_metadata: {
                full_name: 'Agent 47',
                avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop'
            }
        };
        localStorage.setItem('DEMO_USER_SESSION', JSON.stringify(demoUser));
        setUser(demoUser);
    };

    const handleSignOut = async () => {
        try {
            if (auth) {
                await firebaseSignOut(auth);
            }
            localStorage.removeItem('DEMO_USER_SESSION');
            document.cookie = "firebase-session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
            setUser(null);
        } catch (error) {
            console.error("Logout error:", error);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm font-medium">
                <Loader2 size={16} className="animate-spin text-[#A855F7]" />
            </div>
        );
    }

    if (user) {
        return (
            <div className="flex items-center gap-4">
                <Link
                    href="/profile"
                    className="w-10 h-10 rounded-full border border-white/10 bg-white/5 overflow-hidden relative group hover:border-[#A855F7] transition-all flex items-center justify-center"
                    title="Client Profile"
                >
                    {user.user_metadata?.avatar_url ? (
                        <img src={user.user_metadata.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                        <User size={18} className="text-gray-400 group-hover:text-[#A855F7] transition-colors" />
                    )}
                </Link>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-2">
            <Link
                href="/login"
                className="flex items-center gap-2 px-6 py-2 bg-white/10 hover:bg-white/20 border border-white/10 rounded-lg text-sm font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 text-white"
            >
                <LogIn size={16} className="text-[#A855F7]" />
                Login
            </Link>
            {/* Quick Demo Access for Testing */}
            <button
                onClick={handleDemoLogin}
                className="text-[10px] text-gray-500 hover:text-white uppercase font-bold tracking-widest px-2"
                title="Enter Demo Mode"
            >
                [DEMO]
            </button>
        </div>
    );
}
