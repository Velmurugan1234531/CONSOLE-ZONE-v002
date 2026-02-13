"use client";

import { useState } from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { motion, AnimatePresence } from "framer-motion";
import {
    User, Phone, Fingerprint, MapPin, Loader2, CheckCircle2,
    FileCheck, Scan, ShieldCheck, ChevronRight, AlertCircle, Upload
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { createWorker } from 'tesseract.js';
import ScanningOverlay from "./kyc/ScanningOverlay";

interface KYCFormProps {
    onSuccess?: () => void;
    className?: string;
}

export default function KYCForm({ onSuccess, className }: KYCFormProps) {
    const [step, setStep] = useState(1);
    const [activeField, setActiveField] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLocating, setIsLocating] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [scanStatus, setScanStatus] = useState("Initializing Scanner...");

    // Form Stats
    const [fullName, setFullName] = useState("");
    const [phone, setPhone] = useState("");
    const [secondaryPhone, setSecondaryPhone] = useState("");
    const [aadharNumber, setAadharNumber] = useState("");
    const [address, setAddress] = useState("");
    const [idFrontFile, setIdFrontFile] = useState<File | null>(null);
    const [idBackFile, setIdBackFile] = useState<File | null>(null);
    const [selfieFile, setSelfieFile] = useState<File | null>(null);

    const router = useRouter();
    const supabase = createClient();

    const uploadFile = async (file: File, path: string) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${path}/${fileName}`;

        // Demo Mode Bypass
        if (path.includes('demo-user')) {
            return "https://images.unsplash.com/photo-1549923746-c502d488b3ea?q=80&w=300";
        }

        const { error: uploadError } = await supabase.storage
            .from('kyc-documents')
            .upload(filePath, file);

        if (uploadError) throw uploadError;

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
                } catch (error) {
                    console.error("Error fetching address:", error);
                } finally {
                    setIsLocating(false);
                }
            }, (error) => {
                console.error("Error getting location:", error);
                setIsLocating(false);
            });
        } else {
            setIsLocating(false);
        }
    };

    const scanIDCard = async (file: File) => {
        setIsScanning(true);
        setScanStatus("Calibrating Neural Sensors...");

        try {
            const worker = await createWorker('eng');

            setScanStatus("Analyzing Document Structure...");
            const { data: { text } } = await worker.recognize(file);

            setScanStatus("Extracting Bio-Data...");
            console.log("OCR Result:", text);

            // Simple pattern matching for Indian Aadhar (XXXX XXXX XXXX or XXXXXXXXXXXX)
            const aadharMatch = text.match(/\b\d{4}\s\d{4}\s\d{4}\b/) || text.match(/\b\d{12}\b/);
            if (aadharMatch) {
                setAadharNumber(aadharMatch[0]);
            }

            // Simple name extraction attempt (very basic, looks for uppercase strings)
            // In a real app, this would be much more sophisticated or use a specialized API
            const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 5);
            // Assuming name is often at the top or near "Name"
            const nameLine = lines.find(l =>
                !l.toLowerCase().includes('india') &&
                !l.toLowerCase().includes('government') &&
                !l.toLowerCase().includes('aadhar') &&
                /^[A-Z\s]+$/.test(l)
            );
            if (nameLine && !fullName) {
                setFullName(nameLine);
            }

            await worker.terminate();
        } catch (error) {
            console.error("Scanning failed:", error);
        } finally {
            setIsScanning(false);
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, setter: (file: File | null) => void, isIdFront = false) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setter(file);

            if (isIdFront) {
                await scanIDCard(file);
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (step < 3) {
            setStep(step + 1);
            return;
        }

        if (!idFrontFile || !idBackFile || !selfieFile) {
            alert("Please upload ID Card (Front & Back) and Selfie documents.");
            return;
        }

        setIsSubmitting(true);
        setUploading(true);

        try {
            let userId = "";
            const firebaseUser = auth?.currentUser;

            if (firebaseUser) {
                userId = firebaseUser.uid;
            } else {
                const demoUser = localStorage.getItem('DEMO_USER_SESSION');
                if (demoUser) {
                    userId = JSON.parse(demoUser).id;
                } else {
                    alert("Please log in to submit KYC.");
                    router.push('/login');
                    return;
                }
            }

            // Upload Files
            const idFrontUrl = await uploadFile(idFrontFile, `${userId}/id_card_front`);
            const idBackUrl = await uploadFile(idBackFile, `${userId}/id_card_back`);
            const selfieUrl = await uploadFile(selfieFile, `${userId}/selfie`);

            // Submit Data
            const { submitKYC } = await import("@/services/admin");

            // Handle Demo Submission differently if needed or just pass through
            if (userId.startsWith('demo-')) {
                // Demo submission simulation
                await new Promise(resolve => setTimeout(resolve, 1500));
            } else {
                await submitKYC(userId, {
                    fullName,
                    phone,
                    secondaryPhone,
                    aadharNumber,
                    address,
                    idCardFrontUrl: idFrontUrl,
                    idCardBackUrl: idBackUrl,
                    selfieUrl
                });
            }

            if (onSuccess) {
                onSuccess();
            } else {
                router.push("/profile");
            }

        } catch (error: any) {
            console.error("KYC Submission Failed:", error);
            alert(`Submission Failed: ${error.message || "Unknown error"}`);
        } finally {
            setIsSubmitting(false);
            setUploading(false);
        }
    };

    return (
        <div className={`text-white relative ${className}`}>
            {/* AI Scanning Overlay */}
            <ScanningOverlay isVisible={isScanning} status={scanStatus} />

            {/* Progress Stepper */}
            <div className="mb-8">
                <div className="flex justify-between items-center relative">
                    <div className="absolute top-1/2 left-0 w-full h-0.5 bg-white/5 -translate-y-1/2" />
                    <div
                        className="absolute top-1/2 left-0 h-0.5 bg-gradient-to-r from-[#8B5CF6] to-[#A855F7] -translate-y-1/2 transition-all duration-500"
                        style={{ width: `${((step - 1) / 2) * 100}%` }}
                    />
                    {[1, 2, 3].map((s) => (
                        <div key={s} className="relative z-10 flex flex-col items-center gap-2 group">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black transition-all duration-300 border ${step === s
                                ? 'bg-[#8B5CF6] text-white border-[#8B5CF6] shadow-[0_0_20px_rgba(139,92,246,0.5)]'
                                : step > s
                                    ? 'bg-emerald-500 text-white border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)]'
                                    : 'bg-[#0a0a0a] text-gray-600 border-white/10 group-hover:border-white/20'
                                }`}>
                                {step > s ? <CheckCircle2 size={16} /> : s}
                            </div>
                            <span className={`text-[8px] font-black uppercase tracking-widest ${step >= s ? 'text-white' : 'text-gray-600'}`}>
                                {s === 1 ? 'IDENTITY' : s === 2 ? 'DOCS' : 'CONFIRM'}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                <AnimatePresence mode="wait">
                    {step === 1 && (
                        <motion.div
                            key="step1"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-6"
                        >
                            <div className="grid grid-cols-1 gap-4">
                                <div className="group">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1 mb-2 block">Full Legal Name</label>
                                    <div className={`relative bg-[#0A0A0A] border rounded-xl overflow-hidden transition-all duration-300 ${activeField === 'name' ? 'border-[#A855F7]' : 'border-white/10'}`}>
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                                            <User size={16} />
                                        </div>
                                        <input
                                            required
                                            type="text"
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                            placeholder="John Doe"
                                            onFocus={() => setActiveField('name')}
                                            onBlur={() => setActiveField(null)}
                                            className="w-full bg-transparent p-3 pl-10 text-sm text-white outline-none placeholder:text-gray-700 font-bold"
                                        />
                                    </div>
                                </div>

                                <div className="group">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1 mb-2 block">Primary Mobile</label>
                                    <div className={`relative bg-[#0A0A0A] border rounded-xl overflow-hidden transition-all duration-300 ${activeField === 'phone' ? 'border-[#A855F7]' : 'border-white/10'}`}>
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                                            <Phone size={16} />
                                        </div>
                                        <input
                                            required
                                            type="tel"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            placeholder="+91"
                                            onFocus={() => setActiveField('phone')}
                                            onBlur={() => setActiveField(null)}
                                            className="w-full bg-transparent p-3 pl-10 text-sm text-white font-mono outline-none placeholder:text-gray-700"
                                        />
                                    </div>
                                </div>

                                <div className="group">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1 mb-2 block">Secondary Mobile</label>
                                    <div className={`relative bg-[#0A0A0A] border rounded-xl overflow-hidden transition-all duration-300 ${activeField === 'secondaryPhone' ? 'border-[#A855F7]' : 'border-white/10'}`}>
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                                            <Phone size={16} />
                                        </div>
                                        <input
                                            type="tel"
                                            value={secondaryPhone}
                                            onChange={(e) => setSecondaryPhone(e.target.value)}
                                            placeholder="+91 (Optional)"
                                            onFocus={() => setActiveField('secondaryPhone')}
                                            onBlur={() => setActiveField(null)}
                                            className="w-full bg-transparent p-3 pl-10 text-sm text-white font-mono outline-none placeholder:text-gray-700"
                                        />
                                    </div>
                                </div>

                                <div className="group">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1 mb-2 block">Aadhar / National ID</label>
                                    <div className={`relative bg-[#0A0A0A] border rounded-xl overflow-hidden transition-all duration-300 ${activeField === 'aadhar' ? 'border-[#A855F7]' : 'border-white/10'}`}>
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                                            <Fingerprint size={16} />
                                        </div>
                                        <input
                                            required
                                            type="text"
                                            value={aadharNumber}
                                            onChange={(e) => setAadharNumber(e.target.value)}
                                            placeholder="XXXX-XXXX-XXXX"
                                            onFocus={() => setActiveField('aadhar')}
                                            onBlur={() => setActiveField(null)}
                                            className="w-full bg-transparent p-3 pl-10 text-sm text-white font-mono outline-none placeholder:text-gray-700"
                                        />
                                    </div>
                                </div>

                                <div className="group">
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Address</label>
                                        <button
                                            type="button"
                                            onClick={detectLocation}
                                            disabled={isLocating}
                                            className="text-[9px] font-black text-[#A855F7] hover:text-[#A855F7]/80 flex items-center gap-1 disabled:opacity-50 uppercase tracking-[0.1em]"
                                        >
                                            {isLocating ? <Loader2 size={10} className="animate-spin" /> : <MapPin size={10} />}
                                            {isLocating ? "Locating..." : "Auto-Detect"}
                                        </button>
                                    </div>
                                    <textarea
                                        required
                                        value={address}
                                        onChange={(e) => setAddress(e.target.value)}
                                        placeholder="Full residential address"
                                        rows={2}
                                        onFocus={() => setActiveField('address')}
                                        onBlur={() => setActiveField(null)}
                                        className={`w-full bg-[#0A0A0A] border rounded-xl p-3 text-sm text-white outline-none placeholder:text-gray-700 resize-none transition-all duration-300 ${activeField === 'address' ? 'border-[#A855F7]' : 'border-white/10'}`}
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
                            className="space-y-6"
                        >
                            <div className="grid grid-cols-1 gap-6">
                                {/* ID Front Upload */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Government ID (Front)</label>
                                    <div className={`relative group border-2 border-dashed rounded-xl p-6 transition-all duration-300 ${idFrontFile ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-white/10 hover:border-[#A855F7]/50 hover:bg-[#A855F7]/5'}`}>
                                        <input
                                            type="file"
                                            accept="image/*,.pdf"
                                            onChange={(e) => handleFileChange(e, setIdFrontFile, true)}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                        />
                                        <div className="flex flex-col items-center justify-center text-center gap-2">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${idFrontFile ? 'bg-emerald-500/20 text-emerald-500' : 'bg-white/5 text-gray-400 group-hover:text-[#A855F7]'}`}>
                                                {idFrontFile ? <CheckCircle2 size={20} /> : <FileCheck size={20} />}
                                            </div>
                                            <div>
                                                <p className={`text-xs font-bold ${idFrontFile ? 'text-emerald-500' : 'text-gray-300 group-hover:text-white'}`}>
                                                    {idFrontFile ? idFrontFile.name : "Upload ID Front"}
                                                </p>
                                                <p className="text-[9px] text-gray-500 mt-1">MAX 5MB (JPG, PNG)</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* ID Back Upload */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Government ID (Back)</label>
                                    <div className={`relative group border-2 border-dashed rounded-xl p-6 transition-all duration-300 ${idBackFile ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-white/10 hover:border-[#A855F7]/50 hover:bg-[#A855F7]/5'}`}>
                                        <input
                                            type="file"
                                            accept="image/*,.pdf"
                                            onChange={(e) => handleFileChange(e, setIdBackFile)}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                        />
                                        <div className="flex flex-col items-center justify-center text-center gap-2">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${idBackFile ? 'bg-emerald-500/20 text-emerald-500' : 'bg-white/5 text-gray-400 group-hover:text-[#A855F7]'}`}>
                                                {idBackFile ? <CheckCircle2 size={20} /> : <FileCheck size={20} />}
                                            </div>
                                            <div>
                                                <p className={`text-xs font-bold ${idBackFile ? 'text-emerald-500' : 'text-gray-300 group-hover:text-white'}`}>
                                                    {idBackFile ? idBackFile.name : "Upload ID Back"}
                                                </p>
                                                <p className="text-[9px] text-gray-500 mt-1">MAX 5MB (JPG, PNG)</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Selfie Upload */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Live Selfie</label>
                                    <div className={`relative group border-2 border-dashed rounded-xl p-6 transition-all duration-300 ${selfieFile ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-white/10 hover:border-[#A855F7]/50 hover:bg-[#A855F7]/5'}`}>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            capture="user"
                                            onChange={(e) => handleFileChange(e, setSelfieFile)}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                        />
                                        <div className="flex flex-col items-center justify-center text-center gap-2">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${selfieFile ? 'bg-emerald-500/20 text-emerald-500' : 'bg-white/5 text-gray-400 group-hover:text-[#A855F7]'}`}>
                                                {selfieFile ? <CheckCircle2 size={20} /> : <Scan size={20} />}
                                            </div>
                                            <div>
                                                <p className={`text-xs font-bold ${selfieFile ? 'text-emerald-500' : 'text-gray-300 group-hover:text-white'}`}>
                                                    {selfieFile ? selfieFile.name : "Take Selfie"}
                                                </p>
                                                <p className="text-[9px] text-gray-500 mt-1">Tap to capture</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {step === 3 && (
                        <motion.div
                            key="step3"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="flex flex-col items-center justify-center text-center py-8 space-y-6"
                        >
                            <div className="w-20 h-20 bg-[#A855F7]/20 rounded-full flex items-center justify-center text-[#A855F7] animate-pulse">
                                <ShieldCheck size={40} />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-white italic uppercase tracking-widest mb-2">Review & Submit</h3>
                                <p className="text-gray-400 text-xs max-w-xs mx-auto">
                                    By proceeding, you consent to the processing of your personal data for identity verification purposes.
                                </p>
                            </div>

                            <div className="flex gap-2 text-[10px] text-gray-500 bg-white/5 px-4 py-2 rounded-lg">
                                <AlertCircle size={14} />
                                <span>Verification typically takes 2-4 hours.</span>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="flex justify-between pt-4 border-t border-white/5">
                    {step > 1 ? (
                        <button
                            type="button"
                            onClick={() => setStep(step - 1)}
                            className="px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold text-gray-400 transition-colors"
                        >
                            Back
                        </button>
                    ) : (
                        <div />
                    )}

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-8 py-3 bg-[#A855F7] hover:bg-[#9333EA] disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-xs font-black uppercase tracking-widest text-white flex items-center gap-2 transition-all shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:shadow-[0_0_30px_rgba(168,85,247,0.5)]"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                Processing...
                            </>
                        ) : step < 3 ? (
                            <>
                                Next Step
                                <ChevronRight size={16} />
                            </>
                        ) : (
                            "Submit Verification"
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
