'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

interface User {
    id: string
    username: string
    role: string
}

interface AuthContextType {
    user: User | null
    loading: boolean
    refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)

    const refreshUser = async () => {
        try {
            const res = await fetch('/api/auth/me')
            const data = await res.json()
            if (!data.error) {
                setUser(data)
            } else {
                setUser(null)
            }
        } catch (err) {
            console.error('Failed to fetch user', err)
            setUser(null)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        refreshUser()
    }, [])

    return (
        <AuthContext.Provider value={{ user, loading, refreshUser }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
