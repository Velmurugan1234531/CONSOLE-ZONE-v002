"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    ShoppingBag,
    Filter,
    Gamepad2,
    Monitor,
    Cpu,
    Gamepad,
    Search,
    ChevronRight,
    ArrowRight,
    Star,
    ShieldCheck,
    Truck,
    Trash2
} from "lucide-react";
import { Product, ProductCategory } from "@/types";
import { getProducts } from "@/services/products";
import { formatCurrency } from "@/utils/format";
import Link from "next/link";
import { useCart } from "@/context/cart-context";
import { usePageSEO } from "@/hooks/use-seo";

const categories = [
    { id: 'All', icon: <ShoppingBag size={18} /> },
    { id: 'PS5', icon: <Gamepad2 size={18} /> },
    { id: 'Xbox', icon: <Gamepad size={18} /> },
    { id: 'PS4', icon: <Gamepad2 size={18} /> },
    { id: 'VR', icon: <Monitor size={18} /> },
    { id: 'Accessory', icon: <Monitor size={18} /> },
];

import PageHero from "@/components/layout/PageHero";
import { VisualsService, VisualSettings } from "@/services/visuals";

export default function BuyPage() {
    usePageSEO('buy');
    const { addItem } = useCart();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [searchQuery, setSearchQuery] = useState("");
    const [visualSettings, setVisualSettings] = useState<VisualSettings | null>(null);

    const [isAdmin, setIsAdmin] = useState(false);
    const [clickCount, setClickCount] = useState(0);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<Partial<Product>>({});

    useEffect(() => {
        loadProducts();
        const loadVisuals = async () => {
            const settings = await VisualsService.getSettings();
            setVisualSettings(settings);
        };
        loadVisuals();
    }, []);

    const loadProducts = async () => {
        setLoading(true);
        try {
            const data = await getProducts('buy');
            setProducts(data);
        } catch (error) {
            console.error("Failed to load products:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSecretClick = () => {
        const newCount = clickCount + 1;
        setClickCount(newCount);
        if (newCount === 5) {
            setIsAdmin(!isAdmin);
            setClickCount(0);
        }
    };

    const handleCreate = async () => {
        if (!confirm("Create a new product?")) return;

        const newProduct = {
            name: "NEW PRODUCT",
            description: "Description here",
            price: 9999,
            type: 'buy',
            category: 'Category' as ProductCategory,
            stock: 1,
            images: ["/images/products/ps5.png"]
        };

        await import("@/services/products").then(mod => mod.createProduct(newProduct as Product));
        await loadProducts();
    };

    const startEdit = (product: Product) => {
        setEditingId(product.id);
        setEditForm({ ...product });
    };

    const handleSave = async (id: string) => {
        if (!editForm) return;

        await import("@/services/products").then(mod => mod.updateProduct(id, editForm));
        setEditingId(null);
        await loadProducts();
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this product?")) return;

        await import("@/services/products").then(mod => mod.deleteProduct(id));
        await loadProducts();
    };

    const filteredProducts = products.filter(p => {
        const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
        const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.description?.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    return (
        <div className="min-h-screen relative bg-[#050505] text-white">
            <PageHero
                title={visualSettings?.pageContent?.buy_title || "OWN THE ULTIMATE GEAR"}
                subtitle={visualSettings?.pageContent?.buy_subtitle || "Premium pre-owned and brand new consoles, games, and accessories."}
                images={visualSettings?.pageBackgrounds?.buy || []}
                height="100vh"
            />

            {isAdmin && (
                <div className="fixed top-24 right-4 z-[100] bg-blue-600 text-white px-4 py-2 rounded-full font-bold uppercase tracking-widest text-xs animate-pulse shadow-[0_0_20px_rgba(37,99,235,0.5)] flex items-center gap-2">
                    <span>Stock Admin Active</span>
                    <button
                        onClick={handleCreate}
                        className="bg-white/20 hover:bg-white/40 rounded-full w-6 h-6 flex items-center justify-center transition-all ml-2"
                        title="Add New Product"
                    >
                        +
                    </button>
                    <button
                        onClick={() => setIsAdmin(false)}
                        className="ml-2 hover:text-blue-200"
                    >
                        x
                    </button>
                </div>
            )}

            <div className="text-white pb-20">


                {/* Filter & Search Bar */}
                <section className="px-4 sm:px-6 lg:px-8 w-full max-w-none mx-auto mb-12">
                    <div className="flex flex-col md:flex-row gap-6 items-center justify-between bg-[#0A0A0A] p-4 rounded-3xl border border-white/5 backdrop-blur-xl">
                        {/* Category Filter */}
                        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar w-full md:w-auto">
                            {categories.map((cat) => (
                                <button
                                    key={cat.id}
                                    onClick={() => setSelectedCategory(cat.id)}
                                    className={`px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap ${selectedCategory === cat.id
                                        ? 'bg-[#A855F7] text-white shadow-[0_0_20px_rgba(168,85,247,0.4)]'
                                        : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                                        }`}
                                >
                                    {cat.icon}
                                    {cat.id}
                                </button>
                            ))}
                        </div>

                        {/* Search Field */}
                        <div className="relative w-full md:w-96">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                            <input
                                type="text"
                                placeholder="SEARCH GEAR..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm font-bold placeholder:text-gray-600 focus:outline-none focus:border-[#A855F7]/50 focus:ring-1 focus:ring-[#A855F7]/50 transition-all uppercase tracking-widest"
                            />
                        </div>
                    </div>
                </section>

                {/* Product Grid */}
                <section className="px-4 sm:px-6 lg:px-8 w-full max-w-none mx-auto">
                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8">
                            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                                <div key={i} className="aspect-[4/5] bg-white/5 rounded-3xl animate-pulse" />
                            ))}
                        </div>
                    ) : filteredProducts.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8">
                            {filteredProducts.map((product, idx) => (
                                <motion.div
                                    key={product.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className="group bg-[#0A0A0A] border border-white/10 rounded-3xl overflow-hidden hover:border-[#A855F7]/50 transition-all duration-500 hover:scale-[1.02] hover:shadow-[0_0_40px_rgba(168,85,247,0.1)] flex flex-col"
                                >
                                    {editingId === product.id ? (
                                        <div className="p-4 space-y-3 flex-1">
                                            <input
                                                className="w-full bg-white/5 p-2 rounded text-xs text-white border border-white/10"
                                                placeholder="Image URL"
                                                value={editForm.images?.[0] || ""}
                                                onChange={e => setEditForm(prev => ({ ...prev, images: [e.target.value] }))}
                                            />
                                            <input
                                                className="w-full bg-white/5 p-2 rounded text-sm font-bold text-white border border-white/10"
                                                placeholder="Name"
                                                value={editForm.name || ""}
                                                onChange={e => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                                            />
                                            <input
                                                className="w-full bg-white/5 p-2 rounded text-xs text-white border border-white/10"
                                                placeholder="Category"
                                                value={editForm.category || ""}
                                                onChange={e => setEditForm(prev => ({ ...prev, category: e.target.value as ProductCategory }))}
                                            />
                                            <textarea
                                                className="w-full bg-white/5 p-2 rounded text-xs text-white border border-white/10"
                                                placeholder="Description"
                                                rows={3}
                                                value={editForm.description || ""}
                                                onChange={e => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                                            />
                                            <input
                                                className="w-full bg-white/5 p-2 rounded text-sm font-bold text-white border border-white/10"
                                                type="number"
                                                placeholder="Price"
                                                value={editForm.price || 0}
                                                onChange={e => setEditForm(prev => ({ ...prev, price: Number(e.target.value) }))}
                                            />
                                            <div className="flex gap-2 pt-2">
                                                <button
                                                    onClick={() => handleSave(product.id)}
                                                    className="flex-1 bg-green-600 p-2 rounded text-xs font-bold uppercase hover:bg-green-700"
                                                >
                                                    Save
                                                </button>
                                                <button
                                                    onClick={() => setEditingId(null)}
                                                    className="flex-1 bg-gray-700 p-2 rounded text-xs font-bold uppercase hover:bg-gray-600"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <Link href={`/buy/${product.id}`} className="block relative aspect-square overflow-hidden bg-black/40">
                                                {isAdmin && (
                                                    <div className="absolute top-2 right-2 z-20 flex gap-2">
                                                        <button
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                                startEdit(product);
                                                            }}
                                                            className="bg-blue-600 text-white p-2 rounded-lg shadow-lg hover:scale-110 transition-transform"
                                                        >
                                                            <Filter size={14} className="rotate-180" />
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                                handleDelete(product.id);
                                                            }}
                                                            className="bg-red-600 text-white p-2 rounded-lg shadow-lg hover:scale-110 transition-transform"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                )}
                                                <img
                                                    src={product.images?.[0] || "/images/products/ps5.png"}
                                                    alt={product.name}
                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center">
                                                    <span className="text-white text-xs font-black uppercase tracking-[0.3em] border border-white/20 px-4 py-2 bg-black/20 backdrop-blur-sm rounded-full">View Details</span>
                                                </div>
                                            </Link>

                                            <div className="p-6 flex flex-col flex-1">
                                                <div className="mb-4">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className="px-3 py-1 rounded-full bg-[#A855F7]/10 text-[#A855F7] text-[10px] font-black uppercase tracking-widest border border-[#A855F7]/20">
                                                            {product.category}
                                                        </span>
                                                        <span className="px-3 py-1 rounded-full bg-white/5 text-gray-400 text-[10px] font-black uppercase tracking-widest border border-white/10">
                                                            Stock: {product.stock}
                                                        </span>
                                                    </div>
                                                    <Link href={`/buy/${product.id}`}>
                                                        <h3 className="text-xl font-bold uppercase italic leading-none mb-2 group-hover:text-[#A855F7] transition-colors">
                                                            {product.name}
                                                        </h3>
                                                    </Link>
                                                    <p className="text-gray-500 text-xs line-clamp-2 leading-relaxed">
                                                        {product.description}
                                                    </p>
                                                </div>

                                                <div className="mt-auto flex items-end justify-between gap-4">
                                                    <div>
                                                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Starting At</p>
                                                        <p className="text-2xl font-black text-white tracking-tight">{formatCurrency(product.price)}</p>
                                                    </div>
                                                    <button
                                                        onClick={() => addItem({
                                                            id: product.id,
                                                            name: product.name,
                                                            price: product.price,
                                                            image: product.images?.[0] || "/images/products/ps5.png",
                                                            quantity: 1
                                                        } as any)}
                                                        className="h-12 w-12 rounded-2xl bg-white text-black flex items-center justify-center hover:bg-[#A855F7] hover:text-white transition-all hover:scale-110 hover:shadow-[0_0_20px_rgba(168,85,247,0.4)]"
                                                    >
                                                        <ShoppingBag size={20} />
                                                    </button>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-24 space-y-6">
                            <div className="w-24 h-24 bg-white/5 border border-white/10 rounded-full flex items-center justify-center mx-auto">
                                <ShoppingBag className="text-gray-600" size={40} />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-2xl font-bold uppercase italic">No Gear Found</h3>
                                <p className="text-gray-500 font-mono text-xs uppercase tracking-widest">Adjust your mission parameters or check back later.</p>
                            </div>
                            <button
                                onClick={() => { setSelectedCategory('All'); setSearchQuery(""); }}
                                className="bg-[#A855F7] text-white px-8 py-3 rounded-full font-black text-xs uppercase tracking-widest hover:bg-white hover:text-black transition-all"
                            >
                                RESET FILTERS
                            </button>
                        </div>
                    )}
                </section>

                {/* Why Console Zone? */}
                <section className="px-4 sm:px-6 lg:px-8 w-full max-w-none mx-auto mt-32">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12 border-t border-white/10 pt-20">
                        <div className="space-y-4">
                            <div className="w-12 h-12 bg-[#A855F7]/10 rounded-2xl flex items-center justify-center border border-[#A855F7]/20">
                                <ShieldCheck className="text-[#A855F7]" size={24} />
                            </div>
                            <h4 className="text-xl font-bold uppercase tracking-tight">Triple-Checked Quality</h4>
                            <p className="text-gray-500 text-sm leading-relaxed">Every console and game undergoes a rigorous 21-point software and hardware inspection before listing.</p>
                        </div>
                        <div className="space-y-4">
                            <div className="w-12 h-12 bg-[#A855F7]/10 rounded-2xl flex items-center justify-center border border-[#A855F7]/20">
                                <Star className="text-[#A855F7]" size={24} />
                            </div>
                            <h4 className="text-xl font-bold uppercase tracking-tight">Buy Back Guarantee</h4>
                            <p className="text-gray-500 text-sm leading-relaxed">Done with the game? We guarantee a fixed buy-back price so you never lose value on your library.</p>
                        </div>
                        <div className="space-y-4">
                            <div className="w-12 h-12 bg-[#A855F7]/10 rounded-2xl flex items-center justify-center border border-[#A855F7]/20">
                                <Truck className="text-[#A855F7]" size={24} />
                            </div>
                            <h4 className="text-xl font-bold uppercase tracking-tight">Express Delivery</h4>
                            <p className="text-gray-500 text-sm leading-relaxed">Orders placed before 2 PM are dispatched same-day with premium tracking across major metros.</p>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}

