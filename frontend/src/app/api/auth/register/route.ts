import { NextRequest } from "next/server";
import { authenticate } from "@/lib/server-auth";

export function POST(request: NextRequest) {
  return authenticate(request, "register");
}
