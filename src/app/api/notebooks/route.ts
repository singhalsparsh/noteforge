import { NextRequest, NextResponse } from 'next/server';
import { getNotebooks, saveNotebook, deleteNotebook, getNotebook } from '@/lib/database';
import { generateId, generateShareToken } from '@/lib/utils';

export async function GET(req: NextRequest) {
  try {
    const notebooks = await getNotebooks();
    return NextResponse.json({ notebooks });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch notebooks' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const notebook = {
      ...body,
      id: body.id || generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await saveNotebook(notebook);
    return NextResponse.json({ notebook, success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create notebook' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...data } = body;
    if (!id) {
      return NextResponse.json({ error: 'Notebook ID is required' }, { status: 400 });
    }
    const existing = await getNotebook(id);
    if (!existing) {
      return NextResponse.json({ error: 'Notebook not found' }, { status: 404 });
    }
    const updated = { ...existing, ...data, updatedAt: new Date().toISOString() };
    await saveNotebook(updated);
    return NextResponse.json({ notebook: updated, success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update notebook' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ error: 'Notebook ID is required' }, { status: 400 });
    }
    await deleteNotebook(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete notebook' }, { status: 500 });
  }
}
