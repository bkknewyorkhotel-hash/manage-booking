'use client'

import React, { useEffect, useState } from 'react'
import { Shell } from '@/components/Shell'
import { useTranslation } from '@/lib/LanguageContext'
import {
    Users,
    DoorOpen,
    Settings as Tool,
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
}

function StatCard({ title, value, icon: Icon, color }: StatCardProps) {
    return (
        <div className="p-6 bg-card border rounded-xl shadow-sm">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-muted-foreground">{title}</p>
                    <h3 className="mt-1 text-2xl font-bold">{value}</h3>
                </div>
                <div className={cn("p-2 rounded-lg", color)}>
                    <Icon className="w-5 h-5" />
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
    const [stats, setStats] = useState<any>(null)
    const [roomStats, setRoomStats] = useState<any>({})
    const [arrivals, setArrivals] = useState<any[]>([])
    const [departures, setDepartures] = useState<any[]>([])

    useEffect(() => {
        // Fetch real stats from our APIs
        const fetchData = async () => {
            try {
                const [resStats, resRooms, resArr, resDept] = await Promise.all([
                    fetch('/api/reports?type=occupancy'),
                    fetch('/api/rooms/stats'),
                    fetch('/api/reports?type=arrivals'),
                    fetch('/api/reports?type=departures')
                ])
                setStats(await resStats.json())
                setRoomStats(await resRooms.json())
                setArrivals(await resArr.json())
                setDepartures(await resDept.json())
            } catch (err) {
                console.error(err)
            }
        }
        fetchData()
    }, [])

    const alerts = []

    if (arrivals.length > 0) {
        alerts.push({
            type: 'info',
            title: 'Expected Arrivals',
            message: `${arrivals.length} guests are expected to check in today.`
        })
    }

    if (roomStats['VACANT_DIRTY'] > 0) {
        alerts.push({
            type: 'warning',
            title: 'Housekeeping Needed',
            message: `${roomStats['VACANT_DIRTY']} rooms are currently dirty and need cleaning.`
        })
    }

    if (roomStats['OUT_OF_ORDER'] > 0) {
        alerts.push({
            type: 'error',
            title: 'Maintenance',
            message: `${roomStats['OUT_OF_ORDER']} rooms are out of order.`
        })
    }

    // Example logic for "Unassigned" - in a real app this would check bookings
    // For now we can show "No critical alerts" if empty
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
                {/* Logistics Stats */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                        title={t('arrivals')}
                        value={arrivals.length}
                        icon={DoorOpen}
                        color="bg-emerald-500/10 text-emerald-600"
                    />
                    <StatCard
                        title={t('departures')}
                        value={departures.length}
                        icon={Clock}
                        color="bg-blue-500/10 text-blue-600"
                    />
                    <StatCard
                        title={t('inHouse')}
                        value={stats?.occupied || 0}
                        icon={Users}
                        color="bg-purple-500/10 text-purple-600"
                    />
                    <StatCard
                        title="Occupancy"
                        value={`${Math.round(stats?.rate || 0)}%`}
                        icon={TrendingUp}
                        color="bg-orange-500/10 text-orange-600"
                    />
                </div>

                {/* Room Status Breakdown */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <div className="lg:col-span-2 p-6 bg-card border rounded-xl shadow-sm">
                        <h3 className="text-lg font-bold mb-4">{t('rooms')} - {t('today')}</h3>
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                            <RoomStatusTile label={t('vacantClean')} count={roomStats['VACANT_CLEAN'] || 0} color="border-emerald-500 text-emerald-600" icon={CheckCircle2} />
                            <RoomStatusTile label={t('vacantDirty')} count={roomStats['VACANT_DIRTY'] || 0} color="border-amber-500 text-amber-600" icon={AlertCircle} />
                            <RoomStatusTile label={t('occupied')} count={roomStats['OCCUPIED'] || 0} color="border-blue-500 text-blue-600" icon={Users} />
                            <RoomStatusTile label={t('reserved')} count={roomStats['RESERVED'] || 0} color="border-purple-500 text-purple-600" icon={Clock} />
                            <RoomStatusTile label={t('outOfOrder')} count={roomStats['OUT_OF_ORDER'] || 0} color="border-red-500 text-red-600" icon={Ban} />
                            <RoomStatusTile label={t('inspecting')} count={roomStats['INSPECTING'] || 0} color="border-cyan-500 text-cyan-600" icon={Tool} />
                        </div>
                    </div>

                    {/* Alerts */}
                    <div className="p-6 bg-card border rounded-xl shadow-sm">
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
