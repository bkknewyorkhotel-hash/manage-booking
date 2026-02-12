'use client'

import React, { useState, useEffect } from 'react'
import { X, Bed, Check, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RoomActionModalProps {
    isOpen: boolean
    onClose: () => void
    room: any
    onSuccess: () => void
}

const ROOM_STATUSES = [
    { value: 'VACANT_CLEAN', label: 'Vacant Clean', color: 'bg-emerald-100 text-emerald-800' },
    { value: 'VACANT_DIRTY', label: 'Vacant Dirty', color: 'bg-amber-100 text-amber-800' },
    { value: 'OCCUPIED', label: 'Occupied', color: 'bg-blue-100 text-blue-800' },
    { value: 'RESERVED', label: 'Reserved', color: 'bg-purple-100 text-purple-800' },
    { value: 'OUT_OF_ORDER', label: 'Out of Order', color: 'bg-red-100 text-red-800' },
    { value: 'INSPECTING', label: 'Inspecting', color: 'bg-cyan-100 text-cyan-800' },
    { value: 'CLEANING', label: 'Cleaning', color: 'bg-indigo-100 text-indigo-800' },
]

export function RoomActionModal({
    isOpen,
    onClose,
    room,
    onSuccess
}: RoomActionModalProps) {
    const [status, setStatus] = useState('')
    const [roomTypeId, setRoomTypeId] = useState('')
    const [note, setNote] = useState('')
    const [isSaving, setIsSaving] = useState(false)
    const [roomTypes, setRoomTypes] = useState<any[]>([])

    useEffect(() => {
        if (room) {
            setStatus(room.status)
            setRoomTypeId(room.roomTypeId)
            setNote('')
        }
    }, [room])

    useEffect(() => {
        if (isOpen) {
            fetch('/api/room-types')
                .then(res => res.json())
                .then(data => setRoomTypes(data))
                .catch(err => console.error('Failed to load room types', err))
        }
    }, [isOpen])

    if (!isOpen || !room) return null

    const handleSave = async () => {
        setIsSaving(true)
        try {
            const res = await fetch('/api/rooms', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: room.id,
                    status,
                    roomTypeId,
                    note
                })
            })

            if (res.ok) {
                onSuccess()
                onClose()
            } else {
                alert('Failed to update room')
            }
        } catch (error) {
            console.error(error)
            alert('An error occurred')
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b bg-gray-50/50">
                    <div>
                        <h2 className="text-xl font-black text-gray-900">Room {room.roomNo}</h2>
                        <p className="text-sm text-gray-500 font-medium">Manage Room Details</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X size={20} className="text-gray-400" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-5">

                    {/* Status Select */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700 uppercase tracking-wide">Status</label>
                        <div className="grid grid-cols-2 gap-2">
                            {ROOM_STATUSES.map((s) => (
                                <button
                                    key={s.value}
                                    onClick={() => setStatus(s.value)}
                                    className={cn(
                                        "px-3 py-2 text-xs font-bold rounded-lg border transition-all text-left truncate",
                                        status === s.value
                                            ? `ring-2 ring-offset-1 ring-black/10 ${s.color} border-transparent`
                                            : "bg-white border-gray-200 hover:border-gray-300 text-gray-600"
                                    )}
                                >
                                    {s.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Type Select */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700 uppercase tracking-wide">Room Type</label>
                        <select
                            value={roomTypeId}
                            onChange={(e) => setRoomTypeId(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50/50 font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        >
                            {roomTypes.map(type => (
                                <option key={type.id} value={type.id}>
                                    {type.name} (Cap: {type.capacity}, ฿{type.baseRate})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Note */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700 uppercase tracking-wide">Internal Note</label>
                        <textarea
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="Add a reason for status change..."
                            rows={3}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50/50 font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t bg-gray-50/50 flex gap-3">
                    <button
                        onClick={onClose}
                        disabled={isSaving}
                        className="flex-1 py-3 rounded-xl font-bold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 transition-all disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex-1 py-3 rounded-xl font-black text-white bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {isSaving ? (
                            <>Processing...</>
                        ) : (
                            <>
                                <Check size={18} />
                                Save Changes
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}
