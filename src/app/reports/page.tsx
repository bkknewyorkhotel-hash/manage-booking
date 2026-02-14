'use client'

import React, { useEffect, useState } from 'react'
import { Shell } from '@/components/Shell'
import { useTranslation } from '@/lib/LanguageContext'
import { cn, formatCurrency } from '@/lib/utils'
import { TrendingUp, Wallet, PieChart, Download, Clock, Settings as ToolIcon } from 'lucide-react'

export default function ReportsPage() {
    const { t } = useTranslation()
    const [revenue, setRevenue] = useState<any[]>([])
    const [occupancy, setOccupancy] = useState<any>(null)
    const [monthlyStats, setMonthlyStats] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [generating, setGenerating] = useState(false)
    const [currentUser, setCurrentUser] = useState<any>(null)

    // Shift History State
    const [shiftHistory, setShiftHistory] = useState<any[]>([])
    const [shiftPage, setShiftPage] = useState(1)
    const [hasMoreShifts, setHasMoreShifts] = useState(true)
    const [loadingMore, setLoadingMore] = useState(false)

    const fetchShifts = async (page: number) => {
        try {
            const res = await fetch(`/api/reports/shifts?page=${page}&limit=7`)
            const data = await res.json()
            if (data.length < 7) setHasMoreShifts(false)
            if (page === 1) {
                setShiftHistory(data)
            } else {
                setShiftHistory(prev => [...prev, ...data])
            }
        } catch (err) {
            console.error(err)
        }
    }

    const fetchData = async () => {
        try {
            const [resMe, resRev, resOcc, resMonth] = await Promise.all([
                fetch('/api/auth/me'),
                fetch('/api/reports?type=revenue'),
                fetch('/api/reports?type=occupancy'),
                fetch('/api/reports/summary')
            ])
            const me = await resMe.json()
            setCurrentUser(me)

            setRevenue(await resRev.json())
            setOccupancy(await resOcc.json())
            setMonthlyStats(await resMonth.json())
            setLoading(false)
            fetchShifts(1)
        } catch (err) {
            console.error(err)
        }
    }

    const handleLoadMoreShifts = async () => {
        setLoadingMore(true)
        const nextPage = shiftPage + 1
        await fetchShifts(nextPage)
        setShiftPage(nextPage)
        setLoadingMore(false)
    }

    useEffect(() => {
        fetchData()
    }, [])

    const handleGenerateDemo = async () => {
        if (!confirm('This will generate random historical data. Continue?')) return
        setGenerating(true)
        try {
            await fetch('/api/reports/demo', { method: 'POST' })
            fetchData()
            window.location.reload()
        } catch (err) {
            alert('Failed to generate data')
        } finally {
            setGenerating(false)
        }
    }

    return (
        <Shell>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold text-primary uppercase tracking-tight">Reports & Analytics</h2>
                </div>

                {/* Monthly Summary */}
                {monthlyStats && currentUser?.role === 'ADMIN' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="p-6 bg-card border rounded-3xl shadow-soft">
                            <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest mb-2 opacity-70">Monthly Revenue</p>
                            <p className="text-3xl font-bold text-primary tracking-tight">{formatCurrency(monthlyStats.revenue.total)}</p>
                            <div className="mt-4 space-y-2 text-sm">
                                <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground font-semibold">Rooms</span>
                                    <span className="font-bold">{formatCurrency(monthlyStats.revenue.room)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground font-semibold">POS</span>
                                    <span className="font-bold">{formatCurrency(monthlyStats.revenue.pos)}</span>
                                </div>
                            </div>
                        </div>
                        <div className="p-6 bg-card border rounded-3xl shadow-soft">
                            <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest mb-4 opacity-70">Booking Sources</p>
                            <div className="space-y-3">
                                {monthlyStats.sources.map((s: any, i: number) => (
                                    <div key={i} className="flex justify-between items-center">
                                        <span className="font-semibold text-sm">{s.name}</span>
                                        <span className="px-2 py-0.5 bg-secondary text-secondary-foreground rounded text-[10px] font-bold">{s.count}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="p-6 bg-card border rounded-3xl shadow-soft">
                            <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest mb-4 opacity-70">Top Selling Products</p>
                            <div className="space-y-3">
                                {monthlyStats.topProducts.map((p: any, i: number) => (
                                    <div key={i} className="flex justify-between items-center text-sm">
                                        <span className="truncate max-w-[150px] font-semibold">{p.name}</span>
                                        <div className="text-right">
                                            <p className="font-bold text-base tracking-tight">{formatCurrency(p.total)}</p>
                                            <p className="text-[9px] font-bold text-muted-foreground uppercase">{p.qty} sold</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className={cn(
                        "p-6 bg-card border rounded-3xl shadow-soft",
                        currentUser?.role === 'RECEPTION' ? "lg:col-span-2" : ""
                    )}>
                        <div className="flex items-center space-x-3 mb-6">
                            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl"><ToolIcon size={20} /></div>
                            <h3 className="text-xl font-bold">Shift History</h3>
                        </div>

                        <div className="space-y-8 max-h-[700px] overflow-y-auto pr-2 custom-scrollbar">
                            {shiftHistory.map((shift: any) => (
                                <div key={shift.id} className="space-y-4 pb-8 border-b border-dashed last:border-0 last:pb-0">
                                    <div className="flex items-center justify-between text-[11px] font-bold tracking-wider text-muted-foreground uppercase opacity-80">
                                        <span className="truncate">Shift ID: {shift.id.substring(0, 12)}...</span>
                                        <span className="ml-4 whitespace-nowrap">Date: {new Date(shift.endTime).toLocaleDateString('th-TH')}</span>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {shift.breakdown.map((item: any, idx: number) => (
                                            <div key={idx} className="p-4 bg-secondary/10 border border-transparent rounded-2xl flex items-center justify-between group hover:bg-card hover:border-border transition-all">
                                                <div>
                                                    <div className="flex items-center space-x-2 mb-1">
                                                        <span className={cn(
                                                            "px-2 py-0.5 rounded text-[9px] font-bold uppercase",
                                                            item.source === 'ROOM' ? "bg-orange-100 text-orange-600" : "bg-blue-100 text-blue-600"
                                                        )}>
                                                            {item.source}
                                                        </span>
                                                        <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{item.method}</span>
                                                    </div>
                                                    <p className="text-xl font-bold tracking-tight">{formatCurrency(item.amount)}</p>
                                                </div>
                                                <div className={cn(
                                                    "w-10 h-10 rounded-full flex items-center justify-center opacity-60",
                                                    item.source === 'ROOM' ? "bg-emerald-50 text-emerald-400" : "bg-blue-50 text-blue-400"
                                                )}>
                                                    <TrendingUp size={18} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="flex justify-between items-center px-1">
                                        <span className="text-sm font-bold uppercase tracking-widest text-muted-foreground opacity-70">Shift Total</span>
                                        <span className="text-2xl font-bold text-primary tracking-tight">{formatCurrency(shift.totalRevenue)}</span>
                                    </div>
                                </div>
                            ))}

                            {hasMoreShifts && (
                                <div className="pt-4 text-center">
                                    <button
                                        onClick={handleLoadMoreShifts}
                                        disabled={loadingMore}
                                        className="w-full py-4 border-2 border-dashed rounded-2xl font-bold text-muted-foreground text-sm hover:bg-secondary/50 transition-all disabled:opacity-50"
                                    >
                                        {loadingMore ? 'Loading...' : 'Load History'}
                                    </button>
                                </div>
                            )}

                            {shiftHistory.length === 0 && (
                                <div className="py-16 text-center">
                                    <Clock className="w-12 h-12 mx-auto text-muted-foreground/20 mb-4" />
                                    <p className="text-muted-foreground text-sm font-bold uppercase tracking-widest">No shift history found</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Occupancy & Housekeeping */}
                    {currentUser?.role === 'ADMIN' && (
                        <div className="p-6 bg-card border rounded-3xl shadow-soft space-y-8">
                            <div>
                                <div className="flex items-center space-x-3 mb-6">
                                    <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl"><PieChart size={20} /></div>
                                    <h3 className="text-xl font-bold">Occupancy Metrics</h3>
                                </div>

                                <div className="space-y-6 py-1">
                                    <MetricProgress label="Stay Occupancy" value={occupancy?.rate || 0} color="bg-primary" />
                                    <MetricProgress label="Reserved Load" value={(occupancy?.reserved / (occupancy?.total || 1)) * 100 || 0} color="bg-purple-500" />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 border-t border-dashed pt-6 mt-6">
                                    <div className="text-center p-3 bg-secondary/10 rounded-xl sm:bg-transparent sm:p-0">
                                        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">Total</p>
                                        <p className="text-lg md:text-xl font-bold mt-0.5">{occupancy?.total || 0}</p>
                                    </div>
                                    <div className="text-center p-3 bg-secondary/10 rounded-xl sm:bg-transparent sm:p-0 sm:border-x sm:border-dashed">
                                        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">Occupied</p>
                                        <p className="text-lg md:text-xl font-bold mt-0.5">{occupancy?.occupied || 0}</p>
                                    </div>
                                    <div className="text-center p-3 bg-secondary/10 rounded-xl sm:bg-transparent sm:p-0">
                                        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">Reserved</p>
                                        <p className="text-lg md:text-xl font-bold mt-0.5">{occupancy?.reserved || 0}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-dashed">
                                <div className="flex items-center space-x-3 mb-6">
                                    <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl"><TrendingUp size={20} /></div>
                                    <h3 className="text-xl font-bold">Housekeeping</h3>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <StatusSmallStat label="Dirty" count={occupancy?.dirty || 0} color="text-amber-600 bg-amber-50" />
                                    <StatusSmallStat label="Cleaning" count={occupancy?.cleaning || 0} color="text-blue-600 bg-blue-50" />
                                    <StatusSmallStat label="Inspecting" count={occupancy?.inspecting || 0} color="text-cyan-600 bg-cyan-50" />
                                    <StatusSmallStat label="Clean" count={occupancy?.clean || 0} color="text-emerald-600 bg-emerald-50" />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {currentUser?.role === 'ADMIN' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <ArrivalsReport />
                        <DeparturesReport />
                    </div>
                )}

                {currentUser?.role === 'ADMIN' && (
                    <div className="w-full">
                        <RoomStatusReport />
                    </div>
                )}
            </div>
        </Shell>
    )
}

function StatusSmallStat({ label, count, color }: any) {
    return (
        <div className={cn("p-3 rounded-xl border flex justify-between items-center", color)}>
            <span className="text-xs font-bold uppercase tracking-tight opacity-70">{label}</span>
            <span className="text-xl font-black">{count}</span>
        </div>
    )
}

function MetricProgress({ label, value, color }: any) {
    return (
        <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold uppercase tracking-tight">
                <span>{label}</span>
                <span>{Math.round(value)}%</span>
            </div>
            <div className="h-3 w-full bg-secondary rounded-full overflow-hidden border">
                <div
                    className={cn("h-full transition-all duration-1000", color)}
                    style={{ width: `${value}%` }}
                />
            </div>
        </div>
    )
}

function ArrivalsReport() {
    const [data, setData] = useState<any[]>([])

    useEffect(() => {
        fetch('/api/reports?type=arrivals').then(res => res.json()).then(setData)
    }, [])

    return (
        <div className="p-6 bg-card border rounded-3xl shadow-soft h-full">
            <div className="flex items-center space-x-3 mb-6">
                <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl font-bold text-xs">IN</div>
                <h3 className="text-xl font-bold">Expected Arrivals</h3>
            </div>

            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {data.map((b: any) => (
                    <div key={b.id} className="flex justify-between items-center p-4 bg-secondary/10 hover:bg-card border border-transparent hover:border-border rounded-2xl transition-all group cursor-pointer">
                        <div>
                            <p className="font-bold text-base">{b.PrimaryGuest.name}</p>
                            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mt-0.5">{b.bookingNo}</p>
                        </div>
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded text-[9px] font-bold uppercase tracking-wider border border-emerald-100 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                            {b.Rooms.length} Room(s)
                        </span>
                    </div>
                ))}
                {data.length === 0 && <p className="text-center text-xs font-bold text-muted-foreground py-10 opacity-50 uppercase tracking-widest">No arrivals expected</p>}
            </div>
        </div>
    )
}

function DeparturesReport() {
    const [data, setData] = useState<any[]>([])

    useEffect(() => {
        fetch('/api/reports?type=departures').then(res => res.json()).then(setData)
    }, [])

    return (
        <div className="p-6 bg-card border rounded-3xl shadow-soft h-full">
            <div className="flex items-center space-x-3 mb-6">
                <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl font-bold text-xs">OUT</div>
                <h3 className="text-xl font-bold">Expected Departures</h3>
            </div>

            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {data.map((b: any) => (
                    <div key={b.id} className="flex justify-between items-center p-4 bg-secondary/10 hover:bg-card border border-transparent hover:border-border rounded-2xl transition-all group cursor-pointer">
                        <div>
                            <p className="font-bold text-base">{b.PrimaryGuest.name}</p>
                            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mt-0.5">{b.bookingNo}</p>
                        </div>
                        <span className="px-2 py-0.5 bg-rose-50 text-rose-600 rounded text-[9px] font-bold uppercase tracking-wider border border-rose-100 group-hover:bg-rose-500 group-hover:text-white transition-colors">
                            Room: {b.Rooms.map((r: any) => r.Room?.roomNo).join(', ')}
                        </span>
                    </div>
                ))}
                {data.length === 0 && <p className="text-center text-xs font-bold text-muted-foreground py-10 opacity-50 uppercase tracking-widest">No departures expected</p>}
            </div>
        </div>
    )
}

function RoomStatusReport() {
    const [data, setData] = useState<any[]>([])

    useEffect(() => {
        fetch('/api/reports?type=room_status').then(res => res.json()).then(setData)
    }, [])

    return (
        <div className="p-6 bg-card border rounded-3xl shadow-soft">
            <div className="flex items-center space-x-3 mb-6">
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl font-bold text-xs">ST</div>
                <h3 className="text-xl font-bold">Room Status Detail</h3>
            </div>

            <div className="overflow-x-auto scrollbar-hide">
                <table className="w-full text-left text-sm min-w-[500px]">
                    <thead>
                        <tr className="border-b text-muted-foreground text-[10px] font-bold uppercase tracking-widest opacity-60">
                            <th className="py-4 px-4 font-bold">Room</th>
                            <th className="py-4 px-4 font-bold">Type</th>
                            <th className="py-4 px-4 font-bold">Status</th>
                            <th className="py-4 px-4 font-bold">Current Guest</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-dashed">
                        {data.map((room: any) => {
                            const currentBooking = room.BookingRooms[0]?.Booking
                            return (
                                <tr key={room.id} className="hover:bg-secondary/10 transition-all group">
                                    <td className="py-4 px-4 font-bold text-base tracking-tight">{room.roomNo}</td>
                                    <td className="py-4 px-4 font-semibold text-muted-foreground text-xs">{room.RoomType.name}</td>
                                    <td className="py-4 px-4">
                                        <span className={cn(
                                            "px-2 py-0.5 rounded text-[10px] font-bold uppercase border",
                                            room.status === 'VACANT_CLEAN' && "bg-emerald-50 text-emerald-700 border-emerald-100",
                                            room.status === 'VACANT_DIRTY' && "bg-amber-50 text-amber-700 border-amber-100",
                                            room.status === 'OCCUPIED' && "bg-blue-50 text-blue-700 border-blue-100",
                                            room.status === 'OUT_OF_ORDER' && "bg-rose-50 text-rose-700 border-rose-100",
                                        )}>
                                            {room.status.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="py-4 px-4 font-bold">
                                        {currentBooking ? currentBooking.PrimaryGuest.name : '-'}
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
