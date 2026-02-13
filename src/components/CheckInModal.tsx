'use client'

import React, { useState } from 'react'
import { X, Check, CreditCard, User, Key } from 'lucide-react'
import { cn, formatCurrency } from '@/lib/utils'

interface CheckInModalProps {
    isOpen: boolean
    onClose: () => void
    booking: any
    onSuccess: () => void
}

export function CheckInModal({ isOpen, onClose, booking, onSuccess }: CheckInModalProps) {
    const [loading, setLoading] = useState(false)
    const [idCardNumber, setIdCardNumber] = useState(booking?.PrimaryGuest?.idCardNumber || '')
    const [keyDeposit, setKeyDeposit] = useState('0')
    const [keyDepositMethod, setKeyDepositMethod] = useState('CASH')
    const [guestName, setGuestName] = useState(booking?.PrimaryGuest?.name || '')
    const [error, setError] = useState('')

    if (!isOpen || !booking) return null

    const handleCheckIn = async () => {
        setLoading(true)
        setError('')
        try {
            const res = await fetch(`/api/bookings/${booking.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status: 'CHECKED_IN',
                    idCardNumber,
                    keyDeposit,
                    keyDepositMethod,
                    guestName
                })
            })

            const json = await res.json()

            if (res.ok) {
                onSuccess()
                onClose()
            } else {
                setError(json.error || 'Failed to check in')
            }
        } catch (err: any) {
            setError('An error occurred during check-in')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-background w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b bg-secondary/20">
                    <div>
                        <h2 className="text-xl font-black uppercase text-primary">Check In</h2>
                        <p className="text-xs text-muted-foreground font-bold">{booking.bookingNo} - {booking.PrimaryGuest.name}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-secondary rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">
                    {error && (
                        <div className="p-3 bg-red-100 border border-red-200 text-red-700 rounded-xl text-sm font-bold">
                            {error}
                        </div>
                    )}

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1">
                                <User size={14} /> Guest Name
                            </label>
                            <input
                                type="text"
                                value={guestName}
                                onChange={(e) => setGuestName(e.target.value)}
                                className="w-full px-4 py-2 bg-card border rounded-xl font-medium"
                                placeholder="Full Name"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1">
                                <CreditCard size={14} /> ID Card / Passport
                            </label>
                            <input
                                type="text"
                                value={idCardNumber}
                                onChange={(e) => setIdCardNumber(e.target.value)}
                                className="w-full px-4 py-2 bg-card border rounded-xl font-medium"
                                placeholder="เลขบัตรประชาชน / Passport"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1">
                                <Key size={14} /> Key Deposit (ค่ามัดจำกุญแจ)
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-2.5 font-bold text-muted-foreground">฿</span>
                                <input
                                    type="number"
                                    value={keyDeposit}
                                    onChange={(e) => setKeyDeposit(e.target.value)}
                                    className="w-full pl-8 pr-4 py-2 bg-card border rounded-xl font-black text-lg"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1">
                                <CreditCard size={14} /> Deposit Payment Method
                            </label>
                            <select
                                value={keyDepositMethod}
                                onChange={(e) => setKeyDepositMethod(e.target.value)}
                                className="w-full px-4 py-2 bg-card border rounded-xl font-medium"
                            >
                                <option value="CASH">Cash (เงินสด)</option>
                                <option value="BANK_TRANSFER">Bank Transfer (โอนเงิน)</option>
                                <option value="CARD">Credit/Debit Card</option>
                                <option value="QR">QR PromptPay</option>
                            </select>
                        </div>
                    </div>

                    <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10">
                        <p className="text-xs font-bold text-primary uppercase mb-2">Summary</p>
                        <div className="space-y-1">
                            {booking.Rooms.map((r: any, idx: number) => (
                                <div key={idx} className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Room {r.Room?.roomNo || 'TBD'} ({r.RoomType.name})</span>
                                    <span className="font-bold">{formatCurrency(r.ratePerNight * booking.nights)}</span>
                                </div>
                            ))}
                            <div className="pt-2 mt-2 border-t border-dashed flex justify-between font-black text-primary">
                                <span>Total to be charged</span>
                                <span>{formatCurrency(booking.Rooms.reduce((acc: number, r: any) => acc + (Number(r.ratePerNight) * booking.nights), 0) + Number(keyDeposit || 0))}</span>
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-1">* Payment will be recorded using {booking.paymentMethod || 'CASH'}</p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t bg-secondary/20 flex gap-3">
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="flex-1 py-3 rounded-xl font-bold text-muted-foreground bg-background border hover:bg-secondary transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleCheckIn}
                        disabled={loading}
                        className="flex-1 py-3 bg-primary text-white rounded-xl font-black shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all disabled:opacity-50"
                    >
                        {loading ? 'Processing...' : 'Complete Check-In'}
                    </button>
                </div>
            </div>
        </div>
    )
}
