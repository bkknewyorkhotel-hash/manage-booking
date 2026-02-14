'use client'

import React, { useEffect, useState } from 'react'
import { Shell } from '@/components/Shell'
import { Construction, Save, Plus, Trash2, User as UserIcon, Bed, Building, DoorOpen, Package } from 'lucide-react'
import { useTranslation } from '@/lib/LanguageContext'
import { useToast } from '@/lib/ToastContext'
import { cn, formatCurrency } from '@/lib/utils'

export default function SettingsPage() {
    const { t } = useTranslation()
    const { showToast } = useToast()
    const [activeTab, setActiveTab] = useState('general')
    const [user, setUser] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch('/api/auth/me')
            .then(res => res.json())
            .then(json => {
                setUser(json)
                setLoading(false)
            })
    }, [])

    if (loading) return <Shell><div className="p-8">{t('processing')}</div></Shell>

    if (user?.role !== 'ADMIN') {
        return (
            <Shell>
                <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
                    <div className="p-4 bg-red-50 text-red-500 rounded-full">
                        <Construction size={48} />
                    </div>
                    <h2 className="text-2xl font-black text-red-600 uppercase">{t('accessDenied')}</h2>
                    <p className="text-muted-foreground max-w-sm">
                        {t('noPermissionSettings')}
                    </p>
                </div>
            </Shell>
        )
    }

    return (
        <Shell>
            <div className="space-y-6">
                <h2 className="text-2xl font-black text-primary uppercase tracking-tight">{t('systemConfiguration')}</h2>
                ...

                <div className="flex space-x-2 border-b pb-2 overflow-x-auto">
                    <TabButton active={activeTab === 'general'} onClick={() => setActiveTab('general')} icon={Building} label={t('general')} />
                    <TabButton active={activeTab === 'rooms'} onClick={() => setActiveTab('rooms')} icon={DoorOpen} label={t('rooms')} />
                    <TabButton active={activeTab === 'room_types'} onClick={() => setActiveTab('room_types')} icon={Bed} label={t('roomTypes')} />
                    <TabButton active={activeTab === 'products'} onClick={() => setActiveTab('products')} icon={Package} label={t('products')} />
                    <TabButton active={activeTab === 'users'} onClick={() => setActiveTab('users')} icon={UserIcon} label={t('users')} />
                </div>

                <div className="min-h-[400px]">
                    {activeTab === 'general' && <GeneralSettings />}
                    {activeTab === 'rooms' && <RoomSettings />}
                    {activeTab === 'room_types' && <RoomTypeSettings />}
                    {activeTab === 'products' && <ProductSettings />}
                    {activeTab === 'users' && <UserSettings />}
                </div>
            </div>
        </Shell>
    )
}

function TabButton({ active, onClick, icon: Icon, label }: any) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "flex items-center space-x-2 px-4 py-2 rounded-lg font-bold transition-all whitespace-nowrap",
                active ? "bg-primary text-white shadow-lg shadow-primary/20" : "hover:bg-secondary text-muted-foreground"
            )}
        >
            <Icon size={18} />
            <span>{label}</span>
        </button>
    )
}

function GeneralSettings() {
    const { t } = useTranslation()
    const { showToast } = useToast()
    const [settings, setSettings] = useState<any>({})
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        fetch('/api/settings')
            .then(res => res.json())
            .then(data => {
                setSettings(data)
                setLoading(false)
            })
    }, [])

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        try {
            await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings)
            })
            showToast(t('settingsSaved'), 'success')
        } catch (error) {
            showToast(t('failedToSave'), 'error')
        } finally {
            setSaving(false)
        }
    }

    if (loading) return <p>{t('processing')}</p>

    return (
        <div className="max-w-2xl p-6 bg-card border rounded-2xl shadow-sm">
            <h3 className="text-lg font-bold mb-6">{t('hotelInformation')}</h3>
            <form onSubmit={handleSave} className="space-y-4">
                <div className="space-y-1">
                    <label className="text-sm font-bold text-muted-foreground">{t('hotelName')}</label>
                    <input
                        type="text"
                        value={settings.hotelName || ''}
                        onChange={e => setSettings({ ...settings, hotelName: e.target.value })}
                        className="w-full p-2 border rounded-lg bg-secondary/20 focus:bg-white transition-all outline-none focus:ring-2 ring-primary/20"
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-sm font-bold text-muted-foreground">{t('address')}</label>
                    <textarea
                        value={settings.address || ''}
                        onChange={e => setSettings({ ...settings, address: e.target.value })}
                        className="w-full p-2 border rounded-lg bg-secondary/20 focus:bg-white transition-all outline-none focus:ring-2 ring-primary/20 h-24"
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-sm font-bold text-muted-foreground">{t('taxId')}</label>
                    <input
                        type="text"
                        value={settings.taxId || ''}
                        onChange={e => setSettings({ ...settings, taxId: e.target.value })}
                        className="w-full p-2 border rounded-lg bg-secondary/20 focus:bg-white transition-all outline-none focus:ring-2 ring-primary/20"
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-sm font-bold text-muted-foreground">{t('phone')}</label>
                    <input
                        type="text"
                        value={settings.phone || ''}
                        onChange={e => setSettings({ ...settings, phone: e.target.value })}
                        className="w-full p-2 border rounded-lg bg-secondary/20 focus:bg-white transition-all outline-none focus:ring-2 ring-primary/20"
                    />
                </div>
                <div className="pt-4">
                    <button
                        type="submit"
                        disabled={saving}
                        className="px-6 py-2 bg-primary text-white rounded-lg font-bold hover:bg-primary/90 flex items-center space-x-2"
                    >
                        <Save size={18} />
                        <span>{saving ? t('processing') : t('saveChanges')}</span>
                    </button>
                </div>
            </form>
        </div>
    )
}

function RoomTypeSettings() {
    const { t } = useTranslation()
    const { showToast } = useToast()
    const [types, setTypes] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [formData, setFormData] = useState<any>({})

    const fetchTypes = () => {
        fetch('/api/room-types')
            .then(res => res.json())
            .then(data => {
                setTypes(data)
                setLoading(false)
            })
    }

    useEffect(() => {
        fetchTypes()
    }, [])

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        const method = formData.id ? 'PUT' : 'POST'
        await fetch('/api/room-types', {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        })
        setIsFormOpen(false)
        setFormData({})
        fetchTypes()
    }

    const handleDelete = async (id: string) => {
        if (!confirm(t('confirmDeleteType'))) return
        const res = await fetch(`/api/room-types?id=${id}`, { method: 'DELETE' })
        if (res.ok) fetchTypes()
        else showToast(t('failedToDelete'), 'error')
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold">{t('manageRoomTypes')}</h3>
                <button
                    onClick={() => { setFormData({}); setIsFormOpen(true) }}
                    className="flex items-center space-x-2 px-4 py-2 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-lg font-bold hover:bg-emerald-100"
                >
                    <Plus size={18} />
                    <span>{t('addRoomType')}</span>
                </button>
            </div>

            {isFormOpen && (
                <div className="p-6 bg-card border rounded-2xl shadow-sm mb-6">
                    <form onSubmit={handleSave} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-sm font-bold text-muted-foreground">{t('guestName')}</label>
                                <input required type="text" value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full p-2 border rounded-lg" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-bold text-muted-foreground">{t('baseRate')}</label>
                                <input required type="number" value={formData.baseRate || ''} onChange={e => setFormData({ ...formData, baseRate: e.target.value })} className="w-full p-2 border rounded-lg" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-bold text-muted-foreground">{t('capacity')}</label>
                                <input required type="number" value={formData.capacity || ''} onChange={e => setFormData({ ...formData, capacity: e.target.value })} className="w-full p-2 border rounded-lg" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-bold text-muted-foreground">{t('amenities')}</label>
                                <input type="text" value={formData.amenities || ''} onChange={e => setFormData({ ...formData, amenities: e.target.value })} className="w-full p-2 border rounded-lg" />
                            </div>
                        </div>
                        <div className="flex space-x-2">
                            <button type="button" onClick={() => setIsFormOpen(false)} className="px-4 py-2 border rounded-lg font-bold">{t('cancel')}</button>
                            <button type="submit" className="px-4 py-2 bg-primary text-white rounded-lg font-bold">{t('saveChanges')}</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {types.map(t => (
                    <div key={t.id} className="p-4 border rounded-xl bg-card hover:shadow-md transition-all">
                        <div className="flex justify-between items-start">
                            <div>
                                <h4 className="font-black text-lg">{t.name}</h4>
                                <p className="text-sm text-muted-foreground">{t.capacity} Guests • {t.baseRate} THB</p>
                            </div>
                            <div className="flex space-x-1">
                                <button onClick={() => { setFormData(t); setIsFormOpen(true) }} className="p-1 hover:bg-secondary rounded"><Construction size={16} /></button>
                                <button onClick={() => handleDelete(t.id)} className="p-1 hover:bg-red-50 text-red-500 rounded"><Trash2 size={16} /></button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

function UserSettings() {
    const { t } = useTranslation()
    const { showToast } = useToast()
    const [users, setUsers] = useState<any[]>([])
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [formData, setFormData] = useState<any>({})

    const fetchUsers = () => {
        fetch('/api/users')
            .then(res => res.json())
            .then(setUsers)
    }

    useEffect(() => {
        fetchUsers()
    }, [])

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        const method = formData.id ? 'PUT' : 'POST'
        const res = await fetch('/api/users', {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        })
        if (res.ok) {
            setIsFormOpen(false)
            setFormData({})
            fetchUsers()
            showToast(t('settingsSaved'), 'success')
        } else {
            showToast(t('failedToSave'), 'error')
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm(t('confirmDeleteUser'))) return
        await fetch(`/api/users?id=${id}`, { method: 'DELETE' })
        fetchUsers()
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold">{t('manageUsers')}</h3>
                <button
                    onClick={() => { setFormData({}); setIsFormOpen(true) }}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-50 text-blue-600 border border-blue-200 rounded-lg font-bold hover:bg-blue-100"
                >
                    <Plus size={18} />
                    <span>{t('addUser')}</span>
                </button>
            </div>

            {isFormOpen && (
                <div className="p-6 bg-card border rounded-2xl shadow-sm mb-6">
                    <form onSubmit={handleSave} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-sm font-bold text-muted-foreground">{t('username')}</label>
                                <input required disabled={!!formData.id} type="text" value={formData.username || ''} onChange={e => setFormData({ ...formData, username: e.target.value })} className="w-full p-2 border rounded-lg disabled:opacity-50" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-bold text-muted-foreground">{t('password')}</label>
                                <input type="password" placeholder={formData.id ? "(Unchanged)" : ""} value={formData.password || ''} onChange={e => setFormData({ ...formData, password: e.target.value })} className="w-full p-2 border rounded-lg" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-bold text-muted-foreground">{t('role')}</label>
                                <select value={formData.role || 'RECEPTION'} onChange={e => setFormData({ ...formData, role: e.target.value })} className="w-full p-2 border rounded-lg">
                                    <option value="ADMIN">{t('admin')}</option>
                                    <option value="RECEPTION">{t('reception')}</option>
                                    <option value="HOUSEKEEPING">{t('housekeeping')}</option>
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-bold text-muted-foreground">{t('guestName')}</label>
                                <input required type="text" value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full p-2 border rounded-lg" />
                            </div>
                        </div>
                        <div className="flex space-x-2">
                            <button type="button" onClick={() => setIsFormOpen(false)} className="px-4 py-2 border rounded-lg font-bold">{t('cancel')}</button>
                            <button type="submit" className="px-4 py-2 bg-primary text-white rounded-lg font-bold">{t('saveChanges')}</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="overflow-hidden border rounded-xl">
                <table className="w-full text-left text-sm">
                    <thead className="bg-secondary/20">
                        <tr>
                            <th className="p-4">{t('guestName')}</th>
                            <th className="p-4">{t('username')}</th>
                            <th className="p-4">{t('role')}</th>
                            <th className="p-4 text-right">{t('actions')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {users.map(u => (
                            <tr key={u.id}>
                                <td className="p-4 font-bold">{u.name}</td>
                                <td className="p-4 text-muted-foreground">{u.username}</td>
                                <td className="p-4"><span className="px-2 py-1 bg-secondary rounded text-xs font-bold">{t(u.role.toLowerCase())}</span></td>
                                <td className="p-4 text-right">
                                    <button onClick={() => { setFormData(u); setIsFormOpen(true) }} className="px-2 text-blue-600 hover:underline">{t('edit')}</button>
                                    <button onClick={() => handleDelete(u.id)} className="px-2 text-red-600 hover:underline">{t('delete')}</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

function RoomSettings() {
    const { t } = useTranslation()
    const { showToast } = useToast()
    const [floors, setFloors] = useState<any[]>([])
    const [roomTypes, setRoomTypes] = useState<any[]>([])
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [formData, setFormData] = useState<any>({})

    const fetchData = () => {
        fetch('/api/rooms').then(res => res.json()).then(setFloors)
        fetch('/api/room-types').then(res => res.json()).then(setRoomTypes)
    }

    useEffect(() => {
        fetchData()
    }, [])

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        const method = formData.id ? 'PUT' : 'POST'
        const res = await fetch('/api/rooms', {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        })
        if (res.ok) {
            setIsFormOpen(false)
            setFormData({})
            fetchData()
            showToast(t('settingsSaved'), 'success')
        } else {
            const json = await res.json()
            showToast(json.error || t('failedToSave'), 'error')
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm(t('confirmDeleteRoom'))) return
        const res = await fetch(`/api/rooms?id=${id}`, { method: 'DELETE' })
        if (res.ok) {
            fetchData()
        } else {
            const json = await res.json()
            showToast(json.error || t('failedToDeleteRoom'), 'error')
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold">{t('manageRooms')}</h3>
                <button
                    onClick={() => { setFormData({}); setIsFormOpen(true) }}
                    className="flex items-center space-x-2 px-4 py-2 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-lg font-bold hover:bg-emerald-100"
                >
                    <Plus size={18} />
                    <span>{t('addRoomSetting')}</span>
                </button>
            </div>

            {isFormOpen && (
                <div className="p-6 bg-card border rounded-2xl shadow-sm mb-6">
                    <form onSubmit={handleSave} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-1">
                                <label className="text-sm font-bold text-muted-foreground">{t('roomNumber')}</label>
                                <input required type="text" placeholder="e.g. 101" value={formData.roomNo || ''} onChange={e => setFormData({ ...formData, roomNo: e.target.value })} className="w-full p-2 border rounded-lg" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-bold text-muted-foreground">{t('floorNumber')}</label>
                                <input required type="number" placeholder="e.g. 1" value={formData.floorNo || (formData.Floor?.floorNo) || ''} onChange={e => setFormData({ ...formData, floorNo: e.target.value })} className="w-full p-2 border rounded-lg" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-bold text-muted-foreground">{t('roomType')}</label>
                                <select required value={formData.roomTypeId || ''} onChange={e => setFormData({ ...formData, roomTypeId: e.target.value })} className="w-full p-2 border rounded-lg">
                                    <option value="">{t('selectType')}...</option>
                                    {roomTypes.map(rt => (
                                        <option key={rt.id} value={rt.id}>{rt.name} ({formatCurrency(rt.baseRate)})</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="flex space-x-2">
                            <button type="button" onClick={() => setIsFormOpen(false)} className="px-4 py-2 border rounded-lg font-bold">{t('cancel')}</button>
                            <button type="submit" className="px-4 py-2 bg-primary text-white rounded-lg font-bold">
                                {formData.id ? t('saveChanges') : t('createRoom')}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="space-y-4">
                {floors.map(floor => (
                    <div key={floor.id} className="border rounded-xl overflow-hidden">
                        <div className="bg-secondary/30 p-3 font-bold flex justify-between items-center">
                            <span>{t('floor')} {floor.floorNo}</span>
                            <span className="text-xs text-muted-foreground">{floor.Rooms?.length || 0} {t('rooms')}</span>
                        </div>
                        <div className="p-4 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                            {floor.Rooms?.map((room: any) => (
                                <div key={room.id} className="p-3 border rounded-lg bg-card relative group hover:shadow-md transition-all">
                                    <div className="font-black text-lg">{room.roomNo}</div>
                                    <div className="text-xs text-muted-foreground truncate">{room.RoomType?.name}</div>
                                    <div className="absolute top-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => { setFormData(room); setIsFormOpen(true) }}
                                            className="p-1 bg-blue-50 text-blue-500 rounded hover:bg-blue-100"
                                        >
                                            <Construction size={14} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(room.id)}
                                            className="p-1 bg-red-50 text-red-500 rounded hover:bg-red-100"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {(!floor.Rooms || floor.Rooms.length === 0) && (
                                <div className="col-span-full text-center py-4 text-muted-foreground text-sm italic">
                                    {t('noRoomsOnFloor')}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

function ProductSettings() {
    const { t } = useTranslation()
    const { showToast } = useToast()
    const [products, setProducts] = useState<any[]>([])
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [formData, setFormData] = useState<any>({})

    const fetchProducts = () => {
        fetch('/api/pos/products')
            .then(res => res.json())
            .then(setProducts)
    }

    useEffect(() => {
        fetchProducts()
    }, [])

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        const method = formData.id ? 'PUT' : 'POST'
        const res = await fetch('/api/pos/products', {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        })
        if (res.ok) {
            setIsFormOpen(false)
            setFormData({})
            fetchProducts()
            showToast(t('settingsSaved'), 'success')
        } else {
            showToast(t('failedToSave'), 'error')
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm(t('confirmDeleteProduct'))) return
        const res = await fetch(`/api/pos/products?id=${id}`, { method: 'DELETE' })
        if (res.ok) {
            fetchProducts()
        } else {
            const json = await res.json()
            showToast(json.error || t('failedToDelete'), 'error')
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold">{t('manageProducts')}</h3>
                <button
                    onClick={() => { setFormData({}); setIsFormOpen(true) }}
                    className="flex items-center space-x-2 px-4 py-2 bg-indigo-50 text-indigo-600 border border-indigo-200 rounded-lg font-bold hover:bg-indigo-100"
                >
                    <Plus size={18} />
                    <span>{t('addProduct')}</span>
                </button>
            </div>

            {isFormOpen && (
                <div className="p-6 bg-card border rounded-2xl shadow-sm mb-6">
                    <form onSubmit={handleSave} className="space-y-4">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <div className="space-y-1">
                                <label className="text-sm font-bold text-muted-foreground">{t('productName')}</label>
                                <input required type="text" value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full p-2 border rounded-lg" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-bold text-muted-foreground">{t('category')}</label>
                                <input required type="text" list="categories" value={formData.category || ''} onChange={e => setFormData({ ...formData, category: e.target.value })} className="w-full p-2 border rounded-lg" />
                                <datalist id="categories">
                                    <option value="Food" />
                                    <option value="Drink" />
                                    <option value="Service" />
                                    <option value="Amenity" />
                                </datalist>
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-bold text-muted-foreground">{t('amount')}</label>
                                <input required type="number" step="0.01" value={formData.price || ''} onChange={e => setFormData({ ...formData, price: e.target.value })} className="w-full p-2 border rounded-lg" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-bold text-muted-foreground">{t('cost')}</label>
                                <input type="number" step="0.01" value={formData.cost || ''} onChange={e => setFormData({ ...formData, cost: e.target.value })} className="w-full p-2 border rounded-lg" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-bold text-muted-foreground">{t('stock')}</label>
                                <input type="number" value={formData.stock || ''} onChange={e => setFormData({ ...formData, stock: e.target.value })} className="w-full p-2 border rounded-lg" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-bold text-muted-foreground">{t('barcode')}</label>
                                <input type="text" value={formData.barcode || ''} onChange={e => setFormData({ ...formData, barcode: e.target.value })} className="w-full p-2 border rounded-lg" />
                            </div>
                        </div>
                        <div className="flex space-x-2">
                            <button type="button" onClick={() => setIsFormOpen(false)} className="px-4 py-2 border rounded-lg font-bold">{t('cancel')}</button>
                            <button type="submit" className="px-4 py-2 bg-primary text-white rounded-lg font-bold">{t('saveProduct')}</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="overflow-hidden border rounded-xl">
                <table className="w-full text-left text-sm">
                    <thead className="bg-secondary/20">
                        <tr>
                            <th className="p-4">{t('productName')}</th>
                            <th className="p-4">{t('category')}</th>
                            <th className="p-4">{t('amount')}</th>
                            <th className="p-4">{t('stock')}</th>
                            <th className="p-4 text-right">{t('actions')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {products.map(p => (
                            <tr key={p.id}>
                                <td className="p-4 font-bold">{p.name}</td>
                                <td className="p-4"><span className="px-2 py-1 bg-secondary rounded text-xs font-bold">{p.category}</span></td>
                                <td className="p-4 font-mono">{formatCurrency(p.price)}</td>
                                <td className="p-4">
                                    <span className={cn("px-2 py-1 rounded text-xs font-bold", p.stock > 10 ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700")}>
                                        {p.stock}
                                    </span>
                                </td>
                                <td className="p-4 text-right">
                                    <button onClick={() => { setFormData(p); setIsFormOpen(true) }} className="px-2 text-blue-600 hover:underline">{t('edit')}</button>
                                    <button onClick={() => handleDelete(p.id)} className="px-2 text-red-600 hover:underline">{t('delete')}</button>
                                </td>
                            </tr>
                        ))}
                        {products.length === 0 && (
                            <tr>
                                <td colSpan={5} className="p-4 text-center text-muted-foreground">{t('noBookings')}</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
