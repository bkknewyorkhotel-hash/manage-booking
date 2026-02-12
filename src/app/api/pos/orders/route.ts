
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { items, paymentMethod, total, roomId, guestId, userId, shiftId } = body

        // items: [{ productId, qty, price }]

        // 1. Generate Order Number
        const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '')
        const count = await prisma.posOrder.count()
        const orderNo = `INV-${dateStr}-${(count + 1).toString().padStart(4, '0')}`

        // 2. Create Order Transaction
        const order = await prisma.$transaction(async (tx) => {
            // Create Order
            const newOrder = await tx.posOrder.create({
                data: {
                    orderNo,
                    total: Number(total),
                    paymentMethod,
                    roomId,
                    guestId,
                    shiftId, // Link to Shift
                    createdBy: userId,
                    Items: {
                        create: items.map((item: any) => ({
                            productId: item.productId,
                            name: item.name,
                            price: Number(item.price),
                            qty: Number(item.qty),
                            total: Number(item.price) * Number(item.qty)
                        }))
                    }
                }
            })

            // Deduct Stock
            for (const item of items) {
                await tx.product.update({
                    where: { id: item.productId },
                    data: { stock: { decrement: Number(item.qty) } }
                })
            }

            return newOrder
        })

        return NextResponse.json(order)

    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
