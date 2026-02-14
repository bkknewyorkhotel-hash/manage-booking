import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import prisma from '@/lib/prisma'
import { verifyJWT } from '@/lib/auth'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const {
            stayId,
            buyerGuestId,
            discount = 0,
            serviceCharge = 0,
            payments, // [{ method, amount, reference }]
        } = body

        // 1. Fetch stay and related charges
        const stay = await prisma.stay.findUnique({
            where: { id: stayId },
            include: {
                ChargeItems: true,
                Booking: {
                    include: {
                        Rooms: true,
                    }
                },
                Deposits: {
                    where: { status: 'RECEIVED' }
                }
            }
        })

        if (!stay) {
            return NextResponse.json({ error: 'Stay not found' }, { status: 404 })
        }

        // 2. Calculate totals
        // Subtotal = Sum of all charge items + Room charges (if not already in charge items)
        const chargesTotal = stay.ChargeItems.reduce((sum, item) => sum + Number(item.amount), 0)

        // For simplicity, we assume room charges are added as charge items 
        // or we calculate them here if stay has booking rooms
        let roomCharges = 0
        if (stay.Booking) {
            roomCharges = stay.Booking.Rooms.reduce((sum, r) => sum + (Number(r.ratePerNight) * stay.Booking.nights), 0)
        }

        const subtotal = chargesTotal + roomCharges
        const totalAfterDiscount = subtotal - Number(discount) + Number(serviceCharge)

        // Thai VAT 7% - Inclusive (รวมภาษีแล้ว)
        const grandTotal = totalAfterDiscount
        const vatRate = 0.07
        const vatAmount = grandTotal - (grandTotal / (1 + vatRate))
        const baseCharge = grandTotal - vatAmount

        // 3. Generate Invoice Number (e.g. INV-2026-XXXX)
        const invoiceNo = `INV-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 899999)}`

        // Check for active shift
        const cookieStore = await cookies()
        const token = cookieStore.get('token')?.value
        const payload: any = token ? await verifyJWT(token) : null
        const userId = payload?.userId

        const activeShift = await prisma.shift.findFirst({
            where: {
                userId: userId,
                status: 'OPEN'
            }
        })

        // 4. Create in Transaction
        const invoice = await prisma.$transaction(async (tx) => {
            const inv = await tx.invoice.create({
                data: {
                    invoiceNo,
                    stayId,
                    buyerGuestId,
                    subtotal: baseCharge,
                    discount,
                    serviceCharge,
                    vatRate,
                    vatAmount,
                    total: grandTotal,
                    status: 'ISSUED',
                    Payments: {
                        create: payments.map((p: any) => ({
                            method: p.method,
                            amount: p.amount,
                            reference: p.reference,
                            paidAt: new Date(),
                            shiftId: activeShift?.id
                        }))
                    }
                },
                include: {
                    Payments: true,
                    BuyerGuest: true
                }
            })

            // Update Stay status if checkout
            await tx.stay.update({
                where: { id: stayId },
                data: {
                    status: 'CHECKED_OUT',
                    checkOutTime: new Date()
                }
            })

            // Apply deposits
            for (const deposit of stay.Deposits) {
                await tx.deposit.update({
                    where: { id: deposit.id },
                    data: { status: 'APPLIED', appliedAt: new Date() }
                })
            }

            // Update Rooms to Vacant Dirty
            const roomIds = stay.Booking.Rooms.map(r => r.roomId).filter(id => !!id) as string[]
            await tx.room.updateMany({
                where: { id: { in: roomIds } },
                data: { status: 'VACANT_DIRTY' }
            })

            return inv
        })

        return NextResponse.json(invoice)
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const invoiceNo = searchParams.get('no')

        const invoices = await prisma.invoice.findMany({
            where: invoiceNo ? { invoiceNo } : {},
            include: {
                BuyerGuest: true,
                Payments: true,
                Stay: {
                    include: {
                        ChargeItems: true
                    }
                }
            }
        })

        return NextResponse.json(invoices)
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
