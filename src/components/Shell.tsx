'use client'

import React, { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useTranslation } from '@/lib/LanguageContext'
import {
    LayoutDashboard,
    Bed,
    CalendarDays,
    Hammer,
    ClipboardCheck,
    FileBarChart,
    Settings,
    LogOut,
    ChevronLeft,
    ChevronRight,
    User as UserIcon,
    Globe,
    ShoppingBag
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface SidebarItemProps {
    icon: any
    label: string
    href: string
    active?: boolean
    collapsed?: boolean
}

function SidebarItem({ icon: Icon, label, href, active, collapsed }: SidebarItemProps) {
    const router = useRouter()
    return (
        <button
            onClick={() => router.push(href)}
            className={cn(
                "flex items-center w-full p-3 my-1 transition-all rounded-lg group",
                active ? "bg-primary text-primary-foreground shadow-md" : "hover:bg-secondary text-muted-foreground hover:text-foreground",
                collapsed ? "justify-center" : "space-x-3"
            )}
        >
            <Icon size={20} className={cn(!active && "text-muted-foreground group-hover:text-foreground")} />
            {!collapsed && <span className="font-medium">{label}</span>}
        </button>
    )
}

export function Shell({ children }: { children: React.ReactNode }) {
    const { lang, setLang, t } = useTranslation()
    const [collapsed, setCollapsed] = useState(false)
    const [user, setUser] = useState<any>(null)
    const pathname = usePathname()
    const router = useRouter()

    React.useEffect(() => {
        fetch('/api/auth/me')
            .then(res => res.json())
            .then(json => {
                if (!json.error) setUser(json)
            })
            .catch(err => console.error('Failed to fetch user', err))
    }, [])

    const allNavItems = [
        { icon: LayoutDashboard, label: t('dashboard'), href: '/dashboard' },
        { icon: Bed, label: t('rooms'), href: '/rooms' },
        { icon: CalendarDays, label: t('reservations'), href: '/reservations' },
        { icon: ClipboardCheck, label: t('housekeeping'), href: '/housekeeping' },
        { icon: Hammer, label: t('maintenance'), href: '/maintenance' },
        { icon: FileBarChart, label: t('reports'), href: '/reports' },
        { icon: ShoppingBag, label: t('pos'), href: '/pos' },
        { icon: Settings, label: t('settings'), href: '/settings', role: 'ADMIN' },
    ]

    const navItems = allNavItems.filter(item => !item.role || user?.role === item.role)

    const handleLogout = async () => {
        // Basic logout: clear cookie (would normally call api/auth/logout)
        document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;"
        router.push('/login')
    }

    return (
        <div className="flex h-screen bg-background overflow-hidden">
            {/* Sidebar */}
            <aside
                className={cn(
                    "flex flex-col h-full transition-all duration-300 border-r bg-card",
                    collapsed ? "w-20" : "w-64"
                )}
            >
                <div className="flex items-center justify-between p-4 border-b">
                    {!collapsed && <span className="text-xl font-bold text-primary truncate">{t('hotelName')}</span>}
                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        className="p-1 rounded-md hover:bg-secondary text-muted-foreground"
                    >
                        {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
                    </button>
                </div>

                <nav className="flex-1 px-3 py-4 overflow-y-auto">
                    {navItems.map((item) => (
                        <SidebarItem
                            key={item.href}
                            {...item}
                            active={pathname.startsWith(item.href)}
                            collapsed={collapsed}
                        />
                    ))}
                </nav>

                <div className="p-3 border-t">
                    <button
                        onClick={handleLogout}
                        className={cn(
                            "flex items-center w-full p-3 transition-colors rounded-lg text-destructive hover:bg-destructive/10",
                            collapsed ? "justify-center" : "space-x-3"
                        )}
                    >
                        <LogOut size={20} />
                        {!collapsed && <span className="font-medium">{t('logout')}</span>}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
                {/* Header */}
                <header className="flex items-center justify-between h-16 px-6 border-b bg-card">
                    <h1 className="text-lg font-semibold truncate capitalize">
                        {navItems.find(i => pathname.startsWith(i.href))?.label || ''}
                    </h1>

                    <div className="flex items-center space-x-4">
                        {/* Language Toggle */}
                        <button
                            onClick={() => setLang(lang === 'TH' ? 'EN' : 'TH')}
                            className="flex items-center px-3 py-1.5 space-x-2 text-sm font-medium border rounded-full hover:bg-secondary"
                        >
                            <Globe size={16} />
                            <span>{lang}</span>
                        </button>

                        {/* User Profile */}
                        <div className="flex items-center space-x-3 border-l pl-4">
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-medium leading-none capitalize">{user?.username || 'Guest'}</p>
                                <p className="text-xs text-muted-foreground uppercase">{user?.role || ''}</p>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                                <UserIcon size={18} />
                            </div>
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-6 bg-secondary/30">
                    {children}
                </main>
            </div>
        </div>
    )
}
