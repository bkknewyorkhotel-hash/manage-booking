import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { startOfDay, endOfDay } from 'date-fns'

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const type = searchParams.get('type') // revenue, occupancy, outstanding
        const date = searchParams.get('date') ? new Date(searchParams.get('date')!) : new Date()

        if (type === 'revenue') {
            // 1. Room/Invoice Payments
            const roomPayments = await prisma.payment.groupBy({
                by: ['method'],
                where: {
                    paidAt: {
                        gte: startOfDay(date),
                        lte: endOfDay(date)
                    }
                },
                _sum: { amount: true }
            })

            // 2. POS Orders
            const posPayments = await prisma.posOrder.groupBy({
                by: ['paymentMethod'],
                where: {
                    createdAt: {
                        gte: startOfDay(date),
                        lte: endOfDay(date)
                    },
                    status: 'COMPLETED'
                },
                _sum: { total: true }
            })

            // Normalize and Combine
            const combined: any[] = []

            // Add Room Payments
            roomPayments.forEach(p => {
                combined.push({ method: `ROOM_${p.method}`, amount: p._sum.amount || 0, type: 'ROOM' })
            })

            // Add POS Payments
            posPayments.forEach(p => {
                combined.push({ method: `POS_${p.paymentMethod}`, amount: p._sum.total || 0, type: 'POS' })
            })

            return NextResponse.json(combined)
        }

        if (type === 'occupancy') {
            const totalRooms = await prisma.room.count()
            const statuses = await prisma.room.groupBy({
                by: ['status'],
                _count: { id: true }
            })

            const stats: any = {
                total: totalRooms,
                occupied: 0,
                reserved: 0,
                cleaning: 0,
                inspecting: 0,
                dirty: 0,
                clean: 0
            }

            statuses.forEach(s => {
                const count = s._count.id
                if (s.status === 'OCCUPIED') stats.occupied = count
                if (s.status === 'RESERVED') stats.reserved = count
                if (s.status === 'CLEANING') stats.cleaning = count
                if (s.status === 'INSPECTING') stats.inspecting = count
                if (s.status === 'VACANT_DIRTY') stats.dirty = count
                if (s.status === 'VACANT_CLEAN') stats.clean = count
            })

            return NextResponse.json({
                ...stats,
                rate: (stats.occupied / totalRooms) * 100
            })
        }

        if (type === 'outstanding') {
            const outstandingStays = await prisma.stay.findMany({
                where: { status: 'IN_HOUSE' },
                include: {
                    PrimaryGuest: true,
                    ChargeItems: true,
                    Booking: { include: { Rooms: true } },
                    Invoices: { include: { Payments: true } }
                }
            })

            const reports = outstandingStays.map(stay => {
                const charges = stay.ChargeItems.reduce((sum, item) => sum + Number(item.amount), 0)
                const roomCharges = stay.Booking?.Rooms.reduce((sum, r) => sum + (Number(r.ratePerNight) * stay.Booking.nights), 0) || 0
                const totalPaid = stay.Invoices.reduce((sum, inv) =>
                    sum + inv.Payments.reduce((pSum, p) => pSum + Number(p.amount), 0), 0)

                return {
                    stayId: stay.id,
                    guestName: stay.PrimaryGuest.name,
                    totalCharges: charges + roomCharges,
                    totalPaid,
                    balance: (charges + roomCharges) - totalPaid
                }
            }).filter(r => r.balance > 0)

            return NextResponse.json(reports)
        }

        if (type === 'arrivals') {
            const bookings = await prisma.booking.findMany({
                where: {
                    checkInDate: {
                        gte: startOfDay(date),
                        lte: endOfDay(date)
                    },
                    status: 'CONFIRMED'
                },
                include: {
                    PrimaryGuest: true,
                    Rooms: { include: { RoomType: true } }
                }
            })
            return NextResponse.json(bookings)
        }

        if (type === 'departures') {
            const bookings = await prisma.booking.findMany({
                where: {
                    checkOutDate: {
                        gte: startOfDay(date),
                        lte: endOfDay(date)
                    },
                    status: { in: ['CHECKED_IN', 'CONFIRMED'] }
                },
                include: {
                    PrimaryGuest: true,
                    Rooms: { include: { Room: true } }
                }
            })
            return NextResponse.json(bookings)
        }

        if (type === 'room_status') {
            const rooms = await prisma.room.findMany({
                include: {
                    RoomType: true,
                    BookingRooms: {
                        where: {
                            Booking: {
                                status: 'CHECKED_IN'
                            }
                        },
                        include: {
                            Booking: {
                                include: { PrimaryGuest: true }
                            }
                        }
                    }
                },
                orderBy: { roomNo: 'asc' }
            })
            return NextResponse.json(rooms)
        }

        return NextResponse.json({ error: 'Invalid report type' }, { status: 400 })
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
