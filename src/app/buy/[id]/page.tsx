"use client";

import { use, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    ShoppingBag,
    ArrowLeft,
    ShieldCheck,
    Truck,
    Star,
    CheckCircle2,
    Package,
    Tag,
    Share2
} from "lucide-react";
import Link from "next/link";
import { getProductById } from "@/services/products";
import { Product } from "@/types";
import { formatCurrency } from "@/utils/format";
import { useCart } from "@/context/cart-context";
import PageHero from "@/components/layout/PageHero";
import JoystickLoader from "@/components/ui/JoystickLoader";

export default function ShopProductDetail({ params }: { params: Promise<{ id: string }> }) {
    const unwrappedParams = use(params);
    const id = unwrappedParams.id;

    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeImage, setActiveImage] = useState("");
    const { addItem } = useCart();

    useEffect(() => {
        const loadProduct = async () => {
            try {
                const data = await getProductById(id);
                setProduct(data);
                if (data && data.images && data.images.length > 0) {
                    setActiveImage(data.images[0]);
                } else if (data && data.image) {
                    setActiveImage(data.image);
                }
            } catch (error) {
                console.error("Failed to load product:", error);
            } finally {
                setLoading(false);
            }
        };
        loadProduct();
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center text-white p-8">
                <JoystickLoader />
                <p className="mt-4 text-xs font-black uppercase tracking-[0.3em] text-gray-500">Retrieving Gear Intel...</p>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center text-white p-8 space-y-6">
                <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-3xl">
                    <ShoppingBag size={48} className="text-red-500 opacity-50" />
                </div>
                <div className="text-center">
                    <h1 className="text-3xl font-black uppercase italic tracking-tighter">Gear Not Found</h1>
                    <p className="text-gray-500 font-mono text-xs uppercase tracking-widest mt-2">The requested item has been relocated or sold.</p>
                </div>
                <Link
                    href="/buy"
                    className="flex items-center gap-2 bg-white text-black px-8 py-3 rounded-full font-black text-xs uppercase tracking-widest hover:bg-[#A855F7] hover:text-white transition-all"
                >
                    <ArrowLeft size={16} /> Return to Shop
                </Link>
            </div>
        );
    }

    const allImages = product.images && product.images.length > 0 ? product.images : [product.image];

    return (
        <div className="min-h-screen relative bg-[#050505] text-white">
            <PageHero
                title={product.name}
                subtitle={`${product.category} | ${product.stock > 0 ? 'INSTANT DISPATCH' : 'OUT OF STOCK'}`}
                images={allImages}
                height="60vh"
            >
                <Link href="/buy" className="inline-flex items-center gap-2 text-gray-400 hover:text-[#A855F7] mt-4 transition-colors font-black text-[10px] uppercase tracking-widest">
                    <ArrowLeft size={14} /> Back to Catalog
                </Link>
            </PageHero>

            <div className="w-full max-w-none px-4 sm:px-6 lg:px-8 pb-32 pt-20 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16">

                    {/* Visuals Column */}
                    <div className="lg:col-span-7 space-y-6">
                        <div className="bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] overflow-hidden aspect-square flex items-center justify-center relative perspective-1000 group">
                            <AnimatePresence mode="wait">
                                <motion.img
                                    key={activeImage}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 1.05 }}
                                    transition={{ duration: 0.4 }}
                                    src={activeImage}
                                    alt={product.name}
                                    className="w-full h-full object-cover relative z-10 pointer-events-none"
                                />
                            </AnimatePresence>
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        </div>

                        {/* Thumbnails */}
                        {allImages.length > 1 && (
                            <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
                                {allImages.map((img, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setActiveImage(img)}
                                        className={`min-w-[100px] h-[100px] bg-[#0a0a0a] border rounded-2xl overflow-hidden transition-all ${activeImage === img ? 'border-[#A855F7] ring-1 ring-[#A855F7] ring-offset-4 ring-offset-[#050505]' : 'border-white/10 opacity-70 hover:opacity-100'}`}
                                    >
                                        <img src={img} className="w-full h-full object-cover" alt={`View ${i}`} />
                                    </button>
                                ))}
                            </div>
                        )}

                        <div className="hidden lg:grid grid-cols-3 gap-6 pt-12">
                            <IconBox icon={<ShieldCheck size={20} />} title="Authentic" subtitle="Pre-inspected Gear" />
                            <IconBox icon={<Truck size={20} />} title="Fast Shipping" subtitle="Metro 24h Delivery" />
                            <IconBox icon={<Star size={20} />} title="Warranty" subtitle="CZ Certified" />
                        </div>
                    </div>

                    {/* Intel Column */}
                    <div className="lg:col-span-5 flex flex-col">
                        <div className="sticky top-24 space-y-8">
                            <div>
                                <div className="flex items-center gap-3 mb-4">
                                    <span className="px-4 py-1.5 rounded-full bg-[#A855F7]/10 text-[#A855F7] text-[10px] font-black uppercase tracking-[0.2em] border border-[#A855F7]/20">
                                        {product.category}
                                    </span>
                                    <span className={`px-4 py-1.5 rounded-full ${product.stock > 0 ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'} text-[10px] font-black uppercase tracking-[0.2em] border`}>
                                        {product.stock > 0 ? `IN STOCK (${product.stock})` : 'BACKORDER'}
                                    </span>
                                </div>
                                <h1 className="text-4xl md:text-6xl font-black text-white uppercase italic tracking-tighter leading-none mb-6">
                                    {product.name}
                                </h1>
                                <div className="flex items-end gap-4">
                                    <span className="text-5xl font-black text-white tracking-tight">{formatCurrency(product.price)}</span>
                                    <span className="text-gray-500 font-mono text-xs uppercase mb-2">Incl. GST</span>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <button
                                    onClick={() => addItem({
                                        id: product.id,
                                        name: product.name,
                                        price: product.price,
                                        image: activeImage,
                                        quantity: 1
                                    } as any)}
                                    disabled={product.stock <= 0}
                                    className="w-full h-16 bg-white text-black rounded-2xl flex items-center justify-center gap-3 font-black uppercase tracking-widest text-sm hover:bg-[#A855F7] hover:text-white transition-all transform hover:scale-[1.02] shadow-[0_0_30px_rgba(255,255,255,0.1)] active:scale-[0.98] disabled:opacity-50 disabled:grayscale"
                                >
                                    <ShoppingBag size={20} />
                                    {product.stock > 0 ? 'ADD TO MISSION CORE' : 'NOTIFY WHEN READY'}
                                </button>
                                <div className="flex gap-4">
                                    <button className="flex-1 h-12 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">
                                        <Share2 size={14} /> Share Intel
                                    </button>
                                    <button className="flex-1 h-12 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">
                                        <Tag size={14} /> Track Price
                                    </button>
                                </div>
                            </div>

                            <div className="pt-8 border-t border-white/5 space-y-6">
                                <div className="space-y-3">
                                    <h3 className="text-xs font-black uppercase tracking-[0.3em] text-[#A855F7]">Device Intel</h3>
                                    <p className="text-gray-400 text-sm leading-relaxed font-medium capitalize">
                                        {product.description}
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 gap-3">
                                    <FeatureItem text="Certified Quality Checked" />
                                    <FeatureItem text="7-Day Replacement Policy" />
                                    <FeatureItem text="Instant Digital Verification" />
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}

function IconBox({ icon, title, subtitle }: { icon: React.ReactNode, title: string, subtitle: string }) {
    return (
        <div className="p-6 bg-white/5 border border-white/10 rounded-3xl space-y-2">
            <div className="text-[#A855F7] opacity-80">{icon}</div>
            <h4 className="text-xs font-black uppercase tracking-widest text-white">{title}</h4>
            <p className="text-[10px] font-mono text-gray-500 uppercase">{subtitle}</p>
        </div>
    );
}

function FeatureItem({ text }: { text: string }) {
    return (
        <div className="flex items-center gap-3 py-2">
            <CheckCircle2 size={16} className="text-[#A855F7]" />
            <span className="text-white text-xs font-black uppercase tracking-widest">{text}</span>
        </div>
    );
}
