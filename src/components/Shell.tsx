'use client'

import React, { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useTranslation } from '@/lib/LanguageContext'
import { useAuth } from '@/lib/AuthContext'
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
    ShoppingBag,
    Banknote,
    Menu,
    X as CloseIcon
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
                "flex items-center w-full p-3 my-1.5 transition-all duration-300 rounded-xl group relative",
                active
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/10"
                    : "hover:bg-secondary/70 text-muted-foreground hover:text-foreground",
                collapsed ? "justify-center" : "space-x-3"
            )}
        >
            <Icon size={20} className={cn("transition-transform duration-300", !active && "text-muted-foreground group-hover:text-foreground")} />
            {!collapsed && <span className="font-semibold tracking-tight text-sm">{label}</span>}
            {active && !collapsed && (
                <div className="absolute left-0 w-1 h-5 bg-white rounded-full -ml-1" />
            )}
        </button>
    )
}

export function Shell({ children }: { children: React.ReactNode }) {
    const { lang, setLang, t } = useTranslation()
    const [collapsed, setCollapsed] = useState(false)
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const { user } = useAuth()
    const pathname = usePathname()
    const router = useRouter()

    const allNavItems = [
        { icon: LayoutDashboard, label: t('dashboard'), href: '/dashboard' },
        { icon: Bed, label: t('rooms'), href: '/rooms' },
        { icon: CalendarDays, label: t('reservations'), href: '/reservations' },
        { icon: ClipboardCheck, label: t('housekeeping'), href: '/housekeeping' },
        { icon: Hammer, label: t('maintenance'), href: '/maintenance' },
        { icon: FileBarChart, label: t('reports'), href: '/reports' },
        { icon: ShoppingBag, label: t('pos'), href: '/pos' },
        { icon: Banknote, label: t('finance'), href: '/finance' },
        { icon: Settings, label: t('settings'), href: '/settings', role: 'ADMIN' },
    ]

    const navItems = allNavItems.filter(item => !item.role || user?.role === item.role)

    const handleLogout = async () => {
        document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;"
        router.push('/login')
    }

    return (
        <div className="flex h-screen bg-background overflow-hidden font-sans relative">
            {/* Mobile Sidebar Overlay */}
            {mobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] lg:hidden animate-in fade-in duration-300"
                    onClick={() => setMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={cn(
                    "flex flex-col h-full transition-all duration-500 ease-in-out border-r bg-card fixed inset-y-0 left-0 lg:relative z-[110] lg:z-20",
                    collapsed ? "w-20" : "w-64",
                    mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
                )}
            >
                <div className="flex items-center justify-between p-5 mb-2">
                    {(!collapsed || mobileMenuOpen) ? (
                        <span className="text-xl font-bold text-primary tracking-tight">
                            {t('hotelName')}
                        </span>
                    ) : (
                        <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                            <Bed size={18} />
                        </div>
                    )}
                    <button
                        onClick={() => {
                            if (mobileMenuOpen) setMobileMenuOpen(false)
                            else setCollapsed(!collapsed)
                        }}
                        className="p-1.5 rounded-lg bg-secondary/50 hover:bg-secondary text-muted-foreground transition-all"
                    >
                        {mobileMenuOpen ? <CloseIcon size={18} /> : (collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />)}
                    </button>
                </div>

                <nav className="flex-1 px-4 py-2 overflow-y-auto custom-scrollbar">
                    {navItems.map((item) => (
                        <div key={item.href} onClick={() => setMobileMenuOpen(false)}>
                            <SidebarItem
                                {...item}
                                active={pathname.startsWith(item.href)}
                                collapsed={collapsed && !mobileMenuOpen}
                            />
                        </div>
                    ))}
                </nav>

                <div className="p-3 border-t border-dashed">
                    <button
                        onClick={handleLogout}
                        className={cn(
                            "flex items-center w-full p-3 transition-all duration-300 rounded-xl text-destructive hover:bg-destructive/10 group",
                            (collapsed && !mobileMenuOpen) ? "justify-center" : "space-x-3"
                        )}
                    >
                        <LogOut size={20} />
                        {(!collapsed || mobileMenuOpen) && <span className="font-semibold text-sm">{t('logout')}</span>}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex flex-col flex-1 min-w-0 overflow-hidden relative">
                {/* Header */}
                <header className="flex items-center justify-between h-16 px-4 md:px-6 border-b frosted sticky top-0 z-10 shrink-0">
                    <div className="flex items-center space-x-3">
                        <button
                            onClick={() => setMobileMenuOpen(true)}
                            className="p-2 -ml-2 lg:hidden text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <Menu size={24} />
                        </button>
                        <div className="w-1 h-6 bg-primary rounded-full hidden md:block" />
                        <h1 className="text-sm md:text-lg font-bold tracking-tight text-foreground uppercase truncate max-w-[150px] md:max-w-none">
                            {navItems.find(i => pathname.startsWith(i.href))?.label || ''}
                        </h1>
                    </div>

                    <div className="flex items-center space-x-4">
                        {/* Language Toggle */}
                        <button
                            onClick={() => setLang(lang === 'TH' ? 'EN' : 'TH')}
                            className="flex items-center px-3 py-1.5 space-x-2 text-xs font-bold border rounded-xl hover:bg-secondary transition-all bg-card/50"
                        >
                            <Globe size={14} className="text-primary" />
                            <span>{lang}</span>
                        </button>

                        {/* User Profile */}
                        <div className="flex items-center space-x-2 md:space-x-3 pl-2 md:pl-4 border-l">
                            <div className="text-right hidden sm:block">
                                <p className="text-[10px] md:text-xs font-bold leading-none text-foreground">{user?.username || 'Guest'}</p>
                                <p className="text-[8px] md:text-[9px] font-bold text-primary background-primary/10 px-1 py-0.5 rounded mt-1 inline-block uppercase">{user?.role || ''}</p>
                            </div>
                            <div className="w-8 h-8 md:w-9 md:h-9 rounded-xl bg-primary shadow-md shadow-primary/10 flex items-center justify-center text-primary-foreground transition-transform hover:scale-105 cursor-pointer">
                                <UserIcon size={16} className="md:size-[18px]" />
                            </div>
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-secondary/20 relative">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -ml-32 -mb-32 pointer-events-none" />

                    <div className="relative z-0">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    )
}

