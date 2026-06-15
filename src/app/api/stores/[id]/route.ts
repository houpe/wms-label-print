import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const store = await prisma.store.findUnique({
    where: { id },
    include: { contacts: true },
  })
  if (!store) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(store)
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()
  const store = await prisma.store.update({
    where: { id },
    data: {
      name: body.name,
      address: body.address,
    },
  })
  return NextResponse.json(store)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  await prisma.store.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
