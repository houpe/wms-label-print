import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  const stores = await prisma.store.findMany({
    orderBy: [{ cargoOwner: 'asc' }, { createdAt: 'desc' }],
    include: { contacts: true },
  })
  return NextResponse.json(stores)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const store = await prisma.store.create({
    data: {
      cargoOwner: body.cargoOwner || '',
      name: body.name,
      address: body.address,
    },
  })
  return NextResponse.json(store, { status: 201 })
}
