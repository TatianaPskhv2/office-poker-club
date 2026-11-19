import { NextResponse } from "next/server";
import { authSchema } from "@/lib/validation";
import { loginUser } from "@/lib/server/register";
import { setSessionCookie } from "@/lib/server/session";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = authSchema.pick({ email: true, password: true }).safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
    }
    const user = await loginUser(parsed.data.email, parsed.data.password);
    await setSessionCookie(user.id);
    return NextResponse.json({ user });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Не удалось войти" },
      { status: 400 }
    );
  }
}
