'use client'

import React, { useEffect, useState } from 'react'
import { Shell } from '@/components/Shell'
import { useTranslation } from '@/lib/LanguageContext'
import { useToast } from '@/lib/ToastContext'
import { cn } from '@/lib/utils'
import { Plus, Wrench, AlertTriangle, CheckCircle2, Search, Clock, ShieldAlert } from 'lucide-react'

export default function MaintenancePage() {
    const { t } = useTranslation()
    const { showToast } = useToast()
    const [tickets, setTickets] = useState<any[]>([])
    const [rooms, setRooms] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [formData, setFormData] = useState({
        roomId: '',
        issue: '',
        priority: 'MEDIUM'
    })

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [ticketsRes, roomsRes] = await Promise.all([
                    fetch('/api/maintenance'),
                    fetch('/api/rooms')
                ])
                const ticketsData = await ticketsRes.json()
                const floorsData = await roomsRes.json()

                // Flatten rooms from floors
                const allRooms = floorsData.flatMap((f: any) => f.Rooms)

                setTickets(ticketsData)
                setRooms(allRooms)
                setLoading(false)
            } catch (err) {
                console.error(err)
                setLoading(false)
                showToast('Failed to load data', 'error')
            }
        }
        fetchData()
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.roomId || !formData.issue) return

        setIsSubmitting(true)
        try {
            const res = await fetch('/api/maintenance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            })
            if (res.ok) {
                const refreshedRes = await fetch('/api/maintenance')
                const refreshedTickets = await refreshedRes.json()
                setTickets(refreshedTickets)

                showToast(t('issueReportedSuccessfully'), 'success')

                // Keep modal open for a split second so user sees the success state if we add one,
                // but for now just close it.
                setIsModalOpen(false)
                setFormData({ roomId: '', issue: '', priority: 'MEDIUM' })
            } else {
                showToast(t('failedToReportIssue'), 'error')
            }
        } catch (err) {
            console.error(err)
            showToast(t('anErrorOccurred'), 'error')
        } finally {
            setIsSubmitting(false)
        }
    }

    const updateTicketStatus = async (id: string, status: string) => {
        try {
            const res = await fetch(`/api/maintenance?id=${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status }),
            })
            if (res.ok) {
                setTickets(tickets.map(t => t.id === id ? { ...t, status } : t))
                showToast(t('ticketStatusUpdated'), 'info')
            } else {
                showToast(t('failedToUpdateTicket'), 'error')
            }
        } catch (err) {
            console.error(err)
            showToast(t('errorUpdatingStatus'), 'error')
        }
    }

    return (
        <Shell>
            <div className="space-y-6">
                <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <h2 className="text-xl md:text-2xl font-black text-primary uppercase tracking-tight">{t('maintenanceTickets')}</h2>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="w-full sm:w-auto flex items-center justify-center space-x-2 px-6 py-2.5 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95"
                    >
                        <Plus size={18} />
                        <span>{t('reportIssue')}</span>
                    </button>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {loading ? (
                        [...Array(3)].map((_, i) => <div key={i} className="h-48 bg-card animate-pulse border rounded-2xl" />)
                    ) : tickets.length === 0 ? (
                        <div className="lg:col-span-3 p-12 text-center text-muted-foreground border-2 border-dashed rounded-2xl">
                            {t('noActiveMaintenanceTickets')}
                        </div>
                    ) : tickets.map((ticket) => (
                        <div key={ticket.id} className="relative p-6 bg-card border rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex flex-col">
                                    <span className="text-3xl font-black">{ticket.Room?.roomNo || 'N/A'}</span>
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase">{ticket.Room?.status || 'UNKNOWN'}</span>
                                </div>
                                <PriorityBadge priority={ticket.priority} />
                            </div>

                            <div className="space-y-3">
                                <p className="font-bold text-sm leading-snug">{ticket.issue}</p>
                                <div className="flex items-center text-[10px] font-bold text-muted-foreground space-x-1">
                                    <Clock size={12} />
                                    <span>{t('reported')} {new Date(ticket.createdAt).toLocaleString()}</span>
                                </div>
                            </div>

                            <div className="mt-6 flex flex-col sm:flex-row gap-2">
                                {ticket.status !== 'RESOLVED' ? (
                                    <>
                                        <button
                                            onClick={() => updateTicketStatus(ticket.id, 'IN_PROGRESS')}
                                            className={cn(
                                                "flex-1 py-2 text-xs font-black rounded-lg transition-colors",
                                                ticket.status === 'IN_PROGRESS'
                                                    ? "bg-blue-100 text-blue-600 cursor-default"
                                                    : "bg-blue-500 text-white hover:bg-blue-600"
                                            )}
                                            disabled={ticket.status === 'IN_PROGRESS'}
                                        >
                                            {ticket.status === 'IN_PROGRESS' ? t('inProgress') : t('startWork')}
                                        </button>
                                        <button
                                            onClick={() => updateTicketStatus(ticket.id, 'RESOLVED')}
                                            className="flex-1 py-2 text-xs font-black bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
                                        >
                                            {t('resolve')}
                                        </button>
                                    </>
                                ) : (
                                    <div className="flex-1 py-1.5 text-center text-[10px] font-black uppercase text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-lg flex items-center justify-center space-x-1">
                                        <CheckCircle2 size={14} />
                                        <span>{t('resolved')}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Report Issue Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-card w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b bg-secondary/10 flex justify-between items-center">
                            <h3 className="text-xl font-black text-primary uppercase tracking-tight">{t('reportNewIssue')}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-secondary rounded-full">
                                <Plus className="rotate-45" size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest pl-1">{t('roomNumber')}</label>
                                <select
                                    required
                                    className="w-full h-12 px-4 rounded-xl border bg-background font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                    value={formData.roomId}
                                    onChange={(e) => setFormData({ ...formData, roomId: e.target.value })}
                                >
                                    <option value="">{t('selectRoom')}</option>
                                    {rooms.map(room => (
                                        <option key={room.id} value={room.id}>{t('room')} {room.roomNo}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest pl-1">{t('issueDescription')}</label>
                                <textarea
                                    required
                                    rows={3}
                                    placeholder={t('describeProblem')}
                                    className="w-full p-4 rounded-xl border bg-background font-medium focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none"
                                    value={formData.issue}
                                    onChange={(e) => setFormData({ ...formData, issue: e.target.value })}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest pl-1">{t('priority')}</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {['LOW', 'MEDIUM', 'HIGH'].map((p) => (
                                        <button
                                            key={p}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, priority: p })}
                                            className={cn(
                                                "py-2 rounded-lg text-[10px] font-black uppercase transition-all border-2",
                                                formData.priority === p
                                                    ? p === 'HIGH' ? "bg-rose-500 text-white border-rose-500 shadow-lg shadow-rose-200"
                                                        : p === 'MEDIUM' ? "bg-amber-500 text-white border-amber-500 shadow-lg shadow-amber-200"
                                                            : "bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-200"
                                                    : "bg-secondary/50 text-muted-foreground border-transparent hover:border-muted-foreground/20"
                                            )}
                                        >
                                            {t(p.toLowerCase())}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 h-12 rounded-xl font-bold text-muted-foreground hover:bg-secondary transition-colors"
                                >
                                    {t('cancel')}
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex-[2] h-12 rounded-xl bg-primary text-white font-black shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all disabled:opacity-50"
                                >
                                    {isSubmitting ? t('processing') : t('submitTicket')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </Shell>
    )
}

function PriorityBadge({ priority }: { priority: string }) {
    const styles = {
        HIGH: "bg-red-500 text-white shadow-red-200",
        MEDIUM: "bg-amber-500 text-white shadow-amber-200",
        LOW: "bg-emerald-500 text-white shadow-emerald-200",
    }
    return (
        <span className={cn("px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest shadow-sm", (styles as any)[priority])}>
            {priority}
        </span>
    )
}
