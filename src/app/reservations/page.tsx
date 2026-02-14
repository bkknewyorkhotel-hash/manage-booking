'use client'

import React, { useEffect, useState } from 'react'
import { Shell } from '@/components/Shell'
import { useTranslation } from '@/lib/LanguageContext'
import { Plus, Search, Calendar, User, MoreVertical, CreditCard } from 'lucide-react'
import { cn, formatCurrency } from '@/lib/utils'
import { NewBookingModal } from '@/components/NewBookingModal'
import { CheckInModal } from '@/components/CheckInModal'
import { CheckOutModal } from '@/components/CheckOutModal'

export default function ReservationsPage() {
    const { t } = useTranslation()
    const [bookings, setBookings] = useState<any[]>([])
    const [pagination, setPagination] = useState<any>({ page: 1, totalPages: 1 })
    const [search, setSearch] = useState('')
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isCheckInOpen, setIsCheckInOpen] = useState(false)
    const [isCheckOutOpen, setIsCheckOutOpen] = useState(false)
    const [selectedBooking, setSelectedBooking] = useState<any>(null)

    const [updating, setUpdating] = useState<string | null>(null)

    const refreshData = (pageNum = 1) => {
        setLoading(true)
        fetch(`/api/bookings?page=${pageNum}&limit=20`)
            .then(res => res.json())
            .then(data => {
                setBookings(data.bookings || [])
                setPagination(data.pagination || { page: 1, totalPages: 1 })
                setLoading(false)
            })
            .catch(err => {
                console.error(err)
                setLoading(false)
            })
    }

    useEffect(() => {
        refreshData()
    }, [])

    const updateStatus = async (id: string, status: string) => {
        if (!confirm(`Are you sure you want to change status to ${status}?`)) return

        setUpdating(id)
        try {
            const res = await fetch(`/api/bookings/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            })

            if (res.ok) {
                refreshData()
            } else {
                const json = await res.json().catch(() => ({}))
                alert(json.error || 'Failed to update status')
            }
        } catch (error) {
            console.error(error)
            alert('Error updating status')
        } finally {
            setUpdating(null)
        }
    }

    const handleCheckInClick = (booking: any) => {
        setSelectedBooking(booking)
        setIsCheckInOpen(true)
    }

    const handleCheckOutClick = (booking: any) => {
        setSelectedBooking(booking)
        setIsCheckOutOpen(true)
    }

    useEffect(() => {
        refreshData()
    }, [])

    const filtered = bookings.filter(b =>
        b.bookingNo.toLowerCase().includes(search.toLowerCase()) ||
        b.PrimaryGuest.name.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <Shell>
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <h2 className="text-xl md:text-2xl font-black text-primary uppercase tracking-tight">{t('reservations')}</h2>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="w-full sm:w-auto flex items-center justify-center space-x-2 px-6 py-2.5 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95"
                    >
                        <Plus size={18} />
                        <span>{t('newBooking')}</span>
                    </button>
                </div>

                <div className="bg-card p-4 rounded-xl border shadow-sm flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-2.5 text-muted-foreground" size={18} />
                        <input
                            type="text"
                            placeholder={t('searchBooking')}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-secondary/50 border-none rounded-lg outline-none focus:ring-2 focus:ring-primary/20"
                        />
                    </div>
                </div>

                {/* Booking Table */}
                <div className="bg-card border rounded-2xl shadow-sm overflow-hidden">
                    <div className="overflow-x-auto scrollbar-hide">
                        <table className="w-full text-left border-collapse min-w-[900px]">
                            <thead className="bg-secondary/50 border-b">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Booking #</th>
                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">{t('guestName')}</th>
                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">{t('stayDates')}</th>
                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Rooms</th>
                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">{t('status')}</th>
                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground text-right">{t('actions')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {loading ? (
                                    [...Array(5)].map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            <td colSpan={6} className="px-6 py-8"><div className="h-4 bg-secondary rounded w-full" /></td>
                                        </tr>
                                    ))
                                ) : filtered.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground font-medium">No bookings found</td>
                                    </tr>
                                ) : filtered.map((booking) => (
                                    <tr key={booking.id} className="hover:bg-secondary/20 transition-colors">
                                        <td className="px-6 py-4 font-bold text-primary">{booking.bookingNo}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground">
                                                    <User size={14} />
                                                </div>
                                                <span className="font-medium">{booking.PrimaryGuest.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium">
                                                    {new Date(booking.checkInDate).toLocaleDateString()} - {new Date(booking.checkOutDate).toLocaleDateString()}
                                                </span>
                                                <span className="text-[10px] text-muted-foreground uppercase font-bold">{booking.nights} Nights</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-wrap gap-1">
                                                {booking.Rooms.map((r: any, idx: number) => (
                                                    <span key={idx} className="px-2 py-0.5 bg-secondary text-[10px] font-bold rounded border uppercase">
                                                        {r.Room?.roomNo || r.RoomType.name}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <StatusBadge status={booking.status} t={t} />
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end space-x-2">
                                                {booking.status === 'CONFIRMED' && (
                                                    <>
                                                        <button
                                                            onClick={() => handleCheckInClick(booking)}
                                                            className="px-3 py-1 bg-blue-500 text-white text-xs font-bold rounded hover:bg-blue-600 shadow-md shadow-blue-500/20 active:scale-95 transition-all"
                                                        >
                                                            Check In
                                                        </button>
                                                        <button
                                                            onClick={() => updateStatus(booking.id, 'CANCELLED')}
                                                            disabled={updating === booking.id}
                                                            className="px-3 py-1 bg-red-100 text-red-600 text-xs font-bold rounded hover:bg-red-200 disabled:opacity-50"
                                                        >
                                                            {t('cancel')}
                                                        </button>
                                                    </>
                                                )}
                                                {booking.status === 'CHECKED_IN' && (
                                                    <button
                                                        onClick={() => handleCheckOutClick(booking)}
                                                        disabled={updating === booking.id}
                                                        className="px-3 py-1 bg-amber-500 text-white text-xs font-bold rounded hover:bg-amber-600 disabled:opacity-50"
                                                    >
                                                        Check Out
                                                    </button>
                                                )}
                                                {booking.status === 'CHECKED_OUT' && (
                                                    <span className="text-xs text-muted-foreground italic">Completed</span>
                                                )}
                                                {booking.status === 'CANCELLED' && (
                                                    <span className="text-xs text-muted-foreground italic">Cancelled</span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {/* Pagination Controls */}
                    {!loading && pagination.totalPages > 1 && (
                        <div className="flex justify-center items-center gap-4 py-4">
                            <button
                                disabled={pagination.page <= 1}
                                onClick={() => refreshData(pagination.page - 1)}
                                className="px-4 py-2 border rounded-xl font-bold hover:bg-secondary disabled:opacity-50"
                            >
                                Previous
                            </button>
                            <span className="text-sm font-bold text-muted-foreground">
                                Page {pagination.page} of {pagination.totalPages}
                            </span>
                            <button
                                disabled={pagination.page >= pagination.totalPages}
                                onClick={() => refreshData(pagination.page + 1)}
                                className="px-4 py-2 border rounded-xl font-bold hover:bg-secondary disabled:opacity-50"
                            >
                                Next
                            </button>
                        </div>
                    )}
                </div>

                <NewBookingModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSuccess={refreshData}
                />

                <CheckInModal
                    isOpen={isCheckInOpen}
                    booking={selectedBooking}
                    onClose={() => setIsCheckInOpen(false)}
                    onSuccess={refreshData}
                />

                <CheckOutModal
                    isOpen={isCheckOutOpen}
                    booking={selectedBooking}
                    onClose={() => setIsCheckOutOpen(false)}
                    onSuccess={refreshData}
                />
            </div>
        </Shell >

    )
}

function StatusBadge({ status, t }: { status: string, t: any }) {
    const styles = {
        CONFIRMED: "bg-emerald-500/10 text-emerald-600 border-emerald-100",
        CANCELLED: "bg-red-500/10 text-red-600 border-red-100",
        CHECKED_IN: "bg-blue-500/10 text-blue-600 border-blue-100",
        CHECKED_OUT: "bg-gray-500/10 text-gray-600 border-gray-100",
    }
    return (
        <span className={cn("px-2.5 py-1 text-[10px] font-black border rounded-full uppercase tracking-widest", (styles as any)[status])}>
            {status === 'CONFIRMED' && t('confirmed')}
            {status === 'CANCELLED' && t('cancelled')}
            {status === 'CHECKED_IN' && t('checkedIn')}
            {status === 'CHECKED_OUT' && t('checkedOut')}
            {!['CONFIRMED', 'CANCELLED', 'CHECKED_IN', 'CHECKED_OUT'].includes(status) && status.replace('_', ' ')}
        </span>
    )
}
