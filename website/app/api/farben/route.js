// Öffentlich: welche Shop-Farben gerade lieferbar sind (nur IDs, keine Lagerdetails).
import { NextResponse } from 'next/server';
import { lieferbar } from '../../../technik/lager.js';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({ farben: await lieferbar() }, { headers: { 'Cache-Control': 'no-store' } });
}
