
const IS_CLIENT = typeof window !== 'undefined';
const KEY = 'VISUAL_SETTINGS_V11';

export interface CustomPage {
    id: string;
    title: string;
    slug: string;
    content: string;
    layout: 'default' | 'narrow' | 'landing';
    published: boolean;
}

export interface VisualStyles {
    desktop: any;
    tablet?: any;
    mobile?: any;
    hover?: any;
}

export interface AnimationSettings {
    type: 'none' | 'fade' | 'slide' | 'zoom' | 'bounce' | 'rotate';
    direction?: 'up' | 'down' | 'left' | 'right';
    duration: number;
    delay: number;
    iteration: 'once' | 'infinite';
}

export interface VisualElement {
    id: string;
    type: 'text' | 'image' | 'button' | 'container' | 'product_grid' | 'video' | 'dynamic' | 'section' | 'spacer' | 'divider';
    label: string;
    props: Record<string, any>;
    styles: VisualStyles;
    children?: VisualElement[];
    animation?: AnimationSettings;
    locked?: boolean;
    hidden?: boolean;
}

export interface BackgroundEffects {
    imageOpacity: number;      // 0-100
    overlayDarkness: number;   // 0-100
    blurIntensity: number;     // 0-10
    slideshowSpeed: number;    // seconds (0 for no slideshow)
}

export interface PageLayout {
    pageId: string;
    layers: VisualElement[];
    background?: BackgroundEffects;
}

export interface GlobalDesign {
    colors: {
        primary: string;
        secondary: string;
        accent: string;
        background: string;
        surface: string;
    };
    typography: {
        display: string;
        body: string;
    };
}

export interface FooterSettings {
    address: string;
    phone: string;
    email: string;
    supportHours: string;
    socialLinks: {
        facebook: string;
        twitter: string;
        instagram: string;
        youtube: string;
    };
    copyrightText: string;
}

export interface VisualSettings {
    mediaGallery: string[];
    pageBackgrounds: Record<string, string[]>;
    consoleBackgrounds: Record<string, string[] | undefined>;
    globalLighting: number;
    backgroundEffects: BackgroundEffects;
    branding: {
        siteName: string;
        tagline: string;
        accentColor: string;
    };
    globalDesign: GlobalDesign;
    layout: {
        headerStyle: 'modern' | 'glass' | 'minimal';
        footerEnabled: boolean;
        containerWidth: 'standard' | 'wide' | 'full';
    };
    footer: FooterSettings;
    pageContent: Record<string, string>;
    servicesData?: Record<string, {
        price: string;
        active: boolean;
        description: string;
    }>;
    customPages: CustomPage[];
    layouts: Record<string, PageLayout>; // pageId -> Layout map
    pageEffects: Record<string, BackgroundEffects>;
}

const DEFAULT_SETTINGS: VisualSettings = {
    mediaGallery: [
        "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1605901309584-818e25960b8f?auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?auto=format&fit=crop&q=80"
    ],
    pageBackgrounds: {
        home: [
            "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&q=80"
        ],
        rental: [
            "https://images.unsplash.com/photo-1605901309584-818e25960b8f?auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?auto=format&fit=crop&q=80"
        ],
        buy: [
            "https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80"
        ],
        sell: [
            "https://images.unsplash.com/photo-1556742044-3c52d6e88c62?auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80"
        ],
        services: [
            "https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1597733336794-12d05021d510?auto=format&fit=crop&q=80"
        ],
        admin: [
            "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80"
        ],
        login: [
            "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80"
        ],
        signup: [
            "https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&q=80"
        ],
        kyc: [
            "https://images.unsplash.com/photo-1556742044-3c52d6e88c62?auto=format&fit=crop&q=80"
        ],
        profile: [
            "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&q=80"
        ]
    },
    pageEffects: {},
    consoleBackgrounds: {},
    globalLighting: 95,
    backgroundEffects: {
        imageOpacity: 100,      // Full brightness
        overlayDarkness: 0,     // No overlay
        blurIntensity: 0,       // No blur
        slideshowSpeed: 10      // 10 seconds default
    },
    branding: {
        siteName: "CONSOLE ZONE",
        tagline: "Premium Gaming Rental Experience",
        accentColor: "#A855F7"
    },
    globalDesign: {
        colors: {
            primary: "#A855F7",
            secondary: "#06B6D4",
            accent: "#39ff14",
            background: "#050505",
            surface: "#0a0a0a"
        },
        typography: {
            display: "Inter, sans-serif",
            body: "Inter, sans-serif"
        }
    },
    layout: {
        headerStyle: 'modern',
        footerEnabled: true,
        containerWidth: 'standard',
    },
    footer: {
        address: "NO.27/43, 4th St, Gangaiamman Nagar, AGS Colony, Chromepet, Chennai, Tamil Nadu 600044",
        phone: "+91 81228 41273",
        email: "support@consolezone.com",
        supportHours: "10:30 AM - 6:30 PM",
        socialLinks: {
            facebook: "#",
            twitter: "#",
            instagram: "#",
            youtube: "#"
        },
        copyrightText: "Console Zone"
    },
    pageContent: {
        "home_hero_title": "LEVEL UP YOUR GAMING",
        "home_hero_subtitle": "Premium Console Rentals Delivered to Your Doorstep",
        "home_cta_primary": "START BROWSING",
        "home_cta_secondary": "HOW IT WORKS",
        "rental_title": "CHOOSE YOUR RIG",
        "rental_subtitle": "Select from our elite fleet of current-gen and classic consoles",
        "buy_title": "OWN THE EXPERIENCE",
        "buy_subtitle": "Premium pre-owned and brand new consoles at unbeatable prices",
        "sell_title": "GET INSTANT CASH",
        "sell_subtitle": "Sell your old gaming gear for the best prices in the market",
        "services_title": "EXPERT CARE",
        "services_subtitle": "Professional maintenance and repair services for all gaming hardware"
    },
    servicesData: {
        "hardware": { price: "Starting at ₹2,499", active: true, description: "Fixing HDMI ports, overheating issues, disc drive failures, and motherboard repairs." },
        "controller": { price: "Starting at ₹999", active: true, description: "Stick drift fix, button replacement, battery upgrades, and shell customization for Pro gear." },
        "cleaning": { price: "₹1,499", active: true, description: "Complete internal dust removal, thermal paste replacement, and fan optimization for silent operation." },
        "software": { price: "Starting at ₹1,299", active: true, description: "Fixing bricked consoles, update loops, storage upgrades (SSD installation), and data recovery." }
    },
    customPages: [],
    layouts: {
        home: {
            pageId: 'home',
            layers: []
        },
        rental: { pageId: 'rental', layers: [] },
        buy: { pageId: 'buy', layers: [] },
        sell: { pageId: 'sell', layers: [] },
        services: { pageId: 'services', layers: [] }
    }
};

declare global {
    interface Window {
        czBuilderData?: {
            apiUrl: string;
            nonce: string;
            initialSettings?: any;
        };
    }
}

export const VisualsService = {
    getSettings: async (): Promise<VisualSettings> => {
        if (!IS_CLIENT) return DEFAULT_SETTINGS;

        // Try WordPress REST API first
        if (window.czBuilderData) {
            try {
                const response = await fetch(`${window.czBuilderData.apiUrl}/settings`, {
                    headers: { 'X-WP-Nonce': window.czBuilderData.nonce }
                });
                if (response.ok) {
                    const parsed = await response.json();
                    return VisualsService.migrate(parsed);
                }
            } catch (e) {
                console.error("WP API Failure, falling back to LocalStorage", e);
            }
        }

        const stored = localStorage.getItem(KEY);
        if (stored) {
            try {
                return VisualsService.migrate(JSON.parse(stored));
            } catch (e) {
                console.error("Failed to parse visual settings", e);
                return DEFAULT_SETTINGS;
            }
        }
        return DEFAULT_SETTINGS;
    },

    migrate: (parsed: any): VisualSettings => {
        // Ensure all layout keys exist
        const defaultLayouts = DEFAULT_SETTINGS.layouts;
        const mergedLayouts = { ...defaultLayouts };

        if (parsed.layouts) {
            Object.keys(parsed.layouts).forEach(key => {
                mergedLayouts[key] = parsed.layouts[key];
            });
        }

        // Legacy migration: ensure all core pages have at least an empty layout
        ['home', 'rental', 'buy', 'sell', 'services'].forEach(key => {
            if (!mergedLayouts[key]) {
                mergedLayouts[key] = { pageId: key, layers: [] };
            }
        });

        // Convert console backgrounds if needed
        const consoleBackgrounds = { ...parsed.consoleBackgrounds };
        ['ps5', 'ps4', 'xbox'].forEach(k => {
            const key = k as 'ps5' | 'ps4' | 'xbox';
            if (typeof consoleBackgrounds[key] === 'string') {
                consoleBackgrounds[key] = [consoleBackgrounds[key]];
            }
        });

        // Merge page backgrounds with defaults if empty
        const pageBackgrounds = { ...DEFAULT_SETTINGS.pageBackgrounds };
        if (parsed.pageBackgrounds) {
            Object.keys(parsed.pageBackgrounds).forEach(key => {
                if (parsed.pageBackgrounds[key] && parsed.pageBackgrounds[key].length > 0) {
                    pageBackgrounds[key] = parsed.pageBackgrounds[key];
                }
            });
        }

        return {
            ...DEFAULT_SETTINGS,
            ...parsed,
            globalDesign: { ...DEFAULT_SETTINGS.globalDesign, ...parsed.globalDesign },
            backgroundEffects: { ...DEFAULT_SETTINGS.backgroundEffects, ...parsed.backgroundEffects },
            layouts: mergedLayouts,
            customPages: parsed.customPages || [],
            pageBackgrounds,
            pageEffects: { ...DEFAULT_SETTINGS.pageEffects, ...parsed.pageEffects },
            consoleBackgrounds
        };
    },

    saveSettings: async (settings: VisualSettings) => {
        if (!IS_CLIENT) return;

        // Try WordPress REST API
        if (window.czBuilderData) {
            try {
                await fetch(`${window.czBuilderData.apiUrl}/settings`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-WP-Nonce': window.czBuilderData.nonce
                    },
                    body: JSON.stringify(settings)
                });
            } catch (e) {
                console.error("WP Save Failure", e);
            }
        }

        localStorage.setItem(KEY, JSON.stringify(settings));
    },

    addPageBackground: async (pageId: string, image: string) => {
        const settings = await VisualsService.getSettings();
        const current = settings.pageBackgrounds[pageId] || [];
        const newSettings = {
            ...settings,
            pageBackgrounds: {
                ...settings.pageBackgrounds,
                [pageId]: [...current, image]
            }
        };
        await VisualsService.saveSettings(newSettings);
        return newSettings;
    },

    removePageBackground: async (pageId: string, index: number) => {
        const settings = await VisualsService.getSettings();
        const current = settings.pageBackgrounds[pageId] || [];
        const newSettings = {
            ...settings,
            pageBackgrounds: {
                ...settings.pageBackgrounds,
                [pageId]: current.filter((_, i) => i !== index)
            }
        };
        await VisualsService.saveSettings(newSettings);
        return newSettings;
    },

    addConsoleBackground: async (console: 'ps5' | 'ps4' | 'xbox', image: string) => {
        const settings = await VisualsService.getSettings();
        const current = settings.consoleBackgrounds[console] || [];

        const newSettings = {
            ...settings,
            consoleBackgrounds: {
                ...settings.consoleBackgrounds,
                [console]: [...current, image]
            }
        };
        await VisualsService.saveSettings(newSettings);
        return newSettings;
    },

    removeConsoleBackground: async (console: 'ps5' | 'ps4' | 'xbox', index: number) => {
        const settings = await VisualsService.getSettings();
        const current = settings.consoleBackgrounds[console] || [];

        const newSettings = {
            ...settings,
            consoleBackgrounds: {
                ...settings.consoleBackgrounds,
                [console]: current.filter((_, i) => i !== index)
            }
        };
        await VisualsService.saveSettings(newSettings);
        return newSettings;
    },

    resetConsoleBackground: async (console: 'ps5' | 'ps4' | 'xbox') => {
        const settings = await VisualsService.getSettings();
        const newConsoles = { ...settings.consoleBackgrounds };
        delete newConsoles[console];

        const newSettings = {
            ...settings,
            consoleBackgrounds: newConsoles
        };
        await VisualsService.saveSettings(newSettings);
        return newSettings;
    },

    updateServiceData: async (id: string, data: Partial<{ price: string; active: boolean; description: string }>) => {
        const settings = await VisualsService.getSettings();
        const currentData = settings.servicesData || DEFAULT_SETTINGS.servicesData!;

        const newSettings = {
            ...settings,
            servicesData: {
                ...currentData,
                [id]: { ...currentData[id], ...data }
            }
        };
        await VisualsService.saveSettings(newSettings);
        return newSettings;
    },

    updateFooterSettings: async (data: Partial<FooterSettings>) => {
        const settings = await VisualsService.getSettings();
        const newSettings = {
            ...settings,
            footer: {
                ...settings.footer,
                ...data
            }
        };
        await VisualsService.saveSettings(newSettings);
        return newSettings;
    },

    updateGlobalLighting: async (value: number) => {
        const settings = await VisualsService.getSettings();
        const newSettings = {
            ...settings,
            globalLighting: value
        };
        await VisualsService.saveSettings(newSettings);
        return newSettings;
    },

    // Reset to defaults if needed
    reset: async () => {
        if (!IS_CLIENT) return;
        localStorage.removeItem(KEY);
        // WP Reset not implemented here as it's destructive
        return DEFAULT_SETTINGS;
    }
};
