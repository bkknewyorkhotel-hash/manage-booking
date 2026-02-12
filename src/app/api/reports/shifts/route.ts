
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
            const roomBreakdown = shift.Payments.reduce((acc: any, p: any) => {
                acc[p.method] = (acc[p.method] || 0) + p.amount
                return acc
            }, {})

            const posBreakdown = shift.Orders.reduce((acc: any, o: any) => {
                acc[o.paymentMethod] = (acc[o.paymentMethod] || 0) + o.total
                return acc
            }, {})

            const breakdown: any[] = []

            Object.entries(roomBreakdown).forEach(([method, amount]) => {
                breakdown.push({ source: 'ROOM', method, amount })
            })

            Object.entries(posBreakdown).forEach(([method, amount]) => {
                breakdown.push({ source: 'POS', method, amount })
            })

            const totalRevenue = breakdown.reduce((sum, item) => sum + item.amount, 0)

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
