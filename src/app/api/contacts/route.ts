import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const storeId = request.nextUrl.searchParams.get('storeId')
  if (storeId) {
    const contacts = await prisma.contact.findMany({
      where: { storeId },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(contacts)
  }
  const contacts = await prisma.contact.findMany({
    include: { store: true },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(contacts)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const contact = await prisma.contact.create({
    data: {
      name: body.name,
      phone: body.phone,
      address: body.address,
      storeId: body.storeId,
    },
    include: { store: true },
  })
  return NextResponse.json(contact, { status: 201 })
}
