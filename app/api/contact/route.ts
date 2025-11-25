import { NextResponse } from "next/server";

// POST /api/contact - Handle contact form submissions
export async function POST(request: Request) {
  const body = await request.json();
  
  const { firstName, lastName, email, subject, message } = body;
  
  // TODO: Implement email sending or store in Supabase
  // TODO: Add validation
  
  console.log("Contact form submission:", { firstName, lastName, email, subject, message });
  
  return NextResponse.json({ 
    success: true, 
    message: "Message received. We'll get back to you soon!" 
  });
}
