'use client'

import React, { createContext, useContext, useState, useCallback } from 'react'
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react'
import { cn } from '@/lib/utils'

type ToastType = 'success' | 'error' | 'info' | 'warning'

interface Toast {
    id: string
    message: string
    type: ToastType
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([])

    const showToast = useCallback((message: string, type: ToastType = 'success') => {
        const id = Math.random().toString(36).substr(2, 9)
        setToasts((prev) => [...prev, { id, message, type }])

        // Auto-remove after 4 seconds
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id))
        }, 4000)
    }, [])

    const removeToast = (id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
    }

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className={cn(
                            "flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl border animate-in slide-in-from-right-full duration-300 pointer-events-auto min-w-[300px]",
                            toast.type === 'success' && "bg-emerald-50 border-emerald-200 text-emerald-800",
                            toast.type === 'error' && "bg-red-50 border-red-200 text-red-800",
                            toast.type === 'info' && "bg-blue-50 border-blue-200 text-blue-800",
                            toast.type === 'warning' && "bg-amber-50 border-amber-200 text-amber-800"
                        )}
                    >
                        <div className="flex-shrink-0">
                            {toast.type === 'success' && <CheckCircle size={20} />}
                            {toast.type === 'error' && <AlertCircle size={20} />}
                            {toast.type === 'info' && <Info size={20} />}
                            {toast.type === 'warning' && <AlertCircle size={20} />}
                        </div>
                        <p className="flex-1 font-bold text-sm">{toast.message}</p>
                        <button
                            onClick={() => removeToast(toast.id)}
                            className="p-1 hover:bg-black/5 rounded-full transition-colors"
                        >
                            <X size={16} className="opacity-50" />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    )
}

export function useToast() {
    const context = useContext(ToastContext)
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider')
    }
    return context
}
