'use client'

import React, { useEffect, useState } from 'react'
import { Shell } from '@/components/Shell'
import { useTranslation } from '@/lib/LanguageContext'
import { cn, formatCurrency } from '@/lib/utils'
import { TrendingUp, Wallet, PieChart, Download } from 'lucide-react'

export default function ReportsPage() {
    const { t } = useTranslation()
    const [revenue, setRevenue] = useState<any[]>([])
    const [occupancy, setOccupancy] = useState<any>(null)
    const [monthlyStats, setMonthlyStats] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [generating, setGenerating] = useState(false)

    const fetchData = async () => {
        try {
            const [resRev, resOcc, resMonth] = await Promise.all([
                fetch('/api/reports?type=revenue'),
                fetch('/api/reports?type=occupancy'),
                fetch('/api/reports/summary')
            ])
            setRevenue(await resRev.json())
            setOccupancy(await resOcc.json())
            setMonthlyStats(await resMonth.json())
            setLoading(false)
        } catch (err) {
            console.error(err)
        }
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
            // Also refresh other components if needed, or force reload
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
                    <h2 className="text-2xl font-black text-primary uppercase tracking-tight">Financial & Occupancy Reports</h2>
                    <div className="flex space-x-2">
                        <button
                            onClick={handleGenerateDemo}
                            disabled={generating}
                            className="flex items-center space-x-2 px-4 py-2 bg-blue-50 text-blue-600 border border-blue-200 rounded-xl font-bold hover:bg-blue-100 disabled:opacity-50"
                        >
                            {generating ? 'Generating...' : 'Generate Demo Data'}
                        </button>
                        <button className="flex items-center space-x-2 px-4 py-2 bg-secondary border border-border rounded-xl font-bold hover:bg-secondary/80">
                            <Download size={18} />
                            <span>Export CSV</span>
                        </button>
                    </div>
                </div>

                {/* Monthly Summary */}
                {monthlyStats && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="p-6 bg-card border rounded-2xl shadow-sm">
                            <p className="text-xs font-bold uppercase text-muted-foreground mb-1">Monthly Revenue</p>
                            <p className="text-3xl font-black text-primary">{formatCurrency(monthlyStats.revenue.total)}</p>
                            <div className="mt-4 space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Rooms</span>
                                    <span className="font-bold">{formatCurrency(monthlyStats.revenue.room)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">POS</span>
                                    <span className="font-bold">{formatCurrency(monthlyStats.revenue.pos)}</span>
                                </div>
                            </div>
                        </div>
                        <div className="p-6 bg-card border rounded-2xl shadow-sm">
                            <p className="text-xs font-bold uppercase text-muted-foreground mb-4">Booking Sources (This Month)</p>
                            <div className="space-y-3">
                                {monthlyStats.sources.map((s: any, i: number) => (
                                    <div key={i} className="flex justify-between items-center">
                                        <span className="font-medium">{s.name}</span>
                                        <span className="px-2 py-0.5 bg-secondary rounded text-xs font-bold">{s.count}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="p-6 bg-card border rounded-2xl shadow-sm">
                            <p className="text-xs font-bold uppercase text-muted-foreground mb-4">Top Selling Products</p>
                            <div className="space-y-3">
                                {monthlyStats.topProducts.map((p: any, i: number) => (
                                    <div key={i} className="flex justify-between items-center text-sm">
                                        <span className="truncate max-w-[150px]">{p.name}</span>
                                        <div className="text-right">
                                            <p className="font-bold">{formatCurrency(p.total)}</p>
                                            <p className="text-xs text-muted-foreground">{p.qty} sold</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Revenue Breakdown */}
                    <div className="p-6 bg-card border rounded-2xl shadow-sm">
                        <div className="flex items-center space-x-3 mb-6">
                            <div className="p-2 bg-primary/10 text-primary rounded-lg"><Wallet size={20} /></div>
                            <h3 className="text-lg font-bold">Daily Revenue</h3>
                        </div>

                        <div className="space-y-4">
                            {revenue.map((item: any, idx: number) => (
                                <div key={idx} className="flex items-center justify-between p-4 bg-secondary/20 rounded-xl border border-border/50">
                                    <div>
                                        <div className="flex items-center space-x-2">
                                            <span className={cn(
                                                "px-1.5 py-0.5 rounded text-[10px] font-bold uppercase",
                                                item.type === 'POS' ? "bg-blue-100 text-blue-700" : "bg-orange-100 text-orange-700"
                                            )}>
                                                {item.type}
                                            </span>
                                            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{item.method.replace('ROOM_', '').replace('POS_', '').replace('_', ' ')}</p>
                                        </div>
                                        <p className="text-xl font-black mt-1">{formatCurrency(item.amount)}</p>
                                    </div>
                                    <div className="h-10 w-10 bg-white dark:bg-black/20 rounded-full flex items-center justify-center border shadow-sm">
                                        <TrendingUp size={16} className={item.type === 'POS' ? "text-blue-500" : "text-emerald-500"} />
                                    </div>
                                </div>
                            ))}
                            {revenue.length === 0 && <p className="text-center py-8 text-muted-foreground">No revenue recorded today</p>}
                        </div>

                        <div className="mt-6 pt-6 border-t">
                            <div className="flex justify-between items-center">
                                <span className="font-bold">Total Revenue</span>
                                <span className="text-2xl font-black text-primary">
                                    {formatCurrency(revenue.reduce((sum, item) => sum + Number(item.amount), 0))}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Occupancy & Housekeeping */}
                    <div className="p-6 bg-card border rounded-2xl shadow-sm space-y-8">
                        <div>
                            <div className="flex items-center space-x-3 mb-6">
                                <div className="p-2 bg-purple-500/10 text-purple-600 rounded-lg"><PieChart size={20} /></div>
                                <h3 className="text-lg font-bold">Occupancy Metrics</h3>
                            </div>

                            <div className="space-y-6 py-2">
                                <MetricProgress label="Stay Occupancy" value={occupancy?.rate || 0} color="bg-primary" />
                                <MetricProgress label="Reserved Load" value={(occupancy?.reserved / (occupancy?.total || 1)) * 100 || 0} color="bg-purple-500" />
                            </div>

                            <div className="grid grid-cols-3 gap-4 border-t pt-6 mt-4">
                                <div className="text-center">
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Total Rooms</p>
                                    <p className="text-xl font-black mt-1">{occupancy?.total || 0}</p>
                                </div>
                                <div className="text-center border-x">
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Occupied</p>
                                    <p className="text-xl font-black mt-1">{occupancy?.occupied || 0}</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Reserved</p>
                                    <p className="text-xl font-black mt-1">{occupancy?.reserved || 0}</p>
                                </div>
                            </div>
                        </div>

                        <div className="pt-6 border-t">
                            <div className="flex items-center space-x-3 mb-6">
                                <div className="p-2 bg-amber-500/10 text-amber-600 rounded-lg"><TrendingUp size={20} /></div>
                                <h3 className="text-lg font-bold">Housekeeping Status</h3>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <StatusSmallStat label="Dirty" count={occupancy?.dirty || 0} color="text-amber-600 bg-amber-50" />
                                <StatusSmallStat label="Cleaning" count={occupancy?.cleaning || 0} color="text-blue-600 bg-blue-50" />
                                <StatusSmallStat label="Inspecting" count={occupancy?.inspecting || 0} color="text-cyan-600 bg-cyan-50" />
                                <StatusSmallStat label="Clean" count={occupancy?.clean || 0} color="text-emerald-600 bg-emerald-50" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <ArrivalsReport />
                    <DeparturesReport />
                </div>

                <div className="w-full">
                    <RoomStatusReport />
                </div>
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
        <div className="p-6 bg-card border rounded-2xl shadow-sm h-full">
            <div className="flex items-center space-x-3 mb-6">
                <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg"><div className="w-5 h-5 flex items-center justify-center font-bold">IN</div></div>
                <h3 className="text-lg font-bold">Expected Arrivals</h3>
            </div>

            <div className="space-y-3">
                {data.map((b: any) => (
                    <div key={b.id} className="flex justify-between items-center p-3 hover:bg-secondary/50 rounded-lg border border-transparent hover:border-border transition-all">
                        <div>
                            <p className="font-bold text-sm">{b.PrimaryGuest.name}</p>
                            <p className="text-xs text-muted-foreground">{b.bookingNo}</p>
                        </div>
                        <div className="text-right">
                            <p className="font-bold text-xs bg-emerald-100 text-emerald-800 px-2 py-1 rounded">{b.Rooms.length} Room(s)</p>
                        </div>
                    </div>
                ))}
                {data.length === 0 && <p className="text-center text-sm text-muted-foreground py-4">No arrivals expected today.</p>}
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
        <div className="p-6 bg-card border rounded-2xl shadow-sm h-full">
            <div className="flex items-center space-x-3 mb-6">
                <div className="p-2 bg-red-100 text-red-700 rounded-lg"><div className="w-5 h-5 flex items-center justify-center font-bold">OUT</div></div>
                <h3 className="text-lg font-bold">Expected Departures</h3>
            </div>

            <div className="space-y-3">
                {data.map((b: any) => (
                    <div key={b.id} className="flex justify-between items-center p-3 hover:bg-secondary/50 rounded-lg border border-transparent hover:border-border transition-all">
                        <div>
                            <p className="font-bold text-sm">{b.PrimaryGuest.name}</p>
                            <p className="text-xs text-muted-foreground">{b.bookingNo}</p>
                        </div>
                        <div className="text-right">
                            <p className="font-bold text-xs bg-red-100 text-red-800 px-2 py-1 rounded">Room {b.Rooms.map((r: any) => r.Room?.roomNo).join(', ')}</p>
                        </div>
                    </div>
                ))}
                {data.length === 0 && <p className="text-center text-sm text-muted-foreground py-4">No departures expected today.</p>}
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
        <div className="p-6 bg-card border rounded-2xl shadow-sm">
            <div className="flex items-center space-x-3 mb-6">
                <div className="p-2 bg-blue-100 text-blue-700 rounded-lg"><div className="w-5 h-5 flex items-center justify-center font-bold">ST</div></div>
                <h3 className="text-lg font-bold">Room Status Detail</h3>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead>
                        <tr className="border-b text-muted-foreground text-xs uppercase tracking-wider">
                            <th className="py-3 px-4">Room</th>
                            <th className="py-3 px-4">Type</th>
                            <th className="py-3 px-4">Status</th>
                            <th className="py-3 px-4">Current Guest</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {data.map((room: any) => {
                            const currentBooking = room.BookingRooms[0]?.Booking
                            return (
                                <tr key={room.id} className="hover:bg-secondary/20">
                                    <td className="py-3 px-4 font-black">{room.roomNo}</td>
                                    <td className="py-3 px-4 text-muted-foreground">{room.RoomType.name}</td>
                                    <td className="py-3 px-4">
                                        <span className={cn(
                                            "px-2 py-1 rounded-full text-[10px] font-bold uppercase border",
                                            room.status === 'VACANT_CLEAN' && "bg-emerald-100 text-emerald-700 border-emerald-200",
                                            room.status === 'VACANT_DIRTY' && "bg-amber-100 text-amber-700 border-amber-200",
                                            room.status === 'OCCUPIED' && "bg-blue-100 text-blue-700 border-blue-200",
                                            room.status === 'OUT_OF_ORDER' && "bg-red-100 text-red-700 border-red-200",
                                        )}>
                                            {room.status.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4 font-medium">
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
