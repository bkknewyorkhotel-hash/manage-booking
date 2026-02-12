'use client'

import React, { useEffect, useState } from 'react'
import { Shell } from '@/components/Shell'
import { Construction, Save, Plus, Trash2, User as UserIcon, Bed, Building, DoorOpen, Package } from 'lucide-react'
import { cn, formatCurrency } from '@/lib/utils'

export default function SettingsPage() {
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

    if (loading) return <Shell><div className="p-8">Loading...</div></Shell>

    if (user?.role !== 'ADMIN') {
        return (
            <Shell>
                <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
                    <div className="p-4 bg-red-50 text-red-500 rounded-full">
                        <Construction size={48} />
                    </div>
                    <h2 className="text-2xl font-black text-red-600 uppercase">Access Denied</h2>
                    <p className="text-muted-foreground max-w-sm">
                        You do not have permission to access the system configuration. Please contact the administrator.
                    </p>
                </div>
            </Shell>
        )
    }

    return (
        <Shell>
            <div className="space-y-6">
                <h2 className="text-2xl font-black text-primary uppercase tracking-tight">System Configuration</h2>
                ...

                <div className="flex space-x-2 border-b pb-2 overflow-x-auto">
                    <TabButton active={activeTab === 'general'} onClick={() => setActiveTab('general')} icon={Building} label="General" />
                    <TabButton active={activeTab === 'rooms'} onClick={() => setActiveTab('rooms')} icon={DoorOpen} label="Rooms" />
                    <TabButton active={activeTab === 'room_types'} onClick={() => setActiveTab('room_types')} icon={Bed} label="Room Types" />
                    <TabButton active={activeTab === 'products'} onClick={() => setActiveTab('products')} icon={Package} label="Products" />
                    <TabButton active={activeTab === 'users'} onClick={() => setActiveTab('users')} icon={UserIcon} label="Users" />
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
            alert('Settings saved!')
        } catch (error) {
            alert('Failed to save')
        } finally {
            setSaving(false)
        }
    }

    if (loading) return <p>Loading...</p>

    return (
        <div className="max-w-2xl p-6 bg-card border rounded-2xl shadow-sm">
            <h3 className="text-lg font-bold mb-6">Hotel Information</h3>
            <form onSubmit={handleSave} className="space-y-4">
                <div className="space-y-1">
                    <label className="text-sm font-bold text-muted-foreground">Hotel Name</label>
                    <input
                        type="text"
                        value={settings.hotelName || ''}
                        onChange={e => setSettings({ ...settings, hotelName: e.target.value })}
                        className="w-full p-2 border rounded-lg bg-secondary/20 focus:bg-white transition-all outline-none focus:ring-2 ring-primary/20"
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-sm font-bold text-muted-foreground">Address</label>
                    <textarea
                        value={settings.address || ''}
                        onChange={e => setSettings({ ...settings, address: e.target.value })}
                        className="w-full p-2 border rounded-lg bg-secondary/20 focus:bg-white transition-all outline-none focus:ring-2 ring-primary/20 h-24"
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-sm font-bold text-muted-foreground">Tax ID</label>
                    <input
                        type="text"
                        value={settings.taxId || ''}
                        onChange={e => setSettings({ ...settings, taxId: e.target.value })}
                        className="w-full p-2 border rounded-lg bg-secondary/20 focus:bg-white transition-all outline-none focus:ring-2 ring-primary/20"
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-sm font-bold text-muted-foreground">Phone</label>
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
                        <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                    </button>
                </div>
            </form>
        </div>
    )
}

function RoomTypeSettings() {
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
        if (!confirm('Are you sure?')) return
        const res = await fetch(`/api/room-types?id=${id}`, { method: 'DELETE' })
        if (res.ok) fetchTypes()
        else alert('Failed to delete (might be in use)')
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold">Manage Room Types</h3>
                <button
                    onClick={() => { setFormData({}); setIsFormOpen(true) }}
                    className="flex items-center space-x-2 px-4 py-2 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-lg font-bold hover:bg-emerald-100"
                >
                    <Plus size={18} />
                    <span>Add Room Type</span>
                </button>
            </div>

            {isFormOpen && (
                <div className="p-6 bg-card border rounded-2xl shadow-sm mb-6">
                    <form onSubmit={handleSave} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-sm font-bold text-muted-foreground">Name</label>
                                <input required type="text" value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full p-2 border rounded-lg" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-bold text-muted-foreground">Base Rate</label>
                                <input required type="number" value={formData.baseRate || ''} onChange={e => setFormData({ ...formData, baseRate: e.target.value })} className="w-full p-2 border rounded-lg" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-bold text-muted-foreground">Capacity</label>
                                <input required type="number" value={formData.capacity || ''} onChange={e => setFormData({ ...formData, capacity: e.target.value })} className="w-full p-2 border rounded-lg" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-bold text-muted-foreground">Amenities</label>
                                <input type="text" value={formData.amenities || ''} onChange={e => setFormData({ ...formData, amenities: e.target.value })} className="w-full p-2 border rounded-lg" />
                            </div>
                        </div>
                        <div className="flex space-x-2">
                            <button type="button" onClick={() => setIsFormOpen(false)} className="px-4 py-2 border rounded-lg font-bold">Cancel</button>
                            <button type="submit" className="px-4 py-2 bg-primary text-white rounded-lg font-bold">Save</button>
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
        } else {
            alert('Error saving user')
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure?')) return
        await fetch(`/api/users?id=${id}`, { method: 'DELETE' })
        fetchUsers()
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold">Manage Users</h3>
                <button
                    onClick={() => { setFormData({}); setIsFormOpen(true) }}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-50 text-blue-600 border border-blue-200 rounded-lg font-bold hover:bg-blue-100"
                >
                    <Plus size={18} />
                    <span>Add User</span>
                </button>
            </div>

            {isFormOpen && (
                <div className="p-6 bg-card border rounded-2xl shadow-sm mb-6">
                    <form onSubmit={handleSave} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-sm font-bold text-muted-foreground">Username</label>
                                <input required disabled={!!formData.id} type="text" value={formData.username || ''} onChange={e => setFormData({ ...formData, username: e.target.value })} className="w-full p-2 border rounded-lg disabled:opacity-50" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-bold text-muted-foreground">Password</label>
                                <input type="password" placeholder={formData.id ? "(Unchanged)" : ""} value={formData.password || ''} onChange={e => setFormData({ ...formData, password: e.target.value })} className="w-full p-2 border rounded-lg" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-bold text-muted-foreground">Role</label>
                                <select value={formData.role || 'RECEPTION'} onChange={e => setFormData({ ...formData, role: e.target.value })} className="w-full p-2 border rounded-lg">
                                    <option value="ADMIN">Admin</option>
                                    <option value="RECEPTION">Reception</option>
                                    <option value="HOUSEKEEPING">Housekeeping</option>
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-bold text-muted-foreground">Name</label>
                                <input required type="text" value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full p-2 border rounded-lg" />
                            </div>
                        </div>
                        <div className="flex space-x-2">
                            <button type="button" onClick={() => setIsFormOpen(false)} className="px-4 py-2 border rounded-lg font-bold">Cancel</button>
                            <button type="submit" className="px-4 py-2 bg-primary text-white rounded-lg font-bold">Save</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="overflow-hidden border rounded-xl">
                <table className="w-full text-left text-sm">
                    <thead className="bg-secondary/20">
                        <tr>
                            <th className="p-4">Name</th>
                            <th className="p-4">Username</th>
                            <th className="p-4">Role</th>
                            <th className="p-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {users.map(u => (
                            <tr key={u.id}>
                                <td className="p-4 font-bold">{u.name}</td>
                                <td className="p-4 text-muted-foreground">{u.username}</td>
                                <td className="p-4"><span className="px-2 py-1 bg-secondary rounded text-xs font-bold">{u.role}</span></td>
                                <td className="p-4 text-right">
                                    <button onClick={() => { setFormData(u); setIsFormOpen(true) }} className="px-2 text-blue-600 hover:underline">Edit</button>
                                    <button onClick={() => handleDelete(u.id)} className="px-2 text-red-600 hover:underline">Delete</button>
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
        const res = await fetch('/api/rooms', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        })
        if (res.ok) {
            setIsFormOpen(false)
            setFormData({})
            fetchData()
        } else {
            alert('Error creating room')
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this room?')) return
        const res = await fetch(`/api/rooms?id=${id}`, { method: 'DELETE' })
        if (res.ok) {
            fetchData()
        } else {
            const json = await res.json()
            alert(json.error || 'Failed to delete room')
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold">Manage Rooms</h3>
                <button
                    onClick={() => { setFormData({}); setIsFormOpen(true) }}
                    className="flex items-center space-x-2 px-4 py-2 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-lg font-bold hover:bg-emerald-100"
                >
                    <Plus size={18} />
                    <span>Add Room</span>
                </button>
            </div>

            {isFormOpen && (
                <div className="p-6 bg-card border rounded-2xl shadow-sm mb-6">
                    <form onSubmit={handleSave} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-1">
                                <label className="text-sm font-bold text-muted-foreground">Room Number</label>
                                <input required type="text" placeholder="e.g. 101" value={formData.roomNo || ''} onChange={e => setFormData({ ...formData, roomNo: e.target.value })} className="w-full p-2 border rounded-lg" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-bold text-muted-foreground">Floor Number</label>
                                <input required type="number" placeholder="e.g. 1" value={formData.floorNo || ''} onChange={e => setFormData({ ...formData, floorNo: e.target.value })} className="w-full p-2 border rounded-lg" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-bold text-muted-foreground">Room Type</label>
                                <select required value={formData.roomTypeId || ''} onChange={e => setFormData({ ...formData, roomTypeId: e.target.value })} className="w-full p-2 border rounded-lg">
                                    <option value="">Select Type...</option>
                                    {roomTypes.map(rt => (
                                        <option key={rt.id} value={rt.id}>{rt.name} ({rt.baseRate} THB)</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="flex space-x-2">
                            <button type="button" onClick={() => setIsFormOpen(false)} className="px-4 py-2 border rounded-lg font-bold">Cancel</button>
                            <button type="submit" className="px-4 py-2 bg-primary text-white rounded-lg font-bold">Create Room</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="space-y-4">
                {floors.map(floor => (
                    <div key={floor.id} className="border rounded-xl overflow-hidden">
                        <div className="bg-secondary/30 p-3 font-bold flex justify-between items-center">
                            <span>Floor {floor.floorNo}</span>
                            <span className="text-xs text-muted-foreground">{floor.Rooms?.length || 0} Rooms</span>
                        </div>
                        <div className="p-4 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                            {floor.Rooms?.map((room: any) => (
                                <div key={room.id} className="p-3 border rounded-lg bg-card relative group hover:shadow-md transition-all">
                                    <div className="font-black text-lg">{room.roomNo}</div>
                                    <div className="text-xs text-muted-foreground truncate">{room.RoomType?.name}</div>
                                    <button
                                        onClick={() => handleDelete(room.id)}
                                        className="absolute top-2 right-2 p-1 bg-red-50 text-red-500 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}
                            {(!floor.Rooms || floor.Rooms.length === 0) && (
                                <div className="col-span-full text-center py-4 text-muted-foreground text-sm italic">
                                    No rooms on this floor
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
        } else {
            alert('Error saving product')
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this product?')) return
        const res = await fetch(`/api/pos/products?id=${id}`, { method: 'DELETE' })
        if (res.ok) {
            fetchProducts()
        } else {
            const json = await res.json()
            alert(json.error || 'Failed to delete product')
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold">Manage Products</h3>
                <button
                    onClick={() => { setFormData({}); setIsFormOpen(true) }}
                    className="flex items-center space-x-2 px-4 py-2 bg-indigo-50 text-indigo-600 border border-indigo-200 rounded-lg font-bold hover:bg-indigo-100"
                >
                    <Plus size={18} />
                    <span>Add Product</span>
                </button>
            </div>

            {isFormOpen && (
                <div className="p-6 bg-card border rounded-2xl shadow-sm mb-6">
                    <form onSubmit={handleSave} className="space-y-4">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <div className="space-y-1">
                                <label className="text-sm font-bold text-muted-foreground">Product Name</label>
                                <input required type="text" value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full p-2 border rounded-lg" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-bold text-muted-foreground">Category</label>
                                <input required type="text" list="categories" value={formData.category || ''} onChange={e => setFormData({ ...formData, category: e.target.value })} className="w-full p-2 border rounded-lg" />
                                <datalist id="categories">
                                    <option value="Food" />
                                    <option value="Drink" />
                                    <option value="Service" />
                                    <option value="Amenity" />
                                </datalist>
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-bold text-muted-foreground">Price</label>
                                <input required type="number" step="0.01" value={formData.price || ''} onChange={e => setFormData({ ...formData, price: e.target.value })} className="w-full p-2 border rounded-lg" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-bold text-muted-foreground">Cost</label>
                                <input type="number" step="0.01" value={formData.cost || ''} onChange={e => setFormData({ ...formData, cost: e.target.value })} className="w-full p-2 border rounded-lg" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-bold text-muted-foreground">Stock</label>
                                <input type="number" value={formData.stock || ''} onChange={e => setFormData({ ...formData, stock: e.target.value })} className="w-full p-2 border rounded-lg" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-bold text-muted-foreground">Barcode</label>
                                <input type="text" value={formData.barcode || ''} onChange={e => setFormData({ ...formData, barcode: e.target.value })} className="w-full p-2 border rounded-lg" />
                            </div>
                        </div>
                        <div className="flex space-x-2">
                            <button type="button" onClick={() => setIsFormOpen(false)} className="px-4 py-2 border rounded-lg font-bold">Cancel</button>
                            <button type="submit" className="px-4 py-2 bg-primary text-white rounded-lg font-bold">Save Product</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="overflow-hidden border rounded-xl">
                <table className="w-full text-left text-sm">
                    <thead className="bg-secondary/20">
                        <tr>
                            <th className="p-4">Product Name</th>
                            <th className="p-4">Category</th>
                            <th className="p-4">Price</th>
                            <th className="p-4">Stock</th>
                            <th className="p-4 text-right">Actions</th>
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
                                    <button onClick={() => { setFormData(p); setIsFormOpen(true) }} className="px-2 text-blue-600 hover:underline">Edit</button>
                                    <button onClick={() => handleDelete(p.id)} className="px-2 text-red-600 hover:underline">Delete</button>
                                </td>
                            </tr>
                        ))}
                        {products.length === 0 && (
                            <tr>
                                <td colSpan={5} className="p-4 text-center text-muted-foreground">No products found. Add one above!</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
