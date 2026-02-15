'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from '@/lib/LanguageContext'
import { useAuth } from '@/lib/AuthContext'
import { Lock, User, Globe } from 'lucide-react'

export default function LoginPage() {
    const { lang, setLang, t } = useTranslation()
    const { refreshUser } = useAuth()
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const router = useRouter()

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            })

            if (res.ok) {
                await refreshUser()
                router.push('/dashboard')
            } else {
                setError('Invalid username or password')
            }
        } catch (err) {
            setError('Connection failed')
        }
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-secondary/30">
            <div className="w-full max-w-md p-8 bg-card border rounded-2xl shadow-xl space-y-8">
                <div className="flex flex-col items-center">
                    <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4">
                        <Lock size={32} />
                    </div>
                    <h2 className="text-2xl font-bold">{t('hotelName')}</h2>
                    <p className="text-muted-foreground mt-1">{t('login')}</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    {error && (
                        <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">
                            {error}
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-sm font-medium">{t('username') || 'Username'}</label>
                        <div className="relative">
                            <User className="absolute left-3 top-3 text-muted-foreground" size={18} />
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                                placeholder="reception / admin"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">{t('password') || 'Password'}</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-3 text-muted-foreground" size={18} />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                                placeholder="••••••••"
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full py-3 font-bold text-white bg-primary rounded-lg hover:bg-primary/90 transition-all shadow-lg active:scale-[0.98]"
                    >
                        {t('login')}
                    </button>
                </form>

                <div className="flex justify-center border-t pt-6">
                    <button
                        onClick={() => setLang(lang === 'TH' ? 'EN' : 'TH')}
                        className="flex items-center space-x-2 text-sm text-muted-foreground hover:text-foreground"
                    >
                        <Globe size={16} />
                        <span>Switch to {lang === 'TH' ? 'English' : 'Thai'}</span>
                    </button>
                </div>
            </div>
        </div>
    )
}
