import { NextResponse } from "next/server";

// Sanitize input to prevent XSS
function sanitizeInput(input: string): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/[<>]/g, '') // Remove < and > to prevent HTML injection
    .trim()
    .slice(0, 1000); // Limit length
}

// Validate email format
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

// POST /api/contact - Handle contact form submissions
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const firstName = sanitizeInput(body.firstName || '');
    const lastName = sanitizeInput(body.lastName || '');
    const email = sanitizeInput(body.email || '');
    const subject = sanitizeInput(body.subject || '');
    const message = sanitizeInput(body.message || '').slice(0, 5000); // Allow longer message
    
    // Validate required fields
    if (!firstName || firstName.length < 1) {
      return NextResponse.json(
        { error: 'First name is required' },
        { status: 400 }
      );
    }
    
    if (!email || !isValidEmail(email)) {
      return NextResponse.json(
        { error: 'Valid email is required' },
        { status: 400 }
      );
    }
    
    if (!message || message.length < 10) {
      return NextResponse.json(
        { error: 'Message must be at least 10 characters' },
        { status: 400 }
      );
    }
    
    // TODO: Implement email sending or store in Supabase
    // Note: Contact form data intentionally not logged to avoid PII exposure
    
    return NextResponse.json({ 
      success: true, 
      message: "Message received. We'll get back to you soon!" 
    });
  } catch (error) {
    console.error("[Contact API] Error:", error);
    return NextResponse.json(
      { error: 'Failed to process your request' },
      { status: 500 }
    );
  }
}
