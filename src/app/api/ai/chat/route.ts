import { NextResponse } from "next/server";

import { askWarehouseAI } from "@/features/ai/service";
import { chatRequestSchema } from "@/features/ai/schemas";
import { getActor } from "@/lib/auth/guards";

/** Assistant chat. Identity and role come from the session cookie, never the body. */
export async function POST(request: Request) {
  const actor = await getActor();

  if (!actor) {
    return NextResponse.json(
      { error: "Please sign in to use the assistant." },
      { status: 401 },
    );
  }

  if (actor.mustChangePassword) {
    return NextResponse.json(
      { error: "Change your temporary password before using the assistant." },
      { status: 403 },
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "The request body must be JSON." },
      { status: 400 },
    );
  }

  const parsed = chatRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error:
          parsed.error.issues[0]?.message ?? "The request was not valid.",
      },
      { status: 400 },
    );
  }

  try {
    const result = await askWarehouseAI(parsed.data.messages, actor);

    if (!result.response) {
      return NextResponse.json(
        { error: "The assistant did not return an answer. Please try again." },
        { status: 502 },
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    // Details stay in the server log; the client gets a plain message.
    console.error("AI chat error:", error);

    return NextResponse.json(
      { error: "The assistant is unavailable right now. Please try again." },
      { status: 500 },
    );
  }
}
