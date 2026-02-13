
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { subDays, startOfDay } from 'date-fns'

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '7')
        const skip = (page - 1) * limit

        const shifts = await prisma.shift.findMany({
            where: {
                status: 'CLOSED'
            },
            include: {
                User: {
                    select: {
                        name: true,
                        username: true
                    }
                },
                Payments: {
                    select: {
                        amount: true,
                        method: true
                    }
                },
                Orders: {
                    where: {
                        status: 'COMPLETED'
                    },
                    select: {
                        total: true,
                        paymentMethod: true
                    }
                }
            },
            orderBy: {
                endTime: 'desc'
            },
            take: limit,
            skip: skip
        })

        const formattedShifts = shifts.map((shift: any) => {
            const roomBreakdown = shift.Payments.reduce((acc: any, p: any) => {
                acc[p.method] = (Number(acc[p.method]) || 0) + Number(p.amount)
                return acc
            }, {})

            const posBreakdown = shift.Orders.reduce((acc: any, o: any) => {
                acc[o.paymentMethod] = (Number(acc[o.paymentMethod]) || 0) + Number(o.total)
                return acc
            }, {})

            const breakdown: any[] = []

            Object.entries(roomBreakdown).forEach(([method, amount]) => {
                breakdown.push({ source: 'ROOM', method, amount })
            })

            Object.entries(posBreakdown).forEach(([method, amount]) => {
                breakdown.push({ source: 'POS', method, amount })
            })

            const totalRevenue = breakdown.reduce((sum, item) => sum + Number(item.amount), 0)

            return {
                id: shift.id,
                startTime: shift.startTime,
                endTime: shift.endTime,
                user: shift.User?.name || shift.User?.username || 'Unknown',
                breakdown,
                totalRevenue,
                startCash: shift.startCash,
                endCash: shift.endCash
            }
        })

        return NextResponse.json(formattedShifts)
    } catch (error) {
        console.error('Shift History API Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
