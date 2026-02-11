import { createClient } from "@/utils/supabase/client";
import { Product, ProductType, ProductCategory } from "@/types";
export type { Product, ProductType, ProductCategory };

const PRODUCTS_STORAGE_KEY = 'console_zone_products_v1';

export const DEMO_PRODUCTS: Product[] = [
    {
        id: "978c1aa9-a069-46a5-b14a-2bcc8d031f10",
        name: "Sony PS5 Slim Disc Edition (New)",
        description: "Latest Slim model with 1TB SSD and detachable disc drive.",
        price: 54990,
        type: 'buy',
        category: 'PS5',
        stock: 5,
        images: ["https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?q=80&w=600"],
        status: 'available',
        created_at: new Date().toISOString()
    },
    {
        id: "xbox-series-x-001",
        name: "Xbox Series X 1TB",
        description: "The fastest, most powerful Xbox ever. 4K gaming at up to 120 FPS.",
        price: 49990,
        type: 'buy',
        category: 'Xbox',
        stock: 10,
        images: ["https://images.unsplash.com/photo-1621259182902-3b836c824e22?q=80&w=600"],
        status: 'available',
        created_at: new Date().toISOString()
    },
    {
        id: "ps5-controller-dual-sense",
        name: "PS5 DualSense Wireless Controller",
        description: "Immersive haptic feedback, dynamic adaptive triggers, and a built-in microphone.",
        price: 5990,
        type: 'buy',
        category: 'Accessory',
        stock: 25,
        images: ["https://images.unsplash.com/photo-1590650046871-92c887180603?q=80&w=600"],
        status: 'available',
        created_at: new Date().toISOString()
    },
    {
        id: "meta-quest-3",
        name: "Meta Quest 3 128GB",
        description: "Breakthrough mixed reality. 4K+ Infinite Display. Powerful new processor.",
        price: 44990,
        type: 'rent',
        category: 'VR',
        stock: 3,
        images: ["https://images.unsplash.com/photo-1622979135225-d2ba269fb1bd?q=80&w=600"],
        status: 'available',
        created_at: new Date().toISOString()
    },
    {
        id: "gaming-headset-pro",
        name: "Razer BlackShark V2 Pro",
        description: "HyperSpeed Wireless Technology. TriForce Titanium 50mm Drivers.",
        price: 11990,
        type: 'buy',
        category: 'Accessory',
        stock: 15,
        images: ["https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?q=80&w=600"],
        status: 'available',
        created_at: new Date().toISOString()
    },
    // Trade-In Items (Sell Page)
    {
        id: "ps4-pro-1tb-tradein",
        name: "Sony PS4 Pro 1TB Console",
        description: "Trade in your old PS4 Pro for cash or credit.",
        price: 18000,
        type: 'trade-in',
        category: 'PS4',
        stock: 0,
        images: ["https://images.unsplash.com/photo-1507457379470-08b800bebc67?q=80&w=600"],
        status: 'available',
        created_at: new Date().toISOString()
    },
    {
        id: "xbox-one-x-tradein",
        name: "Xbox One X 1TB Console",
        description: "Sell your Xbox One X. Best value guaranteed.",
        price: 16500,
        type: 'trade-in',
        category: 'Xbox',
        stock: 0,
        images: ["https://images.unsplash.com/photo-1605901309584-818e25960b8f?q=80&w=600"],
        status: 'available',
        created_at: new Date().toISOString()
    },
    {
        id: "nintendo-switch-v2-tradein",
        name: "Nintendo Switch V2 (Neon)",
        description: "Get great value for your Switch console.",
        price: 14000,
        type: 'trade-in',
        category: 'Handheld',
        stock: 0,
        images: ["https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?q=80&w=600"],
        status: 'available',
        created_at: new Date().toISOString()
    },
    {
        id: "xbox-series-s-tradein",
        name: "Xbox Series S Digital",
        description: "Upgrade to Series X by trading in your Series S.",
        price: 19000,
        type: 'trade-in',
        category: 'Xbox',
        stock: 0,
        images: ["https://images.unsplash.com/photo-1621259182902-3b836c824e22?q=80&w=600"],
        status: 'available',
        created_at: new Date().toISOString()
    }
];

/**
 * Robust Fetch: Tries Supabase, falls back to LocalStorage or Demo Data
 */
export const getProducts = async (type?: ProductType, category?: string, includeHidden: boolean = false): Promise<Product[]> => {
    let products: Product[] = [];

    try {
        const supabase = createClient();
        let query = supabase
            .from('products')
            .select('*');

        if (!includeHidden) {
            query = query.neq('status', 'hidden');
        }

        if (type) query = query.eq('type', type);

        // Note: Category in DB is enum 'PS5' | 'Xbox' etc.
        if (category && category !== 'All') {
            if (category === 'Consoles') query = query.in('category', ['PS5', 'Xbox', 'PS4']);
            else if (category === 'VR') query = query.eq('category', 'VR');
            else if (category === 'Controllers') query = query.eq('category', 'Accessory');
            else query = query.eq('category', category);
        }

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) throw error;
        products = data || [];

        // Sync local storage if success
        if (products.length > 0 && typeof window !== 'undefined') {
            if (!includeHidden) {
                localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(products));
            }
        }
    } catch (error) {
        console.warn("Supabase fetch failed, falling back to localStorage/Demo:", error);
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem(PRODUCTS_STORAGE_KEY);
            products = stored ? JSON.parse(stored) : [];
        }

        // Final fallback to hardcoded demo data if everything else is empty
        if (products.length === 0) {
            products = [...DEMO_PRODUCTS];
        }

        // Apply filtering locally
        if (!includeHidden) products = products.filter(p => p.status !== 'hidden');
        if (type) products = products.filter(p => p.type === type);
        if (category && category !== 'All') {
            if (category === 'Consoles') products = products.filter(p => ['PS5', 'Xbox', 'PS4'].includes(p.category));
            else if (category === 'VR') products = products.filter(p => p.category === 'VR');
            else if (category === 'Controllers') products = products.filter(p => p.category === 'Accessory');
            else products = products.filter(p => p.category === category);
        }
    }

    // MAP FOR UI COMPATIBILITY (image singular)
    return products.map(p => ({
        ...p,
        image: (p as any).image || p.images?.[0] || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=600'
    }));
};

export const getProductById = async (id: string) => {
    try {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return {
            ...data,
            image: (data as any).image || data.images?.[0]
        } as Product;
    } catch (error) {
        // Fallback for individual product view
        if (typeof window !== 'undefined') {
            const stored = JSON.parse(localStorage.getItem(PRODUCTS_STORAGE_KEY) || '[]');
            let found = stored.find((p: Product) => p.id === id);

            // If not in storage, check hardcoded demo data
            if (!found) {
                found = DEMO_PRODUCTS.find(p => p.id === id);
            }

            if (found) {
                return {
                    ...found,
                    image: (found as any).image || found.images?.[0]
                };
            }
            return null;
        }
        throw error;
    }
};

export const updateProductStock = async (id: string, newStock: number) => {
    const supabase = createClient();
    const { error } = await supabase
        .from('products')
        .update({ stock: newStock })
        .eq('id', id);

    if (error) throw error;
};

export const createProduct = async (productData: any) => {
    const images = productData.images || (productData.image ? [productData.image] : ['https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=600']);
    const formatted = {
        ...productData,
        id: productData.id || crypto.randomUUID(),
        images,
        created_at: new Date().toISOString()
    };

    try {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('products')
            .insert([formatted])
            .select()
            .single();

        if (error) throw error;
        return {
            ...data,
            image: (data as any).image || data.images?.[0]
        };
    } catch (error) {
        console.warn("Supabase create failed, using localStorage:", error);
        if (typeof window !== 'undefined') {
            const existing = JSON.parse(localStorage.getItem(PRODUCTS_STORAGE_KEY) || '[]');
            localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify([...existing, formatted]));
            return {
                ...formatted,
                image: formatted.image || formatted.images?.[0]
            };
        }
        throw error;
    }
};

export const createProductsBatch = async (productsData: any[]) => {
    const formattedProducts = productsData.map(({ image, ...p }) => ({
        ...p,
        id: p.id || crypto.randomUUID(),
        images: p.images || (image ? [image] : ['https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=600']),
        created_at: new Date().toISOString()
    }));

    try {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('products')
            .insert(formattedProducts)
            .select();

        if (error) throw error;
        return data.map((p: any) => ({ ...p, image: (p as any).image || p.images?.[0] }));
    } catch (error) {
        console.warn("Supabase batch insert failed, saving to localStorage:", error);
        if (typeof window !== 'undefined') {
            const existing = JSON.parse(localStorage.getItem(PRODUCTS_STORAGE_KEY) || '[]');
            const updated = [...existing, ...formattedProducts];
            localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(updated));
            return formattedProducts.map(p => ({ ...p, image: (p as any).image || p.images?.[0] }));
        }
        throw error;
    }
};

export const updateProduct = async (id: string, productData: Partial<Product>) => {
    try {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('products')
            .update(productData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return { ...data, image: (data as any).image || data.images?.[0] };
    } catch (error) {
        if (typeof window !== 'undefined') {
            const existing = JSON.parse(localStorage.getItem(PRODUCTS_STORAGE_KEY) || '[]');
            const updated = existing.map((p: Product) => p.id === id ? { ...p, ...productData } : p);
            localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(updated));
            const found = updated.find((p: Product) => p.id === id);
            return found ? { ...found, image: (found as any).image || found.images?.[0] } : null;
        }
        throw error;
    }
};

export const deleteProduct = async (id: string) => {
    try {
        const supabase = createClient();
        const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', id);

        if (error) throw error;
    } catch (error) {
        if (typeof window !== 'undefined') {
            const existing = JSON.parse(localStorage.getItem(PRODUCTS_STORAGE_KEY) || '[]');
            const updated = existing.filter((p: Product) => p.id !== id);
            localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(updated));
        }
    }
};
