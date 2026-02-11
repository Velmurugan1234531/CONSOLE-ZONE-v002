import { createClient, isSupabaseConfigured } from "@/utils/supabase/client";

export interface CatalogSettings {
    id: string;
    device_category: string;
    is_enabled: boolean;
    is_featured: boolean;
    max_controllers: number;
    extra_controller_enabled: boolean;
    daily_rate: number;
    weekly_rate: number;
    monthly_rate: number;
    controller_daily_rate: number;
    controller_weekly_rate: number;
    controller_monthly_rate: number;
    display_order: number;
    features?: string[];
}

// DEMO DATA for testing without Supabase
const DEMO_CATALOG_SETTINGS: CatalogSettings[] = [
    {
        id: "demo-cat-1",
        device_category: "PS5",
        is_enabled: true,
        is_featured: true,
        max_controllers: 4,
        extra_controller_enabled: true,
        daily_rate: 699,
        weekly_rate: 4499,
        monthly_rate: 9999,
        controller_daily_rate: 100,
        controller_weekly_rate: 500,
        controller_monthly_rate: 1500,
        display_order: 1,
        features: ["4K 120Hz Gaming", "100+ Games Free", "24 Hours Access", "Self Pickup Available"]
    },
    {
        id: "demo-cat-2",
        device_category: "PS4",
        is_enabled: true,
        is_featured: false,
        max_controllers: 4,
        extra_controller_enabled: true,
        daily_rate: 399,
        weekly_rate: 2499,
        monthly_rate: 4999,
        controller_daily_rate: 75,
        controller_weekly_rate: 400,
        controller_monthly_rate: 1200,
        display_order: 2,
        features: ["HDR Gaming Support", "100+ Games Library", "24/7 Support Access", "Budget Friendly Rig"]
    },
    {
        id: "demo-cat-3",
        device_category: "Xbox",
        is_enabled: true,
        is_featured: false,
        max_controllers: 4,
        extra_controller_enabled: true,
        daily_rate: 599,
        weekly_rate: 3999,
        monthly_rate: 8999,
        controller_daily_rate: 100,
        controller_weekly_rate: 500,
        controller_monthly_rate: 1500,
        display_order: 3,
        features: ["4K 120Hz Gaming", "Game Pass Ultimate", "Quick Resume", "Performance Mode"]
    }
];

// Helper to persist demo settings
const persistDemoSettings = (settings: CatalogSettings[]) => {
    if (typeof window !== 'undefined') {
        localStorage.setItem('DEMO_CATALOG_SETTINGS', JSON.stringify(settings));
        window.dispatchEvent(new Event('storage')); // Notify other tabs/components
    }
};

// Helper to load demo settings
const loadDemoSettings = (): CatalogSettings[] => {
    if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('DEMO_CATALOG_SETTINGS');
        if (stored) {
            try {
                return JSON.parse(stored);
            } catch (e) {
                console.error("Failed to parse demo catalog settings", e);
            }
        }
    }
    return DEMO_CATALOG_SETTINGS; // Fallback to initial defaults
};

export const getCatalogSettings = async (): Promise<CatalogSettings[]> => {
    if (!isSupabaseConfigured()) {
        console.warn("Supabase not configured. Returning DEMO catalog settings.");
        return loadDemoSettings();
    }

    const supabase = createClient();
    const { data, error } = await supabase
        .from('catalog_settings')
        .select('*')
        .order('display_order', { ascending: true });

    if (error) {
        console.error("Error fetching catalog settings:", error);
        throw error;
    }

    return data || [];
};

export const getCatalogSettingsByCategory = async (category: string): Promise<CatalogSettings | null> => {
    if (!isSupabaseConfigured()) {
        const settings = loadDemoSettings();
        return settings.find(c => c.device_category === category) || null;
    }

    const supabase = createClient();
    const { data, error } = await supabase
        .from('catalog_settings')
        .select('*')
        .eq('device_category', category)
        .single();

    if (error) {
        console.error("Error fetching catalog setting:", error);
        return null;
    }

    return data;
};

export const updateCatalogSettings = async (
    category: string,
    updates: Partial<CatalogSettings>
): Promise<CatalogSettings | null> => {
    if (!isSupabaseConfigured()) {
        console.warn("Supabase not configured. Updating local demo settings.");
        const currentSettings = loadDemoSettings();
        const index = currentSettings.findIndex(c => c.device_category === category);

        if (index !== -1) {
            const updated = { ...currentSettings[index], ...updates };
            currentSettings[index] = updated;
            persistDemoSettings(currentSettings);

            // Also update the in-memory constant to keep it in sync for this session
            const memIndex = DEMO_CATALOG_SETTINGS.findIndex(c => c.device_category === category);
            if (memIndex !== -1) DEMO_CATALOG_SETTINGS[memIndex] = updated;

            return updated;
        }
        return null;
    }

    const supabase = createClient();
    const { data, error } = await supabase
        .from('catalog_settings')
        .update(updates)
        .eq('device_category', category)
        .select()
        .single();

    if (error) {
        console.error("Error updating catalog settings:", error);
        throw error;
    }

    return data;
};

export const createCatalogSettings = async (
    settings: Omit<CatalogSettings, 'id'>
): Promise<CatalogSettings | null> => {
    if (!isSupabaseConfigured()) {
        console.warn("Supabase not configured. Creating local demo settings.");
        const newSetting: CatalogSettings = {
            ...settings,
            id: `demo-cat-${Date.now()}`
        };

        const currentSettings = loadDemoSettings();
        currentSettings.push(newSetting);
        persistDemoSettings(currentSettings);
        DEMO_CATALOG_SETTINGS.push(newSetting); // Sync memory

        return newSetting;
    }

    const supabase = createClient();
    const { data, error } = await supabase
        .from('catalog_settings')
        .insert([settings])
        .select()
        .single();

    if (error) {
        console.error("Error creating catalog settings:", error);
        throw error;
    }

    return data;
};

export const deleteCatalogSettings = async (category: string): Promise<boolean> => {
    if (!isSupabaseConfigured()) {
        console.warn("Supabase not configured. Deleting local demo output.");
        const currentSettings = loadDemoSettings();
        const index = currentSettings.findIndex(c => c.device_category === category);

        if (index !== -1) {
            currentSettings.splice(index, 1);
            persistDemoSettings(currentSettings);

            const memIndex = DEMO_CATALOG_SETTINGS.findIndex(c => c.device_category === category);
            if (memIndex !== -1) DEMO_CATALOG_SETTINGS.splice(memIndex, 1);

            return true;
        }
        return false;
    }

    const supabase = createClient();
    const { error } = await supabase
        .from('catalog_settings')
        .delete()
        .eq('device_category', category);

    if (error) {
        console.error("Error deleting catalog settings:", error);
        throw error;
    }

    return true;
};

export const getEnabledDevices = async (): Promise<CatalogSettings[]> => {
    const allSettings = await getCatalogSettings();
    return allSettings.filter(s => s.is_enabled);
};

export const getFeaturedDevices = async (): Promise<CatalogSettings[]> => {
    const allSettings = await getCatalogSettings();
    return allSettings.filter(s => s.is_enabled && s.is_featured);
};

// Calculate rental price based on catalog settings
export const calculateRentalPrice = async (
    category: string,
    days: number,
    extraControllers: number = 0
): Promise<{ basePrice: number; controllerPrice: number; total: number }> => {
    // Attempt to get real-time settings
    let settings: CatalogSettings | null = null;

    try {
        settings = await getCatalogSettingsByCategory(category);
    } catch (error) {
        console.error("Failed to fetch settings for calculation, falling back to demo:", error);
    }

    // Fallback to demo if real-time fails or returned null
    if (!settings) {
        settings = DEMO_CATALOG_SETTINGS.find(c => c.device_category === category) || null;
    }

    if (!settings) {
        return { basePrice: 0, controllerPrice: 0, total: 0 };
    }

    let basePrice = 0;
    let controllerPrice = 0;

    // Determine base price based on rental duration
    if (days >= 28) {
        // Monthly rate
        basePrice = settings.monthly_rate;
        controllerPrice = extraControllers * (settings.controller_weekly_rate * 4);
    } else if (days >= 7) {
        // Weekly rate
        const weeks = Math.ceil(days / 7);
        basePrice = settings.weekly_rate * weeks;
        controllerPrice = extraControllers * settings.controller_weekly_rate * weeks;
    } else {
        // Daily rate
        basePrice = settings.daily_rate * days;
        controllerPrice = extraControllers * settings.controller_daily_rate * days;
    }

    return {
        basePrice,
        controllerPrice,
        total: basePrice + controllerPrice
    };
};
