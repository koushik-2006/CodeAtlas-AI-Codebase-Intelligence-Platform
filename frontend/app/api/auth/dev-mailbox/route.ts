import { NextResponse } from "next/server";
import { emailService } from "@/lib/server/email-service";

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not Found" }, { status: 404 });
  }

  const mailbox = emailService.getDevMailbox();
  return NextResponse.json({
    success: true,
    count: mailbox.length,
    messages: mailbox,
  });
}

export async function DELETE() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not Found" }, { status: 404 });
  }

  emailService.clearDevMailbox();
  return NextResponse.json({ success: true, message: "Dev mailbox cleared." });
}
