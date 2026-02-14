'use client'

import React, { useEffect, useState } from 'react'
import { Shell } from '@/components/Shell'
import { useTranslation } from '@/lib/LanguageContext'
import { useToast } from '@/lib/ToastContext'
import { cn } from '@/lib/utils'
import { Brush, CheckCircle2, Search, Clock, ShieldAlert } from 'lucide-react'

export default function HousekeepingPage() {
    const { t } = useTranslation()
    const { showToast } = useToast()
    const [rooms, setRooms] = useState<any[]>([])
    const [user, setUser] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [roomsRes, userRes] = await Promise.all([
                    fetch('/api/rooms'),
                    fetch('/api/auth/me')
                ])

                const roomsJson = await roomsRes.json()
                const userJson = await userRes.json()

                const allRooms = roomsJson.flatMap((f: any) => f.Rooms)
                setRooms(allRooms)
                setUser(userJson)
                setLoading(false)
            } catch (err) {
                console.error(err)
                setLoading(false)
            }
        }
        fetchData()
    }, [])

    const updateRoomStatus = async (roomId: string, status: string) => {
        if (!user?.id) {
            showToast('No user session found', 'error')
            return
        }

        try {
            const res = await fetch('/api/housekeeping', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ roomId, status, userId: user.id }),
            })
            if (res.ok) {
                setRooms(rooms.map(r => r.id === roomId ? { ...r, status } : r))
                showToast(t('roomStatusUpdated'), 'success')
            } else {
                showToast(t('failedToUpdateStatus'), 'error')
            }
        } catch (err) {
            console.error(err)
            showToast(t('anErrorOccurred'), 'error')
        }
    }

    const housekeepingQueue = rooms.filter(r =>
        r.status === 'DIRTY' ||
        r.status === 'CLEANING' ||
        r.status === 'INSPECTING' ||
        r.status === 'OCCUPIED'
    )

    return (
        <Shell>
            <div className="space-y-6">
                <header>
                    <h2 className="text-2xl md:text-3xl font-black text-primary uppercase tracking-tight">{t('housekeeping')}</h2>
                </header>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard
                        title={t('dirtyRooms')}
                        count={rooms.filter(r => r.status === 'DIRTY').length}
                        color="bg-rose-50 text-rose-600"
                    />
                    <StatCard
                        title={t('inProgress')}
                        count={rooms.filter(r => r.status === 'CLEANING').length}
                        color="bg-amber-50 text-amber-600"
                    />
                    <StatCard
                        title={t('toInspect')}
                        count={rooms.filter(r => r.status === 'INSPECTING').length}
                        color="bg-blue-50 text-blue-600"
                    />
                    <StatCard
                        title={t('cleanReady')}
                        count={rooms.filter(r => r.status === 'CLEAN').length}
                        color="bg-emerald-50 text-emerald-600"
                    />
                </div>

                <div className="bg-card border rounded-2xl shadow-sm overflow-hidden">
                    <div className="overflow-x-auto scrollbar-hide">
                        <table className="w-full text-left border-collapse min-w-[600px]">
                            <thead className="bg-secondary/50 border-b">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">{t('room')}</th>
                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">{t('type')}</th>
                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">{t('status')}</th>
                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground text-right">{t('actions')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y text-sm">
                                {housekeepingQueue.map((r) => (
                                    <tr key={r.id} className="hover:bg-secondary/10">
                                        <td className="px-6 py-4 font-black text-lg">{r.roomNo}</td>
                                        <td className="px-6 py-4 text-muted-foreground">{r.RoomType.name}</td>
                                        <td className="px-6 py-4">
                                            <span className={cn(
                                                "px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                                                r.status === 'DIRTY' && "bg-amber-100 text-amber-700 border-amber-200",
                                                r.status === 'CLEANING' && "bg-blue-100 text-blue-700 border-blue-200",
                                                r.status === 'INSPECTING' && "bg-cyan-100 text-cyan-700 border-cyan-200",
                                                r.status === 'OCCUPIED' && "bg-zinc-100 text-zinc-700 border-zinc-200",
                                                r.status === 'CLEAN' && "bg-emerald-100 text-emerald-700 border-emerald-200"
                                            )}>
                                                {r.status.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right space-x-2">
                                            {(r.status === 'DIRTY' || r.status === 'OCCUPIED') && (
                                                <button
                                                    onClick={() => updateRoomStatus(r.id, 'CLEANING')}
                                                    className="w-full flex items-center justify-center space-x-2 py-2 bg-amber-50 text-amber-600 rounded-lg text-xs font-bold hover:bg-amber-100 transition-colors"
                                                >
                                                    <Brush size={14} />
                                                    <span>{t('startCleaning')}</span>
                                                </button>
                                            )}
                                            {r.status === 'CLEANING' && (
                                                <button
                                                    onClick={() => updateRoomStatus(r.id, 'INSPECTING')}
                                                    className="w-full flex items-center justify-center space-x-2 py-2 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-100 transition-colors"
                                                >
                                                    <Clock size={14} />
                                                    <span>{t('finishInspect')}</span>
                                                </button>
                                            )}
                                            {r.status === 'INSPECTING' && (
                                                <button
                                                    onClick={() => updateRoomStatus(r.id, 'CLEAN')}
                                                    className="w-full flex items-center justify-center space-x-2 py-2 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-bold hover:bg-emerald-100 transition-colors"
                                                >
                                                    <CheckCircle2 size={14} />
                                                    <span>{t('markAsCleaned')}</span>
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </Shell>
    )
}

function StatCard({ title, count, color }: any) {
    return (
        <div className={cn("p-4 md:p-6 rounded-2xl border shadow-sm", color)}>
            <p className="text-[10px] md:text-xs font-black uppercase tracking-widest opacity-80 mb-1">{title}</p>
            <p className="text-2xl md:text-4xl font-black tracking-tight">{count}</p>
        </div>
    )
}

function HousekeepStat({ label, count, color, countColor }: any) {
    return (
        <div className={cn("p-4 md:p-5 border rounded-2xl shadow-sm transition-all hover:shadow-md", color)}>
            <p className="text-[10px] md:text-xs font-bold uppercase tracking-wider opacity-70 truncate">{label}</p>
            <p className={cn("text-2xl md:text-3xl font-black mt-1", countColor)}>{count}</p>
        </div>
    )
}
