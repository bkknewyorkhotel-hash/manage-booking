import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { isBefore, isAfter, startOfDay, endOfDay } from 'date-fns'

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const status = searchParams.get('status')
        const primaryGuestId = searchParams.get('guestId')

        const bookings = await prisma.booking.findMany({
            where: {
                ...(status ? { status: status as any } : {}),
                ...(primaryGuestId ? { primaryGuestId } : {}),
            },
            include: {
                PrimaryGuest: true,
                Rooms: {
                    include: {
                        RoomType: true,
                        Room: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        })

        return NextResponse.json(bookings)
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const {
            primaryGuestId,
            guestData, // { name, phone, etc. }
            source,
            checkInDate,
            checkOutDate,
            rooms, // [{ roomTypeId, roomId, adults, children, ratePerNight }]
            specialRequest,
        } = body

        // 1. Ensure primary guest exists or create
        let guestId = primaryGuestId
        if (!guestId && guestData) {
            const guest = await prisma.guest.create({
                data: guestData,
            })
            guestId = guest.id
        }

        if (!guestId) {
            return NextResponse.json({ error: 'Primary guest information missing' }, { status: 400 })
        }

        // 2. Room Assignment and Overlap check logic
        const finalRooms = []
        for (const r of rooms) {
            let selectedRoomId = r.roomId

            if (!selectedRoomId) {
                // Find an available room of this type
                const allTypeRooms = await prisma.room.findMany({
                    where: { roomTypeId: r.roomTypeId },
                    select: { id: true }
                })

                const occupiedRooms = await prisma.bookingRoom.findMany({
                    where: {
                        roomTypeId: r.roomTypeId,
                        Booking: {
                            status: { in: ['CONFIRMED', 'CHECKED_IN'] },
                            OR: [
                                {
                                    checkInDate: { lt: new Date(checkOutDate) },
                                    checkOutDate: { gt: new Date(checkInDate) },
                                },
                            ],
                        },
                    },
                    select: { roomId: true }
                })

                const occupiedIds = new Set(occupiedRooms.map(o => o.roomId).filter(id => !!id))
                const availableRoom = allTypeRooms.find(room => !occupiedIds.has(room.id))

                if (!availableRoom) {
                    return NextResponse.json({
                        error: `No rooms of this type available for selected dates.`
                    }, { status: 400 })
                }
                selectedRoomId = availableRoom.id
            } else {
                // Check if specific room is overlapping
                const overlap = await prisma.bookingRoom.findFirst({
                    where: {
                        roomId: selectedRoomId,
                        Booking: {
                            status: { in: ['CONFIRMED', 'CHECKED_IN'] },
                            OR: [
                                {
                                    checkInDate: { lt: new Date(checkOutDate) },
                                    checkOutDate: { gt: new Date(checkInDate) },
                                },
                            ],
                        },
                    },
                })

                if (overlap) {
                    return NextResponse.json({
                        error: `Room is already booked for the selected dates.`
                    }, { status: 400 })
                }
            }
            finalRooms.push({ ...r, roomId: selectedRoomId })
        }

        // 3. Create Booking and BookingRooms in a transaction
        const nights = Math.ceil((new Date(checkOutDate).getTime() - new Date(checkInDate).getTime()) / (1000 * 60 * 60 * 24))

        // Generate a simple booking number: B-YYYYMMDD-XXXX
        const bookingNo = `B-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`

        const booking = await prisma.booking.create({
            data: {
                bookingNo,
                source,
                paymentMethod: body.paymentMethod || 'CASH', // Added
                checkInDate: new Date(checkInDate),
                checkOutDate: new Date(checkOutDate),
                nights,
                specialRequest,
                primaryGuestId: guestId,
                Rooms: {
                    create: finalRooms.map((r: any) => ({
                        roomTypeId: r.roomTypeId,
                        roomId: r.roomId,
                        ratePerNight: r.ratePerNight,
                        adults: r.adults,
                        children: r.children,
                    })),
                },
            },
            include: {
                Rooms: true,
            },
        })

        // 4. If booking is for today, update room status to RESERVED
        const isToday = startOfDay(new Date(checkInDate)).getTime() === startOfDay(new Date()).getTime()
        if (isToday) {
            for (const r of finalRooms) {
                if (r.roomId) {
                    await prisma.room.update({
                        where: { id: r.roomId },
                        data: { status: 'RESERVED' }
                    })
                }
            }
        }


        return NextResponse.json(booking)
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
