import { NextResponse } from "next/server";

interface RSVPResponse {
  success: boolean;
  message: string;
  errors?: Record<string, string>;
}

export async function POST() {
  return NextResponse.json(
    {
      success: false,
      message: "RSVPs are now closed. Thank you for celebrating with us.",
    } as RSVPResponse,
    { status: 410 }
  );
}
