
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { v4 as uuidv4 } from 'uuid'

function randomInt(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(start: Date, end: Date) {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

export async function POST() {
    try {
        // Find existing data to link to
        const guest = await prisma.guest.findFirst()
        const roomTypes = await prisma.roomType.findMany()
        const rooms = await prisma.room.findMany()
        const products = await prisma.product.findMany()
        const shifts = await prisma.shift.findMany({ where: { status: 'OPEN' } }) // Use open shift or create one

        if (!guest || rooms.length === 0 || products.length === 0) {
            return NextResponse.json({ error: 'Please run initial seed first (npm run db:seed)' }, { status: 400 })
        }

        const today = new Date()
        const lastMonth = new Date()
        lastMonth.setDate(today.getDate() - 30)

        // Generate 30 Past Bookings
        for (let i = 0; i < 30; i++) {
            const checkIn = randomDate(lastMonth, today)
            const nights = randomInt(1, 5)
            const checkOut = new Date(checkIn)
            checkOut.setDate(checkIn.getDate() + nights)

            const room = rooms[randomInt(0, rooms.length - 1)]
            const type = roomTypes.find(t => t.id === room.roomTypeId) || roomTypes[0]
            const total = Number(type.baseRate) * nights

            // Create Booking, Stay, Invoice, Payment
            const booking = await prisma.booking.create({
                data: {
                    bookingNo: `DEMO-${uuidv4().substring(0, 8).toUpperCase()}`,
                    source: ['Agoda', 'Booking.com', 'Walk-in', 'Direct'][randomInt(0, 3)],
                    status: 'CHECKED_OUT',
                    checkInDate: checkIn,
                    checkOutDate: checkOut,
                    nights,
                    primaryGuestId: guest.id,
                    Rooms: {
                        create: [{ roomId: room.id, roomTypeId: type.id, ratePerNight: type.baseRate, adults: 2, children: 0 }]
                    }
                }
            })

            const stay = await prisma.stay.create({
                data: {
                    bookingId: booking.id,
                    primaryGuestId: guest.id,
                    status: 'CHECKED_OUT',
                    checkInTime: checkIn,
                    checkOutTime: checkOut
                }
            })

            const invoice = await prisma.invoice.create({
                data: {
                    invoiceNo: `INV-DEMO-${uuidv4().substring(0, 8)}`,
                    stayId: stay.id,
                    buyerGuestId: guest.id,
                    subtotal: total,
                    vatAmount: total * 0.07,
                    total: total * 1.07,
                    status: 'ISSUED',
                    issuedAt: checkOut
                }
            })

            await prisma.payment.create({
                data: {
                    invoiceId: invoice.id,
                    method: ['CASH', 'CARD', 'QR', 'BANK_TRANSFER'][randomInt(0, 3)] as any,
                    amount: total * 1.07,
                    paidAt: checkOut
                }
            })
        }

        // Generate 50 POS Orders
        for (let i = 0; i < 50; i++) {
            const orderDate = randomDate(lastMonth, today)
            const itemCount = randomInt(1, 4)
            let total = 0
            const items = []

            for (let j = 0; j < itemCount; j++) {
                const p = products[randomInt(0, products.length - 1)]
                const qty = randomInt(1, 3)
                const price = Number(p.price)
                total += price * qty
                items.push({ productId: p.id, name: p.name, price: price, qty, total: price * qty })
            }

            await prisma.posOrder.create({
                data: {
                    orderNo: `POS-DEMO-${uuidv4().substring(0, 8)}`,
                    total,
                    paymentMethod: ['CASH', 'QR'][randomInt(0, 1)] as any,
                    status: 'COMPLETED',
                    createdAt: orderDate,
                    Items: { create: items }
                }

            })
        }

        return NextResponse.json({ success: true, message: 'Generated 30 bookings and 50 POS orders' })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
