'use client'

import React, { useEffect, useState } from 'react'
import { Shell } from '@/components/Shell'
import { Search, ShoppingCart, Plus, Minus, Trash2, CreditCard, Banknote, Wallet, X, User, QrCode } from 'lucide-react'
import { useTranslation } from '@/lib/LanguageContext'
import { cn, formatCurrency } from '@/lib/utils'
import { useToast } from '@/lib/ToastContext'
import { ConfirmationModal } from '@/components/ConfirmationModal'
import { useAuth } from '@/lib/AuthContext'

interface Product {
    id: string
    name: string
    category: string
    price: number
    stock: number
}

interface CartItem extends Product {
    qty: number
}

export default function POSPage() {
    const { t } = useTranslation()
    const { showToast } = useToast()
    const { user } = useAuth()
    const [products, setProducts] = useState<Product[]>([])
    const [cart, setCart] = useState<CartItem[]>([])
    const [search, setSearch] = useState('')
    const [category, setCategory] = useState('All')
    const [loading, setLoading] = useState(false)
    const [isProcessing, setIsProcessing] = useState(false)
    const [showShiftModal, setShowShiftModal] = useState(false)
    const [shiftData, setShiftData] = useState<any>(null)
    const [activeShift, setActiveShift] = useState<any>(null)
    const [startingCash, setStartingCash] = useState('')

    // Confirmation states
    const [isCloseModalOpen, setIsCloseModalOpen] = useState(false)
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
    const [paymentMethod, setPaymentMethod] = useState('')
    const [isCartOpen, setIsCartOpen] = useState(false) // Mobile cart toggle

    // 1. Check for Active Shift on Load
    useEffect(() => {
        checkActiveShift()
    }, [])

    const checkActiveShift = () => {
        fetch('/api/pos/shift/check')
            .then(res => res.json())
            .then(data => {
                setActiveShift(data)
                if (data) {
                    setShiftData(data.stats)
                }
            })
            .catch(err => console.error(err))
    }

    // Load Products
    useEffect(() => {
        fetch('/api/pos/products')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setProducts(data)
                } else {
                    console.error('Failed to load products:', data)
                    setProducts([])
                }
            })
            .catch(err => {
                console.error(err)
                setProducts([])
            })
    }, [])

    const categories = ['All', ...Array.from(new Set(products.map(p => p.category)))]

    const filteredProducts = products.filter(p => {
        const matchSearch = p.name.toLowerCase().includes(search.toLowerCase())
        const matchCat = category === 'All' || p.category === category
        return matchSearch && matchCat
    })

    const addToCart = (product: any) => {
        setCart(prev => {
            const existing = prev.find(item => item.id === product.id)
            if (existing) {
                return prev.map(item =>
                    item.id === product.id
                        ? { ...item, qty: item.qty + 1 }
                        : item
                )
            }
            return [...prev, { ...product, qty: 1 }]
        })
    }

    const updateQty = (id: string, delta: number) => {
        setCart(prev => prev.map(item => {
            if (item.id === id) {
                const newQty = Math.max(0, item.qty + delta)
                return { ...item, qty: newQty }
            }
            return item
        }).filter(item => item.qty > 0))
    }

    const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0)

    const handleOpenShift = async () => {
        if (!startingCash) {
            showToast(t('pleaseEnterStartingCash'), 'warning')
            return
        }
        setIsProcessing(true)
        try {
            const res = await fetch('/api/pos/shift/open', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user?.id, startCash: Number(startingCash) })
            })
            if (res.ok) {
                const shift = await res.json()
                setActiveShift(shift)
                setStartingCash('')
                showToast(t('shiftOpenedSuccessfully'), 'success')
            } else {
                showToast(t('failedToOpenShift'), 'error')
            }
        } catch (error) {
            console.error(error)
            showToast(t('errorOpeningShift'), 'error')
        } finally {
            setIsProcessing(false)
        }
    }

    const handleCloseShift = async () => {
        if (!activeShift) return

        setIsProcessing(true)
        setIsCloseModalOpen(false)
        try {
            const res = await fetch('/api/pos/shift/close', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ shiftId: activeShift.id, endCash: 0 })
            })

            if (res.ok) {
                showToast(t('shiftClosedSuccessfully'), 'success')
                setActiveShift(null)
                setShiftData(null)
                setShowShiftModal(false)
                setIsCloseModalOpen(false)
            } else {
                showToast(t('failedToCloseShift'), 'error')
            }
        } catch (error) {
            console.error(error)
            showToast(t('errorClosingShift'), 'error')
        } finally {
            setIsProcessing(false)
        }
    }

    const handleCheckout = async () => {
        if (!activeShift) {
            showToast(t('pleaseOpenShiftFirst'), 'error')
            return
        }
        if (cart.length === 0) return

        setIsProcessing(true)
        try {
            const res = await fetch('/api/pos/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    items: cart.map(i => ({ productId: i.id, name: i.name, price: i.price, qty: i.qty })),
                    total,
                    paymentMethod: paymentMethod,
                    userId: user?.id,
                    shiftId: activeShift.id
                })
            })

            if (res.ok) {
                showToast(t('paymentSuccessful'), 'success')
                setCart([])
                setIsPaymentModalOpen(false)
                fetch('/api/pos/products')
                    .then(res => res.json())
                    .then(data => setProducts(data))
                checkActiveShift()
            } else {
                showToast(t('paymentFailed'), 'error')
            }
        } catch (err) {
            console.error(err)
            showToast(t('errorProcessingPayment'), 'error')
        } finally {
            setIsProcessing(false)
        }
    }

    const initiateCheckout = (method: string) => {
        setPaymentMethod(method)
        setIsPaymentModalOpen(true)
    }

    // Modal to Open Shift if none active
    if (!activeShift && !loading) {
        return (
            <Shell>
                <div className="flex items-center justify-center h-[calc(100vh-100px)]">
                    <div className="w-full max-w-sm p-6 bg-card border rounded-3xl shadow-xl space-y-4">
                        <div className="space-y-1.5 text-left">
                            <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">{t('startingCash')}</label>
                            <input
                                type="number"
                                placeholder="0.00"
                                className="w-full h-12 px-4 rounded-xl border bg-background font-mono text-lg font-bold focus:ring-2 focus:ring-primary/20 outline-none"
                                value={startingCash}
                                onChange={(e) => setStartingCash(e.target.value)}
                            />
                        </div>
                        <button
                            onClick={handleOpenShift}
                            disabled={isProcessing}
                            className="w-full py-4 bg-primary text-white font-black rounded-2xl shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all disabled:opacity-50"
                        >
                            {isProcessing ? t('processing') : t('openShift')}
                        </button>
                    </div>
                </div>
            </Shell>
        )
    }

    return (
        <Shell>
            <div className="flex flex-col lg:flex-row h-[calc(100vh-80px)] md:h-[calc(100vh-100px)] gap-4 md:gap-6 pb-20 lg:pb-0 relative">
                {/* Left: Product Catalog */}
                <div className="flex-1 flex flex-col space-y-3 md:space-y-4 min-h-0">
                    <div className="flex flex-col md:flex-row gap-3 bg-card p-3 md:p-4 rounded-xl border shadow-sm">
                        <div className="relative">
                            <Search className="absolute left-3 top-3 text-muted-foreground" size={18} />
                            <input
                                type="text"
                                placeholder={t('searchProducts')}
                                className="w-full pl-10 pr-4 py-3 bg-secondary/50 border-none rounded-xl outline-none focus:ring-2 focus:ring-primary/20"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <div className="flex space-x-2 overflow-x-auto pb-1 scrollbar-hide">
                            {categories.map(c => (
                                <button
                                    key={c}
                                    onClick={() => setCategory(c)}
                                    className={cn(
                                        "px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-xs md:text-sm font-bold whitespace-nowrap transition-colors",
                                        category === c
                                            ? "bg-primary text-white shadow-lg shadow-primary/20"
                                            : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                                    )}
                                >
                                    {c}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4 overflow-y-auto pr-2 custom-scrollbar flex-1">
                        {filteredProducts.map(product => (
                            <button
                                key={product.id}
                                onClick={() => addToCart(product)}
                                disabled={product.stock <= 0}
                                className="bg-card border rounded-xl p-3 md:p-4 flex flex-col items-center text-center space-y-2 md:space-y-3 hover:border-primary/50 hover:shadow-lg transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <div className="w-16 h-16 md:w-20 md:h-20 bg-secondary rounded-full flex items-center justify-center text-xl md:text-2xl font-bold text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                    {product.name.charAt(0)}
                                </div>
                                <div className="min-w-0 w-full">
                                    <h3 className="font-bold text-foreground text-sm md:text-base truncate">{product.name}</h3>
                                    <p className="text-[10px] md:text-xs text-muted-foreground italic">{product.stock} {t('inStock')}</p>
                                </div>
                                <div className="font-black text-base md:text-lg text-primary">
                                    {formatCurrency(product.price)}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Right: Cart */}
                {isCartOpen && (
                    <div
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150] lg:hidden animate-in fade-in duration-300"
                        onClick={() => setIsCartOpen(false)}
                    />
                )}

                <div className={cn(
                    "fixed lg:relative inset-x-0 bottom-0 lg:bottom-auto lg:inset-x-auto h-[80vh] lg:h-full lg:w-96 flex flex-col bg-card border-t lg:border-l rounded-t-[2rem] lg:rounded-2xl shadow-2xl lg:shadow-xl overflow-hidden z-[160] lg:z-10 transition-transform duration-300 transform",
                    isCartOpen ? "translate-y-0" : "translate-y-full lg:translate-y-0"
                )}>
                    <div className="p-4 border-b bg-secondary/30 flex justify-between items-center shrink-0">
                        <div className="flex flex-col">
                            <h2 className="font-black text-lg flex items-center">
                                <ShoppingCart className="mr-2" size={20} /> {t('currentOrder')}
                            </h2>
                            {activeShift && (
                                <span className="text-[10px] font-mono text-muted-foreground">
                                    {t('shift')} #{activeShift.id?.slice(-8)}
                                </span>
                            )}
                        </div>
                        <button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-secondary rounded-full lg:hidden">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                        {cart.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-muted-foreground space-y-4 opacity-50 italic">
                                <ShoppingCart size={40} className="md:size-12" />
                                <p className="text-sm md:text-base">{t('cartIsEmpty')}</p>
                            </div>
                        ) : (
                            cart.map(item => (
                                <div key={item.id} className="flex justify-between items-center bg-secondary/20 p-2 md:p-3 rounded-xl border border-transparent hover:border-gray-200 transition-all">
                                    <div className="min-w-0 flex-1 mr-2">
                                        <p className="font-bold text-xs md:text-sm truncate">{item.name}</p>
                                        <p className="text-[10px] md:text-xs text-muted-foreground font-medium">{formatCurrency(item.price)} x {item.qty}</p>
                                    </div>
                                    <div className="flex items-center space-x-2 md:space-x-3 shrink-0">
                                        <div className="flex items-center space-x-1 bg-card rounded-lg border shadow-sm">
                                            <button onClick={() => updateQty(item.id, -1)} className="p-1 hover:bg-secondary rounded-l transition-colors">
                                                <Minus size={12} className="md:size-[14px]" />
                                            </button>
                                            <span className="w-6 md:w-8 text-center text-xs md:text-sm font-bold">{item.qty}</span>
                                            <button onClick={() => updateQty(item.id, 1)} className="p-1 hover:bg-secondary rounded-r transition-colors">
                                                <Plus size={12} className="md:size-[14px]" />
                                            </button>
                                        </div>
                                        <div className="text-right w-14 md:w-16">
                                            <p className="font-bold text-xs md:text-sm">{formatCurrency(item.price * item.qty)}</p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="p-4 md:p-6 bg-secondary/30 space-y-3 md:space-y-4 shrink-0 pb-8 lg:pb-6">
                        <div className="flex justify-between items-center text-lg md:text-xl font-black italic">
                            <span>{t('total')}</span>
                            <span className="text-primary">{formatCurrency(total)}</span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 md:gap-3">
                            <button
                                onClick={() => initiateCheckout('CASH')}
                                disabled={cart.length === 0 || isProcessing}
                                className="flex flex-col items-center justify-center p-2.5 md:p-3 bg-emerald-500 text-white rounded-xl md:rounded-2xl hover:bg-emerald-600 transition-colors disabled:opacity-50 shadow-md shadow-emerald-500/20 active:scale-95"
                            >
                                <Banknote size={20} className="mb-0.5 md:mb-1 md:size-6" />
                                <span className="text-[10px] md:text-xs font-bold uppercase">{t('cash')}</span>
                            </button>
                            <button
                                onClick={() => initiateCheckout('QR')}
                                disabled={cart.length === 0 || isProcessing}
                                className="flex flex-col items-center justify-center p-2.5 md:p-3 bg-blue-500 text-white rounded-xl md:rounded-2xl hover:bg-blue-600 transition-colors disabled:opacity-50 shadow-md shadow-blue-500/20 active:scale-95"
                            >
                                <CreditCard size={20} className="mb-0.5 md:mb-1 md:size-6" />
                                <span className="text-[10px] md:text-xs font-bold uppercase">{t('qrPay')}</span>
                            </button>
                        </div>

                        <div className="pt-3 md:pt-4 border-t border-gray-200">
                            <button
                                onClick={() => {
                                    checkActiveShift()
                                    setShowShiftModal(true)
                                }}
                                className="w-full py-2.5 md:py-3 bg-zinc-800 text-white rounded-xl md:rounded-2xl font-bold text-xs md:text-sm hover:bg-zinc-700 shadow-lg active:scale-95 transition-all"
                            >
                                {t('closeShift')} / {t('summary')}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Cart Floating Button */}
                <button
                    onClick={() => setIsCartOpen(true)}
                    className="fixed bottom-4 right-4 z-[140] lg:hidden bg-primary text-white p-4 rounded-full shadow-2xl flex items-center space-x-2 animate-bounce-subtle"
                >
                    <div className="relative">
                        <ShoppingCart size={24} />
                        {cart.length > 0 && (
                            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">
                                {cart.reduce((s, i) => s + i.qty, 0)}
                            </span>
                        )}
                    </div>
                    <span className="font-black italic text-sm">{formatCurrency(total)}</span>
                </button>
            </div>

            {/* Shift Summary Modal */}
            {showShiftModal && (
                <div
                    className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in duration-200"
                    onClick={() => setShowShiftModal(false)}
                >
                    <div
                        className="bg-card w-full max-w-lg p-6 md:p-8 rounded-2xl shadow-2xl space-y-8 overflow-y-auto max-h-[90vh]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header Info */}
                        <div className="flex justify-between items-start">
                            <div className="space-y-1 text-[11px] font-mono text-muted-foreground">
                                <div className="flex space-x-2">
                                    <span>Shift ID:</span>
                                    <span className="font-bold">{activeShift?.id}</span>
                                </div>
                                <div className="flex space-x-2">
                                    <span>{t('date')}:</span>
                                    <span className="font-bold">{new Date().toLocaleDateString('th-TH')}</span>
                                </div>
                            </div>
                            <button onClick={() => setShowShiftModal(false)} className="p-2 hover:bg-secondary rounded-full transition-colors">
                                <X size={20} className="text-muted-foreground" />
                            </button>
                        </div>

                        {shiftData ? (
                            <div className="space-y-10 text-[14px]">
                                {/* Section 1: POS Sales */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-black text-[#3b82f6] border-b pb-2 uppercase tracking-wide">{t('posSection')}</h3>
                                    <div className="space-y-2.5">
                                        <div className="flex justify-between items-center font-bold">
                                            <span className="text-zinc-800">{t('posSales')}</span>
                                            <div className="flex items-center">
                                                <span className="text-zinc-400 text-[11px] font-black uppercase tracking-tighter mr-6">{shiftData.pos?.count} BILLS</span>
                                                <span className="w-28 text-right text-lg">{formatCurrency(shiftData.pos?.total || 0)}</span>
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center text-zinc-500 font-medium">
                                            <span>{t('totalDiscount')}</span>
                                            <span className="w-28 text-right">-{formatCurrency(shiftData.pos?.discount || 0)}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-zinc-500 font-medium pb-2">
                                            <span>{t('avgBill')}</span>
                                            <span className="w-28 text-right">{formatCurrency(shiftData.pos?.avg || 0)}</span>
                                        </div>
                                        <div className="flex justify-between items-center pt-3 border-t font-black text-[#3b82f6] text-xl">
                                            <span>{t('saleAfterDisc')}</span>
                                            <span className="w-28 text-right">฿{Number(shiftData.pos?.afterDiscount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Section 2: Room Revenue */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-black text-[#10b981] border-b pb-2 uppercase tracking-wide">{t('roomSection')}</h3>
                                    <div className="space-y-2.5">
                                        <div className="flex justify-between items-center font-bold text-[#10b981]">
                                            <span className="text-zinc-800 tracking-tight">roomRevenue</span>
                                            <div className="flex items-center">
                                                <span className="text-zinc-400 text-[11px] font-black uppercase tracking-tighter mr-6">{shiftData.room?.count} TRANS</span>
                                                <span className="w-28 text-right text-lg">฿{Number(shiftData.room?.total || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Payment Breakdown Section */}
                                <div className="space-y-6">
                                    <h3 className="text-sm font-black text-zinc-400 border-b pb-1 uppercase tracking-widest">{t('paymentBreakdownHeader')}</h3>

                                    {/* Cash Group */}
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center font-black text-zinc-600">
                                            <span>{t('cash')}</span>
                                            <span className="w-28 text-right text-lg">{formatCurrency(shiftData.payments?.cash?.total || 0)}</span>
                                        </div>
                                        {shiftData.payments?.cash?.list?.map((item: any) => (
                                            <div key={item.method} className="flex justify-between items-center pl-1 font-bold">
                                                <span className="text-zinc-800 capitalize">{item.method.toLowerCase()}</span>
                                                <div className="flex items-center">
                                                    <span className="text-zinc-400 text-[11px] font-bold lowercase mr-6">{item.count} bills</span>
                                                    <span className="w-28 text-right">{formatCurrency(item.amount)}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Non-Cash Group */}
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center font-black text-zinc-600 pt-2 border-t border-zinc-100">
                                            <span>{t('nonCash')}</span>
                                            <span className="w-28 text-right text-lg">{formatCurrency(shiftData.payments?.nonCash?.total || 0)}</span>
                                        </div>
                                        {shiftData.payments?.nonCash?.list?.map((item: any) => (
                                            <div key={item.method} className="flex justify-between items-center pl-1 font-bold">
                                                <span className="text-zinc-800 capitalize">{item.method.toLowerCase() === 'qr_pay' ? 'Qr' : item.method.toLowerCase().replace('_', ' ')}</span>
                                                <div className="flex items-center">
                                                    <span className="text-zinc-400 text-[11px] font-bold lowercase mr-6">{item.count} bills</span>
                                                    <span className="w-28 text-right">{formatCurrency(item.amount)}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Section 3: Cash In-Out */}
                                <div className="space-y-5">
                                    <h3 className="text-lg font-black text-[#3b82f6] border-b pb-2 uppercase tracking-wide">{t('cashFlowSection')}</h3>
                                    <div className="space-y-3 px-1">
                                        <div className="flex justify-between items-center font-bold text-zinc-500">
                                            <span>{t('startingCash')}</span>
                                            <span className="w-28 text-right font-black">฿{Number(shiftData.cashFlow?.startCash || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                        </div>
                                        <div className="flex justify-between items-center font-black text-[#10b981]">
                                            <span>{t('cashInLabel')}</span>
                                            <span className="w-28 text-right text-lg">+{formatCurrency(shiftData.cashFlow?.cashIn || 0)}</span>
                                        </div>
                                        <div className="flex justify-between items-center font-black text-[#ef4444]">
                                            <span>{t('cashOutLabel')}</span>
                                            <span className="w-28 text-right text-lg">-{formatCurrency(shiftData.cashFlow?.cashOut || 0)}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Final Dashed Border */}
                                <div className="border-t-2 border-dashed border-zinc-300 pt-4"></div>
                            </div>
                        ) : (
                            <div className="flex justify-center py-12">
                                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#3b82f6]"></div>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex flex-col gap-3 py-4">
                            <div className="flex space-x-3">
                                <button
                                    onClick={() => window.print()}
                                    className="flex-1 py-4 border border-zinc-200 rounded-xl font-black text-zinc-700 hover:bg-zinc-50 transition-all active:scale-95"
                                >
                                    {t('printReport')}
                                </button>
                                <button
                                    onClick={() => setIsCloseModalOpen(true)}
                                    className="flex-1 py-4 bg-red-500 text-white rounded-xl font-black shadow-lg shadow-red-500/20 hover:bg-red-600 transition-all active:scale-95"
                                >
                                    {t('confirmClose')}
                                </button>
                            </div>
                            <button
                                onClick={() => setShowShiftModal(false)}
                                className="w-full py-4 bg-zinc-100 text-zinc-500 rounded-xl font-black hover:bg-zinc-200 transition-all"
                            >
                                {t('cancel')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmationModal
                isOpen={isCloseModalOpen}
                title={t('closeShift')}
                message={t('confirmCloseShiftMessage')}
                confirmLabel={t('confirmClose')}
                type="danger"
                isProcessing={isProcessing}
                onConfirm={handleCloseShift}
                onCancel={() => setIsCloseModalOpen(false)}
            />

            <ConfirmationModal
                isOpen={isPaymentModalOpen}
                title={t('confirmPayment')}
                message={t('confirmPaymentMessage')}
                confirmLabel={t('confirmPayment')}
                isProcessing={isProcessing}
                onConfirm={handleCheckout}
                onCancel={() => setIsPaymentModalOpen(false)}
            />
        </Shell>
    )
}
