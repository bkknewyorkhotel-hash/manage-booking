'use client'

import React, { useEffect, useState } from 'react'
import { Shell } from '@/components/Shell'
import { useTranslation } from '@/lib/LanguageContext'
import { cn } from '@/lib/utils'
import { Bed, User, AlertCircle, CheckCircle2, Hammer, Ban } from 'lucide-react'
import { RoomActionModal } from '@/components/RoomActionModal'

export default function RoomBoardPage() {
    const { t } = useTranslation()
    const [data, setData] = useState<any[]>([])
    const [activeFloor, setActiveFloor] = useState<number>(1)
    const [loading, setLoading] = useState(true)
    const [selectedRoom, setSelectedRoom] = useState<any>(null)
    const [isModalOpen, setIsModalOpen] = useState(false)

    const fetchData = () => {
        setLoading(true)
        fetch('/api/rooms')
            .then(res => res.json())
            .then(json => {
                setData(json)
                setLoading(false)
            })
    }

    useEffect(() => {
        fetchData()
    }, [])

    const handleAction = (room: any) => {
        setSelectedRoom(room)
        setIsModalOpen(true)
    }

    const handleSuccess = () => {
        fetchData()
        // Optional: Show toast
    }

    const currentFloor = data.find(f => f.floorNo === activeFloor)

    return (
        <Shell>
            <div className="space-y-6">
                {/* Floor Navigation */}
                <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide">
                    {data.map(floor => (
                        <button
                            key={floor.id}
                            onClick={() => setActiveFloor(floor.floorNo)}
                            className={cn(
                                "px-6 py-2.5 rounded-xl font-bold transition-all border whitespace-nowrap",
                                activeFloor === floor.floorNo
                                    ? "bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-105"
                                    : "bg-card hover:bg-secondary text-muted-foreground border-border"
                            )}
                        >
                            Floor {floor.floorNo}
                        </button>
                    ))}
                </div>

                {/* Room Grid */}
                {/* Room Grid */}
                {loading ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                        {[...Array(10)].map((_, i) => (
                            <div key={i} className="h-32 bg-secondary animate-pulse rounded-xl border" />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
                        {currentFloor?.Rooms.map((room: any) => (
                            <RoomCard key={room.id} room={room} onAction={() => handleAction(room)} />
                        ))}
                    </div>
                )}

                {/* Legend */}
                <div className="flex flex-wrap gap-4 p-4 border rounded-xl bg-card text-xs font-medium">
                    <div className="flex items-center space-x-2"><div className="w-3 h-3 rounded-full bg-emerald-500" /><span>{t('vacantClean')}</span></div>
                    <div className="flex items-center space-x-2"><div className="w-3 h-3 rounded-full bg-amber-500" /><span>{t('vacantDirty')}</span></div>
                    <div className="flex items-center space-x-2"><div className="w-3 h-3 rounded-full bg-blue-500" /><span>{t('occupied')}</span></div>
                    <div className="flex items-center space-x-2"><div className="w-3 h-3 rounded-full bg-purple-500" /><span>{t('reserved')}</span></div>
                    <div className="flex items-center space-x-2"><div className="w-3 h-3 rounded-full bg-red-500" /><span>{t('outOfOrder')}</span></div>
                </div>
            </div>

            <RoomActionModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                room={selectedRoom}
                onSuccess={fetchData}
            />
        </Shell>
    )
}

function RoomCard({ room, onAction }: { room: any, onAction: () => void }) {
    const { t } = useTranslation()

    const statusStyles = {
        VACANT_CLEAN: "border-emerald-200 bg-emerald-50/50 text-emerald-700",
        VACANT_DIRTY: "border-amber-200 bg-amber-50/50 text-amber-700",
        OCCUPIED: "border-blue-200 bg-blue-50/50 text-blue-700",
        RESERVED: "border-purple-200 bg-purple-50/50 text-purple-700",
        OUT_OF_ORDER: "border-red-200 bg-red-50/50 text-red-700",
        INSPECTING: "border-cyan-200 bg-cyan-50/50 text-cyan-700",
        CLEANING: "border-emerald-100 bg-emerald-50/20 text-emerald-600",
    }

    const icons = {
        VACANT_CLEAN: CheckCircle2,
        VACANT_DIRTY: AlertCircle,
        OCCUPIED: User,
        RESERVED: Bed,
        OUT_OF_ORDER: Ban,
        INSPECTING: Hammer,
        CLEANING: Hammer,
    }

    const StatusIcon = (icons as any)[room.status] || Bed

    return (
        <div className={cn(
            "relative p-5 border-2 rounded-2xl transition-all cursor-pointer hover:shadow-lg group",
            (statusStyles as any)[room.status] || "border-border bg-card"
        )}>
            <div className="flex justify-between items-start mb-2">
                <span className="text-2xl font-black">{room.roomNo}</span>
                <StatusIcon size={20} className="opacity-80" />
            </div>

            <div className="space-y-1">
                <p className="text-xs font-bold opacity-70 uppercase tracking-tighter">
                    {room.RoomType.name}
                </p>
                <p className="text-[10px] font-medium opacity-60">
                    Capacity: {room.RoomType.capacity}
                </p>
            </div>

            <div className="mt-4 flex space-x-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                <button onClick={(e) => {
                    e.stopPropagation()
                    onAction()
                }} className="flex-1 py-1.5 text-[10px] font-bold bg-white/80 lg:bg-white/50 hover:bg-white rounded-lg border border-current shadow-sm active:scale-95 transition-all">
                    Update Status
                </button>
            </div>

            {room.status === 'OCCUPIED' && (
                <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            )}
        </div>
    )
}
