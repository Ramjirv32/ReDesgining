'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import OrganizerHeader from '@/components/organizer/OrganizerHeader';
import { getOrganizerSession } from '@/lib/auth/organizer';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { ArrowLeft, TrendingUp, IndianRupee, Users, Activity } from 'lucide-react';

interface AnalyticsData {
    total_collected_amount: number;
    total_refunded_amount: number;
    total_net_revenue: number;
    total_bookings: number;
    chart_data: Array<{
        date: string;
        collected: number;
        refunded: number;
    }>;
}

function AnalyticsContent() {
    const router = useRouter();
    const [hasMounted, setHasMounted] = useState(false);
    const [session, setSession] = useState<ReturnType<typeof getOrganizerSession>>(null);
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        setHasMounted(true);
        const s = getOrganizerSession();
        if (!s) {
            router.replace('/organizer/login');
            return;
        }
        setSession(s);
    }, [router]);

    useEffect(() => {
        if (!session) return;
        
        const fetchAnalytics = async () => {
            setLoading(true);
            try {
                const res = await fetch(`/backend/api/organizer/analytics?filter=${filter}`, {
                    headers: {
                        'Authorization': `Bearer ${session.id}`
                    }
                });
                if (res.ok) {
                    const result = await res.json();
                    
                    // Sort chart data by date
                    if (result.chart_data && result.chart_data.length > 0) {
                        result.chart_data.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
                    }
                    setData(result);
                }
            } catch (err) {
                console.error("Failed to fetch analytics:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchAnalytics();
    }, [session, filter]);

    if (!hasMounted) {
        return <div className="min-h-screen bg-zinc-50 animate-pulse" />;
    }

    return (
        <div className="flex flex-col min-h-screen font-[family-name:var(--font-anek-latin)] bg-[#F8F9FA]">
            <OrganizerHeader />

            <main className="flex-1 px-8 md:px-14 lg:px-20 py-16">
                <div className="max-w-[1228px] mx-auto w-full space-y-12">
                    {/* Header Section */}
                    <div className="flex items-center justify-between">
                        <div>
                            <button
                                onClick={() => router.push('/organizer/dashboard?category=play')}
                                className="flex items-center gap-2 text-[#686868] hover:text-black transition-colors group mb-6 flex-shrink-0"
                            >
                                <div className="w-10 h-10 rounded-full bg-white border border-[#AEAEAE] flex items-center justify-center group-hover:bg-black group-hover:text-white group-hover:border-black transition-all">
                                    <ArrowLeft size={20} />
                                </div>
                                <span className="text-[18px] font-medium">Back</span>
                            </button>
                            <h1 className="text-[40px] font-bold text-black leading-tight">
                                Performance Analytics
                            </h1>
                            <p className="text-[20px] font-medium text-[#686868] mt-2">
                                Track your revenue, bookings, and refunds
                            </p>
                        </div>
                        
                        <div className="bg-white border border-[#E9E9E9] rounded-xl p-1 flex">
                            {['all', 'month', 'week'].map((f) => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    className={`px-6 py-2.5 rounded-lg text-sm font-semibold capitalize transition-all ${
                                        filter === f ? 'bg-black text-white shadow-md' : 'text-[#686868] hover:bg-zinc-50'
                                    }`}
                                >
                                    {f === 'all' ? 'All Time' : `Last ${f}`}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="w-full h-[1px] bg-[#AEAEAE] opacity-50" />

                    {loading ? (
                        <div className="animate-pulse space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-zinc-200 rounded-3xl" />)}
                            </div>
                            <div className="h-[400px] bg-zinc-200 rounded-3xl" />
                        </div>
                    ) : (
                        <>
                            {/* KPI Metrics */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <MetricCard 
                                    title="Net Revenue" 
                                    value={`₹${data?.total_net_revenue?.toLocaleString('en-IN') || 0}`} 
                                    icon={<TrendingUp size={24} className="text-green-600" />}
                                    bgColor="bg-green-50"
                                />
                                <MetricCard 
                                    title="Total Collected" 
                                    value={`₹${data?.total_collected_amount?.toLocaleString('en-IN') || 0}`} 
                                    icon={<IndianRupee size={24} className="text-blue-600" />}
                                    bgColor="bg-blue-50"
                                />
                                <MetricCard 
                                    title="Total Refunded" 
                                    value={`₹${data?.total_refunded_amount?.toLocaleString('en-IN') || 0}`} 
                                    icon={<Activity size={24} className="text-red-600" />}
                                    bgColor="bg-red-50"
                                    isNegative
                                />
                                <MetricCard 
                                    title="Total Bookings" 
                                    value={`${data?.total_bookings || 0}`} 
                                    icon={<Users size={24} className="text-purple-600" />}
                                    bgColor="bg-purple-50"
                                />
                            </div>

                            {/* Revenue Chart */}
                            <div className="bg-white p-8 border border-zinc-200 rounded-[32px] shadow-sm">
                                <h3 className="text-xl font-bold text-black mb-6">Revenue & Refunds Timeline</h3>
                                
                                {data?.chart_data?.length ? (
                                    <div className="h-[400px] w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart
                                                data={data.chart_data}
                                                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                                            >
                                                <defs>
                                                    <linearGradient id="colorCollected" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/>
                                                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                                                    </linearGradient>
                                                    <linearGradient id="colorRefunded" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#dc2626" stopOpacity={0.3}/>
                                                        <stop offset="95%" stopColor="#dc2626" stopOpacity={0}/>
                                                    </linearGradient>
                                                </defs>
                                                <XAxis 
                                                    dataKey="date" 
                                                    tickFormatter={(str) => {
                                                        const date = new Date(str);
                                                        return `${date.getDate()} ${date.toLocaleString('default', { month: 'short' })}`;
                                                    }}
                                                    tickLine={false}
                                                    axisLine={false}
                                                    tick={{ fill: '#686868', fontSize: 13 }}
                                                    dy={10}
                                                />
                                                <YAxis 
                                                    tickFormatter={(val) => `₹${val}`}
                                                    tickLine={false}
                                                    axisLine={false}
                                                    tick={{ fill: '#686868', fontSize: 13 }}
                                                    dx={-10}
                                                />
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E9E9E9" />
                                                <RechartsTooltip 
                                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
                                                    formatter={(value: any, name: any) => [`₹${Number(value).toLocaleString('en-IN')}`, String(name).charAt(0).toUpperCase() + String(name).slice(1)]}
                                                    labelFormatter={(label: any) => new Date(label).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric'})}
                                                />
                                                <Area type="monotone" dataKey="collected" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorCollected)" />
                                                <Area type="monotone" dataKey="refunded" stroke="#dc2626" strokeWidth={3} fillOpacity={1} fill="url(#colorRefunded)" />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                ) : (
                                    <div className="h-[400px] w-full flex flex-col items-center justify-center border-2 border-dashed border-zinc-200 rounded-[24px]">
                                        <TrendingUp size={48} className="text-zinc-300 mb-4" />
                                        <p className="text-zinc-500 font-medium">No sales data available for this period.</p>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </main>
        </div>
    );
}

function MetricCard({ title, value, icon, bgColor, isNegative }: { title: string, value: string, icon: React.ReactNode, bgColor: string, isNegative?: boolean }) {
    return (
        <div className="bg-white p-6 border border-zinc-200 rounded-[24px] shadow-sm flex flex-col gap-4 transition-transform hover:-translate-y-1">
            <div className="flex items-center justify-between">
                <div className={`w-12 h-12 rounded-2xl ${bgColor} flex items-center justify-center`}>
                    {icon}
                </div>
            </div>
            <div>
                <p className="text-[14px] font-semibold text-[#686868] uppercase tracking-wider mb-1">{title}</p>
                <h3 className={`text-[32px] font-bold leading-none ${isNegative ? 'text-red-600' : 'text-black'}`}>
                    {value}
                </h3>
            </div>
        </div>
    );
}

export default function AnalyticsPage() {
    return (
        <Suspense fallback={<div className="min-h-screen animate-pulse bg-zinc-50" />}>
            <AnalyticsContent />
        </Suspense>
    );
}
