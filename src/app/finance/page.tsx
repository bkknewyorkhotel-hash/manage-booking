'use client'

import React, { useEffect, useState } from 'react'
import { Shell } from '@/components/Shell'
import { Plus, ArrowUpCircle, ArrowDownCircle, Search, Wallet, Receipt, Trash2 } from 'lucide-react'
import { cn, formatCurrency } from '@/lib/utils'
import { useToast } from '@/lib/ToastContext'

export default function FinancePage() {
    const { showToast } = useToast()
    const [transactions, setTransactions] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [search, setSearch] = useState('')
    const [activeShift, setActiveShift] = useState<any>(null)
    const [userRole, setUserRole] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)

    // Form states
    const [type, setType] = useState('EXPENSE')
    const [category, setCategory] = useState('PETTY_CASH')
    const [amount, setAmount] = useState('')
    const [description, setDescription] = useState('')
    const [referenceNo, setReferenceNo] = useState('')
    const [isSaving, setIsSaving] = useState(false)

    const fetchTransactions = () => {
        setLoading(true)
        setError(null)
        fetch('/api/finance/transactions')
            .then(res => res.json())
            .then(json => {
                if (json.error === 'NO_ACTIVE_SHIFT') {
                    setTransactions([])
                    setActiveShift(null)
                    setError('NO_ACTIVE_SHIFT')
                } else {
                    setTransactions(json.transactions || [])
                    setActiveShift(json.activeShift)
                }
                setUserRole(json.role)
                setLoading(false)
            })
            .catch(err => {
                console.error(err)
                setLoading(false)
            })
    }

    useEffect(() => {
        fetchTransactions()
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!amount || !description) return

        setIsSaving(true)
        try {
            const res = await fetch('/api/finance/transactions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type,
                    category,
                    amount,
                    description,
                    referenceNo
                })
            })

            if (res.ok) {
                showToast('Transaction recorded!', 'success')
                setIsModalOpen(false)
                fetchTransactions()
                // Reset form
                setAmount('')
                setDescription('')
                setReferenceNo('')
            } else {
                const data = await res.json()
                showToast(data.error || 'Failed to save transaction', 'error')
            }
        } catch (err) {
            showToast('An error occurred', 'error')
        } finally {
            setIsSaving(false)
        }
    }

    const filtered = transactions.filter(t =>
        t.description.toLowerCase().includes(search.toLowerCase()) ||
        t.referenceNo?.toLowerCase().includes(search.toLowerCase())
    )

    const netBalance = transactions.reduce((acc, t) =>
        t.type === 'INCOME' ? acc + t.amount : acc - t.amount, 0
    )

    if (error === 'NO_ACTIVE_SHIFT') {
        return (
            <Shell>
                <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] space-y-6 text-center">
                    <div className="w-24 h-24 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center animate-bounce shadow-inner">
                        <Wallet size={48} />
                    </div>
                    <div className="max-w-md space-y-2">
                        <h2 className="text-3xl font-black text-foreground">Finance Locked</h2>
                        <p className="text-muted-foreground">
                            Please open a shift in the POS section first. Receptionists can only access finance records during an active shift.
                        </p>
                    </div>
                    <button
                        onClick={() => window.location.href = '/pos'}
                        className="px-8 py-3 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/20 hover:scale-105 transition-all"
                    >
                        Go to POS to Open Shift
                    </button>
                </div>
            </Shell>
        )
    }

    return (
        <Shell>
            <div className="space-y-6">
                {/* Header Stats */}
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <div className="flex items-center gap-3">
                            <h2 className="text-2xl font-black">Finance Transactions</h2>
                            {activeShift && (
                                <span className="bg-primary/10 text-primary text-[10px] font-black px-2 py-0.5 rounded-full uppercase border border-primary/20">
                                    Active Shift: {activeShift.id.slice(-6)}
                                </span>
                            )}
                            {userRole === 'ADMIN' && (
                                <span className="bg-purple-100 text-purple-700 text-[10px] font-black px-2 py-0.5 rounded-full uppercase border border-purple-200">
                                    Admin View (All Data)
                                </span>
                            )}
                        </div>
                        <p className="text-muted-foreground text-sm">Monitor and record cash flow during your shift.</p>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-card p-6 rounded-3xl border border-primary/10 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                            <Wallet size={80} />
                        </div>
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">
                            {userRole === 'ADMIN' ? 'Total Balance' : 'Current Shift Balance'}
                        </p>
                        <h3 className={cn("text-3xl font-black", netBalance >= 0 ? "text-emerald-600" : "text-red-600")}>
                            {formatCurrency(netBalance)}
                        </h3>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="relative flex-1 w-full max-w-md">
                        <Search className="absolute left-3 top-3 text-muted-foreground" size={18} />
                        <input
                            type="text"
                            placeholder="Search transactions, ref..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            disabled={userRole === 'RECEPTION' && !activeShift}
                            className="w-full pl-10 pr-4 py-2 bg-card border rounded-xl outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
                        />
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        disabled={userRole === 'RECEPTION' && !activeShift}
                        className="flex items-center space-x-2 px-6 py-2 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:grayscale disabled:scale-100"
                    >
                        <Plus size={20} />
                        <span>Record Cash In/Out</span>
                    </button>
                </div>

                {/* Transactions Table */}
                <div className="bg-card border rounded-2xl shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-secondary/50 border-b">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Date</th>
                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Type</th>
                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Category</th>
                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Description</th>
                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y text-sm">
                                {loading ? (
                                    [...Array(5)].map((_, i) => (
                                        <tr key={i} className="animate-pulse"><td colSpan={5} className="px-6 py-6"><div className="h-4 bg-secondary rounded w-full" /></td></tr>
                                    ))
                                ) : filtered.length === 0 ? (
                                    <tr><td colSpan={5} className="px-6 py-12 text-center text-muted-foreground font-medium">No transactions found</td></tr>
                                ) : filtered.map((t) => (
                                    <tr key={t.id} className="hover:bg-secondary/20 transition-colors">
                                        <td className="px-6 py-4 font-medium text-muted-foreground">
                                            {new Date(t.createdAt).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={cn(
                                                "flex items-center gap-1 font-bold",
                                                t.type === 'INCOME' ? "text-emerald-600" : "text-red-500"
                                            )}>
                                                {t.type === 'INCOME' ? <ArrowUpCircle size={14} /> : <ArrowDownCircle size={14} />}
                                                {t.type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-0.5 bg-secondary text-[10px] font-black rounded border uppercase">
                                                {t.category.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="font-bold">{t.description}</p>
                                                {t.referenceNo && <p className="text-[10px] text-muted-foreground uppercase">Ref: {t.referenceNo}</p>}
                                            </div>
                                        </td>
                                        <td className={cn(
                                            "px-6 py-4 text-right font-black",
                                            t.type === 'INCOME' ? "text-emerald-600" : "text-red-500"
                                        )}>
                                            {t.type === 'INCOME' ? '+' : '-'}{formatCurrency(t.amount)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Entry Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-background w-full max-w-md rounded-3xl shadow-2xl border overflow-hidden">
                        <div className="flex justify-between items-center p-6 border-b bg-secondary/20">
                            <h2 className="text-xl font-black uppercase text-primary">Record Cash Flow</h2>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-secondary rounded-full">
                                <Plus className="rotate-45" size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="flex gap-2 p-1 bg-secondary/20 rounded-xl">
                                <button
                                    type="button"
                                    onClick={() => setType('INCOME')}
                                    className={cn("flex-1 py-2 rounded-lg font-bold text-xs transition-all", type === 'INCOME' ? "bg-emerald-500 text-white shadow-md" : "text-muted-foreground")}
                                >INCOME (เข้า)</button>
                                <button
                                    type="button"
                                    onClick={() => setType('EXPENSE')}
                                    className={cn("flex-1 py-2 rounded-lg font-bold text-xs transition-all", type === 'EXPENSE' ? "bg-red-500 text-white shadow-md" : "text-muted-foreground")}
                                >EXPENSE (ออก)</button>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase text-muted-foreground">Category</label>
                                <select
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                    className="w-full px-4 py-2 bg-card border rounded-xl"
                                >
                                    <option value="PETTY_CASH">Petty Cash (เงินย่อย)</option>
                                    <option value="REFUND">Refund Deposit (คืนมัดจำ)</option>
                                    <option value="PURCHASE">Supplies/Market (ซื้อของ)</option>
                                    <option value="UTILITY">Utility/Bill</option>
                                    <option value="OTHER">Other</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase text-muted-foreground">Amount</label>
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="0.00"
                                    className="w-full px-4 py-3 bg-card border rounded-xl text-2xl font-black text-primary"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase text-muted-foreground">Description</label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="What is this for?"
                                    className="w-full px-4 py-2 bg-card border rounded-xl resize-none"
                                    rows={3}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase text-muted-foreground">Reference (Optional)</label>
                                <input
                                    type="text"
                                    value={referenceNo}
                                    onChange={(e) => setReferenceNo(e.target.value)}
                                    placeholder="Booking # or Invoice #"
                                    className="w-full px-4 py-2 bg-card border rounded-xl"
                                />
                            </div>

                            <div className="pt-4 flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 py-3 font-bold text-muted-foreground hover:bg-secondary rounded-xl"
                                >Cancel</button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="flex-1 py-3 bg-primary text-white font-black rounded-xl shadow-lg shadow-primary/20 disabled:opacity-50"
                                >{isSaving ? "Saving..." : "Record Transaction"}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </Shell>
    )
}
