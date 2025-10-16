export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'Missing file' }, { status: 400 })

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const baseDir = path.join(process.cwd(), 'public', 'call-recordings')
    await fs.mkdir(baseDir, { recursive: true })
    const safeName = String(file.name || `call_${Date.now()}.webm`).replace(/[^a-zA-Z0-9_.-]/g, '_')
    const fullPath = path.join(baseDir, safeName)
    await fs.writeFile(fullPath, buffer)

    const url = `/call-recordings/${safeName}`
    return NextResponse.json({ url })
  } catch (err: any) {
    console.error('upload error', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
