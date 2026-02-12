'use client'

import React, { useEffect, useState } from 'react'
import { Shell } from '@/components/Shell'
import { Search, ShoppingCart, Plus, Minus, Trash2, CreditCard, Banknote, Wallet } from 'lucide-react'
import { cn, formatCurrency } from '@/lib/utils'
import { useToast } from '@/lib/ToastContext'
import { ConfirmationModal } from '@/components/ConfirmationModal'

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

export default function PosPage() {
    const { showToast } = useToast()
    const [products, setProducts] = useState<Product[]>([])
    const [cart, setCart] = useState<CartItem[]>([])
    const [search, setSearch] = useState('')
    const [category, setCategory] = useState('All')
    const [loading, setLoading] = useState(false)
    const [processing, setProcessing] = useState(false)
    const [showShiftModal, setShowShiftModal] = useState(false)
    const [shiftData, setShiftData] = useState<any>(null)
    const [activeShift, setActiveShift] = useState<any>(null)
    const [startCash, setStartCash] = useState('')

    // Confirmation states
    const [confirmCloseOpen, setConfirmCloseOpen] = useState(false)
    const [confirmPaymentOpen, setConfirmPaymentOpen] = useState(false)
    const [pendingPaymentMethod, setPendingPaymentMethod] = useState('')

    // 1. Check for Active Shift on Load
    useEffect(() => {
        checkActiveShift()
    }, [])

    const checkActiveShift = () => {
        fetch('/api/pos/shift/check')
            .then(res => res.json())
            .then(data => {
                setActiveShift(data)
                // If we have an active shift, also load shift stats for the "Close Shift" preview
                if (data) {
                    setShiftData(data.stats)
                }
            })
            .catch(err => console.error(err))
    }

    // Load Shift Data when modal opens
    useEffect(() => {
        if (showShiftModal) {
            // shiftData is already set by checkActiveShift if there's an active shift
            // If modal is opened without an active shift (e.g., for a new shift), shiftData would be null
            // For now, we rely on checkActiveShift to populate it.
        }
    }, [showShiftModal])

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
        if (!startCash) {
            showToast('Please enter starting cash', 'warning')
            return
        }
        setProcessing(true)
        try {
            const res = await fetch('/api/pos/shift/open', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: 'user_admin', startCash: Number(startCash) })
            })
            if (res.ok) {
                const shift = await res.json()
                setActiveShift(shift)
                setStartCash('')
                showToast('Shift opened successfully', 'success')
            } else {
                showToast('Failed to open shift', 'error')
            }
        } catch (error) {
            console.error(error)
            showToast('Error opening shift', 'error')
        } finally {
            setProcessing(false)
        }
    }

    const handleCloseShift = async () => {
        if (!activeShift) return

        setProcessing(true)
        setConfirmCloseOpen(false)
        try {
            const res = await fetch('/api/pos/shift/close', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ shiftId: activeShift.id, endCash: 0 }) // TODO: Input actual end cash
            })

            if (res.ok) {
                showToast('Shift Closed Successfully', 'success')
                setActiveShift(null)
                setShiftData(null)
                setShowShiftModal(false)
                setConfirmCloseOpen(false)
                // Print functionality would go here
            } else {
                showToast('Failed to close shift', 'error')
            }
        } catch (error) {
            console.error(error)
            showToast('Error closing shift', 'error')
        } finally {
            setProcessing(false)
        }
    }

    const handleCheckout = async () => {
        if (!activeShift) {
            showToast('Please open a shift first!', 'error')
            return
        }
        if (cart.length === 0) return

        setProcessing(true)
        try {
            const res = await fetch('/api/pos/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    items: cart.map(i => ({ productId: i.id, name: i.name, price: i.price, qty: i.qty })),
                    total,
                    paymentMethod: pendingPaymentMethod,
                    userId: 'user_admin', // TODO: Get from session
                    shiftId: activeShift.id
                })
            })

            if (res.ok) {
                showToast('Payment Successful!', 'success')
                setCart([])
                setConfirmPaymentOpen(false)
                // Refresh products to see stock update
                fetch('/api/pos/products')
                    .then(res => res.json())
                    .then(data => setProducts(data))
                // Refresh shift stats
                checkActiveShift()
            } else {
                showToast('Payment Failed', 'error')
            }
        } catch (err) {
            console.error(err)
            showToast('Error processing payment', 'error')
        } finally {
            setProcessing(false)
        }
    }

    const initiateCheckout = (method: string) => {
        setPendingPaymentMethod(method)
        setConfirmPaymentOpen(true)
    }

    // Modal to Open Shift if none active
    if (!activeShift && !loading) {
        return (
            <Shell>
                <div className="flex items-center justify-center h-[calc(100vh-100px)]">
                    <div className="bg-card w-full max-w-md p-8 rounded-2xl shadow-xl border text-center space-y-6">
                        <div className="w-20 h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto">
                            <Wallet size={40} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black">Open New Shift</h2>
                            <p className="text-muted-foreground">Please start a shift to begin selling.</p>
                        </div>

                        <div className="text-left space-y-2">
                            <label className="text-sm font-bold">Starting Cash Float</label>
                            <input
                                type="number"
                                value={startCash}
                                onChange={(e) => setStartCash(e.target.value)}
                                placeholder="0.00"
                                className="w-full p-3 bg-secondary rounded-xl font-mono text-lg outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>

                        <button
                            onClick={handleOpenShift}
                            disabled={processing}
                            className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-bold text-lg hover:bg-primary/90 transition-colors"
                        >
                            Open Shift
                        </button>
                    </div>
                </div>
            </Shell>
        )
    }

    return (
        <Shell>
            <div className="flex h-[calc(100vh-100px)] gap-6">
                {/* Left: Product Catalog */}
                <div className="flex-1 flex flex-col space-y-4">
                    {/* Filters */}
                    <div className="flex space-x-4 bg-card p-4 rounded-xl border shadow-sm">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-3 text-muted-foreground" size={18} />
                            <input
                                type="text"
                                placeholder="Search products..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-secondary/50 border-none rounded-lg outline-none focus:ring-2 focus:ring-primary/20"
                            />
                        </div>
                        <div className="flex space-x-2 overflow-x-auto pb-1">
                            {categories.map(c => (
                                <button
                                    key={c}
                                    onClick={() => setCategory(c)}
                                    className={cn(
                                        "px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-colors",
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

                    {/* Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 overflow-y-auto pr-2">
                        {filteredProducts.map(product => (
                            <button
                                key={product.id}
                                onClick={() => addToCart(product)}
                                disabled={product.stock <= 0}
                                className="bg-card border rounded-xl p-4 flex flex-col items-center text-center space-y-3 hover:border-primary/50 hover:shadow-lg transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center text-2xl font-bold text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                    {product.name.charAt(0)}
                                </div>
                                <div>
                                    <h3 className="font-bold text-foreground line-clamp-1">{product.name}</h3>
                                    <p className="text-xs text-muted-foreground">{product.stock} in stock</p>
                                </div>
                                <div className="font-black text-lg text-primary">
                                    {formatCurrency(product.price)}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Right: Cart */}
                <div className="w-96 flex flex-col bg-card border rounded-2xl shadow-xl overflow-hidden">
                    <div className="p-4 border-b bg-secondary/30 flex justify-between items-center">
                        <h2 className="font-black text-lg flex items-center">
                            <ShoppingCart className="mr-2" size={20} /> Current Order
                        </h2>
                        {activeShift && (
                            <span className="text-xs font-mono bg-green-100 text-green-700 px-2 py-1 rounded">
                                Shift #{activeShift.id?.slice(-4)}
                            </span>
                        )}
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {cart.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-muted-foreground space-y-4 opacity-50">
                                <ShoppingCart size={48} />
                                <p>Cart is empty</p>
                            </div>
                        ) : (
                            cart.map(item => (
                                <div key={item.id} className="flex justify-between items-center bg-secondary/20 p-3 rounded-lg">
                                    <div>
                                        <p className="font-bold text-sm">{item.name}</p>
                                        <p className="text-xs text-muted-foreground">{formatCurrency(item.price)} x {item.qty}</p>
                                    </div>
                                    <div className="flex items-center space-x-3">
                                        <div className="flex items-center space-x-1 bg-background rounded-lg border">
                                            <button
                                                onClick={() => updateQty(item.id, -1)}
                                                className="p-1 hover:bg-secondary rounded-l transition-colors"
                                            >
                                                <Minus size={14} />
                                            </button>
                                            <span className="w-8 text-center text-sm font-bold">{item.qty}</span>
                                            <button
                                                onClick={() => updateQty(item.id, 1)}
                                                className="p-1 hover:bg-secondary rounded-r transition-colors"
                                            >
                                                <Plus size={14} />
                                            </button>
                                        </div>
                                        <div className="text-right w-16">
                                            <p className="font-bold text-sm">{formatCurrency(item.price * item.qty)}</p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="p-6 bg-secondary/30 space-y-4">
                        <div className="flex justify-between items-center text-xl font-black">
                            <span>Total</span>
                            <span className="text-primary">{formatCurrency(total)}</span>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => initiateCheckout('CASH')}
                                disabled={cart.length === 0 || processing}
                                className="flex flex-col items-center justify-center p-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors disabled:opacity-50"
                            >
                                <Banknote size={24} className="mb-1" />
                                <span className="text-xs font-bold uppercase">Cash</span>
                            </button>
                            <button
                                onClick={() => initiateCheckout('QR')}
                                disabled={cart.length === 0 || processing}
                                className="flex flex-col items-center justify-center p-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors disabled:opacity-50"
                            >
                                <CreditCard size={24} className="mb-1" />
                                <span className="text-xs font-bold uppercase">QR Payment</span>
                            </button>
                        </div>

                        <div className="pt-4 border-t">
                            <button
                                onClick={() => {
                                    checkActiveShift() // Refresh stats before showing modal
                                    setShowShiftModal(true)
                                }}
                                className="w-full py-3 bg-zinc-800 text-white rounded-xl font-bold hover:bg-zinc-700 transition-colors"
                            >
                                Close Shift / Summary
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Shift Summary Modal */}
            {showShiftModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in duration-200">
                    <div className="bg-card w-full max-w-md p-6 rounded-2xl shadow-2xl space-y-6">
                        <div className="flex justify-between items-center border-b pb-4">
                            <h2 className="text-xl font-black">Shift Summary</h2>
                            <button onClick={() => setShowShiftModal(false)} className="p-1 hover:bg-secondary rounded-full">
                                <Minus size={20} className="rotate-45" />
                            </button>
                        </div>

                        {shiftData ? (
                            <div className="space-y-4">
                                <div className="p-4 bg-secondary/30 rounded-xl space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Shift ID</span>
                                        <span className="font-bold">{activeShift?.id}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Date</span>
                                        <span className="font-bold">{new Date().toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Total Orders</span>
                                        <span className="font-bold">{shiftData.orderCount}</span>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between items-center p-3 border rounded-lg">
                                        <span className="font-medium">POS Sales</span>
                                        <span className="font-bold text-lg">{formatCurrency(shiftData.posTotal || 0)}</span>
                                    </div>
                                    <div className="flex justify-between items-center p-3 border rounded-lg bg-emerald-50 text-emerald-700">
                                        <span className="font-medium">Room Revenue</span>
                                        <span className="font-bold text-lg">{formatCurrency(shiftData.roomTotal || 0)}</span>
                                    </div>
                                    <div className="flex justify-between items-center p-3 border rounded-lg">
                                        <span className="font-medium">Total Cash</span>
                                        <span className="font-bold text-green-600 text-lg">{formatCurrency(shiftData.cashSales)}</span>
                                    </div>
                                    <div className="flex justify-between items-center p-3 border rounded-lg">
                                        <span className="font-medium">Total Other</span>
                                        <span className="font-bold text-blue-600 text-lg">{formatCurrency(shiftData.otherSales)}</span>
                                    </div>
                                    <div className="flex justify-between items-center p-4 bg-primary/10 rounded-xl">
                                        <span className="font-black text-lg">Total Revenue</span>
                                        <span className="font-black text-2xl text-primary">{formatCurrency(shiftData.totalSales)}</span>
                                    </div>
                                </div>

                                <div className="flex space-x-3 pt-4">
                                    <button
                                        onClick={() => window.print()}
                                        className="flex-1 py-3 border border-border rounded-xl font-bold hover:bg-secondary transition-colors"
                                    >
                                        Print Report
                                    </button>
                                    <button
                                        onClick={() => setConfirmCloseOpen(true)}
                                        className="flex-1 py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-colors"
                                    >
                                        Confirm Close
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex justify-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Confirmation Modals */}
            <ConfirmationModal
                isOpen={confirmCloseOpen}
                title="Close Shift"
                message="Are you sure you want to end this shift? Ensure all cash is counted."
                confirmLabel="Yes, Close Shift"
                type="danger"
                isProcessing={processing}
                onConfirm={handleCloseShift}
                onCancel={() => setConfirmCloseOpen(false)}
            />

            <ConfirmationModal
                isOpen={confirmPaymentOpen}
                title="Confirm Payment"
                message={`Process payment of ${formatCurrency(total)} via ${pendingPaymentMethod}?`}
                confirmLabel="Confirm Payment"
                isProcessing={processing}
                onConfirm={handleCheckout}
                onCancel={() => setConfirmPaymentOpen(false)}
            />
        </Shell>
    )
}
