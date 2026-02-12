
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
    try {
        const products = await prisma.product.findMany({
            where: { isActive: true },
            orderBy: { category: 'asc' }
        })
        return NextResponse.json(products)
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { name, category, price, cost, stock, barcode } = body

        const product = await prisma.product.create({
            data: {
                name,
                category,
                price: Number(price),
                cost: Number(cost || 0),
                stock: Number(stock || 0),
                barcode
            }
        })

        return NextResponse.json(product)
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
// PUT: Update product
export async function PUT(request: Request) {
    try {
        const body = await request.json()
        const { id, name, category, price, cost, stock, barcode, isActive } = body

        if (!id) {
            return NextResponse.json({ error: 'Product ID required' }, { status: 400 })
        }

        const product = await prisma.product.update({
            where: { id },
            data: {
                name,
                category,
                price: Number(price),
                cost: Number(cost),
                stock: Number(stock),
                barcode,
                isActive
            }
        })

        return NextResponse.json(product)
    } catch (error) {
        console.error('Error updating product:', error)
        return NextResponse.json({ error: 'Failed to update product' }, { status: 500 })
    }
}

// DELETE: Delete (or deactivate) product
export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')

        if (!id) {
            return NextResponse.json({ error: 'Product ID required' }, { status: 400 })
        }

        // Check if product is in any order
        const orderCount = await prisma.posOrderItem.count({
            where: { productId: id }
        })

        if (orderCount > 0) {
            // Soft delete
            await prisma.product.update({
                where: { id },
                data: { isActive: false }
            })
            return NextResponse.json({ message: 'Product deactivated (used in orders)' })
        } else {
            // Hard delete
            await prisma.product.delete({
                where: { id }
            })
            return NextResponse.json({ message: 'Product deleted' })
        }
    } catch (error) {
        console.error('Error deleting product:', error)
        return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 })
    }
}
