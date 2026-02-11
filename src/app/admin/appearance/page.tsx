"use client";

import { useState, useEffect } from 'react';
import {
    Trash2, Plus, ImageIcon, RotateCcw, Gamepad2, Sun,
    Layout, Type, FileText, Settings, Palette, Save,
    Monitor, Smartphone, Globe, Check, ExternalLink,
    ChevronRight, Info, MousePointer2, Move, ZoomIn,
    Layers, Grid3X3, Eye, EyeOff, Laptop, Tablet, Box,
    ChevronLeft, Minus, BoxSelect, Maximize2, Minimize2, ChevronDown,
    AlignLeft, AlignCenter, AlignRight, MoreHorizontal,
    Grid, Columns, Square, Image as ImageIconLucide, Video, Sliders,
    Copy, Scissors, Clipboard, Layers as LayersIcon, Download, AlertTriangle,
    RotateCcw as UndoIcon, RotateCw as RedoIcon, Sparkles, Wind, Timer, ShoppingBag
} from 'lucide-react';
import { VisualsService, VisualSettings, VisualElement, PageLayout } from '@/services/visuals';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { BuilderRenderer } from '@/components/Builder/BuilderRenderer';

export default function AppearancePage() {
    const [settings, setSettings] = useState<VisualSettings | null>(null);
    const [originalSettings, setOriginalSettings] = useState<VisualSettings | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Builder Specific State
    const [activePage, setActivePage] = useState<string>('home');
    const [viewport, setViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
    const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
    const [zoom, setZoom] = useState(100);
    const [showGrid, setShowGrid] = useState(true);
    const [hidePanels, setHidePanels] = useState(false);
    const [activeTab, setActiveTab] = useState<'content' | 'style' | 'animation' | 'advanced'>('content');
    const [copiedStyles, setCopiedStyles] = useState<any | null>(null);
    const [showGlobalSettings, setShowGlobalSettings] = useState(false);
    const [activeGlobalTab, setActiveGlobalTab] = useState<'design' | 'gallery'>('design'); // New state for tabs

    // History State
    const [history, setHistory] = useState<VisualSettings[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);

    // --- DRAG LOGIC ---
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0, initialX: 0, initialY: 0 });

    useEffect(() => {
        const init = async () => {
            const current = await VisualsService.getSettings();
            setSettings(current);
            setOriginalSettings(JSON.parse(JSON.stringify(current)));
            // Initialize history
            setHistory([JSON.parse(JSON.stringify(current))]);
            setHistoryIndex(0);
        };
        init();
    }, []);

    const pushToHistory = (newSettings: VisualSettings) => {
        setHistory(prev => {
            const next = prev.slice(0, historyIndex + 1);
            next.push(JSON.parse(JSON.stringify(newSettings)));
            // Limit history to 50 steps
            if (next.length > 50) next.shift();
            return next;
        });
        setHistoryIndex(prev => Math.min(prev + 1, 49));
    };

    const saveHistoryStep = () => {
        if (settings) pushToHistory(settings);
    };

    const undo = () => {
        if (historyIndex > 0) {
            const prev = history[historyIndex - 1];
            setSettings(JSON.parse(JSON.stringify(prev)));
            setHistoryIndex(historyIndex - 1);
        }
    };

    const redo = () => {
        if (historyIndex < history.length - 1) {
            const next = history[historyIndex + 1];
            setSettings(JSON.parse(JSON.stringify(next)));
            setHistoryIndex(historyIndex + 1);
        }
    };

    if (!settings) return null;

    const currentLayout = settings.layouts?.[activePage] || { pageId: activePage, layers: [] };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            VisualsService.saveSettings(settings);
            setOriginalSettings(JSON.parse(JSON.stringify(settings)));
        } finally {
            setIsSaving(false);
        }
    };

    const addElement = (type: VisualElement['type']) => {
        const newEl: VisualElement = {
            id: Math.random().toString(36).substr(2, 9),
            type,
            label: `New ${type}`,
            props: type === 'text' ? { content: 'Double click to edit', tag: 'h2' } : {},
            styles: {
                desktop: {
                    position: 'absolute',
                    top: '100px',
                    left: '100px',
                    padding: '20px',
                    color: '#ffffff',
                    fontSize: type === 'text' ? '40px' : undefined,
                    fontWeight: 'bold',
                    textAlign: 'center'
                }
            }
        };

        const nextSettings = JSON.parse(JSON.stringify(settings));
        if (!nextSettings.layouts) nextSettings.layouts = {};
        if (!nextSettings.layouts[activePage]) {
            nextSettings.layouts[activePage] = { pageId: activePage, layers: [] };
        }
        nextSettings.layouts[activePage].layers.push(newEl);
        setSettings(nextSettings);
        pushToHistory(nextSettings);
        setSelectedElementId(newEl.id);
    };

    const deleteElement = (id: string) => {
        if (!settings) return;
        const nextSettings = JSON.parse(JSON.stringify(settings));
        if (nextSettings.layouts?.[activePage]) {
            nextSettings.layouts[activePage].layers = nextSettings.layouts[activePage].layers.filter((l: any) => l.id !== id);
        }
        setSettings(nextSettings);
        setSelectedElementId(null);
    };

    const selectedElement = currentLayout.layers.find(l => l.id === selectedElementId);

    const updateElementStyle = (key: string, value: any) => {
        if (!selectedElementId || !settings) return;

        // Use functional update with deep clone for safety
        setSettings(prev => {
            if (!prev) return prev;
            const next = JSON.parse(JSON.stringify(prev));
            const el = next.layouts[activePage].layers.find((l: any) => l.id === selectedElementId);
            if (el) {
                // Determine which style block to update
                const styleKey = viewport || 'desktop';
                if (!el.styles[styleKey]) el.styles[styleKey] = { ...el.styles.desktop };
                el.styles[styleKey] = { ...el.styles[styleKey], [key]: value };
            }
            return next;
        });
    };

    const duplicateElement = (id: string) => {
        if (!settings) return;
        const nextSettings = JSON.parse(JSON.stringify(settings));
        const el = nextSettings.layouts[activePage].layers.find((l: any) => l.id === id);
        if (el) {
            const newEl = JSON.parse(JSON.stringify(el));
            newEl.id = Math.random().toString(36).substr(2, 9);
            newEl.label = `${el.label} (Copy)`;
            // Offset slightly so it's visible
            if (newEl.styles.desktop.position === 'absolute') {
                newEl.styles.desktop.top = `${parseInt(newEl.styles.desktop.top) + 20}px`;
                newEl.styles.desktop.left = `${parseInt(newEl.styles.desktop.left) + 20}px`;
            }
            nextSettings.layouts[activePage].layers.push(newEl);
            setSettings(nextSettings);
            pushToHistory(nextSettings);
            setSelectedElementId(newEl.id);
        }
    };

    const copyStyles = (element: VisualElement) => {
        setCopiedStyles(JSON.parse(JSON.stringify(element.styles)));
    };

    const pasteStyles = (id: string) => {
        if (!copiedStyles || !settings) return;
        setSettings(prev => {
            if (!prev) return prev;
            const next = JSON.parse(JSON.stringify(prev));
            const el = next.layouts[activePage].layers.find((l: any) => l.id === id);
            if (el) {
                el.styles = JSON.parse(JSON.stringify(copiedStyles));
            }
            return next;
        });
        saveHistoryStep();
    };

    const toggleVisibility = (id: string) => {
        if (!settings) return;
        setSettings(prev => {
            if (!prev) return prev;
            const next = JSON.parse(JSON.stringify(prev));
            const el = next.layouts[activePage].layers.find((l: any) => l.id === id);
            if (el) el.hidden = !el.hidden;
            return next;
        });
    };

    const importFromTemplate = () => {
        if (!settings) return;
        if (settings.layouts[activePage].layers.length > 0) {
            if (!confirm("This will overwrite your current layers for this page. Continue?")) return;
        }

        const nextSettings = JSON.parse(JSON.stringify(settings));
        const layers: VisualElement[] = [];
        const pageTitle = settings.pageContent[`${activePage}_title`] || activePage.toUpperCase();
        const pageSubtitle = settings.pageContent[`${activePage}_subtitle`] || "";

        if (activePage === 'home') {
            const titleParts = pageTitle.split(' ');
            const mainPart = titleParts.slice(0, -2).join(' ') || "LEVEL UP";
            const accentPart = titleParts.slice(-2).join(' ') || "YOUR GAMING";

            layers.push({
                id: 'hero-section',
                type: 'section',
                label: 'Hero Section',
                props: {},
                styles: {
                    desktop: {
                        minHeight: '80vh',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        padding: '100px 20px',
                        background: 'transparent'
                    }
                },
                children: [
                    {
                        id: 'hero-title',
                        type: 'text',
                        label: 'Main Title',
                        props: { content: `${mainPart}\n${accentPart}`, tag: 'h1' },
                        styles: {
                            desktop: {
                                fontSize: '120px',
                                fontWeight: '900',
                                color: '#ffffff',
                                textAlign: 'center',
                                fontStyle: 'italic',
                                textTransform: 'uppercase',
                                lineHeight: '0.8',
                                letterSpacing: '-0.05em',
                                marginBottom: '40px'
                            }
                        }
                    },
                    {
                        id: 'hero-subtitle',
                        type: 'text',
                        label: 'Subtitle',
                        props: { content: pageSubtitle, tag: 'p' },
                        styles: {
                            desktop: {
                                fontSize: '20px',
                                color: '#94a3b8',
                                textAlign: 'center',
                                letterSpacing: '0.3em',
                                textTransform: 'uppercase',
                                marginBottom: '60px',
                                maxWidth: '800px'
                            }
                        }
                    },
                    {
                        id: 'cta-container',
                        type: 'container',
                        label: 'CTA Buttons',
                        props: {},
                        styles: {
                            desktop: {
                                display: 'flex',
                                gap: '20px',
                                justifyContent: 'center'
                            }
                        },
                        children: [
                            {
                                id: 'cta-primary',
                                type: 'button',
                                label: 'Primary CTA',
                                props: { label: 'RENTAL PLANS' },
                                styles: {
                                    desktop: {
                                        background: '#A855F7',
                                        color: '#ffffff',
                                        padding: '20px 40px',
                                        borderRadius: '0px',
                                        fontWeight: '900',
                                        fontSize: '14px',
                                        letterSpacing: '0.2em'
                                    }
                                }
                            },
                            {
                                id: 'cta-secondary',
                                type: 'button',
                                label: 'Secondary CTA',
                                props: { label: 'MARKETPLACE' },
                                styles: {
                                    desktop: {
                                        background: 'rgba(255,255,255,0.05)',
                                        color: '#ffffff',
                                        padding: '20px 40px',
                                        borderRadius: '0px',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        fontWeight: '900',
                                        fontSize: '14px',
                                        letterSpacing: '0.2em'
                                    }
                                }
                            }
                        ]
                    }
                ]
            });
        } else {
            // Standard Page Header
            layers.push({
                id: 'page-header',
                type: 'section',
                label: 'Page Header',
                props: {},
                styles: {
                    desktop: {
                        padding: '120px 20px 60px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        textAlign: 'center'
                    }
                },
                children: [
                    {
                        id: 'page-title',
                        type: 'text',
                        label: 'Page Title',
                        props: { content: pageTitle, tag: 'h1' },
                        styles: {
                            desktop: {
                                fontSize: '80px',
                                fontWeight: '900',
                                color: '#ffffff',
                                fontStyle: 'italic',
                                textTransform: 'uppercase',
                                letterSpacing: '-0.02em',
                                marginBottom: '20px'
                            }
                        }
                    },
                    {
                        id: 'page-subtitle',
                        type: 'text',
                        label: 'Page Subtitle',
                        props: { content: pageSubtitle, tag: 'p' },
                        styles: {
                            desktop: {
                                fontSize: '14px',
                                color: '#64748b',
                                letterSpacing: '0.4em',
                                textTransform: 'uppercase',
                                maxWidth: '600px'
                            }
                        }
                    }
                ]
            });
        }

        nextSettings.layouts[activePage].layers = layers;
        setSettings(nextSettings);
        setSelectedElementId(null);
    };

    const handleCanvasPointerDown = (e: React.PointerEvent) => {
        if (selectedElementId && e.target instanceof HTMLElement) {
            const el = document.getElementById(selectedElementId);
            if (el && el.contains(e.target as Node)) {
                setIsDragging(true);
                const rect = el.getBoundingClientRect();
                setDragStart({
                    x: e.clientX,
                    y: e.clientY,
                    initialX: parseInt(selectedElement?.styles.desktop.left || '0') || 0,
                    initialY: parseInt(selectedElement?.styles.desktop.top || '0') || 0
                });
                (e.target as HTMLElement).setPointerCapture(e.pointerId);
            }
        }
    };

    const handleCanvasPointerMove = (e: React.PointerEvent) => {
        if (isDragging && selectedElementId) {
            const dx = (e.clientX - dragStart.x) / (zoom / 100);
            const dy = (e.clientY - dragStart.y) / (zoom / 100);

            const newX = dragStart.initialX + dx;
            const newY = dragStart.initialY + dy;

            updateElementStyle('left', `${newX}px`);
            updateElementStyle('top', `${newY}px`);
            // Remove transform if we are manually positioning
            updateElementStyle('transform', 'none');
        }
    };

    const handleCanvasPointerUp = (e: React.PointerEvent) => {
        if (isDragging) {
            saveHistoryStep();
        }
        setIsDragging(false);
        if (e.target instanceof HTMLElement) {
            (e.target as HTMLElement).releasePointerCapture(e.pointerId);
        }
    };

    return (
        <div className="fixed inset-0 bg-[#050505] flex flex-col overflow-hidden select-none">
            {/* --- TOP EDITOR BAR --- */}
            <div className="h-14 bg-[#0a0a0a] border-b border-white/10 flex items-center justify-between px-6 z-50">
                <div className="flex items-center gap-6">
                    <button
                        onClick={() => setHidePanels(!hidePanels)}
                        className={`p-2 rounded-lg transition-all ${hidePanels ? 'bg-[#A855F7] text-white' : 'hover:bg-white/5 text-gray-500'}`}
                    >
                        <ChevronLeft className={`transition-transform duration-300 ${hidePanels ? 'rotate-180' : ''}`} size={18} />
                    </button>
                    <div className="flex items-center gap-3">
                        <Box className="text-[#A855F7]" size={20} />
                        <span className="text-xs font-black uppercase tracking-widest text-white">Engine v2.0</span>
                    </div>
                    <div className="h-6 w-[1px] bg-white/10" />

                    <Link
                        href="/admin/brand"
                        className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-[#A855F7] hover:text-white border border-white/10 hover:border-[#A855F7] rounded-lg transition-all group"
                        title="Brand & SEO Settings"
                    >
                        <Globe size={14} className="text-gray-400 group-hover:text-white" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 group-hover:text-white">Brand & SEO</span>
                    </Link>

                    <Link
                        href="/admin/buy"
                        className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-[#A855F7] hover:text-white border border-white/10 hover:border-[#A855F7] rounded-lg transition-all group"
                        title="Store Inventory"
                    >
                        <ShoppingBag size={14} className="text-gray-400 group-hover:text-white" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 group-hover:text-white">Store</span>
                    </Link>

                    <div className="h-6 w-[1px] bg-white/10" />

                    <div className="h-6 w-[1px] bg-white/10" />
                    <select
                        value={activePage}
                        onChange={(e) => setActivePage(e.target.value as any)}
                        className="bg-transparent text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 focus:text-white outline-none cursor-pointer"
                    >
                        <option value="home">Home Page</option>
                        <option value="rental">Rental Page</option>
                        <option value="buy">Buy Page</option>
                        <option value="sell">Sell Page</option>
                        <option value="services">Services Page</option>
                    </select>
                </div>

                <div className="flex items-center bg-black/40 rounded-lg p-1 border border-white/5">
                    <button onClick={() => setViewport('desktop')} className={`p-2 rounded-md ${viewport === 'desktop' ? 'bg-white/10 text-[#A855F7]' : 'text-gray-500 hover:text-white'}`}><Monitor size={16} /></button>
                    <button onClick={() => setViewport('tablet')} className={`p-2 rounded-md ${viewport === 'tablet' ? 'bg-white/10 text-[#A855F7]' : 'text-gray-500 hover:text-white'}`}><Tablet size={16} /></button>
                    <button onClick={() => setViewport('mobile')} className={`p-2 rounded-md ${viewport === 'mobile' ? 'bg-white/10 text-[#A855F7]' : 'text-gray-500 hover:text-white'}`}><Smartphone size={16} /></button>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg border border-white/10">
                        <button onClick={() => setZoom(prev => Math.max(25, prev - 25))} className="text-gray-500 hover:text-white"><Minus size={12} /></button>
                        <span className="text-[9px] font-black text-white w-8 text-center">{zoom}%</span>
                        <button onClick={() => setZoom(prev => Math.min(200, prev + 25))} className="text-gray-500 hover:text-white"><Plus size={12} /></button>
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex items-center gap-2 bg-[#A855F7] hover:bg-[#9333EA] text-white px-5 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95 disabled:opacity-50"
                    >
                        {isSaving ? "Deploying..." : "Publish Site"}
                    </button>
                </div>
            </div>

            {/* --- MASTER CONTROLS BAR (Undo/Redo) --- */}
            <div className="h-10 bg-[#0f0f0f] border-b border-white/5 flex items-center justify-center px-6 gap-8 z-40">
                <div className="flex items-center gap-4">
                    <button
                        onClick={undo}
                        disabled={historyIndex <= 0}
                        className="p-1.5 text-gray-500 hover:text-white disabled:opacity-20 transition-all flex items-center gap-2"
                        title="Undo (Ctrl+Z)"
                    >
                        <UndoIcon size={14} />
                        <span className="text-[9px] font-bold uppercase tracking-tighter">Undo</span>
                    </button>
                    <button
                        onClick={redo}
                        disabled={historyIndex >= history.length - 1}
                        className="p-1.5 text-gray-500 hover:text-white disabled:opacity-20 transition-all flex items-center gap-2"
                        title="Redo (Ctrl+Shift+Z)"
                    >
                        <RedoIcon size={14} />
                        <span className="text-[9px] font-bold uppercase tracking-tighter">Redo</span>
                    </button>
                </div>
                <div className="h-4 w-[1px] bg-white/10" />
                <div className="flex items-center gap-4 text-gray-600 text-[9px] font-black uppercase tracking-widest">
                    <span className={showGrid ? 'text-[#A855F7]' : ''} onClick={() => setShowGrid(!showGrid)}>Grid</span>
                    <span>â€¢</span>
                    <span className="hover:text-white cursor-pointer">Snap</span>
                    <span>â€¢</span>
                    <span className="hover:text-white cursor-pointer">Locked</span>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* --- LEFT PANEL: TOOLBOX & LAYERS --- */}
                <div className={`${hidePanels ? 'w-0 opacity-0 pointer-events-none' : 'w-72'} bg-[#0a0a0a] border-r border-white/10 flex flex-col transition-all duration-300`}>
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        <div className="p-6">
                            <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                                <Plus size={12} /> Elements
                            </h3>
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { type: 'text', icon: Type, label: 'Text' },
                                    { type: 'image', icon: ImageIcon, label: 'Image' },
                                    { type: 'video', icon: Video, label: 'Video' },
                                    { type: 'button', icon: MousePointer2, label: 'Button' },
                                    { type: 'section', icon: Layout, label: 'Section' },
                                    { type: 'container', icon: Grid3X3, label: 'Container' },
                                    { type: 'dynamic', icon: Gamepad2, label: 'Widget' },
                                    { type: 'spacer', icon: Maximize2, label: 'Spacer' },
                                    { type: 'divider', icon: Minus, label: 'Divider' }
                                ].map(item => (
                                    <button
                                        key={item.type}
                                        onClick={() => addElement(item.type as any)}
                                        className="flex flex-col items-center justify-center p-4 bg-white/5 border border-white/5 rounded-xl hover:border-[#A855F7]/50 hover:bg-[#A855F7]/5 transition-all group"
                                    >
                                        <item.icon size={20} className="text-gray-500 group-hover:text-[#A855F7] mb-2" />
                                        <span className="text-[9px] font-bold text-gray-500 group-hover:text-white uppercase tracking-widest">{item.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="p-6 border-t border-white/5">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] flex items-center gap-2">
                                    <LayersIcon size={12} /> Layers
                                </h3>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => {
                                            setShowGlobalSettings(!showGlobalSettings);
                                            if (!showGlobalSettings) setSelectedElementId(null);
                                        }}
                                        className={`px-3 py-1 border rounded-lg text-[8px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${showGlobalSettings ? 'bg-[#A855F7] text-white border-[#A855F7]' : 'bg-white/5 hover:bg-[#A855F7]/10 border-white/5 hover:border-[#A855F7]/30 text-gray-500 hover:text-[#A855F7]'}`}
                                        title="Open Global Theme Settings"
                                    >
                                        <Sparkles size={10} /> Theme
                                    </button>
                                    <button
                                        onClick={importFromTemplate}
                                        className="px-3 py-1 bg-white/5 hover:bg-[#A855F7]/10 border border-white/5 hover:border-[#A855F7]/30 rounded-lg text-[8px] font-black text-gray-500 hover:text-[#A855F7] uppercase tracking-widest transition-all flex items-center gap-2"
                                        title="Import original template design as editable layers"
                                    >
                                        <Download size={10} /> Import Template
                                    </button>
                                </div>
                            </div>
                            <div className="space-y-1">
                                {currentLayout.layers.map(layer => (
                                    <div
                                        key={layer.id}
                                        onClick={() => setSelectedElementId(layer.id)}
                                        className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all cursor-pointer ${selectedElementId === layer.id ? 'bg-[#A855F7] text-white' : 'text-gray-400 hover:bg-white/5'} ${layer.hidden ? 'opacity-40' : ''}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-4 h-4 flex items-center justify-center">
                                                {layer.type === 'text' && <Type size={12} />}
                                                {layer.type === 'image' && <ImageIcon size={12} />}
                                                {layer.type === 'button' && <MousePointer2 size={12} />}
                                                {layer.type === 'section' && <Layout size={12} />}
                                            </div>
                                            {layer.label}
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                toggleVisibility(layer.id);
                                            }}
                                            className="hover:text-white transition-colors"
                                        >
                                            {layer.hidden ? <EyeOff size={12} /> : <Eye size={12} />}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- CENTER PANEL: CANVAS --- */}
                <div className="flex-1 bg-[#050505] relative overflow-hidden flex flex-col">
                    <div className="flex-1 flex items-center justify-center p-20 overflow-auto custom-scrollbar">
                        <div
                            style={{
                                width: viewport === 'desktop' ? '1280px' : viewport === 'tablet' ? '768px' : '375px',
                                transform: `scale(${zoom / 100})`,
                                transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
                            }}
                            className="bg-[#0a0a0a] min-h-[80vh] shadow-[0_40px_100px_rgba(0,0,0,1)] border border-white/10 rounded-2xl overflow-hidden relative active:cursor-grabbing"
                            onPointerDown={handleCanvasPointerDown}
                            onPointerMove={handleCanvasPointerMove}
                            onPointerUp={handleCanvasPointerUp}
                        >
                            {showGrid && (
                                <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
                            )}

                            <BuilderRenderer
                                elements={currentLayout.layers}
                                mode="edit"
                                viewport={viewport}
                                selectedId={selectedElementId || undefined}
                                onElementClick={setSelectedElementId}
                                globalDesign={settings.globalDesign}
                            />
                        </div>
                    </div>
                </div>

                {/* --- RIGHT PANEL: PROPERTIES / GLOBAL SETTINGS --- */}
                <div className={`${hidePanels ? 'w-0 opacity-0 pointer-events-none' : 'w-80'} bg-[#0a0a0a] border-l border-white/10 flex flex-col transition-all duration-300`}>
                    {showGlobalSettings ? (
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={() => setActiveGlobalTab('design')}
                                        className={`text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-2 transition-colors ${activeGlobalTab === 'design' ? 'text-[#A855F7]' : 'text-gray-600 hover:text-white'}`}
                                    >
                                        <Sparkles size={12} /> Design
                                    </button>
                                    <div className="w-[1px] h-3 bg-white/10" />
                                    <button
                                        onClick={() => setActiveGlobalTab('gallery')}
                                        className={`text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-2 transition-colors ${activeGlobalTab === 'gallery' ? 'text-[#A855F7]' : 'text-gray-600 hover:text-white'}`}
                                    >
                                        <ImageIconLucide size={12} /> Gallery
                                    </button>
                                </div>
                                <button onClick={() => setShowGlobalSettings(false)} className="text-gray-600 hover:text-white"><Plus className="rotate-45" size={16} /></button>
                            </div>

                            {activeGlobalTab === 'gallery' ? (<div className="space-y-6">
                                <div className="p-4 bg-white/5 rounded-xl border border-white/5 space-y-4">
                                    <h4 className="text-[9px] text-gray-500 font-black uppercase tracking-widest flex items-center gap-2">
                                        <Plus size={10} /> Add to Gallery
                                    </h4>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="text"
                                            placeholder="Paste Image URL"
                                            className="flex-1 bg-black border border-white/10 rounded px-2 py-2 text-[10px] text-white focus:border-[#A855F7] outline-none transition-colors"
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    const val = (e.currentTarget as HTMLInputElement).value;
                                                    if (val) {
                                                        const next = JSON.parse(JSON.stringify(settings));
                                                        if (!next.mediaGallery) next.mediaGallery = [];
                                                        next.mediaGallery.push(val);
                                                        setSettings(next);
                                                        saveHistoryStep();
                                                        (e.currentTarget as HTMLInputElement).value = '';
                                                    }
                                                }
                                            }}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    {(settings.mediaGallery || []).map((img, idx) => (
                                        <div key={idx} className="group relative aspect-video bg-white/5 rounded-lg overflow-hidden border border-white/5 hover:border-[#A855F7]/50 transition-all">
                                            <img src={img} alt="" className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => {
                                                        const next = JSON.parse(JSON.stringify(settings));
                                                        next.mediaGallery = next.mediaGallery.filter((_: string, i: number) => i !== idx);
                                                        setSettings(next);
                                                        saveHistoryStep();
                                                    }}
                                                    className="p-1.5 bg-red-500/20 text-red-500 hover:bg-red-500 hover:text-white rounded-md transition-colors"
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>) : (
                                <div className="space-y-10">
                                    {/* Global Colors */}
                                    <div>
                                        <h4 className="text-[9px] text-gray-500 font-black uppercase tracking-widest mb-6 flex items-center gap-2">
                                            <Palette size={10} /> Brand Colors
                                        </h4>
                                        <div className="space-y-4">
                                            {[
                                                { key: 'primary', label: 'Primary Brand' },
                                                { key: 'secondary', label: 'Secondary Accent' },
                                                { key: 'accent', label: 'Neon Highlights' },
                                                { key: 'background', label: 'Deep Background' },
                                                { key: 'surface', label: 'Panel Surface' }
                                            ].map(color => (
                                                <div key={color.key} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                                                    <div className="flex flex-col gap-0.5">
                                                        <span className="text-[9px] font-bold text-white uppercase tracking-widest">{color.label}</span>
                                                        <span className="text-[8px] text-white/30 font-mono uppercase">{(settings.globalDesign.colors as any)[color.key]}</span>
                                                    </div>
                                                    <input
                                                        type="color"
                                                        value={(settings.globalDesign.colors as any)[color.key]}
                                                        onChange={(e) => {
                                                            const next = JSON.parse(JSON.stringify(settings));
                                                            next.globalDesign.colors[color.key] = e.target.value;
                                                            setSettings(next);
                                                            saveHistoryStep();
                                                        }}
                                                        className="w-10 h-10 bg-transparent border-none cursor-pointer p-0"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Global Typography */}
                                    <div>
                                        <h4 className="text-[9px] text-gray-500 font-black uppercase tracking-widest mb-6 flex items-center gap-2">
                                            <Type size={10} /> Site Typography
                                        </h4>
                                        <div className="space-y-4">
                                            {[
                                                { key: 'display', label: 'Headers & Titles' },
                                                { key: 'body', label: 'Body & Paragraphs' }
                                            ].map(font => (
                                                <div key={font.key} className="space-y-2">
                                                    <label className="text-[8px] text-white/30 uppercase tracking-widest font-black">{font.label}</label>
                                                    <select
                                                        value={(settings.globalDesign.typography as any)[font.key]}
                                                        onChange={(e) => {
                                                            const next = JSON.parse(JSON.stringify(settings));
                                                            next.globalDesign.typography[font.key] = e.target.value;
                                                            setSettings(next);
                                                            saveHistoryStep();
                                                        }}
                                                        className="w-full bg-black border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white"
                                                    >
                                                        <option value="Inter, sans-serif">Inter (Modern)</option>
                                                        <option value="'Outfit', sans-serif">Outfit (Premium)</option>
                                                        <option value="'Rajdhani', sans-serif">Rajdhani (Gaming)</option>
                                                        <option value="'JetBrains Mono', monospace">JetBrains (Tech)</option>
                                                    </select>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Global Background Effects */}
                                    <div>
                                        <h4 className="text-[9px] text-gray-500 font-black uppercase tracking-widest mb-6 flex items-center gap-2">
                                            <Sliders size={12} /> Visual Ambiance
                                        </h4>
                                        <div className="p-4 bg-white/5 rounded-xl border border-white/5 space-y-6">
                                            {/* Image Brightness */}
                                            <div>
                                                <div className="flex justify-between text-[9px] text-white/40 uppercase tracking-widest mb-2 font-black">
                                                    <span>Image Brightness</span>
                                                    <span>{settings.backgroundEffects.imageOpacity}%</span>
                                                </div>
                                                <input
                                                    type="range" min="0" max="100"
                                                    value={settings.backgroundEffects.imageOpacity}
                                                    onChange={(e) => {
                                                        const next = JSON.parse(JSON.stringify(settings));
                                                        next.backgroundEffects.imageOpacity = parseInt(e.target.value);
                                                        setSettings(next);
                                                    }}
                                                    onMouseUp={saveHistoryStep}
                                                    className="w-full h-1 bg-white/10 rounded-full appearance-none accent-[#A855F7]"
                                                />
                                            </div>

                                            {/* Overlay Darkness */}
                                            <div>
                                                <div className="flex justify-between text-[9px] text-white/40 uppercase tracking-widest mb-2 font-black">
                                                    <span>Overlay Darkness</span>
                                                    <span>{settings.backgroundEffects.overlayDarkness}%</span>
                                                </div>
                                                <input
                                                    type="range" min="0" max="100"
                                                    value={settings.backgroundEffects.overlayDarkness}
                                                    onChange={(e) => {
                                                        const next = JSON.parse(JSON.stringify(settings));
                                                        next.backgroundEffects.overlayDarkness = parseInt(e.target.value);
                                                        setSettings(next);
                                                    }}
                                                    onMouseUp={saveHistoryStep}
                                                    className="w-full h-1 bg-white/10 rounded-full appearance-none accent-[#A855F7]"
                                                />
                                            </div>

                                            {/* Blur Intensity */}
                                            <div>
                                                <div className="flex justify-between text-[9px] text-white/40 uppercase tracking-widest mb-2 font-black">
                                                    <span>Blur Intensity</span>
                                                    <span>{settings.backgroundEffects.blurIntensity}px</span>
                                                </div>
                                                <input
                                                    type="range" min="0" max="20"
                                                    value={settings.backgroundEffects.blurIntensity}
                                                    onChange={(e) => {
                                                        const next = JSON.parse(JSON.stringify(settings));
                                                        next.backgroundEffects.blurIntensity = parseInt(e.target.value);
                                                        setSettings(next);
                                                    }}
                                                    onMouseUp={saveHistoryStep}
                                                    className="w-full h-1 bg-white/10 rounded-full appearance-none accent-[#A855F7]"
                                                />
                                            </div>

                                            {/* Slideshow Speed */}
                                            <div>
                                                <div className="flex justify-between text-[9px] text-white/40 uppercase tracking-widest mb-2 font-black">
                                                    <span>Slideshow Speed</span>
                                                    <span>{settings.backgroundEffects.slideshowSpeed}s</span>
                                                </div>
                                                <input
                                                    type="range" min="0" max="60"
                                                    value={settings.backgroundEffects.slideshowSpeed}
                                                    onChange={(e) => {
                                                        const next = JSON.parse(JSON.stringify(settings));
                                                        next.backgroundEffects.slideshowSpeed = parseInt(e.target.value);
                                                        setSettings(next);
                                                    }}
                                                    onMouseUp={saveHistoryStep}
                                                    className="w-full h-1 bg-white/10 rounded-full appearance-none accent-[#A855F7]"
                                                />
                                                <p className="text-[7px] text-gray-500 mt-2 uppercase font-black tracking-widest">Set to 0 to disable automatic rotation</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="text-[9px] text-gray-500 font-black uppercase tracking-widest mb-6 flex items-center gap-2">
                                            <Wind size={10} /> Page Backgrounds
                                        </h4>
                                        <div className="space-y-4">
                                            <div className="space-y-3">
                                                {['home', 'buy', 'sell', 'services', 'rental', 'cart', 'login', 'signup', 'kyc', 'profile'].map((page) => (
                                                    <div key={page} className="bg-white/5 rounded-lg border border-white/5 overflow-hidden">
                                                        <button
                                                            onClick={() => {
                                                                const el = document.getElementById(`bg-config-${page}`);
                                                                if (el) el.classList.toggle('hidden');
                                                            }}
                                                            className="w-full flex items-center justify-between p-3 hover:bg-white/5 transition-colors"
                                                        >
                                                            <span className="text-[10px] font-bold text-gray-300 uppercase tracking-wider">{page} Page</span>
                                                            <ChevronDown size={12} className="text-gray-500" />
                                                        </button>
                                                        <div id={`bg-config-${page}`} className="hidden p-3 border-t border-white/5 space-y-4">
                                                            {/* Blur & Overlay Controls */}
                                                            <div className="space-y-3">
                                                                <div>
                                                                    <div className="flex justify-between text-[9px] text-gray-400 uppercase tracking-widest mb-1 font-black">
                                                                        <span>Overlay Opacity</span>
                                                                        <span>{settings.pageEffects?.[page]?.overlayDarkness ?? settings.backgroundEffects.overlayDarkness}%</span>
                                                                    </div>
                                                                    <input
                                                                        type="range" min="0" max="100"
                                                                        value={settings.pageEffects?.[page]?.overlayDarkness ?? settings.backgroundEffects.overlayDarkness}
                                                                        onChange={(e) => {
                                                                            const next = JSON.parse(JSON.stringify(settings));
                                                                            if (!next.pageEffects[page]) next.pageEffects[page] = { ...settings.backgroundEffects };
                                                                            next.pageEffects[page].overlayDarkness = parseInt(e.target.value);
                                                                            setSettings(next);
                                                                        }}
                                                                        onMouseUp={saveHistoryStep}
                                                                        className="w-full accent-[#A855F7] h-1 bg-white/10 rounded-full appearance-none"
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <div className="flex justify-between text-[9px] text-gray-400 uppercase tracking-widest mb-1 font-black">
                                                                        <span>Blur intensity</span>
                                                                        <span>{settings.pageEffects?.[page]?.blurIntensity ?? settings.backgroundEffects.blurIntensity}px</span>
                                                                    </div>
                                                                    <input
                                                                        type="range" min="0" max="20"
                                                                        value={settings.pageEffects?.[page]?.blurIntensity ?? settings.backgroundEffects.blurIntensity}
                                                                        onChange={(e) => {
                                                                            const next = JSON.parse(JSON.stringify(settings));
                                                                            if (!next.pageEffects[page]) next.pageEffects[page] = { ...settings.backgroundEffects };
                                                                            next.pageEffects[page].blurIntensity = parseInt(e.target.value);
                                                                            setSettings(next);
                                                                        }}
                                                                        onMouseUp={saveHistoryStep}
                                                                        className="w-full accent-[#A855F7] h-1 bg-white/10 rounded-full appearance-none"
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <div className="flex justify-between text-[9px] text-gray-400 uppercase tracking-widest mb-1 font-black">
                                                                        <span>Slideshow Speed</span>
                                                                        <span>{settings.pageEffects?.[page]?.slideshowSpeed ?? settings.backgroundEffects.slideshowSpeed}s</span>
                                                                    </div>
                                                                    <input
                                                                        type="range" min="0" max="60"
                                                                        value={settings.pageEffects?.[page]?.slideshowSpeed ?? settings.backgroundEffects.slideshowSpeed}
                                                                        onChange={(e) => {
                                                                            const next = JSON.parse(JSON.stringify(settings));
                                                                            if (!next.pageEffects[page]) next.pageEffects[page] = { ...settings.backgroundEffects };
                                                                            next.pageEffects[page].slideshowSpeed = parseInt(e.target.value);
                                                                            setSettings(next);
                                                                        }}
                                                                        onMouseUp={saveHistoryStep}
                                                                        className="w-full accent-[#A855F7] h-1 bg-white/10 rounded-full appearance-none"
                                                                    />
                                                                </div>
                                                            </div>

                                                            <div className="flex items-center gap-2 text-[8px] text-gray-600 uppercase font-black tracking-widest mb-2 border-t border-white/5 pt-4">
                                                                <ImageIcon size={10} /> Select one or more images for slideshow
                                                            </div>

                                                            {/* Background Selection */}
                                                            <div className="grid grid-cols-3 gap-2">
                                                                {(settings.mediaGallery || []).map((img, idx) => {
                                                                    const isActive = settings.pageBackgrounds?.[page as keyof typeof settings.pageBackgrounds]?.includes(img);
                                                                    return (
                                                                        <button
                                                                            key={idx}
                                                                            onClick={() => {
                                                                                const next = JSON.parse(JSON.stringify(settings));
                                                                                if (!next.pageBackgrounds) next.pageBackgrounds = {};
                                                                                if (!next.pageBackgrounds[page]) next.pageBackgrounds[page] = [];

                                                                                if (isActive) {
                                                                                    next.pageBackgrounds[page] = next.pageBackgrounds[page].filter((i: string) => i !== img);
                                                                                } else {
                                                                                    next.pageBackgrounds[page].push(img);
                                                                                }
                                                                                setSettings(next);
                                                                                saveHistoryStep();
                                                                            }}
                                                                            className={`relative aspect-video rounded overflow-hidden border transition-all ${isActive ? 'border-[#A855F7] ring-1 ring-[#A855F7]' : 'border-white/10 hover:border-white/30'}`}
                                                                        >
                                                                            <img src={img} alt="" className="w-full h-full object-cover" />
                                                                            {isActive && (
                                                                                <div className="absolute inset-0 bg-[#A855F7]/20 flex items-center justify-center">
                                                                                    <Check size={12} className="text-white drop-shadow-md" />
                                                                                </div>
                                                                            )}
                                                                        </button>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Footer Section */}
                                    <div>
                                        <h4 className="text-[9px] text-gray-500 font-black uppercase tracking-widest mb-6 flex items-center gap-2">
                                            <Info size={10} /> Footer Configuration
                                        </h4>
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1.5">
                                                    <label className="text-[9px] text-gray-400 uppercase tracking-widest font-black">Address</label>
                                                    <input
                                                        type="text"
                                                        value={settings.footer?.address || ''}
                                                        onChange={(e) => {
                                                            const next = JSON.parse(JSON.stringify(settings));
                                                            if (!next.footer) next.footer = {};
                                                            next.footer.address = e.target.value;
                                                            setSettings(next);
                                                            saveHistoryStep();
                                                        }}
                                                        className="w-full bg-black border border-white/10 rounded px-3 py-2 text-[10px] text-white focus:border-[#A855F7] outline-none"
                                                        placeholder="Store Address"
                                                    />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-[9px] text-gray-400 uppercase tracking-widest font-black">Phone</label>
                                                    <input
                                                        type="text"
                                                        value={settings.footer?.phone || ''}
                                                        onChange={(e) => {
                                                            const next = JSON.parse(JSON.stringify(settings));
                                                            if (!next.footer) next.footer = {};
                                                            next.footer.phone = e.target.value;
                                                            setSettings(next);
                                                            saveHistoryStep();
                                                        }}
                                                        className="w-full bg-black border border-white/10 rounded px-3 py-2 text-[10px] text-white focus:border-[#A855F7] outline-none"
                                                        placeholder="Contact Phone"
                                                    />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-[9px] text-gray-400 uppercase tracking-widest font-black">Email</label>
                                                    <input
                                                        type="text"
                                                        value={settings.footer?.email || ''}
                                                        onChange={(e) => {
                                                            const next = JSON.parse(JSON.stringify(settings));
                                                            if (!next.footer) next.footer = {};
                                                            next.footer.email = e.target.value;
                                                            setSettings(next);
                                                            saveHistoryStep();
                                                        }}
                                                        className="w-full bg-black border border-white/10 rounded px-3 py-2 text-[10px] text-white focus:border-[#A855F7] outline-none"
                                                        placeholder="Contact Email"
                                                    />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-[9px] text-gray-400 uppercase tracking-widest font-black">Copyright</label>
                                                    <input
                                                        type="text"
                                                        value={settings.footer?.copyrightText || ''}
                                                        onChange={(e) => {
                                                            const next = JSON.parse(JSON.stringify(settings));
                                                            if (!next.footer) next.footer = {};
                                                            next.footer.copyrightText = e.target.value;
                                                            setSettings(next);
                                                            saveHistoryStep();
                                                        }}
                                                        className="w-full bg-black border border-white/10 rounded px-3 py-2 text-[10px] text-white focus:border-[#A855F7] outline-none"
                                                        placeholder="Copyright Text"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Danger Zone Section */}
                                    <div className="mt-12 pt-12 border-t border-white/5">
                                        <h4 className="text-[9px] text-red-500/50 font-black uppercase tracking-widest mb-4 flex items-center gap-2">
                                            <AlertTriangle size={10} /> Danger Zone
                                        </h4>
                                        <p className="text-[10px] text-gray-500 mb-4 leading-relaxed">
                                            Resetting will wipe all changes.
                                        </p>
                                        <button
                                            onClick={async () => {
                                                if (window.confirm("Are you sure?")) {
                                                    await VisualsService.reset();
                                                    window.location.reload();
                                                }
                                            }}
                                            className="w-full py-3 bg-red-500/5 text-red-500/70 border border-red-500/10 rounded-xl text-xs font-bold uppercase tracking-widest"
                                        >
                                            Factory Reset
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                    ) : selectedElement ? (
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Properties</h3>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => copyStyles(selectedElement)}
                                        className="p-1.5 text-gray-600 hover:text-[#A855F7] hover:bg-white/5 rounded-md transition-all"
                                        title="Copy Styles"
                                    >
                                        <Copy size={14} />
                                    </button>
                                    <button
                                        onClick={() => pasteStyles(selectedElement.id)}
                                        disabled={!copiedStyles}
                                        className="p-1.5 text-gray-600 hover:text-[#A855F7] hover:bg-white/5 rounded-md transition-all disabled:opacity-20"
                                        title="Paste Styles"
                                    >
                                        <Clipboard size={14} />
                                    </button>
                                    <button
                                        onClick={() => duplicateElement(selectedElement.id)}
                                        className="p-1.5 text-gray-600 hover:text-[#A855F7] hover:bg-white/5 rounded-md transition-all"
                                        title="Duplicate"
                                    >
                                        <LayersIcon size={14} />
                                    </button>
                                    <div className="w-[1px] h-4 bg-white/5 mx-1" />
                                    <button
                                        onClick={() => toggleVisibility(selectedElement.id)}
                                        className={`p-1.5 rounded-md transition-colors ${selectedElement.hidden ? 'text-gray-600 hover:text-white' : 'text-[#A855F7] hover:bg-[#A855F7]/10'}`}
                                        title={selectedElement.hidden ? "Show Element" : "Hide Element"}
                                    >
                                        {selectedElement.hidden ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                    <button onClick={() => deleteElement(selectedElement.id)} className="p-1.5 text-gray-600 hover:text-red-500 transition-colors" title="Delete"><Trash2 size={16} /></button>
                                </div>
                            </div>

                            {/* --- PROPERTIES TABS --- */}
                            <div className="flex border-b border-white/10 mb-6 font-black uppercase tracking-[0.2em] text-[9px]">
                                <button onClick={() => setActiveTab('content')} className={`flex-1 py-3 transition-colors ${activeTab === 'content' ? 'text-[#A855F7] border-b-2 border-[#A855F7]' : 'text-gray-500 hover:text-white'}`}>Content</button>
                                <button onClick={() => setActiveTab('style')} className={`flex-1 py-3 transition-colors ${activeTab === 'style' ? 'text-[#A855F7] border-b-2 border-[#A855F7]' : 'text-gray-500 hover:text-white'}`}>Style</button>
                                <button onClick={() => setActiveTab('animation')} className={`flex-1 py-3 transition-colors ${activeTab === 'animation' ? 'text-[#A855F7] border-b-2 border-[#A855F7]' : 'text-gray-500 hover:text-white'}`}>Anim</button>
                                <button onClick={() => setActiveTab('advanced')} className={`flex-1 py-3 transition-colors ${activeTab === 'advanced' ? 'text-[#A855F7] border-b-2 border-[#A855F7]' : 'text-gray-500 hover:text-white'}`}>Extra</button>
                            </div>

                            <div className="space-y-8">
                                {activeTab === 'content' && (
                                    <div className="space-y-6">
                                        {/* Text Content */}
                                        {selectedElement.type === 'text' && (
                                            <div className="space-y-4">
                                                <label className="text-[9px] text-gray-600 font-bold uppercase tracking-widest block">Text Content</label>
                                                <textarea
                                                    value={selectedElement.props.content || ''}
                                                    onChange={(e) => {
                                                        const next = JSON.parse(JSON.stringify(settings));
                                                        const el = next.layouts[activePage].layers.find((l: any) => l.id === selectedElement.id);
                                                        if (el) el.props.content = e.target.value;
                                                        setSettings(next);
                                                    }}
                                                    onBlur={saveHistoryStep}
                                                    className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:border-[#A855F7] outline-none resize-none"
                                                    rows={4}
                                                />
                                            </div>
                                        )}

                                        {/* Image Source */}
                                        {selectedElement.type === 'image' && (
                                            <div className="space-y-4">
                                                <label className="text-[9px] text-gray-600 font-bold uppercase tracking-widest block">Image URL</label>
                                                <input
                                                    type="text"
                                                    value={selectedElement.props.url || ''}
                                                    onChange={(e) => {
                                                        const next = JSON.parse(JSON.stringify(settings));
                                                        const el = next.layouts[activePage].layers.find((l: any) => l.id === selectedElement.id);
                                                        if (el) el.props.url = e.target.value;
                                                        setSettings(next);
                                                    }}
                                                    className="w-full bg-black border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white"
                                                    placeholder="https://..."
                                                />
                                            </div>
                                        )}
                                    </div>
                                )}

                                {activeTab === 'animation' && (
                                    <div className="space-y-8">
                                        <div>
                                            <label className="text-[9px] text-gray-600 font-bold uppercase tracking-widest block mb-4">Entrance Effect</label>
                                            <select
                                                value={selectedElement.animation?.type || 'none'}
                                                onChange={(e) => {
                                                    const next = JSON.parse(JSON.stringify(settings));
                                                    const el = next.layouts[activePage].layers.find((l: any) => l.id === selectedElement.id);
                                                    if (el) el.animation = {
                                                        type: e.target.value as any,
                                                        duration: 0.5,
                                                        delay: 0,
                                                        iteration: 'once',
                                                        ...el.animation
                                                    };
                                                    setSettings(next);
                                                    saveHistoryStep();
                                                }}
                                                className="w-full bg-black border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none"
                                            >
                                                <option value="none">None</option>
                                                <option value="fade">Fade In</option>
                                                <option value="slide">Slide In</option>
                                                <option value="zoom">Zoom In</option>
                                                <option value="bounce">Bounce</option>
                                                <option value="rotate">Rotate</option>
                                            </select>
                                        </div>

                                        {selectedElement.animation?.type !== 'none' && (
                                            <>
                                                <div>
                                                    <label className="text-[9px] text-gray-600 font-bold uppercase tracking-widest block mb-4">Direction</label>
                                                    <div className="grid grid-cols-4 gap-2">
                                                        {['up', 'down', 'left', 'right'].map(dir => (
                                                            <button
                                                                key={dir}
                                                                onClick={() => {
                                                                    const next = JSON.parse(JSON.stringify(settings));
                                                                    const el = next.layouts[activePage].layers.find((l: any) => l.id === selectedElement.id);
                                                                    if (el) el.animation.direction = dir as any;
                                                                    setSettings(next);
                                                                }}
                                                                className={`p-2 rounded-lg border text-[8px] font-black uppercase transition-all ${selectedElement.animation?.direction === dir ? 'bg-[#A855F7] border-[#A855F7]' : 'bg-black border-white/5 text-gray-500'}`}
                                                            >
                                                                {dir[0]}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="text-[8px] text-gray-700 font-black uppercase mb-1 block">Duration (s)</label>
                                                        <input
                                                            type="number" step="0.1"
                                                            value={selectedElement.animation?.duration || 0.5}
                                                            onChange={(e) => {
                                                                const next = JSON.parse(JSON.stringify(settings));
                                                                const el = next.layouts[activePage].layers.find((l: any) => l.id === selectedElement.id);
                                                                if (el) el.animation.duration = parseFloat(e.target.value);
                                                                setSettings(next);
                                                            }}
                                                            className="w-full bg-black border border-white/10 rounded-xl px-4 py-2 text-xs text-white"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-[8px] text-gray-700 font-black uppercase mb-1 block">Delay (s)</label>
                                                        <input
                                                            type="number" step="0.1"
                                                            value={selectedElement.animation?.delay || 0}
                                                            onChange={(e) => {
                                                                const next = JSON.parse(JSON.stringify(settings));
                                                                const el = next.layouts[activePage].layers.find((l: any) => l.id === selectedElement.id);
                                                                if (el) el.animation.delay = parseFloat(e.target.value);
                                                                setSettings(next);
                                                            }}
                                                            className="w-full bg-black border border-white/10 rounded-xl px-4 py-2 text-xs text-white"
                                                        />
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                )}

                                {activeTab === 'style' && (
                                    <div className="space-y-8">
                                        {/* Typography */}
                                        <div>
                                            <label className="text-[9px] text-gray-600 font-bold uppercase tracking-widest block mb-4">Typography</label>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <input
                                                        type="number"
                                                        value={parseInt(selectedElement.styles[viewport]?.fontSize || selectedElement.styles.desktop.fontSize || '16')}
                                                        onChange={(e) => updateElementStyle('fontSize', `${e.target.value}px`)}
                                                        className="w-full bg-black border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white"
                                                    />
                                                    <span className="text-[8px] text-white/30 uppercase block mt-1 tracking-widest font-black">Font Size</span>
                                                </div>
                                                <div className="flex flex-col gap-1">
                                                    <input
                                                        type="color"
                                                        value={selectedElement.styles[viewport]?.color || selectedElement.styles.desktop.color || '#ffffff'}
                                                        onChange={(e) => updateElementStyle('color', e.target.value)}
                                                        className="w-full h-10 bg-transparent border-none cursor-pointer p-0"
                                                    />
                                                    <span className="text-[8px] text-white/30 uppercase block tracking-widest font-black">Color</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Visual Decoration */}
                                        <div>
                                            <label className="text-[9px] text-gray-600 font-bold uppercase tracking-widest block mb-4">Decorations</label>
                                            <div className="space-y-4">
                                                <div>
                                                    <input
                                                        type="text"
                                                        value={selectedElement.styles[viewport]?.borderRadius || selectedElement.styles.desktop.borderRadius || '0px'}
                                                        onChange={(e) => updateElementStyle('borderRadius', e.target.value)}
                                                        className="w-full bg-black border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white uppercase"
                                                    />
                                                    <span className="text-[8px] text-white/30 uppercase block mt-1 tracking-widest font-black">Corner Radius</span>
                                                </div>
                                                <div>
                                                    <input
                                                        type="text"
                                                        value={selectedElement.styles[viewport]?.background || selectedElement.styles.desktop.background || ''}
                                                        onChange={(e) => updateElementStyle('background', e.target.value)}
                                                        className="w-full bg-black border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white"
                                                        placeholder="linear-gradient(...) or url(...)"
                                                    />
                                                    <span className="text-[8px] text-white/30 uppercase block mt-1 tracking-widest font-black">Background (CSS)</span>
                                                </div>
                                                <div>
                                                    <select
                                                        value={selectedElement.styles[viewport]?.boxShadow || selectedElement.styles.desktop.boxShadow || 'none'}
                                                        onChange={(e) => updateElementStyle('boxShadow', e.target.value)}
                                                        className="w-full bg-black border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none"
                                                    >
                                                        <option value="none">None</option>
                                                        <option value="0 10px 30px rgba(0,0,0,0.5)">Soft Shadow</option>
                                                        <option value="0 0 20px #8B5CF6">Purple Glow</option>
                                                        <option value="0 0 50px rgba(139,92,246,0.3)">Ultra Diffusion</option>
                                                    </select>
                                                    <span className="text-[8px] text-white/30 uppercase block mt-1 tracking-widest font-black">Elevation & Gloom</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Opacity */}
                                        <div>
                                            <label className="text-[9px] text-gray-600 font-bold uppercase tracking-widest block mb-4">Transparency</label>
                                            <input
                                                type="range" min="0" max="1" step="0.1"
                                                value={selectedElement.styles[viewport]?.opacity ?? 1}
                                                onChange={(e) => updateElementStyle('opacity', parseFloat(e.target.value))}
                                                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#A855F7]"
                                            />
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'advanced' && (
                                    <div className="space-y-8">
                                        {/* Layout / Flexbox */}
                                        {(selectedElement.type === 'section' || selectedElement.type === 'container') && (
                                            <div>
                                                <label className="text-[9px] text-gray-600 font-bold uppercase tracking-widest block mb-4">Flexbox Container</label>
                                                <div className="space-y-4">
                                                    <div className="flex gap-2 p-1 bg-black rounded-lg border border-white/5">
                                                        {['row', 'column'].map(dir => (
                                                            <button
                                                                key={dir}
                                                                onClick={() => updateElementStyle('flexDirection', dir)}
                                                                className={`flex-1 py-2 rounded text-[8px] font-black uppercase tracking-widest transition-all ${selectedElement.styles[viewport]?.flexDirection === dir ? 'bg-[#A855F7] text-white' : 'text-gray-500 hover:text-white'}`}
                                                            >
                                                                {dir}
                                                            </button>
                                                        ))}
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <select
                                                                value={selectedElement.styles[viewport]?.justifyContent || 'flex-start'}
                                                                onChange={(e) => updateElementStyle('justifyContent', e.target.value)}
                                                                className="w-full bg-black border border-white/10 rounded-xl px-4 py-2 text-xs text-white"
                                                            >
                                                                <option value="flex-start">Start</option>
                                                                <option value="center">Center</option>
                                                                <option value="flex-end">End</option>
                                                                <option value="space-between">Between</option>
                                                            </select>
                                                            <span className="text-[8px] text-white/30 uppercase block mt-1 tracking-widest font-black">Distribute</span>
                                                        </div>
                                                        <div>
                                                            <select
                                                                value={selectedElement.styles[viewport]?.alignItems || 'flex-start'}
                                                                onChange={(e) => updateElementStyle('alignItems', e.target.value)}
                                                                className="w-full bg-black border border-white/10 rounded-xl px-4 py-2 text-xs text-white"
                                                            >
                                                                <option value="flex-start">Start</option>
                                                                <option value="center">Center</option>
                                                                <option value="flex-end">End</option>
                                                            </select>
                                                            <span className="text-[8px] text-white/30 uppercase block mt-1 tracking-widest font-black">Align</span>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <input
                                                            type="text"
                                                            value={selectedElement.styles[viewport]?.gap || '0px'}
                                                            onChange={(e) => updateElementStyle('gap', e.target.value)}
                                                            className="w-full bg-black border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white"
                                                        />
                                                        <span className="text-[8px] text-white/30 uppercase block mt-1 tracking-widest font-black">Item Gap</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Dimensions */}
                                        <div>
                                            <label className="text-[9px] text-gray-600 font-bold uppercase tracking-widest block mb-4">Geometry ({viewport})</label>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <input
                                                        type="text"
                                                        value={selectedElement.styles[viewport]?.left || selectedElement.styles.desktop.left || '0px'}
                                                        onChange={(e) => updateElementStyle('left', e.target.value)}
                                                        onBlur={saveHistoryStep}
                                                        className="w-full bg-black border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white"
                                                    />
                                                    <span className="text-[8px] text-white/30 uppercase block mt-1 tracking-widest font-black">X Pos</span>
                                                </div>
                                                <div>
                                                    <input
                                                        type="text"
                                                        value={selectedElement.styles[viewport]?.top || selectedElement.styles.desktop.top || '0px'}
                                                        onChange={(e) => updateElementStyle('top', e.target.value)}
                                                        onBlur={saveHistoryStep}
                                                        className="w-full bg-black border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white"
                                                    />
                                                    <span className="text-[8px] text-white/30 uppercase block mt-1 tracking-widest font-black">Y Pos</span>
                                                </div>
                                                <div>
                                                    <input
                                                        type="text"
                                                        value={selectedElement.styles[viewport]?.width || 'auto'}
                                                        onChange={(e) => updateElementStyle('width', e.target.value)}
                                                        onBlur={saveHistoryStep}
                                                        className="w-full bg-black border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white"
                                                    />
                                                    <span className="text-[8px] text-white/30 uppercase block mt-1 tracking-widest font-black">Width</span>
                                                </div>
                                                <div>
                                                    <input
                                                        type="text"
                                                        value={selectedElement.styles[viewport]?.height || 'auto'}
                                                        onChange={(e) => updateElementStyle('height', e.target.value)}
                                                        onBlur={saveHistoryStep}
                                                        className="w-full bg-black border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white"
                                                    />
                                                    <span className="text-[8px] text-white/30 uppercase block mt-1 tracking-widest font-black">Height</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Spacing */}
                                        <div>
                                            <label className="text-[9px] text-gray-600 font-bold uppercase tracking-widest block mb-4">Spacing</label>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <input
                                                        type="text"
                                                        value={selectedElement.styles[viewport]?.padding || selectedElement.styles.desktop.padding || '0px'}
                                                        onChange={(e) => updateElementStyle('padding', e.target.value)}
                                                        onBlur={saveHistoryStep}
                                                        className="w-full bg-black border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white"
                                                    />
                                                    <span className="text-[8px] text-white/30 uppercase block mt-1 tracking-widest font-black">Padding</span>
                                                </div>
                                                <div>
                                                    <input
                                                        type="text"
                                                        value={selectedElement.styles[viewport]?.margin || selectedElement.styles.desktop.margin || '0px'}
                                                        onChange={(e) => updateElementStyle('margin', e.target.value)}
                                                        onBlur={saveHistoryStep}
                                                        className="w-full bg-black border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white"
                                                    />
                                                    <span className="text-[8px] text-white/30 uppercase block mt-1 tracking-widest font-black">Margin</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center p-12 text-center opacity-30">
                            <MousePointer2 size={40} className="text-gray-700 mb-6" />
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Select an element<br />to edit properties</p>
                        </div>
                    )}
                </div>
            </div>
        </div >
    );
}

