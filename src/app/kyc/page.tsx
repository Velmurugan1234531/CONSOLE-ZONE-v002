"use client";

import { useState, useEffect } from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    User, Phone, Fingerprint, MapPin, Loader2, CheckCircle2,
    FileCheck, Scan, ShieldCheck, ChevronRight, ArrowLeft,
    AlertCircle
} from "lucide-react";
import PageHero from "@/components/layout/PageHero";
import { useVisuals } from "@/context/visuals-context";
import { createClient } from "@/utils/supabase/client";

export default function KYCPage() {
    const [step, setStep] = useState(1);
    const [activeField, setActiveField] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLocating, setIsLocating] = useState(false);

    // Form Stats
    const [fullName, setFullName] = useState("");
    const [phone, setPhone] = useState("");
    const [secondaryPhone, setSecondaryPhone] = useState("");
    const [aadharNumber, setAadharNumber] = useState("");
    const [address, setAddress] = useState("");
    const [idFile, setIdFile] = useState<File | null>(null);
    const [selfieFile, setSelfieFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);

    const router = useRouter();
    const supabase = createClient();
    const { settings } = useVisuals();

    const uploadFile = async (file: File, path: string) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${path}/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('kyc-documents')
            .upload(filePath, file);

        if (uploadError) {
            throw uploadError;
        }

        const { data } = supabase.storage
            .from('kyc-documents')
            .getPublicUrl(filePath);

        return data.publicUrl;
    };

    const detectLocation = () => {
        setIsLocating(true);
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(async (position) => {
                const { latitude, longitude } = position.coords;
                try {
                    const response = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
                    );
                    const data = await response.json();
                    setAddress(data.display_name);
                } catch (error: any) {
                    console.error(`Error fetching address: ${error?.message || error}`);
                } finally {
                    setIsLocating(false);
                }
            }, (error: any) => {
                console.error(`Error getting location: ${error?.message || error}`);
                setIsLocating(false);
            });
        } else {
            setIsLocating(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setter: (file: File | null) => void) => {
        if (e.target.files && e.target.files[0]) {
            setter(e.target.files[0]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (step < 3) {
            setStep(step + 1);
            return;
        }

        if (!idFile || !selfieFile) {
            alert("Please upload both ID and Selfie documents.");
            return;
        }

        setIsSubmitting(true);
        setUploading(true);

        try {
            const user = auth?.currentUser;

            if (!user) {
                // Check Demo Session
                const demoUser = localStorage.getItem('DEMO_USER_SESSION');
                if (demoUser) {
                    const parsed = JSON.parse(demoUser);
                    // Use demo user ID
                    const idUrl = await uploadFile(idFile, `${parsed.id}/id_card`);
                    const selfieUrl = await uploadFile(selfieFile, `${parsed.id}/selfie`);

                    // Submit Data
                    const { submitKYC } = await import("@/services/admin");
                    await submitKYC(parsed.id, {
                        fullName,
                        phone,
                        secondaryPhone,
                        aadharNumber,
                        address,
                        idCardFrontUrl: idUrl,
                        selfieUrl
                    });

                    router.push("/profile");
                    return;
                }
                alert("Please log in to submit KYC.");
                router.push('/login');
                return;
            }

            // Upload Files
            const idUrl = await uploadFile(idFile, `${user.uid}/id_card`);
            const selfieUrl = await uploadFile(selfieFile, `${user.uid}/selfie`);

            // Submit Data
            const { submitKYC } = await import("@/services/admin");
            await submitKYC(user.uid, {
                fullName,
                phone,
                secondaryPhone,
                aadharNumber,
                address,
                idCardFrontUrl: idUrl,
                selfieUrl
            });

            // Success Feedback
            // Redirect to Profile
            router.push("/profile");

        } catch (error: any) {
            console.error(`KYC Submission Failed: ${error?.message || error}`);
            alert(`Submission Failed: ${error.message || "Unknown error"}`);
        } finally {
            setIsSubmitting(false);
            setUploading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#050505] font-display">
            <PageHero
                title="AGENT VERIFICATION"
                subtitle="Identity & Security Clearance"
                images={settings?.pageBackgrounds?.kyc || []}
                height="100vh"
            />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-24 relative z-20 pb-32">
                <div className="max-w-4xl mx-auto">
                    {/* Back button */}
                    <div className="mb-8">
                        <Link
                            href="/profile"
                            className="inline-flex items-center gap-2 text-gray-500 hover:text-[#A855F7] transition-colors group"
                        >
                            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Back to Records</span>
                        </Link>
                    </div>

                    {/* RIGHT COLUMN: FORM (Scrollable) */}
                    <div className="relative h-full bg-[#0a0a0a] border border-white/10 rounded-3xl p-6 md:p-12 lg:p-16 text-white shadow-2xl shadow-black/50">
                        <div className="max-w-3xl mx-auto flex flex-col justify-center">

                            {/* Progress Stepper */}
                            <div className="mb-12">
                                <div className="flex justify-between items-center relative">
                                    <div className="absolute top-1/2 left-0 w-full h-0.5 bg-white/5 -translate-y-1/2" />
                                    <div
                                        className="absolute top-1/2 left-0 h-0.5 bg-gradient-to-r from-[#8B5CF6] to-[#A855F7] -translate-y-1/2 transition-all duration-500"
                                        style={{ width: `${((step - 1) / 2) * 100}%` }}
                                    />
                                    {[1, 2, 3].map((s) => (
                                        <div key={s} className="relative z-10 flex flex-col items-center gap-2 group">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black transition-all duration-300 border ${step === s
                                                ? 'bg-[#8B5CF6] text-white border-[#8B5CF6] shadow-[0_0_20px_rgba(139,92,246,0.5)]'
                                                : step > s
                                                    ? 'bg-emerald-500 text-white border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)]'
                                                    : 'bg-[#0a0a0a] text-gray-600 border-white/10 group-hover:border-white/20'
                                                }`}>
                                                {step > s ? <CheckCircle2 size={20} /> : s}
                                            </div>
                                            <span className={`text-[9px] font-black uppercase tracking-widest ${step >= s ? 'text-white' : 'text-gray-600'}`}>
                                                {s === 1 ? 'IDENTITY' : s === 2 ? 'DOCUMENTS' : 'FINALIZE'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-12 min-h-[400px]">
                                <AnimatePresence mode="wait">
                                    {step === 1 && (
                                        <motion.div
                                            key="step1"
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            className="space-y-8"
                                        >
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="w-8 h-8 rounded-lg bg-[#A855F7]/20 flex items-center justify-center text-[#A855F7] font-black">1</div>
                                                <h2 className="text-xl font-black tracking-widest uppercase italic">Personal Identity</h2>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="group">
                                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1 mb-2 block group-focus-within:text-[#A855F7] transition-colors">Full Legal Name</label>
                                                    <div className={`relative bg-[#0A0A0A] border rounded-xl overflow-hidden transition-all duration-300 ${activeField === 'name' ? 'border-[#A855F7] shadow-[0_0_20px_rgba(168,85,247,0.1)]' : 'border-white/10'}`}>
                                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                                                            <User size={18} />
                                                        </div>
                                                        <input
                                                            required
                                                            type="text"
                                                            value={fullName}
                                                            onChange={(e) => setFullName(e.target.value)}
                                                            placeholder="John Doe"
                                                            onFocus={() => setActiveField('name')}
                                                            onBlur={() => setActiveField(null)}
                                                            className="w-full bg-transparent p-4 pl-12 text-white outline-none placeholder:text-gray-700 font-bold"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="group">
                                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1 mb-2 block group-focus-within:text-[#A855F7] transition-colors">Primary Mobile</label>
                                                    <div className={`relative bg-[#0A0A0A] border rounded-xl overflow-hidden transition-all duration-300 ${activeField === 'phone' ? 'border-[#A855F7] shadow-[0_0_20px_rgba(168,85,247,0.1)]' : 'border-white/10'}`}>
                                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                                                            <Phone size={18} />
                                                        </div>
                                                        <input
                                                            required
                                                            type="tel"
                                                            value={phone}
                                                            onChange={(e) => setPhone(e.target.value)}
                                                            placeholder="+91"
                                                            onFocus={() => setActiveField('phone')}
                                                            onBlur={() => setActiveField(null)}
                                                            className="w-full bg-transparent p-4 pl-12 text-white font-mono outline-none placeholder:text-gray-700"
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="group">
                                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1 mb-2 block group-focus-within:text-[#A855F7] transition-colors">Secondary Mobile</label>
                                                    <div className={`relative bg-[#0A0A0A] border rounded-xl overflow-hidden transition-all duration-300 ${activeField === 'phone2' ? 'border-[#A855F7] shadow-[0_0_20px_rgba(168,85,247,0.1)]' : 'border-white/10'}`}>
                                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                                                            <Phone size={18} className="opacity-50" />
                                                        </div>
                                                        <input
                                                            type="tel"
                                                            value={secondaryPhone}
                                                            onChange={(e) => setSecondaryPhone(e.target.value)}
                                                            placeholder="Emergency Contact"
                                                            onFocus={() => setActiveField('phone2')}
                                                            onBlur={() => setActiveField(null)}
                                                            className="w-full bg-transparent p-4 pl-12 text-white font-mono outline-none placeholder:text-gray-700"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="group">
                                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1 mb-2 block group-focus-within:text-[#A855F7] transition-colors">Aadhar / National ID</label>
                                                    <div className={`relative bg-[#0A0A0A] border rounded-xl overflow-hidden transition-all duration-300 ${activeField === 'aadhar' ? 'border-[#A855F7] shadow-[0_0_20px_rgba(168,85,247,0.1)]' : 'border-white/10'}`}>
                                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                                                            <Fingerprint size={18} />
                                                        </div>
                                                        <input
                                                            required
                                                            type="text"
                                                            value={aadharNumber}
                                                            onChange={(e) => setAadharNumber(e.target.value)}
                                                            placeholder="XXXX-XXXX-XXXX"
                                                            onFocus={() => setActiveField('aadhar')}
                                                            onBlur={() => setActiveField(null)}
                                                            className="w-full bg-transparent p-4 pl-12 text-white font-mono outline-none placeholder:text-gray-700"
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="group">
                                                <div className="flex justify-between items-center mb-2">
                                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1 group-focus-within:text-[#A855F7] transition-colors">Residential Address</label>
                                                    <button
                                                        type="button"
                                                        onClick={detectLocation}
                                                        disabled={isLocating}
                                                        className="text-[10px] font-black text-[#A855F7] hover:text-[#A855F7]/80 flex items-center gap-1 disabled:opacity-50 uppercase tracking-[0.1em]"
                                                    >
                                                        {isLocating ? <Loader2 size={12} className="animate-spin" /> : <MapPin size={12} />}
                                                        {isLocating ? "Locating..." : "Use Current Location"}
                                                    </button>
                                                </div>
                                                <div className={`relative bg-[#0A0A0A] border rounded-xl overflow-hidden transition-all duration-300 ${activeField === 'address' ? 'border-[#A855F7] shadow-[0_0_20px_rgba(168,85,247,0.1)]' : 'border-white/10'}`}>
                                                    <div className="absolute left-4 top-4 text-gray-500">
                                                        <MapPin size={18} />
                                                    </div>
                                                    <textarea
                                                        required
                                                        rows={3}
                                                        placeholder="Enter full verification address"
                                                        value={address}
                                                        onChange={(e) => setAddress(e.target.value)}
                                                        onFocus={() => setActiveField('address')}
                                                        onBlur={() => setActiveField(null)}
                                                        className="w-full bg-transparent p-4 pl-12 text-white outline-none placeholder:text-gray-700 resize-none font-bold"
                                                    />
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}

                                    {step === 2 && (
                                        <motion.div
                                            key="step2"
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            className="space-y-8"
                                        >
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="w-8 h-8 rounded-lg bg-[#A855F7]/20 flex items-center justify-center text-[#A855F7] font-black">2</div>
                                                <h2 className="text-xl font-black tracking-widest uppercase italic">Secure Document Sync</h2>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                {/* ID Card Upload */}
                                                <div className="space-y-4">
                                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1 block">Government ID (Front)</label>
                                                    <div className={`relative group cursor-pointer border-2 border-dashed rounded-2xl p-8 text-center transition-all min-h-[180px] flex flex-col items-center justify-center ${idFile ? 'border-emerald-500 bg-emerald-500/5' : 'border-white/10 hover:border-[#A855F7] hover:bg-white/5'}`}>
                                                        <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleFileChange(e, setIdFile)} accept="image/*,.pdf" />

                                                        {idFile ? (
                                                            <div className="text-center">
                                                                <CheckCircle2 className="text-emerald-500 mx-auto mb-2" size={32} />
                                                                <p className="text-xs font-mono text-white truncate max-w-[200px] mx-auto">{idFile.name}</p>
                                                            </div>
                                                        ) : (
                                                            <div className="text-center">
                                                                <FileCheck className="text-[#A855F7] mx-auto mb-2 group-hover:scale-110 transition-transform" size={32} />
                                                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-300">Sync ID Card</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Selfie Upload */}
                                                <div className="space-y-4">
                                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1 block">Live Face Check</label>
                                                    <div className={`relative group cursor-pointer border-2 border-dashed rounded-2xl p-8 text-center transition-all min-h-[180px] flex flex-col items-center justify-center ${selfieFile ? 'border-emerald-500 bg-emerald-500/5' : 'border-white/10 hover:border-[#A855F7] hover:bg-white/5'}`}>
                                                        <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleFileChange(e, setSelfieFile)} accept="image/*" />

                                                        {selfieFile ? (
                                                            <div className="text-center">
                                                                <CheckCircle2 className="text-emerald-500 mx-auto mb-2" size={32} />
                                                                <p className="text-xs font-mono text-white truncate max-w-[200px] mx-auto">{selfieFile.name}</p>
                                                            </div>
                                                        ) : (
                                                            <div className="text-center">
                                                                <Scan className="text-[#A855F7] mx-auto mb-2 group-hover:scale-110 transition-transform" size={32} />
                                                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-300">Capture Bio-Data</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex gap-4">
                                                <div className="p-3 bg-amber-500/10 rounded-xl text-amber-500 h-fit">
                                                    <AlertCircle size={20} />
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-black uppercase tracking-wider text-white mb-1">Upload Guidelines</h4>
                                                    <ul className="text-xs text-gray-500 space-y-2 list-disc pl-4 font-mono">
                                                        <li>Ensure all 4 corners of the ID are visible</li>
                                                        <li>Text must be clearly readable, no glare</li>
                                                        <li>Selfie must include your face and ID clearly</li>
                                                    </ul>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}

                                    {step === 3 && (
                                        <motion.div
                                            key="step3"
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            className="space-y-8"
                                        >
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="w-8 h-8 rounded-lg bg-[#A855F7]/20 flex items-center justify-center text-[#A855F7] font-black">3</div>
                                                <h2 className="text-xl font-black tracking-widest uppercase italic">Review & Encrypt</h2>
                                            </div>

                                            <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-8 space-y-6">
                                                <div className="grid grid-cols-2 gap-8">
                                                    <div className="space-y-4">
                                                        <div>
                                                            <p className="text-[10px] uppercase font-black text-gray-600 tracking-widest mb-1">Full Name</p>
                                                            <p className="text-lg font-black text-white">{fullName || 'Not Provided'}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] uppercase font-black text-gray-600 tracking-widest mb-1">Aadhar Number</p>
                                                            <p className="text-lg font-mono text-white tracking-widest">{aadharNumber || 'Not Provided'}</p>
                                                        </div>
                                                    </div>
                                                    <div className="space-y-4 text-right">
                                                        <div>
                                                            <p className="text-[10px] uppercase font-black text-gray-600 tracking-widest mb-1">Sync Status</p>
                                                            <p className="text-sm font-black text-emerald-500">READY TO TRANSMIT</p>
                                                        </div>
                                                        <div className="flex justify-end gap-2">
                                                            {idFile && <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg" title="ID Sync"><FileCheck size={16} /></div>}
                                                            {selfieFile && <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg" title="Bio Sync"><User size={16} /></div>}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="border-t border-white/5 pt-6">
                                                    <p className="text-[10px] uppercase font-black text-gray-600 tracking-widest mb-2">Registered Address</p>
                                                    <p className="text-sm text-gray-300 leading-relaxed italic">{address || 'No location data'}</p>
                                                </div>

                                                <div className="bg-[#A855F7]/10 border border-[#A855F7]/20 rounded-2xl p-4 flex gap-3">
                                                    <ShieldCheck className="text-[#A855F7] shrink-0" size={20} />
                                                    <p className="text-[10px] text-gray-400 font-mono leading-relaxed uppercase tracking-wider">
                                                        Finalizing this step will hash your identity into our private ledger. This action is irreversible once the verification process begins.
                                                    </p>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Navigation */}
                                <div className="flex gap-4 pt-12">
                                    {step > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => setStep(step - 1)}
                                            className="flex-1 py-4 bg-white/5 text-white font-black rounded-xl hover:bg-white/10 transition-all border border-white/10 uppercase tracking-widest text-xs"
                                        >
                                            Back
                                        </button>
                                    )}
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className={`flex-[2] py-4 bg-[#A855F7] text-white font-black rounded-xl shadow-[0_4px_30px_rgba(168,85,247,0.3)] hover:shadow-[0_4px_40px_rgba(168,85,247,0.5)] transition-all transform hover:-translate-y-1 relative overflow-hidden group uppercase tracking-widest text-xs disabled:opacity-50 disabled:cursor-not-allowed`}
                                    >
                                        <span className="relative z-10 flex items-center justify-center gap-2">
                                            {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : (step === 3 ? 'Finalize Verification' : 'Continue')}
                                            {!isSubmitting && <ChevronRight size={18} />}
                                        </span>
                                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                                    </button>
                                </div>
                            </form>

                            {/* Footer */}
                            <div className="mt-12 text-center">
                                <p className="text-[#A855F7]/40 text-[9px] font-black uppercase tracking-[0.3em]">
                                    End-to-End Encrypted Verification Protocol v2.4.0
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
