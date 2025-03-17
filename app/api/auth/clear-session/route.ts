import { NextResponse } from 'next/server';

export async function GET() {
  const response = NextResponse.json(
    { success: true, message: 'Session cleared' },
    { status: 200 }
  );
  
  // Clear all NextAuth cookies
  response.cookies.delete('next-auth.session-token');
  response.cookies.delete('next-auth.callback-url');
  response.cookies.delete('next-auth.csrf-token');
  response.cookies.delete('__Secure-next-auth.session-token');
  response.cookies.delete('__Secure-next-auth.callback-url');
  response.cookies.delete('__Secure-next-auth.csrf-token');
  
  return response;
} 