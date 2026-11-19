import { NextResponse } from "next/server";
import { authSchema } from "@/lib/validation";
import { registerUser } from "@/lib/server/register";
import { setSessionCookie } from "@/lib/server/session";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = authSchema.safeParse(body);
    if (!parsed.success || !parsed.data.name) {
      return NextResponse.json(
        { error: parsed.success ? "Укажите имя" : parsed.error.issues[0]?.message },
        { status: 400 }
      );
    }
    const user = await registerUser({
      email: parsed.data.email,
      password: parsed.data.password,
      name: parsed.data.name,
    });
    await setSessionCookie(user.id);
    return NextResponse.json({ user });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Не удалось зарегистрироваться" },
      { status: 400 }
    );
  }
}
