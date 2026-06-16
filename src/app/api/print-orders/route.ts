import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const order = await prisma.printOrder.create({
    data: {
      storeId: body.storeId,
      temperature: body.temperature,
      quantity: body.quantity,
    },
    include: {
      store: true,
    },
  })
  return NextResponse.json(order, { status: 201 })
}

export async function GET() {
  const orders = await prisma.printOrder.findMany({
    include: {
      store: true,
    },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(orders)
}
