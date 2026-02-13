import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { startOfDay, endOfDay } from 'date-fns'

export async function GET() {
    try {
        const today = new Date()
        const startOfToday = startOfDay(today)
        const endOfToday = endOfDay(today)

        // 1. Occupancy Stats
        const totalRooms = await prisma.room.count()
        const statuses = await prisma.room.groupBy({
            by: ['status'],
            _count: { id: true }
        })

        const roomStats: any = {
            total: totalRooms,
            occupied: 0,
            reserved: 0,
            cleaning: 0,
            inspecting: 0,
            dirty: 0,
            clean: 0,
            outOfOrder: 0
        }

        statuses.forEach(s => {
            const count = s._count.id
            if (s.status === 'OCCUPIED') roomStats.occupied = count
            if (s.status === 'RESERVED') roomStats.reserved = count
            if (s.status === 'CLEANING') roomStats.cleaning = count
            if (s.status === 'INSPECTING') roomStats.inspecting = count
            if (s.status === 'VACANT_DIRTY') roomStats.dirty = count
            if (s.status === 'VACANT_CLEAN') roomStats.clean = count
            if (s.status === 'OUT_OF_ORDER') roomStats.outOfOrder = count
        })

        // 2. Arrivals
        const arrivals = await prisma.booking.findMany({
            where: {
                checkInDate: {
                    gte: startOfToday,
                    lte: endOfToday
                },
                status: 'CONFIRMED'
            },
            include: {
                PrimaryGuest: true,
                Rooms: { include: { RoomType: true } }
            }
        })

        // 3. Departures
        const departures = await prisma.booking.findMany({
            where: {
                checkOutDate: {
                    gte: startOfToday,
                    lte: endOfToday
                },
                status: { in: ['CHECKED_IN', 'CONFIRMED'] }
            },
            include: {
                PrimaryGuest: true,
                Rooms: { include: { Room: true } }
            }
        })

        // 4. In-House Guests
        const inHouseCount = await prisma.booking.count({
            where: { status: 'CHECKED_IN' }
        })

        return NextResponse.json({
            occupancy: {
                total: totalRooms,
                occupied: roomStats.occupied,
                rate: totalRooms > 0 ? Math.round((roomStats.occupied / totalRooms) * 100) : 0,
                details: roomStats
            },
            arrivals: arrivals,
            departures: departures,
            inHouseCount: inHouseCount,
            timestamp: new Date().toISOString()
        })
    } catch (error) {
        console.error('Dashboard Stats Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
