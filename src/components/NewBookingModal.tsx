'use client'

import React, { useEffect, useState } from 'react'
import { X, Plus, Trash2, Calendar, User, Search, CheckCircle2 } from 'lucide-react'
import { cn, formatCurrency } from '@/lib/utils'
import { useToast } from '@/lib/ToastContext'

interface NewBookingModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
}

export function NewBookingModal({ isOpen, onClose, onSuccess }: NewBookingModalProps) {
    const { showToast } = useToast()
    const [step, setStep] = useState(1)
    const [loading, setLoading] = useState(false)
    const [showSuccess, setShowSuccess] = useState(false)
    const [error, setError] = useState('')

    // Form Data
    const [checkIn, setCheckIn] = useState(new Date().toISOString().split('T')[0])
    const [checkOut, setCheckOut] = useState(new Date(Date.now() + 86400000).toISOString().split('T')[0])
    const [guestName, setGuestName] = useState('')
    const [guestPhone, setGuestPhone] = useState('')
    const [selectedRooms, setSelectedRooms] = useState<any[]>([])

    // Data for selection
    const [availableRooms, setAvailableRooms] = useState<any[]>([])
    const [roomTypes, setRoomTypes] = useState<any[]>([])

    const [allRooms, setAllRooms] = useState<any[]>([])
    const [existingBookings, setExistingBookings] = useState<any[]>([])

    // Fetch initial data
    useEffect(() => {
        if (isOpen) {
            Promise.all([
                fetch('/api/rooms').then(res => res.json()),
                fetch('/api/bookings?status=CONFIRMED').then(res => res.json()),
                fetch('/api/bookings?status=CHECKED_IN').then(res => res.json()),
            ]).then(([roomsData, confirmedData, checkedInData]) => {
                const flatRooms = roomsData.flatMap((f: any) => f.Rooms)
                setAllRooms(flatRooms)
                setExistingBookings([...confirmedData, ...checkedInData])

                // Extract unique room types
                const types = new Map()
                flatRooms.forEach((r: any) => {
                    if (!types.has(r.RoomType.id)) {
                        types.set(r.RoomType.id, r.RoomType)
                    }
                })
                setRoomTypes(Array.from(types.values()))
            })
        }
    }, [isOpen])

    // Filter available rooms when dates or data changes
    useEffect(() => {
        if (allRooms.length === 0) return

        const start = new Date(checkIn)
        const end = new Date(checkOut)

        const occupiedRoomIds = new Set()

        existingBookings.forEach(b => {
            // Check if booking overlaps with selected dates
            const bStart = new Date(b.checkInDate)
            const bEnd = new Date(b.checkOutDate)

            if (start < bEnd && end > bStart) {
                // Overlap found, mark rooms as occupied
                b.Rooms.forEach((br: any) => {
                    if (br.roomId) occupiedRoomIds.add(br.roomId)
                })
            }
        })

        setAvailableRooms(allRooms.filter(r => !occupiedRoomIds.has(r.id)))
    }, [checkIn, checkOut, allRooms, existingBookings])

    const handleAddRoom = () => {
        setSelectedRooms([...selectedRooms, { roomTypeId: '', roomId: '', adults: 2, children: 0, rate: 0 }])
    }

    const handleRemoveRoom = (index: number) => {
        const newRooms = [...selectedRooms]
        newRooms.splice(index, 1)
        setSelectedRooms(newRooms)
    }

    const updateRoom = (index: number, field: string, value: any) => {
        const newRooms = [...selectedRooms]
        newRooms[index] = { ...newRooms[index], [field]: value }

        // Auto-set rate if room type changes
        if (field === 'roomTypeId') {
            const type = roomTypes.find(t => t.id === value)
            if (type) {
                newRooms[index].rate = type.baseRate
                newRooms[index].roomId = '' // Reset specific room
            }
        }

        // Auto-set rate if room changes (in case room has specific override, though using type base for now)
        if (field === 'roomId') {
            // Logic to find room specific details if needed
        }

        setSelectedRooms(newRooms)
    }

    const handleSubmit = async () => {
        setLoading(true)
        setError('')

        try {
            const res = await fetch('/api/bookings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    guestData: {
                        name: guestName,
                        phone: guestPhone,
                    },
                    checkInDate: checkIn,
                    checkOutDate: checkOut,
                    source: 'WALK_IN',
                    rooms: selectedRooms.map(r => ({
                        roomTypeId: r.roomTypeId,
                        roomId: r.roomId || undefined,
                        ratePerNight: Number(r.rate),
                        adults: Number(r.adults),
                        children: Number(r.children),
                    }))
                })
            })

            const json = await res.json()

            if (!res.ok) {
                throw new Error(json.error || 'Failed to create booking')
            }

            setShowSuccess(true)
            showToast('Booking created successfully!', 'success')

            setTimeout(() => {
                onSuccess()
                onClose()
                // Reset form
                setStep(1)
                setGuestName('')
                setSelectedRooms([])
                setShowSuccess(false)
            }, 1500)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-300">
            <div className="bg-background w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden border animate-in zoom-in-95 duration-300">
                {showSuccess ? (
                    <div className="p-12 text-center space-y-4 animate-in zoom-in-50 duration-500">
                        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle2 size={48} />
                        </div>
                        <h2 className="text-2xl font-black uppercase text-primary">Booking Confirmed!</h2>
                        <p className="text-muted-foreground">The reservation has been successfully saved.</p>
                    </div>
                ) : (
                    <>
                        {/* Header */}
                        <div className="flex justify-between items-center p-6 border-b bg-secondary/20">
                            <h2 className="text-xl font-black uppercase text-primary">New Booking</h2>
                            <button onClick={onClose} className="p-2 hover:bg-secondary rounded-full transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        {/* Body contents ... */}

                        {/* Body */}
                        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                            {error && (
                                <div className="p-3 bg-red-100 border border-red-200 text-red-700 rounded-xl text-sm font-bold">
                                    {error}
                                </div>
                            )}

                            {/* Dates */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase text-muted-foreground">Check-in</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-2.5 text-muted-foreground" size={16} />
                                        <input
                                            type="date"
                                            value={checkIn}
                                            onChange={(e) => setCheckIn(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2 bg-card border rounded-xl"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase text-muted-foreground">Check-out</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-2.5 text-muted-foreground" size={16} />
                                        <input
                                            type="date"
                                            value={checkOut}
                                            onChange={(e) => setCheckOut(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2 bg-card border rounded-xl"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Guest */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase text-muted-foreground">Guest Name</label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-2.5 text-muted-foreground" size={16} />
                                        <input
                                            type="text"
                                            placeholder="Full Name"
                                            value={guestName}
                                            onChange={(e) => setGuestName(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2 bg-card border rounded-xl"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase text-muted-foreground">Phone</label>
                                    <input
                                        type="tel"
                                        placeholder="+66..."
                                        value={guestPhone}
                                        onChange={(e) => setGuestPhone(e.target.value)}
                                        className="w-full px-4 py-2 bg-card border rounded-xl"
                                    />
                                </div>
                            </div>

                            {/* Rooms */}
                            <div className="space-y-4">
                                <div className="flex justify-between items-center border-b pb-2">
                                    <label className="text-xs font-bold uppercase text-muted-foreground">Rooms</label>
                                    <button
                                        onClick={handleAddRoom}
                                        className="text-xs font-bold text-primary flex items-center hover:underline"
                                    >
                                        <Plus size={14} className="mr-1" /> Add Room
                                    </button>
                                </div>

                                {selectedRooms.length === 0 && (
                                    <div className="text-center py-8 text-muted-foreground text-sm border-2 border-dashed rounded-xl">
                                        No rooms selected. Click "Add Room" to start.
                                    </div>
                                )}

                                {selectedRooms.map((room, idx) => (
                                    <div key={idx} className="p-4 bg-secondary/10 border rounded-xl space-y-3 relative group">
                                        <button
                                            onClick={() => handleRemoveRoom(idx)}
                                            className="absolute top-2 right-2 text-red-500 opacity-0 group-hover:opacity-100 hover:bg-red-50 p-1 rounded transition-all"
                                        >
                                            <Trash2 size={16} />
                                        </button>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-bold uppercase text-muted-foreground">Room Type</label>
                                                <select
                                                    value={room.roomTypeId}
                                                    onChange={(e) => updateRoom(idx, 'roomTypeId', e.target.value)}
                                                    className="w-full px-3 py-2 bg-white border rounded-lg text-sm"
                                                >
                                                    <option value="">Select Type</option>
                                                    {roomTypes.map(t => (
                                                        <option key={t.id} value={t.id}>{t.name} (Max {t.capacity})</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-bold uppercase text-muted-foreground">Room No. (Optional)</label>
                                                <select
                                                    value={room.roomId}
                                                    onChange={(e) => updateRoom(idx, 'roomId', e.target.value)}
                                                    className="w-full px-3 py-2 bg-white border rounded-lg text-sm"
                                                    disabled={!room.roomTypeId}
                                                >
                                                    <option value="">Auto-Assign</option>
                                                    {availableRooms
                                                        .filter(r => r.roomTypeId === room.roomTypeId) // Only show matching type
                                                        .map(r => (
                                                            <option key={r.id} value={r.id}>{r.roomNo}</option>
                                                        ))}
                                                </select>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-3 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-bold uppercase text-muted-foreground">Rate (Night)</label>
                                                <input
                                                    type="number"
                                                    value={room.rate}
                                                    onChange={(e) => updateRoom(idx, 'rate', e.target.value)}
                                                    className="w-full px-3 py-2 bg-white border rounded-lg text-sm"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-bold uppercase text-muted-foreground">Adults</label>
                                                <input
                                                    type="number"
                                                    value={room.adults}
                                                    onChange={(e) => updateRoom(idx, 'adults', e.target.value)}
                                                    className="w-full px-3 py-2 bg-white border rounded-lg text-sm"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-bold uppercase text-muted-foreground">Children</label>
                                                <input
                                                    type="number"
                                                    value={room.children}
                                                    onChange={(e) => updateRoom(idx, 'children', e.target.value)}
                                                    className="w-full px-3 py-2 bg-white border rounded-lg text-sm"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t bg-secondary/20 flex justify-end space-x-2">
                            <button
                                onClick={onClose}
                                className="px-6 py-2 rounded-xl font-bold text-muted-foreground hover:bg-secondary transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={loading || selectedRooms.length === 0 || !guestName}
                                className="px-6 py-2 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all disabled:opacity-50 disabled:scale-100"
                            >
                                {loading ? 'Processing...' : 'Create Booking'}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}
