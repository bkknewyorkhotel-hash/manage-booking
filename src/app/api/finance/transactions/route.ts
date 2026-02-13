import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import prisma from '@/lib/prisma'
import { verifyJWT } from '@/lib/auth'

export async function GET() {
    try {
        const cookieStore = await cookies()
        const token = cookieStore.get('token')?.value
        const payload = token ? await verifyJWT(token) : null
        const role = (payload as any)?.role

        let where = {}

        if (role === 'RECEPTION') {
            // Find current active shift
            const activeShift = await prisma.shift.findFirst({
                where: { status: 'OPEN' }
            })

            if (!activeShift) {
                // If receptionist has no open shift, they see nothing
                return NextResponse.json({
                    transactions: [],
                    activeShift: null,
                    error: 'NO_ACTIVE_SHIFT',
                    role
                })
            }

            where = { shiftId: activeShift.id }
        }

        const transactions = await prisma.cashTransaction.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: { Shift: true }
        })

        // Also return activeShift info for UI feedback
        const activeShift = await prisma.shift.findFirst({
            where: { status: 'OPEN' }
        })

        return NextResponse.json({
            transactions,
            activeShift,
            role
        })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const cookieStore = await cookies()
        const token = cookieStore.get('token')?.value
        const payload = token ? await verifyJWT(token) : null
        const role = (payload as any)?.role

        const body = await request.json()
        const { type, category, description, amount, referenceNo } = body

        if (!type || !amount) {
            return NextResponse.json({ error: 'Type and amount are required' }, { status: 400 })
        }

        // Find active shift - required for all now, but especially for reception
        const activeShift = await prisma.shift.findFirst({
            where: { status: 'OPEN' }
        })

        if (!activeShift) {
            return NextResponse.json({
                error: 'Please open a shift first to record transactions (กรุณาเปิดกะก่อนทำการบันทึก)'
            }, { status: 400 })
        }

        const transaction = await prisma.cashTransaction.create({
            data: {
                type,
                category: category || 'PETTY_CASH',
                description,
                amount: Number(amount),
                referenceNo,
                shiftId: activeShift.id
            }
        })

        return NextResponse.json(transaction)
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
