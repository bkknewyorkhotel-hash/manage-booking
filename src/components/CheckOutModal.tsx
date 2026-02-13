'use client'

import React, { useState, useEffect } from 'react'
import { X, LogOut, Check, AlertCircle, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CheckOutModalProps {
    isOpen: boolean
    onClose: () => void
    booking: any
    onSuccess: () => void
}

export function CheckOutModal({
    isOpen,
    onClose,
    booking,
    onSuccess
}: CheckOutModalProps) {
    const [isSaving, setIsSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [refunds, setRefunds] = useState<any[]>([])

    // Assume the first stay is the active one
    const stay = booking?.Stays?.[0]
    const heldDeposits = stay?.Deposits?.filter((d: any) => d.status === 'HELD') || []

    useEffect(() => {
        if (heldDeposits.length > 0) {
            setRefunds(heldDeposits.map((d: any) => ({
                depositId: d.id,
                amount: Number(d.amount),
                originalAmount: Number(d.amount),
                method: d.method
            })))
        }
    }, [booking])

    if (!isOpen || !booking) return null

    const handleCheckOut = async () => {
        setIsSaving(true)
        setError(null)
        try {
            const res = await fetch(`/api/bookings/${booking.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status: 'CHECKED_OUT',
                    refunds: refunds.map(r => ({ depositId: r.depositId, amount: r.amount }))
                })
            })

            const data = await res.json()
            if (res.ok) {
                onSuccess()
                onClose()
            } else {
                setError(data.error || 'Failed to check out')
            }
        } catch (err) {
            console.error(err)
            setError('An error occurred during check-out')
        } finally {
            setIsSaving(false)
        }
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('th-TH', {
            style: 'currency',
            currency: 'THB',
            minimumFractionDigits: 0
        }).format(amount)
    }

    const handleRefundChange = (depositId: string, value: string) => {
        setRefunds(prev => prev.map(r =>
            r.depositId === depositId
                ? { ...r, amount: value === '' ? 0 : Number(value) }
                : r
        ))
    }

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b bg-gray-50/50">
                    <div>
                        <h2 className="text-xl font-black text-gray-900">Check Out</h2>
                        <p className="text-sm text-gray-500 font-medium">Booking {booking.bookingNo}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X size={20} className="text-gray-400" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">
                    {error && (
                        <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3 text-red-700">
                            <AlertCircle size={20} className="shrink-0 mt-0.5" />
                            <p className="text-sm font-bold">{error}</p>
                        </div>
                    )}

                    <div className="space-y-4">
                        <div className="flex items-center gap-3 p-4 bg-primary/5 rounded-2xl border border-primary/10">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                <LogOut size={20} />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Guest Name</p>
                                <p className="text-lg font-black text-gray-900">{booking.PrimaryGuest?.name}</p>
                            </div>
                        </div>

                        {heldDeposits.length > 0 ? (
                            <div className="space-y-3">
                                <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide px-1">Held Deposits (คืนเงินมัดจำ)</h3>
                                {refunds.map((r, idx) => (
                                    <div key={r.depositId} className="p-4 bg-gray-50 border border-gray-100 rounded-2xl space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm font-bold text-gray-600">Key Deposit ({r.method})</span>
                                            <span className="text-sm font-black text-gray-900">{formatCurrency(r.originalAmount)}</span>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Refund Amount (จำนวนเงินที่คืน)</label>
                                            <div className="relative">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-gray-400">฿</span>
                                                <input
                                                    type="number"
                                                    value={r.amount}
                                                    onChange={(e) => handleRefundChange(r.depositId, e.target.value)}
                                                    max={r.originalAmount}
                                                    className="w-full pl-8 pr-4 py-3 rounded-xl border border-gray-200 font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                                />
                                            </div>
                                            <p className="text-[10px] text-amber-600 font-bold">* Max refund is {formatCurrency(r.originalAmount)}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-8 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                                <RefreshCw size={32} className="mx-auto text-gray-300 mb-2 opacity-50" />
                                <p className="text-sm font-bold text-gray-500">No held deposits found for this stay.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t bg-gray-50/50 flex gap-3">
                    <button
                        onClick={onClose}
                        disabled={isSaving}
                        className="flex-1 py-4 rounded-2xl font-bold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 transition-all disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleCheckOut}
                        disabled={isSaving}
                        className="flex-1 py-4 rounded-2xl font-black text-white bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {isSaving ? (
                            <>Confirming...</>
                        ) : (
                            <>
                                <Check size={20} />
                                Confirm Check-Out
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}
