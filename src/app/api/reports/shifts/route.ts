
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { subDays, startOfDay } from 'date-fns'

export async function GET() {
    try {
        const last7Days = startOfDay(subDays(new Date(), 7))

        const shifts = await prisma.shift.findMany({
            where: {
                status: 'CLOSED',
                endTime: {
                    gte: last7Days
                }
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
                        amount: true
                    }
                },
                Orders: {
                    where: {
                        status: 'COMPLETED'
                    },
                    select: {
                        total: true
                    }
                }
            },
            orderBy: {
                endTime: 'desc'
            }
        })

        const formattedShifts = shifts.map((shift: any) => {
            const roomRevenue = shift.Payments.reduce((sum: number, p: any) => sum + p.amount, 0)
            const posRevenue = shift.Orders.reduce((sum: number, o: any) => sum + o.total, 0)

            return {
                id: shift.id,
                startTime: shift.startTime,
                endTime: shift.endTime,
                user: shift.User?.name || shift.User?.username || 'Unknown',
                roomRevenue,
                posRevenue,
                totalRevenue: roomRevenue + posRevenue,
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
