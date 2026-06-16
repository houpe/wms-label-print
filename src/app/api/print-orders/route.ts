import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const body = await request.json()
  // 批量上传场景 storeId 可能为空，此时不写入关联门店，避免外键约束失败
  const storeId = body.storeId || null
  const order = await prisma.printOrder.create({
    data: {
      storeId,
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
