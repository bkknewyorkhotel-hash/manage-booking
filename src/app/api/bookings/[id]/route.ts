
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await context.params
        const body = await request.json()
        const { status } = body

        if (!status) {
            return NextResponse.json({ error: 'Status is required' }, { status: 400 })
        }

        // Validate status transition (simple version)
        const booking = await prisma.booking.findUnique({
            where: { id },
            include: {
                Rooms: {
                    include: { Room: true }
                }
            }
        })

        if (!booking) {
            return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
        }

        // Specific logic per status
        if (status === 'CHECKED_IN' && booking.status !== 'CHECKED_IN') {
            const { idCardNumber, keyDeposit, keyDepositMethod, guestName } = body // Added keyDepositMethod

            // Find active shift
            const activeShift = await prisma.shift.findFirst({
                where: { userId: 'user_admin', status: 'OPEN' }
            })

            if (!activeShift) {
                return NextResponse.json({
                    error: 'Please open a shift before checking in (กรุณาเปิดกะก่อนทำการเช็คอิน)'
                }, { status: 400 })
            }

            await prisma.$transaction(async (tx) => {
                // 0. Update Guest Info (ID Card)
                if (idCardNumber || guestName) {
                    await tx.guest.update({
                        where: { id: booking.primaryGuestId },
                        data: {
                            idCardNumber: idCardNumber,
                            name: guestName || undefined
                        }
                    })
                }

                // 1. Create Stay
                const stay = await tx.stay.create({
                    data: {
                        bookingId: id,
                        primaryGuestId: booking.primaryGuestId,
                        status: 'IN_HOUSE',
                        checkInTime: new Date(),
                        keyDeposit: Number(keyDeposit) || 0, // Store amount for display
                    }
                })

                // 1.5 Create Deposit record for key deposit (if amount > 0)
                if (Number(keyDeposit) > 0) {
                    await tx.deposit.create({
                        data: {
                            stayId: stay.id,
                            amount: Number(keyDeposit),
                            method: (keyDepositMethod as any) || 'CASH',
                            status: 'HELD', // Not refunded yet
                            receivedAt: new Date(),
                            shiftId: activeShift.id
                        }
                    })
                }

                // 2. Create Charge Items for Rooms
                let subtotal = 0
                for (const r of booking.Rooms) {
                    const amount = Number(r.ratePerNight) * booking.nights
                    subtotal += amount
                    await tx.chargeItem.create({
                        data: {
                            stayId: stay.id,
                            type: 'ROOM',
                            description: `Room Charge: ${r.Room?.roomNo || 'TBD'} (${booking.nights} nights)`,
                            qty: 1,
                            unitPrice: amount,
                            amount: amount
                        }
                    })
                }

                // 3. Create Invoice and Payment (Immediate Charging)
                // User requirement: Price includes VAT (รวมภาษีแล้วไม่มีบวกเพิ่ม)
                const grandTotal = subtotal // Inclusive
                const vatRate = 0.07
                const vatAmount = grandTotal - (grandTotal / (1 + vatRate))
                const baseCharge = grandTotal - vatAmount
                const invoiceNo = `INV-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 899999)}`

                await tx.invoice.create({
                    data: {
                        invoiceNo,
                        stayId: stay.id,
                        buyerGuestId: booking.primaryGuestId,
                        subtotal: baseCharge, // Base amount before tax for reporting
                        vatRate,
                        vatAmount,
                        total: grandTotal,
                        status: 'ISSUED',
                        Payments: {
                            create: [{
                                method: (booking.paymentMethod as any) || 'CASH', // Use booking preference
                                amount: grandTotal,
                                paidAt: new Date(),
                                shiftId: activeShift?.id
                            }]
                        }
                    }
                })

                // 4. Update Room status to OCCUPIED
                for (const r of booking.Rooms) {
                    if (r.roomId) {
                        await tx.room.update({
                            where: { id: r.roomId },
                            data: { status: 'OCCUPIED' }
                        })
                    }
                }
            })
        }
        else if (status === 'CHECKED_OUT') {
            const { refunds } = body // [{ depositId, amount }]

            // Find active shift
            const activeShift = await prisma.shift.findFirst({
                where: { userId: 'user_admin', status: 'OPEN' }
            })

            if (!activeShift) {
                return NextResponse.json({
                    error: 'Please open a shift before checking out (กรุณาเปิดกะก่อนทำการเช็คอิน)'
                }, { status: 400 })
            }

            await prisma.$transaction(async (tx) => {
                // 1. Process refunds if any
                if (refunds && Array.isArray(refunds)) {
                    for (const r of refunds) {
                        await tx.deposit.update({
                            where: { id: r.depositId },
                            data: {
                                refundedAmount: Number(r.amount),
                                refundedAt: new Date(),
                                refundShiftId: activeShift.id,
                                status: 'REFUNDED'
                            }
                        })
                    }
                }

                // 2. Update Room status to DIRTY (VACANT_DIRTY)
                for (const r of booking.Rooms) {
                    if (r.roomId) {
                        await tx.room.update({
                            where: { id: r.roomId },
                            data: { status: 'VACANT_DIRTY' }
                        })
                    }
                }

                // 3. Update Stay status
                const stay = await tx.stay.findFirst({
                    where: { bookingId: id, status: 'IN_HOUSE' }
                })
                if (stay) {
                    await tx.stay.update({
                        where: { id: stay.id },
                        data: {
                            status: 'CHECKED_OUT',
                            checkOutTime: new Date()
                        }
                    })
                }
            })
        }
        else if (status === 'CANCELLED') {
            // Release rooms (VACANT_CLEAN or keep current if separate logic, but usually just release)
            // For simplicity, if it was CONFIRMED, rooms were just "Reserved" in schedule, not physically occupied status.
            // But if we want to reflect on Room Board, we might not need to touch Room table if we only visualize based on Booking time.
            // HOWEVER, the logic in `rooms/route.ts` or `rooms/page.tsx` often relies on direct specific room status or computing it.
            // Let's stick to Booking Status being the source of truth for "Reserved" blocks, 
            // but "Occupied" is a physical state.

            // If cancelling a CHECKED_IN booking (rare/mistake), we should free the room.
            if (booking.status === 'CHECKED_IN') {
                for (const r of booking.Rooms) {
                    if (r.roomId) {
                        await prisma.room.update({
                            where: { id: r.roomId },
                            data: { status: 'VACANT_CLEAN' } // Assume instant clean or dirty? dirty is safer.
                        })
                    }
                }
            }
        }

        const updated = await prisma.booking.update({
            where: { id },
            data: { status },
        })

        return NextResponse.json(updated)
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await context.params
        // Soft delete or Hard delete? 
        // Let's do Hard delete for "Cancel" if user wants to remove test data, 
        // but typically "Cancel" is a status update.
        // This DELETE endpoint will be for cleanup.

        await prisma.bookingRoom.deleteMany({ where: { bookingId: id } })
        await prisma.booking.delete({ where: { id } })

        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
