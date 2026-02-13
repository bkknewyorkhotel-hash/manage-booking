'use client'

import React, { useEffect, useState } from 'react'
import { Shell } from '@/components/Shell'
import { useTranslation } from '@/lib/LanguageContext'
import {
    Users,
    DoorOpen,
    Settings as ToolIcon,
    AlertCircle,
    TrendingUp,
    CheckCircle2,
    Clock,
    Ban
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface StatCardProps {
    title: string
    value: string | number
    icon: any
    color: string
    description?: string // Added description
}

function StatCard({ title, value, icon: Icon, color, description }: StatCardProps) {
    return (
        <div className="p-6 bg-card border rounded-3xl shadow-soft hover:shadow-lg transition-all duration-300 group">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-2 opacity-60">{title}</p>
                    <h3 className="text-3xl font-bold tracking-tight text-foreground">{value}</h3>
                    {description && <p className="text-[10px] font-semibold text-primary mt-2 bg-primary/5 px-1.5 py-0.5 rounded inline-block uppercase">{description}</p>}
                </div>
                <div className={cn("p-4 rounded-xl shadow-md transition-all group-hover:scale-105", color)}>
                    <Icon size={24} />
                </div>
            </div>
        </div>
    )
}

function cn(...classes: string[]) {
    return classes.filter(Boolean).join(' ')
}

export default function DashboardPage() {
    const { t } = useTranslation()
    const [data, setData] = useState<any>(null)
    const [shiftHistory, setShiftHistory] = useState<any[]>([])
    const [shiftPage, setShiftPage] = useState(1)
    const [hasMoreShifts, setHasMoreShifts] = useState(true)
    const [loading, setLoading] = useState(true)
    const [loadingMore, setLoadingMore] = useState(false)

    const fetchShifts = async (page: number) => {
        try {
            const res = await fetch(`/api/reports/shifts?page=${page}&limit=7`)
            const shifts = await res.json()
            if (shifts.length < 7) setHasMoreShifts(false)
            if (page === 1) {
                setShiftHistory(shifts)
            } else {
                setShiftHistory(prev => [...prev, ...shifts])
            }
        } catch (err) {
            console.error(err)
        }
    }

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const res = await fetch('/api/dashboard/stats')
                const dashboardData = await res.json()
                setData(dashboardData)
                setLoading(false)
                fetchShifts(1)
            } catch (err) {
                console.error(err)
                setLoading(false)
            }
        }
        fetchDashboardData()
    }, [])

    const handleLoadMoreShifts = async () => {
        setLoadingMore(true)
        const nextPage = shiftPage + 1
        await fetchShifts(nextPage)
        setShiftPage(nextPage)
        setLoadingMore(false)
    }

    if (loading) return <Shell><div className="p-8">Loading dashboard...</div></Shell>

    const stats = data?.occupancy
    const arrivals = data?.arrivals || []
    const departures = data?.departures || []
    const roomStats = data?.occupancy?.details || {}

    const alerts = []

    if (arrivals.length > 0) {
        alerts.push({
            type: 'info',
            title: 'Expected Arrivals',
            message: `${arrivals.length} guests are expected to check in today.`
        })
    }

    if (roomStats.dirty > 0) {
        alerts.push({
            type: 'warning',
            title: 'Housekeeping Needed',
            message: `${roomStats.dirty} rooms are currently dirty and need cleaning.`
        })
    }

    if (roomStats.outOfOrder > 0) {
        alerts.push({
            type: 'error',
            title: 'Maintenance',
            message: `${roomStats.outOfOrder} rooms are out of order.`
        })
    }

    if (alerts.length === 0) {
        alerts.push({
            type: 'success',
            title: 'All Good',
            message: 'System is running smoothly. No immediate actions required.'
        })
    }


    return (
        <Shell>
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="space-y-10">
                    <header>
                        <h2 className="text-3xl font-black text-primary uppercase tracking-tight">Hotel Overview</h2>
                        <p className="text-muted-foreground font-bold">Real-time status and operations summary</p>
                    </header>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        <StatCard
                            title="Today's Occupancy"
                            value={`${stats?.rate || 0}%`}
                            icon={Users}
                            color="bg-indigo-50 text-indigo-600"
                            description={`${stats?.occupied || 0} / ${stats?.total || 0} Rooms occupied (${roomStats.dirty || 0} dirty)`}
                        />
                        <StatCard
                            title="Arrivals"
                            value={arrivals.length}
                            icon={DoorOpen}
                            color="bg-emerald-50 text-emerald-600"
                            description={`${arrivals.length} expected today`}
                        />
                        <StatCard
                            title="Departures"
                            value={departures.length}
                            icon={Clock}
                            color="bg-amber-50 text-amber-600"
                            description={`${departures.length} expected today`}
                        />
                        <StatCard
                            title="Maintenance"
                            value={roomStats.outOfOrder || 0}
                            icon={Ban}
                            color="bg-rose-50 text-rose-600"
                            description="Rooms currently OOO"
                        />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Arrivals/Departures Grid */}
                        <div className="lg:col-span-2 space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Expected Arrivals */}
                                <div className="p-8 bg-card border rounded-[2.5rem] shadow-sm">
                                    <div className="flex items-center space-x-3 mb-8">
                                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl"><CheckCircle2 size={24} /></div>
                                        <h3 className="text-2xl font-black">Arrivals</h3>
                                    </div>
                                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar text-sm">
                                        {arrivals.map((b: any) => (
                                            <div key={b.id} className="p-4 bg-secondary/10 border border-transparent hover:border-primary/20 rounded-2xl transition-all hover:bg-card hover:shadow-soft group cursor-pointer">
                                                <div className="flex justify-between items-center">
                                                    <div>
                                                        <p className="font-bold text-base text-foreground">{b.PrimaryGuest.name}</p>
                                                        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mt-0.5">{b.bookingNo}</p>
                                                    </div>
                                                    <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-bold uppercase tracking-wider border border-emerald-100 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                                                        {b.Rooms.length} Room(s)
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                        {arrivals.length === 0 && (
                                            <div className="py-12 text-center">
                                                <CheckCircle2 className="w-10 h-10 mx-auto text-muted-foreground/20 mb-3" />
                                                <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest">No arrivals today</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Expected Departures */}
                                <div className="p-8 bg-card border rounded-[2.5rem] shadow-sm">
                                    <div className="flex items-center space-x-3 mb-8">
                                        <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl"><Clock size={24} /></div>
                                        <h3 className="text-2xl font-black">Departures</h3>
                                    </div>
                                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar text-sm">
                                        {departures.map((b: any) => (
                                            <div key={b.id} className="p-4 bg-secondary/10 border border-transparent hover:border-primary/20 rounded-2xl transition-all hover:bg-card hover:shadow-soft group cursor-pointer">
                                                <div className="flex justify-between items-center">
                                                    <div>
                                                        <p className="font-bold text-base text-foreground">{b.PrimaryGuest.name}</p>
                                                        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mt-0.5">{b.bookingNo}</p>
                                                    </div>
                                                    <span className="px-3 py-1 bg-amber-50 text-amber-600 rounded-lg text-[10px] font-bold uppercase tracking-wider border border-amber-100 group-hover:bg-amber-500 group-hover:text-white transition-colors">
                                                        Rooms: {b.Rooms.map((r: any) => r.Room?.roomNo).filter(Boolean).join(', ') || 'N/A'}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                        {departures.length === 0 && (
                                            <div className="py-12 text-center">
                                                <Clock className="w-10 h-10 mx-auto text-muted-foreground/20 mb-3" />
                                                <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest">No departures today</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Quick Actions (Keep as is or polish) */}
                            <div className="p-8 bg-indigo-600 text-white rounded-[2.5rem] shadow-indigo-200 shadow-xl overflow-hidden relative">
                                <div className="relative z-10 flex items-center justify-between">
                                    <div>
                                        <h3 className="text-3xl font-black tracking-tight mb-2">Need Help?</h3>
                                        <p className="text-indigo-100 font-bold max-w-[400px]">System is running normally. If you encounter any issues, please check the logs in Settings.</p>
                                    </div>
                                    <ToolIcon size={80} className="text-indigo-400 opacity-30 -rotate-12 absolute -right-4 top-0" />
                                </div>
                            </div>
                        </div>

                        {/* Shift History */}
                        <div className="lg:col-span-1 p-6 bg-card border rounded-[2.5rem] shadow-sm">
                            <div className="flex items-center space-x-3 mb-8">
                                <div className="p-3 bg-[#EEF2FF] text-[#6366F1] rounded-2xl"><ToolIcon size={24} /></div>
                                <h3 className="text-2xl font-black">Shift History</h3>
                            </div>
                            <div className="space-y-12 max-h-[700px] overflow-y-auto pr-2 custom-scrollbar">
                                {shiftHistory.map((shift: any) => (
                                    <div key={shift.id} className="space-y-6 pb-12 border-b border-dashed border-gray-200 last:border-0 last:pb-0">
                                        <div className="flex items-center justify-between text-sm font-black tracking-tight">
                                            <span className="truncate">Shift ID:{shift.id}</span>
                                            <span className="ml-4 whitespace-nowrap">Date: {new Date(shift.endTime).toLocaleDateString('th-TH')}</span>
                                        </div>

                                        <div className="space-y-4">
                                            {shift.breakdown.map((item: any, idx: number) => (
                                                <div key={idx} className="p-6 bg-card border rounded-[2rem] flex items-center justify-between hover:border-gray-300 transition-all cursor-default">
                                                    <div>
                                                        <div className="flex items-center space-x-2 mb-2">
                                                            <span className={cn(
                                                                "px-3 py-1 rounded-lg text-[10px] font-black uppercase",
                                                                item.source === 'ROOM' ? "bg-orange-100 text-orange-600" : "bg-blue-100 text-blue-600"
                                                            )}>
                                                                {item.source}
                                                            </span>
                                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{item.method}</span>
                                                        </div>
                                                        <p className="text-3xl font-black tracking-tighter">{formatCurrency(item.amount)}</p>
                                                    </div>
                                                    <div className={cn(
                                                        "w-12 h-12 rounded-full flex items-center justify-center",
                                                        item.source === 'ROOM' ? "bg-emerald-50 text-emerald-400" : "bg-blue-50 text-blue-400"
                                                    )}>
                                                        <TrendingUp size={24} />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="flex justify-between items-center px-2">
                                            <span className="text-xl font-black uppercase tracking-tight text-gray-900">Total Revenue</span>
                                            <span className="text-4xl font-black text-[#6366F1] tracking-tighter">{formatCurrency(shift.totalRevenue)}</span>
                                        </div>
                                    </div>
                                ))}

                                {hasMoreShifts && (
                                    <div className="pt-8 text-center">
                                        <button
                                            onClick={handleLoadMoreShifts}
                                            disabled={loadingMore}
                                            className="w-full py-6 border-4 border-dashed rounded-[2rem] font-black text-gray-900 text-lg hover:bg-gray-50 transition-all disabled:opacity-50"
                                        >
                                            {loadingMore ? 'Loading...' : 'Next: old data'}
                                        </button>
                                    </div>
                                )}

                                {shiftHistory.length === 0 && (
                                    <div className="py-24 text-center">
                                        <Clock className="w-20 h-20 mx-auto text-gray-200 mb-6" />
                                        <p className="text-gray-400 text-xl font-black">No shift history found.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Alerts */}
                    <div className="lg:col-span-1 p-6 bg-card border rounded-xl shadow-sm h-fit">
                        <h3 className="text-lg font-bold mb-4">Notifications</h3>
                        <div className="space-y-4">
                            {alerts.map((alert, idx) => (
                                <AlertItem
                                    key={idx}
                                    type={alert.type}
                                    title={alert.title}
                                    message={alert.message}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </Shell>
    )
}

function RoomStatusTile({ label, count, color, icon: Icon }: any) {
    return (
        <div className={cn("p-4 border-l-4 rounded-lg bg-secondary/20", color)}>
            <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider mb-1">
                <Icon size={14} />
                <span>{label}</span>
            </div>
            <p className="text-2xl font-bold">{count}</p>
        </div>
    )
}

function AlertItem({ type, title, message }: any) {
    const colors = {
        warning: "bg-amber-500/10 text-amber-600 border-amber-200",
        error: "bg-red-500/10 text-red-600 border-red-200",
        info: "bg-blue-500/10 text-blue-600 border-blue-200",
        success: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
    }
    return (
        <div className={cn("p-3 border rounded-lg", (colors as any)[type])}>
            <p className="text-sm font-bold">{title}</p>
            <p className="text-xs mt-1 leading-relaxed opacity-90">{message}</p>
        </div>
    )
}
