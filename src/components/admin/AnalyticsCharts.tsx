"use client";

import React from 'react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line, BarChart, Bar
} from 'recharts';

interface AnalyticsChartsProps {
    revenueData: any[];
    fleetAnalytics: any;
    fleetHealth: number;
}

export function RevenueChart({ revenueData }: { revenueData: any[] }) {
    return (
        <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={revenueData}>
                <defs>
                    <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                <XAxis dataKey="formattedDate" stroke="#4b5563" fontSize={10} axisLine={false} tickLine={false} />
                <YAxis stroke="#4b5563" fontSize={10} axisLine={false} tickLine={false} tickFormatter={(v) => `\u20b9${v / 1000}k`} />
                <Tooltip
                    contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1rem', fontSize: '10px' }}
                    itemStyle={{ color: '#fff' }}
                />
                <Area type="monotone" dataKey="amount" stroke="#8B5CF6" strokeWidth={3} fillOpacity={1} fill="url(#colorAmount)" />
            </AreaChart>
        </ResponsiveContainer>
    );
}

export function DashboardRevenueChart({ revenueData }: { revenueData: any[] }) {
    return (
        <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={revenueData}>
                <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1a1a1a" />
                <XAxis
                    dataKey="formattedDate"
                    stroke="#4b5563"
                    fontSize={8}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(str) => {
                        try {
                            return str;
                        } catch (e) {
                            return "";
                        }
                    }}
                />
                <YAxis
                    stroke="#4b5563"
                    fontSize={8}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(val) => `\u20b9${val / 1000}k`}
                />
                <Tooltip
                    contentStyle={{
                        backgroundColor: '#0a0a0a',
                        border: '1px solid rgba(255,255,255,0.05)',
                        borderRadius: '1rem',
                        fontSize: '10px'
                    }}
                    itemStyle={{ color: '#fff' }}
                />
                <Area
                    type="monotone"
                    dataKey="amount"
                    stroke="#8B5CF6"
                    strokeWidth={4}
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                />
            </AreaChart>
        </ResponsiveContainer>
    );
}

export function LatencyChart({ data }: { data: any[] }) {
    if (!data) return null;
    return (
        <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff03" vertical={false} />
                <XAxis dataKey="time" stroke="#4b5563" fontSize={8} axisLine={false} tickLine={false} />
                <YAxis stroke="#4b5563" fontSize={8} axisLine={false} tickLine={false} tickFormatter={(v) => `${Math.round(v)}ms`} />
                <Tooltip
                    contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1rem', fontSize: '8px' }}
                />
                <Line type="monotone" dataKey="value" stroke="#3B82F6" strokeWidth={2} dot={false} animationDuration={300} />
            </LineChart>
        </ResponsiveContainer>
    );
}

export function ActivityBarChart({ data }: { data: any[] }) {
    if (!data) return null;
    return (
        <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1a1a1a" />
                <XAxis
                    dataKey="name"
                    stroke="#374151"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                />
                <YAxis hide />
                <Tooltip
                    contentStyle={{
                        backgroundColor: '#0a0a0a',
                        border: '1px solid rgba(255,255,255,0.05)',
                        borderRadius: '12px',
                        fontSize: '10px',
                        fontFamily: 'monospace'
                    }}
                />
                <Bar dataKey="rentals" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={12} />
                <Bar dataKey="sales" fill="#10B981" radius={[4, 4, 0, 0]} barSize={12} />
            </BarChart>
        </ResponsiveContainer>
    );
}

export function InventoryForecastChart() {
    return (
        <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={[
                { time: 'T-12h', val: 82 },
                { time: 'T-8h', val: 75 },
                { time: 'T-4h', val: 68 },
                { time: 'NOW', val: 62 },
                { time: 'T+4h', val: 55 },
                { time: 'T+8h', val: 48 },
                { time: 'T+12h', val: 42 },
            ]} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                    <linearGradient id="colorUsage" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                <XAxis dataKey="time" stroke="#4b5563" fontSize={8} axisLine={false} tickLine={false} />
                <YAxis stroke="#4b5563" fontSize={8} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
                <Tooltip
                    contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', fontSize: '10px' }}
                />
                <Area type="monotone" dataKey="val" stroke="#3B82F6" strokeWidth={2} fillOpacity={1} fill="url(#colorUsage)" />
            </AreaChart>
        </ResponsiveContainer>
    );
}

export function HealthPieChart({ fleetAnalytics, fleetHealth }: { fleetAnalytics: any, fleetHealth: number }) {
    return (
        <div className="h-[200px] w-full flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={fleetAnalytics?.healthDistribution || []}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                    >
                        {fleetAnalytics?.healthDistribution?.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                    </Pie>
                    <Tooltip
                        contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1rem', fontSize: '10px' }}
                    />
                </PieChart>
            </ResponsiveContainer>
            <div className="absolute flex flex-col items-center justify-center">
                <span className="text-2xl font-black text-white">{fleetHealth}%</span>
                <span className="text-[8px] text-gray-500 uppercase font-black">Avg Sync</span>
            </div>
        </div>
    );
}
