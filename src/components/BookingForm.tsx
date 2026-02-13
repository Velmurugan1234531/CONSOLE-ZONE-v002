"use client";

import { useState, useEffect } from "react";
import { Calendar as CalendarIcon, CheckCircle2, ChevronRight, ChevronDown, Loader2, Users, Gamepad2, MapPin, TrendingUp, Gamepad } from "lucide-react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { motion, AnimatePresence } from "framer-motion";
import { DateRange } from "react-day-picker";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { createClient } from "@/utils/supabase/client";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

declare global {
    interface Window {
        Razorpay: any;
    }
}

interface BookingFormProps {
    product?: {
        name: string;
        rate: number;
        weeklyRate?: number;
        monthlyRate?: number;
        image?: string;
        [key: string]: any;
    };
    initialPlan?: string;
}

import { StockService } from "@/services/stock";
import { PLANS, ADDONS, EXTRA_CONTROLLER_PRICING, CONSOLE_RATES } from "@/constants";
import { formatCurrency } from "@/utils/format";
import { CONSOLE_IMAGES } from "@/constants/images";
import { getControllerSettings } from '@/services/controller-settings';
import { getCatalogSettings, calculateRentalPrice, CatalogSettings } from '@/services/catalog';

export default function BookingForm({ product, initialPlan = 'DAILY' }: BookingFormProps) {
    const router = useRouter();
    // Connected to Real-time stock
    const stockList = StockService.useStock();

    // Load controller settings
    const controllerSettings = getControllerSettings();
    const [catalogSettings, setCatalogSettings] = useState<CatalogSettings[]>([]);

    // Map list to Record format for existing logic compatibility
    // ONLY show consoles that belong to ENABLED catalog categories
    const stockData = stockList.reduce((acc, item) => {
        // Find if this item belongs to an enabled category
        const itemCategory = item.id.toLowerCase().includes('ps5') ? 'PS5'
            : item.id.toLowerCase().includes('ps4') ? 'PS4'
                : item.id.toLowerCase().includes('xbox') ? 'Xbox'
                    : 'PS5';

        const isEnabled = catalogSettings.length === 0 || catalogSettings.find(s => s.device_category === itemCategory)?.is_enabled;

        if (isEnabled) {
            acc[item.id] = {
                total: item.total,
                rented: item.rented,
                label: item.label || item.name,
                category: itemCategory
            };
        }
        return acc;
    }, {} as Record<string, { total: number; rented: number; label: string; category: string }>);

    const [selectedPlan, setSelectedPlan] = useState<keyof typeof PLANS>((initialPlan as keyof typeof PLANS) || 'DAILY');
    const [kycStatus, setKycStatus] = useState<string | null>(null);
    const [date, setDate] = useState<DateRange | undefined>({
        from: new Date(),
        to: new Date(new Date().getTime() + 24 * 60 * 60 * 1000 * 2), // 2 days default
    });
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        mobile: "",
        pickupTime: "",
        address: "",
        guests: "1",
        selectedConsole: "ps5", // Default
        deliveryMode: "delivery" // 'delivery' | 'pickup'
    });


    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLocating, setIsLocating] = useState(false);
    const [step, setStep] = useState(1);
    const [isConsoleListOpen, setIsConsoleListOpen] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [offerCode, setOfferCode] = useState("");
    const [appliedOffer, setAppliedOffer] = useState<any>(null);
    const [promoStatus, setPromoStatus] = useState<{ message: string; type: 'success' | 'error' | null }>({ message: '', type: null });
    const [validationError, setValidationError] = useState<string | null>(null);
    const supabase = createClient();

    // Load catalog settings on mount
    useEffect(() => {
        const loadCatalog = async () => {
            try {
                const settings = await getCatalogSettings();
                setCatalogSettings(settings);
            } catch (error: any) {
                console.error(`Failed to load catalog settings: ${error?.message || error}`);
            }
        };
        loadCatalog();
    }, []);

    // Track Auth State
    useEffect(() => {
        if (!auth) return;
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            try {
                if (firebaseUser) {
                    const currentUser = {
                        ...firebaseUser,
                        id: firebaseUser.uid,
                        user_metadata: {
                            full_name: firebaseUser.displayName,
                            avatar_url: firebaseUser.photoURL
                        },
                        email: firebaseUser.email
                    };
                    setUser(currentUser);

                    // Fetch KYC Status from users table
                    // We keep using Supabase for this, but with the Firebase UID
                    const { data: userData } = await supabase
                        .from('users')
                        .select('kyc_status')
                        .eq('id', firebaseUser.uid)
                        .single();

                    if (userData) {
                        setKycStatus(userData.kyc_status);
                    }

                    setFormData(prev => ({
                        ...prev,
                        firstName: firebaseUser.displayName?.split(' ')[0] || "",
                        lastName: firebaseUser.displayName?.split(' ').slice(1).join(' ') || "",
                        email: firebaseUser.email || ""
                    }));
                } else {
                    const demoUser = localStorage.getItem('DEMO_USER_SESSION');
                    if (demoUser) {
                        const parsed = JSON.parse(demoUser);
                        setUser(parsed);
                        setFormData(prev => ({
                            ...prev,
                            firstName: parsed.user_metadata?.full_name?.split(' ')[0] || "",
                            lastName: parsed.user_metadata?.full_name?.split(' ').slice(1).join(' ') || "",
                            email: parsed.email || ""
                        }));
                    }
                }
            } catch (e: any) {
                console.error(`BookingForm: Auth session fetch failure: ${e?.message || e}`);
            }
        });

        return () => unsubscribe();
    }, []);

    const [isScriptLoaded, setIsScriptLoaded] = useState(false);

    // Load Razorpay Script
    useEffect(() => {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.async = true;
        script.onload = () => setIsScriptLoaded(true);
        document.body.appendChild(script);
        return () => {
            document.body.removeChild(script);
        };
    }, []);





    useEffect(() => {
        if (initialPlan && PLANS[initialPlan as keyof typeof PLANS]) {
            setSelectedPlan(initialPlan as keyof typeof PLANS);
        }
    }, [initialPlan]);

    // Effect: Update selected console when product changes (nav from Rent Page)
    useEffect(() => {
        if (product?.id && typeof product.id === 'string') {
            setFormData(prev => ({ ...prev, selectedConsole: product.id }));
        }
    }, [product]);

    // Effect: Enforce Plan Duration Logic
    useEffect(() => {
        if (!date?.from) return;

        const plan = PLANS[selectedPlan];
        const newTo = new Date(date.from);

        if (plan && (plan.type === 'WEEKLY' || plan.type === 'MONTHLY' || selectedPlan === 'WEEKEND')) {
            newTo.setDate(newTo.getDate() + plan.duration);
        } else {
            // Optional: for DAILY, maybe default to 2 days if it was a longer plan
            newTo.setDate(newTo.getDate() + 2);
        }
        setDate({ from: date.from, to: newTo });
    }, [selectedPlan]); // Re-snap when plan changes

    // Effect: Auto-set controller count based on plan type
    useEffect(() => {
        if (selectedPlan === 'MONTHLY') {
            // Monthly plans default to 2 controllers (but can add more)
            setFormData(prev => ({ ...prev, guests: "2" }));
        } else if (formData.guests === "2") {
            // When switching away from monthly, reset to 1 controller default
            setFormData(prev => ({ ...prev, guests: "1" }));
        }
    }, [selectedPlan]);

    const calculateTotal = () => {
        if (!date?.from || !date?.to) return { total: 0, subtotal: 0, deliveryFee: 0, savings: 0 };
        const days = Math.max(1, Math.ceil((date.to.getTime() - date.from.getTime()) / (1000 * 60 * 60 * 24)));

        // Get catalog settings for selected console
        const consoleCategory = formData.selectedConsole.toLowerCase().includes('ps5') ? 'PS5'
            : formData.selectedConsole.toLowerCase().includes('ps4') ? 'PS4'
                : formData.selectedConsole.toLowerCase().includes('xbox') ? 'Xbox'
                    : 'PS5';

        const catalogSetting = catalogSettings.find(s => s.device_category === consoleCategory);

        // Base Unit Price from catalog settings
        let basePrice = 0;
        if (catalogSetting) {
            if (selectedPlan === 'MONTHLY' && days >= 28) {
                basePrice = catalogSetting.monthly_rate;
            } else if (selectedPlan === 'WEEKLY' && days >= 7) {
                basePrice = catalogSetting.weekly_rate * Math.ceil(days / 7);
            } else {
                basePrice = catalogSetting.daily_rate * days;
            }
        } else {
            // Fallback to old pricing if catalog not loaded
            const plan = PLANS[selectedPlan];
            if (plan.type === 'WEEKLY') {
                const weeklyPrice = product?.weeklyRate || plan.price;
                basePrice = weeklyPrice * Math.ceil(days / 7);
            } else if (plan.type === 'MONTHLY') {
                const monthlyPrice = product?.monthlyRate || plan.price;
                basePrice = monthlyPrice * Math.ceil(days / 30);
            } else {
                const dailyPrice = product?.rate || plan.price;
                basePrice = days * dailyPrice;
            }
        }

        // Extra Controller Pricing from catalog settings
        const includedControllers = selectedPlan === 'MONTHLY' ? 2 : 1;
        const extraControllers = Math.max(0, parseInt(formData.guests) - includedControllers);

        let addonCost = 0;
        if (catalogSetting && catalogSetting.extra_controller_enabled && extraControllers > 0) {
            if (selectedPlan === 'MONTHLY' || days >= 28) {
                // Monthly: Weekly rate * 4
                addonCost = extraControllers * (catalogSetting.controller_weekly_rate * 4);
            } else if (selectedPlan === 'WEEKLY' || days >= 7) {
                // Weekly: Weekly rate * number of weeks
                const weeks = Math.ceil(days / 7);
                addonCost = extraControllers * catalogSetting.controller_weekly_rate * weeks;
            } else {
                // Daily: Daily rate * days
                addonCost = extraControllers * catalogSetting.controller_daily_rate * days;
            }
        } else if (!catalogSetting) {
            // Fallback to old controller pricing if settings not loaded
            const consoleType = formData.selectedConsole.toLowerCase().includes('ps5') ? 'ps5' : 'ps4';
            const extraControllerPrice = (controllerSettings.pricing as any)[consoleType]?.[selectedPlan] || 0;
            addonCost = extraControllers * extraControllerPrice;
        }

        const subtotal = basePrice + addonCost;

        // Apply offer discount if available
        let discount = 0;
        if (appliedOffer) {
            if (appliedOffer.discount_type === 'percentage') {
                discount = (subtotal * appliedOffer.discount_value) / 100;
            } else {
                discount = appliedOffer.discount_value;
            }
            discount = Math.min(discount, subtotal); // Don't exceed subtotal
        }

        // Delivery Charge (Free over 1000)
        let deliveryFee = 0;
        if (formData.deliveryMode === 'delivery') {
            deliveryFee = subtotal >= 1000 ? 0 : 350;
        }

        return {
            total: subtotal - discount + deliveryFee,
            subtotal,
            deliveryFee,
            discount,
            savings: Math.floor(subtotal * 0.15) // Placeholder for "Gamer Savings"
        };
    };

    const handleDetectLocation = () => {
        setIsLocating(true);
        setValidationError(null);
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const { latitude, longitude } = position.coords;
                    // Simple coordinate fallback
                    setFormData(prev => ({
                        ...prev,
                        address: `Lat: ${latitude.toFixed(4)}, Long: ${longitude.toFixed(4)}`
                    }));

                    // Optional: Try reverse geocoding if needed, but coords are enough for now
                    try {
                        const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`);
                        const data = await response.json();
                        if (data.city || data.locality) {
                            setFormData(prev => ({
                                ...prev,
                                address: `${data.locality || ''} ${data.city || ''}, ${data.principalSubdivision || ''}`.trim()
                            }));
                        }
                    } catch (e: any) {
                        console.error(`Geocoding failed: ${e?.message || e}`);
                        setValidationError("Could not detect location automatically.");
                    }
                    setIsLocating(false);
                },
                (error: any) => {
                    console.error(`Error getting location: ${error?.message || error}`);
                    setIsLocating(false);
                    setValidationError("Could not detect location. Please enter manually.");
                }
            );
        } else {
            setIsLocating(false);
            setValidationError("Geolocation is not supported by this browser.");
        }
    };

    const handleNextStep = () => {
        setValidationError(null);
        if (step === 1) {
            if (date?.from && date?.to && formData.pickupTime) {
                setStep(2);
            } else {
                setValidationError("Please select dates and pickup time.");
            }
        } else if (step === 2) {
            if (formData.firstName && formData.lastName && formData.email && formData.mobile && formData.address) {
                setStep(3);
            } else {
                setValidationError("Please fill all contact details.");
            }
        }
    };

    // Simulated booked dates (Removed for production)
    const bookedDays: Date[] = [];

    const finalizeBooking = async () => {
        // Create booking object
        const newBooking = {
            id: crypto.randomUUID(),
            ...formData,
            startDate: date?.from,
            endDate: date?.to,
            createdAt: new Date().toISOString(),
            status: 'confirmed',
            totalAmount: calculateTotal()
        };

        // Calculate Addons (Extra Controllers)
        const includedControllers = selectedPlan === 'MONTHLY' ? 2 : 1;
        const extraControllers = Math.max(0, parseInt(formData.guests) - includedControllers);
        const consoleType = formData.selectedConsole.toLowerCase().includes('ps5') ? 'ps5' : 'ps4';
        const extraControllerPrice = (controllerSettings.pricing as any)[consoleType]?.[selectedPlan] || 0;

        const addons = [];
        if (extraControllers > 0) {
            addons.push({
                id: 'extra-controller',
                name: 'Extra Controller',
                quantity: extraControllers,
                price: extraControllers * extraControllerPrice
            });
        }

        try {
            // Log Booking
            const response = await fetch('/api/book', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user?.id || "guest", // or fetch from auth context
                    productCategory: formData.selectedConsole.toUpperCase(), // 'PS5', 'PS4'
                    planId: selectedPlan,
                    startDate: date?.from,
                    endDate: date?.to,
                    deliveryType: formData.deliveryMode.toUpperCase(),
                    address: formData.address,
                    mobile: formData.mobile,
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    email: formData.email,
                    guests: formData.guests,
                    addons: addons,
                    totalAmount: calculateTotal().total
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error(`Booking API Failed: ${errorData?.message || JSON.stringify(errorData)}`);
                // Fallback to local storage if API fails (or show error)
                // For safety/demo we'll still save locally but warn
            }

            // Still save to local for redundancy/offline viewing in this demo
            const newBooking = {
                id: crypto.randomUUID(),
                ...formData,
                startDate: date?.from,
                endDate: date?.to,
                createdAt: new Date().toISOString(),
                status: 'confirmed',
                totalAmount: calculateTotal()
            };
            const existingBookings = JSON.parse(localStorage.getItem('console-zone-bookings') || '[]');
            localStorage.setItem('console-zone-bookings', JSON.stringify([...existingBookings, newBooking]));

        } catch (error: any) {
            console.error(`Failed to save booking: ${error?.message || error}`);
        }

        setIsSubmitting(false);
        setIsSubmitted(true);
    };

    const handlePayment = async () => {
        setIsSubmitting(true);
        const amount = calculateTotal();

        try {
            // 1. Create Order via API
            console.log("Creating order with amount:", amount.total);
            const response = await fetch("/api/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ amount: amount.total }),
            });
            const orderData = await response.json();

            if (orderData.error || orderData.demoMode) {
                const isAuthError = response.status === 401 || orderData.demoMode ||
                    (typeof orderData.error === 'string' && orderData.error.includes("Invalid Razorpay Credentials"));

                if (isAuthError) {
                    console.warn(`Payment Demo Mode: ${orderData.error}`);
                } else {
                    console.error(`Payment API Error: ${orderData.error?.message || orderData.error}`);
                }

                if (isAuthError) {
                    setValidationError("⚠️ Demo Mode: Simulating Payment (Invalid Keys)");
                } else {
                    setValidationError(`Payment Error: ${orderData.error.message || orderData.error}. Falling back to Demo.`);
                }

                await new Promise(resolve => setTimeout(resolve, 1500));
                finalizeBooking();
                return;
            }

            // 2. Open Razorpay Modal
            const options = {
                key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
                amount: orderData.amount,
                currency: orderData.currency,
                name: "Console Zone",
                description: `Rental: ${formData.firstName} ${formData.lastName}`,
                order_id: orderData.id,
                handler: function (response: any) {
                    console.log("Payment Successful:", response);
                    finalizeBooking();
                },
                prefill: {
                    name: `${formData.firstName} ${formData.lastName}`,
                    email: formData.email,
                },
                theme: {
                    color: "#A855F7",
                },
            };

            const rzp = new window.Razorpay(options);
            rzp.open();
            setIsSubmitting(false); // Wait for user action in modal

        } catch (error: any) {
            console.error(`Payment Error: ${error?.message || error}`);
            setIsSubmitting(false);
            setValidationError("Payment failed initialization. Please try again.");
        }
    };

    if (isSubmitted) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-[#080012] rounded-2xl p-8 text-center max-w-md mx-auto shadow-2xl border border-[#4D008C]/50 shadow-[#4D008C]/20"
            >
                <div className="w-16 h-16 bg-[#4D008C]/20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-[#4D008C]/30">
                    <CheckCircle2 className="text-[#A855F7]" size={32} />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Game On!</h3>
                <p className="text-gray-300 mb-6 text-sm leading-relaxed">
                    Booking Confirmed!
                    <br />
                    Check your email: <span className="text-[#A855F7] font-semibold">{formData.email}</span>
                </p>
                <button
                    onClick={() => {
                        setIsSubmitted(false);
                        setStep(1);
                        setFormData({ firstName: "", lastName: "", email: "", mobile: "", pickupTime: "", address: "", guests: "1", selectedConsole: "ps5", deliveryMode: "delivery" });
                        setDate({ from: new Date(), to: new Date(new Date().getTime() + 24 * 60 * 60 * 1000 * 2) });
                    }}
                    className="w-full py-3 bg-[#4D008C] hover:bg-[#6D28D9] text-white font-bold rounded-xl transition-all shadow-lg shadow-[#4D008C]/40 text-sm"
                >
                    Book Another Device
                </button>
            </motion.div >
        );
    }

    return (
        <div className="w-full max-w-md mx-auto">
            {/* Authoritative "Glue" Fix (Zero-Gap Selection) */}
            <style jsx global>{`
                /* 1. REMOVE ALL GAPS */
                .rdp-months { display: flex !important; justify-content: center !important; }
                .rdp-month_grid, .rdp-table { border-collapse: collapse !important; border-spacing: 0 !important; margin: 0 !important; }
                .rdp-cell { padding: 0 !important; margin: 0 !important; border-radius: 0 !important; }
                .rdp-row { display: flex !important; margin: 0 !important; }

                /* 2. SOLID BAR ELEMENTS */
                .rdp-day {
                    width: 44px !important;
                    height: 44px !important;
                    margin: 0 !important;
                    padding: 0 !important;
                    border-radius: 0 !important; /* Square for seamless connection */
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    border: none !important;
                    background: transparent !important;
                    color: white !important;
                    font-weight: 600 !important;
                    position: relative !important;
                }

                /* 3. THE SELECTION BAR (DEEP PURPLE) */
                [aria-selected="true"],
                .rdp-selected,
                .rdp-day_selected {
                    background-color: #4D008C !important; /* Brand Dark Purple */
                    color: white !important; /* High contrast white */
                    font-weight: 800 !important;
                    opacity: 1 !important;
                }

                /* 4. THE START & END HIGHLIGHTS (NEON + OUTLINE) */
                .rdp-day_range_start, .rdp-range_start {
                    background-color: #A855F7 !important; /* Neon Glow */
                    border-radius: 12px 0 0 12px !important; /* Round the start */
                    outline: 2px solid white !important;
                    outline-offset: -2px !important;
                    z-index: 20 !important;
                }

                .rdp-day_range_end, .rdp-range_end {
                    background-color: #A855F7 !important; /* Neon Glow */
                    border-radius: 0 12px 12px 0 !important; /* Round the end */
                    outline: 2px solid white !important;
                    outline-offset: -2px !important;
                    z-index: 20 !important;
                }

                /* 5. SMOOTH MIDDLE BAR */
                .rdp-day_range_middle, .rdp-range_middle {
                    background-color: rgba(77, 0, 140, 0.6) !important;
                }

                /* Today / Hover / Outside */
                .rdp-day_today:not([aria-selected="true"]) {
                    color: #A855F7 !important;
                    font-weight: 900 !important;
                    box-shadow: inset 0 0 0 2px #A855F7 !important;
                    border-radius: 8px !important;
                }
                .rdp-day_outside { opacity: 0.2 !important; }
                .rdp-day:hover:not([aria-selected="true"]) {
                    background-color: rgba(168, 85, 247, 0.1) !important;
                    border-radius: 8px !important;
                }
            `}</style>

            <div className="bg-[#080012] rounded-xl overflow-hidden shadow-2xl border border-[#4D008C]/30 shadow-[#4D008C]/10">
                <div className="bg-[#120520] p-5 border-b border-[#4D008C]/20 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#A855F7]" />
                            {step === 1 && "Configuration"}
                            {step === 2 && "Gamer Details"}
                            {step === 3 && "Payment & Confirm"}
                        </h2>
                        <p className="text-gray-400 text-[10px] uppercase tracking-widest font-bold mt-1 opacity-60">
                            {step === 1 && "Select Plan & Slot"}
                            {step === 2 && "Verification Required"}
                            {step === 3 && "Secure Check-out"}
                        </p>
                    </div>
                    {/* Visual Step Indicator */}
                    <div className="flex gap-1">
                        <div className={`h-2 w-8 rounded-full transition-colors ${step >= 1 ? "bg-[#A855F7]" : "bg-[#4D008C]/30"}`} />
                        <div className={`h-2 w-8 rounded-full transition-colors ${step >= 2 ? "bg-[#A855F7]" : "bg-[#4D008C]/30"}`} />
                        <div className={`h-2 w-8 rounded-full transition-colors ${step >= 3 ? "bg-[#A855F7]" : "bg-[#4D008C]/30"}`} />
                    </div>
                </div>

                <div className="p-5 space-y-5">
                    {step === 1 && (
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="space-y-6"
                        >


                            {/* Date Selection Popover */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-300 uppercase tracking-wide flex items-center gap-2">
                                    <CalendarIcon size={14} className="text-[#A855F7]" />
                                    Rental Period
                                </label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <button
                                            type="button"
                                            className={cn(
                                                "w-full bg-[#120520] border border-[#4D008C]/20 rounded-lg px-4 py-3 text-left font-normal flex items-center justify-between text-sm shadow-inner transition-all hover:bg-[#1f0a33] group hover:border-[#4D008C]/50",
                                                !date && "text-gray-500"
                                            )}
                                        >
                                            <span className={cn("text-white truncate", !date && "text-gray-500")}>
                                                {date?.from ? (
                                                    date.to ? (
                                                        <>
                                                            {format(date.from, "MMM dd")} - {format(date.to, "MMM dd, yyyy")}
                                                        </>
                                                    ) : (
                                                        format(date.from, "MMM dd, yyyy")
                                                    )
                                                ) : (
                                                    <span>Pick your dates</span>
                                                )}
                                            </span>
                                            <CalendarIcon className="mr-2 h-4 w-4 text-[#A855F7] group-hover:text-white transition-colors" />
                                        </button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0 border border-[#4D008C]/30 bg-[#080012] shadow-[0_0_30px_rgba(168,85,247,0.15)]" align="center">
                                        <div className="px-4 py-3 border-b border-[#4D008C]/30 bg-[#120520] flex justify-between items-center bg-gradient-to-r from-[#120520] to-[#1a0b2e]">
                                            <div className="flex items-center gap-2">
                                                <div className="px-2 py-0.5 rounded-full bg-[#A855F7] text-[9px] font-black text-white uppercase tracking-tighter shadow-[0_0_10px_rgba(168,85,247,0.4)]">
                                                    LIVE
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[11px] font-black text-white uppercase tracking-[0.12em] drop-shadow-[0_0_8px_rgba(168,85,247,0.3)]">
                                                        {PLANS[selectedPlan]?.label}
                                                    </span>
                                                    <span className="text-[8px] text-[#A855F7] font-bold uppercase tracking-widest">{PLANS[selectedPlan]?.duration > 0 ? `${PLANS[selectedPlan].duration} Days Selection` : "Flexible Days"}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1.5 pointer-events-none">
                                                <div className="w-1.5 h-1.5 rounded-full bg-[#A855F7] animate-pulse shadow-[0_0_8px_#A855F7]"></div>
                                            </div>
                                        </div>
                                        <Calendar
                                            initialFocus
                                            mode="range"
                                            defaultMonth={date?.from}
                                            selected={date}
                                            onSelect={(newDate, selectedDay) => {
                                                // Handle deselection or invalid clicks
                                                if (!selectedDay) {
                                                    setDate(undefined);
                                                    return;
                                                }

                                                const plan = PLANS[selectedPlan];

                                                if (plan && (plan.type === 'WEEKLY' || plan.type === 'MONTHLY' || selectedPlan === 'WEEKEND')) {
                                                    const from = selectedDay;
                                                    const to = new Date(from);
                                                    to.setDate(to.getDate() + (plan.duration));
                                                    setDate({ from, to });
                                                } else {
                                                    setDate(newDate);
                                                }
                                            }}
                                            numberOfMonths={1}
                                            disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                                            className="bg-[#080012]"
                                        />
                                        {/* Legend */}
                                        <div className="p-3 border-t border-[#4D008C]/20 bg-[#0f0518] flex items-center justify-around text-[9px] text-gray-500 font-bold uppercase tracking-widest">
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-2 h-2 rounded-full bg-[#A855F7] shadow-[0_0_5px_#A855F7]"></div>
                                                <span className="text-gray-300">{PLANS[selectedPlan]?.label}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-2 h-2 rounded-full border border-[#A855F7]"></div>
                                                <span className="text-[#A855F7]">Today</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-2 h-2 rounded-full bg-white/5 border border-white/10"></div>
                                                <span className="opacity-50">Booked</span>
                                            </div>
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            </div>


                            {/* Console Selection Dropdown */}
                            <div className="space-y-3">
                                <label className="text-xs font-bold text-gray-300 uppercase tracking-wide flex items-center gap-2">
                                    <Gamepad2 size={14} className="text-[#A855F7]" />
                                    Select Console
                                </label>

                                <div className="relative">
                                    {/* Dropdown Trigger Button */}
                                    <button
                                        type="button"
                                        onClick={() => setIsConsoleListOpen(!isConsoleListOpen)}
                                        className="w-full flex items-center justify-between p-3 rounded-xl border bg-[#120520] border-[#4D008C]/20 hover:border-[#A855F7]/50 transition-all text-left group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-lg flex items-center justify-center overflow-hidden border border-white/10 bg-black/20">
                                                <img
                                                    src={
                                                        formData.selectedConsole.includes('ps5') ? CONSOLE_IMAGES.ps5.preview :
                                                            formData.selectedConsole.includes('ps4') ? CONSOLE_IMAGES.ps4.preview :
                                                                formData.selectedConsole.includes('xbox') ? CONSOLE_IMAGES.xbox.preview :
                                                                    CONSOLE_IMAGES.default.preview
                                                    }
                                                    alt="Selected"
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold text-white">
                                                    {stockData[formData.selectedConsole]?.label || "Select Console"}
                                                </div>
                                                <div className="text-[10px] text-green-500 font-medium">
                                                    Tap to change console
                                                </div>
                                            </div>
                                        </div>
                                        <ChevronDown className={`text-gray-400 transition-transform duration-300 ${isConsoleListOpen ? 'rotate-180' : ''}`} size={20} />
                                    </button>

                                    {/* Dropdown Options List */}
                                    {isConsoleListOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="absolute top-full left-0 right-0 mt-2 z-20 bg-[#080012] border border-[#4D008C]/50 rounded-xl shadow-2xl overflow-hidden p-1 space-y-1"
                                        >
                                            {Object.entries(stockData).map(([key, data]) => {
                                                const available = data.total - data.rented;
                                                const isLow = available <= 3 && available > 0;
                                                const isOut = available === 0;
                                                const isSelected = formData.selectedConsole === key;

                                                return (
                                                    <button
                                                        key={key}
                                                        type="button"
                                                        onClick={() => {
                                                            if (!isOut) {
                                                                // Navigate to the product page instead of just setting state
                                                                // This ensures images and details update
                                                                router.push(`/rent/${key}`);
                                                                setIsConsoleListOpen(false);
                                                            }
                                                        }}
                                                        disabled={isOut}
                                                        className={`w-full flex items-center justify-between p-2 rounded-lg transition-all text-left ${isSelected
                                                            ? 'bg-[#4D008C] text-white'
                                                            : 'hover:bg-[#4D008C]/20 text-gray-300'
                                                            } ${isOut ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-md overflow-hidden bg-black/40">
                                                                <img
                                                                    src={
                                                                        key.includes('ps5') ? CONSOLE_IMAGES.ps5.preview :
                                                                            key.includes('ps4') ? CONSOLE_IMAGES.ps4.preview :
                                                                                key.includes('xbox') ? CONSOLE_IMAGES.xbox.preview :
                                                                                    CONSOLE_IMAGES.default.preview
                                                                    }
                                                                    alt={data.label}
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            </div>
                                                            <div>
                                                                <div className="text-xs font-bold flex items-center gap-2">
                                                                    {data.label}
                                                                    {/* Price Badge */}
                                                                    <span className="text-[9px] bg-[#A855F7]/10 text-[#A855F7] px-1.5 py-0.5 rounded border border-[#A855F7]/20 uppercase tracking-widest">
                                                                        {(() => {
                                                                            // Lookup Rate
                                                                            const consoleKey = key.includes('ps5') ? 'ps5'
                                                                                : key.includes('ps4') ? 'ps4'
                                                                                    : key.includes('xbox') ? 'xbox'
                                                                                        : key.includes('switch') ? 'switch'
                                                                                            : key.includes('pc') ? 'pc'
                                                                                                : 'ps5';

                                                                            const rate = CONSOLE_RATES[consoleKey as keyof typeof CONSOLE_RATES]?.[selectedPlan] || 0;
                                                                            return rate > 0 ? `₹${rate.toLocaleString()}` : 'Check Price';
                                                                        })()}
                                                                    </span>
                                                                </div>
                                                                <div className="text-[9px] mt-0.5">
                                                                    {isOut ? (
                                                                        <span className="text-red-400 font-bold">Out of Stock</span>
                                                                    ) : isLow ? (
                                                                        <span className="text-orange-500 font-bold flex items-center gap-1 animate-pulse">
                                                                            🔥 {available} Left! Hurry!
                                                                        </span>
                                                                    ) : (
                                                                        <span className={isSelected ? 'text-white/80' : 'text-gray-400'}>{available} units available</span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        {isSelected && <CheckCircle2 size={16} className="text-white" />}
                                                    </button>
                                                )
                                            })}
                                        </motion.div>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-300 uppercase tracking-wide">
                                        Pickup Time
                                    </label>
                                    <select
                                        required
                                        className="w-full bg-[#120520] border border-[#4D008C]/20 rounded-lg px-3 py-2 text-white focus:ring-1 focus:ring-[#A855F7] focus:border-[#A855F7] outline-none transition-all text-xs shadow-inner appearance-none cursor-pointer"
                                        value={formData.pickupTime}
                                        onChange={(e) => setFormData({ ...formData, pickupTime: e.target.value })}
                                    >
                                        <option value="" disabled>Select Delivery Slot</option>
                                        {[10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20].map(hour => {
                                            const timeString = `${hour}:00`;
                                            const displayTime = format(new Date().setHours(hour, 0), "hh:00 a");

                                            // 3-Hour Rule Logic
                                            let isDisabled = false;
                                            if (date?.from && new Date().toDateString() === date.from.toDateString()) {
                                                const cutoff = new Date();
                                                cutoff.setHours(cutoff.getHours() + 3);
                                                if (hour < cutoff.getHours()) isDisabled = true;
                                            }

                                            return (
                                                <option key={hour} value={timeString} disabled={isDisabled} className={isDisabled ? "text-gray-600 bg-gray-900" : ""}>
                                                    {displayTime} {isDisabled ? "(Unavailable)" : ""}
                                                </option>
                                            )
                                        })}
                                    </select>
                                </div>

                                <div className="space-y-3">
                                    {!((stockList.find(i => i.id === formData.selectedConsole)?.extraControllerEnabled === false) ||
                                        (stockList.find(i => i.id === formData.selectedConsole)?.maxControllers === 0)) && (
                                            <>
                                                <label className="text-xs font-bold text-gray-300 uppercase tracking-wide flex items-center gap-2">
                                                    <Gamepad2 size={14} className="text-[#A855F7]" />
                                                    Controllers Needed
                                                </label>

                                                <select
                                                    required
                                                    className="w-full bg-[#120520] border border-[#4D008C]/20 rounded-lg px-3 py-2 text-white focus:ring-1 focus:ring-[#A855F7] focus:border-[#A855F7] outline-none transition-all text-xs shadow-inner appearance-none cursor-pointer"
                                                    value={formData.guests}
                                                    onChange={(e) => setFormData({ ...formData, guests: e.target.value })}
                                                >
                                                    {(() => {
                                                        const consoleCategory = formData.selectedConsole.toLowerCase().includes('ps5') ? 'PS5' : formData.selectedConsole.toLowerCase().includes('ps4') ? 'PS4' : 'Xbox';
                                                        const catalogSetting = catalogSettings.find(s => s.device_category === consoleCategory);

                                                        const isEnabled = catalogSetting?.extra_controller_enabled !== false;
                                                        const maxQty = catalogSetting?.max_controllers || 2;

                                                        const consoleType = formData.selectedConsole.toLowerCase().includes('ps5') ? 'ps5' : 'ps4';
                                                        const pricePerController = catalogSetting ? catalogSetting.controller_daily_rate : ((controllerSettings.pricing as any)[consoleType]?.[selectedPlan] || 0);

                                                        const isMonthly = selectedPlan === 'MONTHLY';
                                                        const includedCount = isMonthly ? 2 : 1;

                                                        if (!isEnabled) return <option value={includedCount}>{includedCount} Controller{includedCount > 1 ? 's' : ''} (Included)</option>;

                                                        return (
                                                            <>
                                                                {Array.from({ length: maxQty }, (_, i) => i + 1).map((num) => {
                                                                    const isIncluded = num <= includedCount;
                                                                    const extraCount = Math.max(0, num - includedCount);

                                                                    // Calculate pricing for the option label
                                                                    let optionPrice = 0;
                                                                    const days = date?.from && date?.to ? Math.ceil((date.to.getTime() - date.from.getTime()) / (1000 * 60 * 60 * 24)) : 1;

                                                                    if (catalogSetting) {
                                                                        if (selectedPlan === 'MONTHLY' || days >= 28) optionPrice = extraCount * catalogSetting.controller_weekly_rate * 4;
                                                                        else if (selectedPlan === 'WEEKLY' || days >= 7) optionPrice = extraCount * catalogSetting.controller_weekly_rate * Math.ceil(days / 7);
                                                                        else optionPrice = extraCount * catalogSetting.controller_daily_rate * days;
                                                                    } else {
                                                                        optionPrice = extraCount * pricePerController;
                                                                    }

                                                                    return (
                                                                        <option key={num} value={num}>
                                                                            {num} Controller{num > 1 ? 's' : ''} {isIncluded ? '(Included)' : `(+₹${optionPrice.toLocaleString()})`}
                                                                        </option>
                                                                    );
                                                                })}
                                                            </>
                                                        );
                                                    })()}
                                                </select>

                                                {/* Pricing Info */}
                                                {date?.from && date?.to && (() => {
                                                    const isMonthly = selectedPlan === 'MONTHLY';
                                                    const includedCount = isMonthly ? 2 : 1;
                                                    const guests = parseInt(formData.guests);

                                                    if (guests <= includedCount) return null;

                                                    const extraCount = guests - includedCount;
                                                    const consoleCategory = formData.selectedConsole.toLowerCase().includes('ps5') ? 'PS5' : formData.selectedConsole.toLowerCase().includes('ps4') ? 'PS4' : 'Xbox';
                                                    const catalogSetting = catalogSettings.find(s => s.device_category === consoleCategory);

                                                    let totalAddon = 0;
                                                    const days = Math.ceil((date.to.getTime() - date.from.getTime()) / (1000 * 60 * 60 * 24));

                                                    if (catalogSetting) {
                                                        if (selectedPlan === 'MONTHLY' || days >= 28) totalAddon = extraCount * catalogSetting.controller_weekly_rate * 4;
                                                        else if (selectedPlan === 'WEEKLY' || days >= 7) totalAddon = extraCount * catalogSetting.controller_weekly_rate * Math.ceil(days / 7);
                                                        else totalAddon = extraCount * catalogSetting.controller_daily_rate * days;
                                                    } else {
                                                        const consoleType = formData.selectedConsole.toLowerCase().includes('ps5') ? 'ps5' : 'ps4';
                                                        const pricePerController = (controllerSettings.pricing as any)[consoleType]?.[selectedPlan] || 0;
                                                        totalAddon = extraCount * pricePerController;
                                                    }

                                                    return (
                                                        <div className="p-2 bg-[#A855F7]/5 border border-[#A855F7]/20 rounded-lg text-[10px] text-gray-300 mt-2">
                                                            <span className="text-[#A855F7] font-bold">
                                                                {extraCount} extra controller{extraCount > 1 ? 's' : ''}
                                                            </span>
                                                            {" "}= ₹{totalAddon.toLocaleString()} total addon
                                                        </div>
                                                    );
                                                })()}
                                            </>
                                        )}
                                </div>
                            </div>

                            {/* Summary & Recommendations */}
                            {date?.from && date?.to && (() => {
                                const days = Math.ceil((date.to.getTime() - date.from.getTime()) / (1000 * 60 * 60 * 24));
                                const showWeeklyRec = selectedPlan === 'DAILY' && days >= 5 && days < 20;
                                const showMonthlyRec = selectedPlan === 'DAILY' && days >= 20;

                                return (
                                    <div className="space-y-3 mt-2">
                                        {/* Recommendation Banner */}
                                        <AnimatePresence>
                                            {(showWeeklyRec || showMonthlyRec) && (
                                                <motion.div
                                                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                                    exit={{ opacity: 0, scale: 0.9 }}
                                                    className="bg-[#A855F7]/10 border border-[#A855F7]/30 rounded-lg p-3 flex items-center justify-between gap-3 shadow-[0_0_15px_rgba(168,85,247,0.1)]"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-8 h-8 rounded-full bg-[#A855F7]/20 flex items-center justify-center">
                                                            <TrendingUp size={16} className="text-[#A855F7]" />
                                                        </div>
                                                        <div>
                                                            <div className="text-[11px] font-bold text-[#A855F7] uppercase tracking-wider">Save More!</div>
                                                            <div className="text-[10px] text-gray-300">
                                                                Switch to <span className="text-white font-bold">{showWeeklyRec ? 'Weekly' : 'Monthly'} Plan</span> for better value.
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => setSelectedPlan(showWeeklyRec ? 'WEEKLY' : 'MONTHLY')}
                                                        className="bg-[#A855F7] hover:bg-[#9333EA] text-white text-[10px] font-black px-3 py-1.5 rounded-md transition-all whitespace-nowrap shadow-lg shadow-[#A855F7]/20"
                                                    >
                                                        SWITCH & SAVE
                                                    </button>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                );
                            })()}

                            <AnimatePresence mode="wait">
                                {date?.from && date?.to && formData.pickupTime && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 20 }}
                                        className="relative mt-auto border-t border-[#4D008C]/30 bg-[#120520] -mx-5 -mb-5 p-6"
                                    >
                                        <div className="flex flex-col gap-4">
                                            <div className="flex justify-between items-end">
                                                <div className="space-y-1">
                                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Selected Slot</p>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-black text-white italic">
                                                            {format(date.from, "MMM d")} - {format(date.to, "MMM d")}
                                                            <span className="text-[#A855F7] ml-2 font-black">({PLANS[selectedPlan].label})</span>
                                                        </span>
                                                        <span className="text-[10px] text-[#A855F7] font-bold uppercase tracking-wider mt-0.5">
                                                            Duration: {Math.max(1, Math.ceil((date.to.getTime() - date.from.getTime()) / (1000 * 60 * 60 * 24)))} Days
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[10px] text-[#A855F7] font-bold uppercase tracking-widest">Estimated Total</p>
                                                    <motion.div
                                                        key={calculateTotal().total}
                                                        initial={{ opacity: 0, scale: 0.95 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        className="text-3xl font-black text-white font-display"
                                                    >
                                                        {formatCurrency(calculateTotal().total)}
                                                    </motion.div>
                                                </div>
                                            </div>

                                            <button
                                                onClick={handleNextStep}
                                                className="w-full py-4 bg-[#A855F7] hover:bg-[#9333EA] text-white font-black uppercase tracking-[0.2em] rounded-xl transition-all shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:shadow-[0_0_30px_rgba(168,85,247,0.5)] active:scale-[0.98] text-sm"
                                            >
                                                Proceed to Information
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    )}

                    {step === 2 && (
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-4"
                        >
                            {/* Delivery Preference Toggle */}
                            <div className="grid grid-cols-2 gap-4 p-1 bg-[#120520] rounded-xl border border-[#4D008C]/20">
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, deliveryMode: 'delivery' })}
                                    className={`py-2 rounded-lg text-sm font-bold transition-all ${formData.deliveryMode === 'delivery' ? 'bg-[#4D008C] text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                                >
                                    Home Delivery
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, deliveryMode: 'pickup' })}
                                    className={`py-2 rounded-lg text-sm font-bold transition-all ${formData.deliveryMode === 'pickup' ? 'bg-[#4D008C] text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                                >
                                    Store Pickup
                                </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-300 uppercase tracking-wide">
                                        First Name
                                    </label>
                                    <input
                                        required
                                        type="text"
                                        placeholder="Gamertag / Name"
                                        className="w-full bg-[#120520] border border-[#4D008C]/20 rounded-lg px-4 py-2.5 text-white placeholder:text-gray-500 focus:ring-1 focus:ring-[#A855F7] focus:border-[#A855F7] outline-none transition-all text-sm shadow-inner"
                                        value={formData.firstName}
                                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-300 uppercase tracking-wide">
                                        Last Name
                                    </label>
                                    <input
                                        required
                                        type="text"
                                        placeholder="Last Name"
                                        className="w-full bg-[#120520] border border-[#4D008C]/20 rounded-lg px-4 py-2.5 text-white placeholder:text-gray-500 focus:ring-1 focus:ring-[#A855F7] focus:border-[#A855F7] outline-none transition-all text-sm shadow-inner"
                                        value={formData.lastName}
                                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-300 uppercase tracking-wide">
                                    Gamer Email
                                </label>
                                <input
                                    required
                                    type="email"
                                    placeholder="player1@example.com"
                                    className="w-full bg-[#120520] border border-[#4D008C]/20 rounded-lg px-4 py-2.5 text-white placeholder:text-gray-500 focus:ring-1 focus:ring-[#A855F7] focus:border-[#A855F7] outline-none transition-all text-sm shadow-inner"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-300 uppercase tracking-wide">
                                    Mobile Number
                                </label>
                                <input
                                    required
                                    type="tel"
                                    placeholder="+91 98765 43210"
                                    className="w-full bg-[#120520] border border-[#4D008C]/20 rounded-lg px-4 py-2.5 text-white placeholder:text-gray-500 focus:ring-1 focus:ring-[#A855F7] focus:border-[#A855F7] outline-none transition-all text-sm shadow-inner"
                                    value={formData.mobile}
                                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-300 uppercase tracking-wide">
                                    Delivery Address
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        required
                                        type="text"
                                        placeholder="Enter delivery address"
                                        className="flex-1 bg-[#120520] border border-[#4D008C]/20 rounded-lg px-4 py-2.5 text-white placeholder:text-gray-500 focus:ring-1 focus:ring-[#A855F7] focus:border-[#A855F7] outline-none transition-all text-sm shadow-inner"
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    />
                                    <button
                                        type="button"
                                        onClick={handleDetectLocation}
                                        disabled={isLocating}
                                        className="bg-[#4D008C]/20 hover:bg-[#4D008C]/40 text-[#A855F7] border border-[#4D008C]/50 rounded-lg px-3 flex items-center justify-center transition-colors disabled:opacity-50"
                                        title="Use Current Location"
                                    >
                                        {isLocating ? <Loader2 className="animate-spin" size={18} /> : <MapPin size={18} />}
                                    </button>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setStep(1)}
                                    className="flex-1 py-3 bg-transparent border border-[#4D008C] text-gray-300 hover:text-white hover:bg-[#4D008C]/20 font-bold rounded-xl text-sm transition-all"
                                >
                                    Back
                                </button>
                                <button
                                    type="button"
                                    onClick={handleNextStep}
                                    disabled={!formData.firstName || !formData.email || !formData.address}
                                    className="flex-[2] bg-[#4D008C] hover:bg-[#6D28D9] text-white font-bold py-3 rounded-xl text-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#4D008C] shadow-lg shadow-[#4D008C]/40 border border-[#A855F7]/30"
                                >
                                    Proceed to Payment <ChevronRight size={18} />
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {step === 3 && (
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-6"
                        >
                            <div className="bg-[#120520] p-6 rounded-2xl border border-[#4D008C]/40 space-y-4 shadow-xl">
                                <div className="flex items-center justify-between border-b border-[#4D008C]/20 pb-4">
                                    <h3 className="text-white font-black text-xs uppercase tracking-widest">Deployment Summary</h3>
                                    <span className="bg-[#39ff14]/10 text-[#39ff14] text-[8px] px-2 py-0.5 rounded border border-[#39ff14]/20 font-black uppercase tracking-tighter">Verified Identity Required</span>
                                </div>

                                <div className="space-y-3 text-xs">
                                    <div className="flex justify-between text-gray-400">
                                        <span className="font-bold">OPERATIVE</span>
                                        <span className="text-white font-mono uppercase">{formData.firstName} {formData.lastName}</span>
                                    </div>
                                    <div className="flex justify-between text-gray-400">
                                        <span className="font-bold">ASSET</span>
                                        <span className="text-white font-mono uppercase">
                                            {product?.name || (stockData[formData.selectedConsole as keyof typeof stockData]?.label)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-gray-400">
                                        <span className="font-bold">DEPLOYMENT</span>
                                        <div className="text-right">
                                            <span className="text-white font-mono uppercase block">{date?.from && format(date.from, "MMM dd")} - {date?.to && format(date.to, "MMM dd")}</span>
                                            <span className="text-[#A855F7] text-[10px] font-bold uppercase tracking-widest">
                                                {date?.from && date?.to && `${Math.max(1, Math.ceil((date.to.getTime() - date.from.getTime()) / (1000 * 60 * 60 * 24)))} Days Total`}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="pt-2 mt-2 border-t border-[#4D008C]/10 space-y-2">
                                        <div className="flex justify-between text-gray-500">
                                            <span>Subtotal</span>
                                            <span className="text-gray-300">{formatCurrency(calculateTotal().subtotal)}</span>
                                        </div>
                                        <div className="flex justify-between text-gray-500">
                                            <span>Delivery Fee</span>
                                            <span className={calculateTotal().deliveryFee === 0 ? "text-[#39ff14] font-bold" : "text-gray-300"}>
                                                {calculateTotal().deliveryFee === 0 ? "FREE" : formatCurrency(calculateTotal().deliveryFee)}
                                            </span>
                                        </div>
                                        {appliedOffer && (calculateTotal().discount ?? 0) > 0 && (
                                            <div className="flex justify-between text-emerald-500 font-bold">
                                                <span className="flex items-center gap-2">
                                                    <span className="text-[10px] bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded uppercase tracking-wider">
                                                        {appliedOffer.code}
                                                    </span>
                                                    Discount
                                                </span>
                                                <span>-{formatCurrency(calculateTotal().discount ?? 0)}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between text-[#39ff14] font-bold">
                                            <span>Gamer Savings</span>
                                            <span>-{formatCurrency(calculateTotal().savings)}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Offer Code Input */}
                                <div className="bg-[#120520] p-4 rounded-2xl border border-[#4D008C]/40 space-y-3">
                                    <label className="text-xs font-bold text-gray-300 uppercase tracking-wide flex items-center gap-2">
                                        <span className="text-amber-500">🏷️</span>
                                        Have a Promo Code?
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            placeholder="Enter code (e.g., FIRST10)"
                                            className="flex-1 bg-[#0a0a0a] border border-[#4D008C]/20 rounded-lg px-4 py-2.5 text-white placeholder:text-gray-600 focus:ring-1 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all text-sm uppercase"
                                            value={offerCode}
                                            onChange={(e) => setOfferCode(e.target.value.toUpperCase())}
                                            disabled={!!appliedOffer}
                                        />
                                        {appliedOffer ? (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setAppliedOffer(null);
                                                    setOfferCode("");
                                                    setPromoStatus({ message: '', type: null });
                                                }}
                                                className="bg-red-500/20 hover:bg-red-500/30 text-red-500 border border-red-500/30 rounded-lg px-4 py-2 text-xs font-bold uppercase transition-all"
                                            >
                                                Remove
                                            </button>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={async () => {
                                                    if (!offerCode) return;
                                                    setPromoStatus({ message: 'Validating...', type: null });
                                                    try {
                                                        const { validateOfferCode } = await import('@/services/offers');
                                                        const consoleCategory = formData.selectedConsole.toLowerCase().includes('ps5') ? 'PS5'
                                                            : formData.selectedConsole.toLowerCase().includes('ps4') ? 'PS4'
                                                                : 'Xbox';
                                                        const days = date?.from && date?.to
                                                            ? Math.max(1, Math.ceil((date.to.getTime() - date.from.getTime()) / (1000 * 60 * 60 * 24)))
                                                            : 1;

                                                        const result = await validateOfferCode(offerCode, consoleCategory, days);

                                                        if (result.is_valid) {
                                                            setAppliedOffer({
                                                                code: offerCode,
                                                                discount_type: result.discount_type,
                                                                discount_value: result.discount_value
                                                            });
                                                            setPromoStatus({ message: result.message, type: 'success' });
                                                        } else {
                                                            setPromoStatus({ message: result.message, type: 'error' });
                                                        }
                                                    } catch (error) {
                                                        console.error("Failed to validate offer:", error);
                                                        setPromoStatus({ message: 'Error validating code', type: 'error' });
                                                    }
                                                }}
                                                className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-500 border border-amber-500/30 rounded-lg px-4 py-2 text-xs font-bold uppercase transition-all"
                                            >
                                                Apply
                                            </button>
                                        )}
                                    </div>

                                    {promoStatus.type && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            className={`p-3 rounded-lg flex items-center gap-2 border ${promoStatus.type === 'success'
                                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'
                                                : 'bg-red-500/10 border-red-500/30 text-red-500'
                                                }`}
                                        >
                                            {promoStatus.type === 'success' ? <CheckCircle2 size={16} /> : <div className="w-1.5 h-1.5 rounded-full bg-red-500" />}
                                            <span className="text-xs font-bold italic tracking-tight">{promoStatus.message}</span>
                                        </motion.div>
                                    )}
                                </div>

                                <div className="border-t border-[#4D008C]/30 pt-4 flex justify-between items-center bg-[#4D008C]/10 -mx-6 px-6 -mb-6 pb-6 rounded-b-2xl">
                                    <div>
                                        <span className="text-gray-400 font-bold text-[10px] uppercase tracking-widest block">Total Payable</span>
                                        <span className="text-white font-black text-3xl font-display">
                                            {formatCurrency(calculateTotal().total)}
                                        </span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-[#39ff14] text-[10px] font-black uppercase tracking-widest block">Level: Elite</span>
                                    </div>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={handlePayment}
                                disabled={isSubmitting || !isScriptLoaded}
                                className="group/pay w-full bg-[#A855F7] hover:bg-[#9333EA] text-white font-black py-5 rounded-2xl text-lg transition-all active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(168,85,247,0.3)] border border-white/10 uppercase tracking-widest"
                            >
                                {isSubmitting ? (
                                    <>DEPLOYING <Loader2 className="animate-spin" size={20} /></>
                                ) : (
                                    <>CONFIRM DEPLOYMENT <ChevronRight size={20} className="group-hover/pay:translate-x-1 transition-transform" /></>
                                )}
                            </button>

                            <button
                                type="button"
                                onClick={() => setStep(2)}
                                className="w-full text-xs text-gray-500 hover:text-gray-300 underline"
                            >
                                Back to Verification
                            </button>
                        </motion.div>
                    )}
                    {/* Error Display */}
                    <AnimatePresence>
                        {validationError && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2 text-red-500 text-xs font-bold"
                            >
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                                {validationError}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div >
    );
}

function GamePadIcon({ className, size }: { className?: string, size?: number }) {
    return (
        <Gamepad2 className={className} size={size} />
    )
}
