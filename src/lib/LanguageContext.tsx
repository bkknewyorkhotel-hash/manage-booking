'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

type Language = 'TH' | 'EN'

interface LanguageContextType {
    lang: Language
    setLang: (lang: Language) => void
    t: (key: string) => string
}

const translations = {
    TH: {
        dashboard: 'แดชบอร์ด',
        rooms: 'ห้องพัก',
        reservations: 'การจอง',
        housekeeping: 'แม่บ้าน',
        maintenance: 'แจ้งซ่อม',
        reports: 'รายงาน',
        settings: 'ตั้งค่า',
        arrivals: 'วันที่เช็คอิน',
        departures: 'วันที่เช็คเอาท์',
        inHouse: 'แขกพักอยู่',
        vacantClean: 'ว่างและสะอาด',
        vacantDirty: 'ว่างและสกปรก',
        occupied: 'มีคนพัก',
        reserved: 'จองแล้ว',
        outOfOrder: 'งดขาย',
        today: 'วันนี้',
        save: 'บันทึก',
        cancel: 'ยกเลิก',
        login: 'เข้าสู่ระบบ',
        logout: 'ออกจากระบบ',
        taxInvoice: 'ใบกำกับภาษี',
        hotelName: 'ระบบจัดการโรงแรม',
    },
    EN: {
        dashboard: 'Dashboard',
        rooms: 'Rooms',
        reservations: 'Reservations',
        housekeeping: 'Housekeeping',
        maintenance: 'Maintenance',
        reports: 'Reports',
        settings: 'Settings',
        arrivals: 'Arrivals',
        departures: 'Departures',
        inHouse: 'In-house',
        vacantClean: 'Vacant Clean',
        vacantDirty: 'Vacant Dirty',
        occupied: 'Occupied',
        reserved: 'Reserved',
        outOfOrder: 'Out of Order',
        today: 'Today',
        save: 'Save',
        cancel: 'Cancel',
        login: 'Login',
        logout: 'Logout',
        taxInvoice: 'Tax Invoice',
        hotelName: 'Hotel Management System',
    }
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
    const [lang, setLang] = useState<Language>('TH')

    const t = (key: string) => {
        return (translations[lang] as any)[key] || key
    }

    return (
        <LanguageContext.Provider value={{ lang, setLang, t }}>
            {children}
        </LanguageContext.Provider>
    )
}

export function useTranslation() {
    const context = useContext(LanguageContext)
    if (!context) throw new Error('useTranslation must be used within LanguageProvider')
    return context
}
