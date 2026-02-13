'use client'

import React, { useEffect, useState } from 'react'
import { Shell } from '@/components/Shell'
import { useTranslation } from '@/lib/LanguageContext'
import { useToast } from '@/lib/ToastContext'
import { cn } from '@/lib/utils'
import { Trash2, Sparkles, Search, CheckCircle, RefreshCcw, Eye } from 'lucide-react'

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

    const updateStatus = async (roomId: string, status: string) => {
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
                showToast(`Room status updated to ${status.replace('_', ' ')}`, 'success')
            } else {
                showToast('Failed to update status', 'error')
            }
        } catch (err) {
            console.error(err)
            showToast('An error occurred', 'error')
        }
    }

    const housekeepingQueue = rooms.filter(r =>
        r.status === 'VACANT_DIRTY' ||
        r.status === 'CLEANING' ||
        r.status === 'INSPECTING' ||
        r.status === 'OCCUPIED'
    )

    return (
        <Shell>
            <div className="space-y-6">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                    <HousekeepStat label="Dirty Rooms" count={rooms.filter(r => r.status === 'VACANT_DIRTY').length} color="text-amber-600 bg-amber-50" />
                    <HousekeepStat label="In Progress" count={rooms.filter(r => r.status === 'CLEANING').length} color="text-blue-600 bg-blue-50" />
                    <HousekeepStat label="To Inspect" count={rooms.filter(r => r.status === 'INSPECTING').length} countColor="text-cyan-600" color="bg-cyan-50" />
                    <HousekeepStat label="Clean & Ready" count={rooms.filter(r => r.status === 'VACANT_CLEAN').length} color="text-emerald-600 bg-emerald-50" />
                </div>

                <div className="bg-card border rounded-2xl shadow-sm overflow-hidden">
                    <div className="overflow-x-auto scrollbar-hide">
                        <table className="w-full text-left border-collapse min-w-[600px]">
                            <thead className="bg-secondary/50 border-b">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Room</th>
                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Type</th>
                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Status</th>
                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y text-sm">
                                {housekeepingQueue.map((room) => (
                                    <tr key={room.id} className="hover:bg-secondary/10">
                                        <td className="px-6 py-4 font-black text-lg">{room.roomNo}</td>
                                        <td className="px-6 py-4 text-muted-foreground">{room.RoomType.name}</td>
                                        <td className="px-6 py-4">
                                            <span className={cn(
                                                "px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                                                room.status === 'VACANT_DIRTY' && "bg-amber-100 text-amber-700 border-amber-200",
                                                room.status === 'CLEANING' && "bg-blue-100 text-blue-700 border-blue-200",
                                                room.status === 'INSPECTING' && "bg-cyan-100 text-cyan-700 border-cyan-200",
                                                room.status === 'OCCUPIED' && "bg-zinc-100 text-zinc-700 border-zinc-200",
                                                room.status === 'VACANT_CLEAN' && "bg-emerald-100 text-emerald-700 border-emerald-200"
                                            )}>
                                                {room.status.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right space-x-2">
                                            {(room.status === 'VACANT_DIRTY' || room.status === 'OCCUPIED') && (
                                                <button
                                                    onClick={() => updateStatus(room.id, 'CLEANING')}
                                                    className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 shadow-sm transition-all active:scale-90"
                                                    title="Start Cleaning"
                                                >
                                                    <RefreshCcw size={16} />
                                                </button>
                                            )}
                                            {room.status === 'CLEANING' && (
                                                <button
                                                    onClick={() => updateStatus(room.id, 'INSPECTING')}
                                                    className="p-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 shadow-sm transition-all active:scale-90"
                                                    title="Finish & Inspect"
                                                >
                                                    <Sparkles size={16} />
                                                </button>
                                            )}
                                            {room.status === 'INSPECTING' && (
                                                <button
                                                    onClick={() => updateStatus(room.id, 'VACANT_CLEAN')}
                                                    className="p-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 shadow-sm transition-all active:scale-90"
                                                    title="Mark as Cleaned"
                                                >
                                                    <CheckCircle size={16} />
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

function HousekeepStat({ label, count, color, countColor }: any) {
    return (
        <div className={cn("p-4 md:p-5 border rounded-2xl shadow-sm transition-all hover:shadow-md", color)}>
            <p className="text-[10px] md:text-xs font-bold uppercase tracking-wider opacity-70 truncate">{label}</p>
            <p className={cn("text-2xl md:text-3xl font-black mt-1", countColor)}>{count}</p>
        </div>
    )
}
