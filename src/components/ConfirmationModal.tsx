'use client'

import React from 'react'
import { AlertCircle, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ConfirmationModalProps {
    isOpen: boolean
    title: string
    message: string
    confirmLabel?: string
    cancelLabel?: string
    onConfirm: () => void
    onCancel: () => void
    type?: 'danger' | 'primary' | 'warning'
    isProcessing?: boolean
}

export function ConfirmationModal({
    isOpen,
    title,
    message,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    onConfirm,
    onCancel,
    type = 'primary',
    isProcessing = false
}: ConfirmationModalProps) {
    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-card w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden border animate-in zoom-in-95 duration-200">
                <div className="p-6 text-center space-y-4">
                    <div className={cn(
                        "w-16 h-16 rounded-full flex items-center justify-center mx-auto",
                        type === 'danger' && "bg-red-100 text-red-600",
                        type === 'primary' && "bg-primary/10 text-primary",
                        type === 'warning' && "bg-amber-100 text-amber-600"
                    )}>
                        <AlertCircle size={32} />
                    </div>

                    <div className="space-y-1">
                        <h3 className="text-xl font-black uppercase tracking-tight">{title}</h3>
                        <p className="text-muted-foreground text-sm">{message}</p>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            onClick={onCancel}
                            disabled={isProcessing}
                            className="flex-1 py-3 rounded-xl font-bold bg-secondary hover:bg-secondary/80 transition-colors disabled:opacity-50"
                        >
                            {cancelLabel}
                        </button>
                        <button
                            onClick={onConfirm}
                            disabled={isProcessing}
                            className={cn(
                                "flex-1 py-3 rounded-xl font-black text-white shadow-lg transition-all active:scale-95 disabled:opacity-50",
                                type === 'danger' && "bg-red-500 shadow-red-200 hover:bg-red-600",
                                type === 'primary' && "bg-primary shadow-primary/20 hover:bg-primary/90",
                                type === 'warning' && "bg-amber-500 shadow-amber-200 hover:bg-amber-600"
                            )}
                        >
                            {isProcessing ? 'Wait...' : confirmLabel}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
