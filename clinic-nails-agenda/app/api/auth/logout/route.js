import { NextResponse } from "next/server";
import { cookieBorrar } from "../../../../lib/servidor";

export const dynamic = "force-dynamic";

export async function POST(request) {
  const respuesta = NextResponse.json({ ok: true });
  respuesta.headers.append("Set-Cookie", cookieBorrar(request));
  return respuesta;
}
