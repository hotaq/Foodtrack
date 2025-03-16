import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import crypto from "crypto";
import { sendEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { message: "Email is required" },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await db.user.findUnique({
      where: { email },
    });

    // Don't reveal if user exists or not for security
    if (!user) {
      return NextResponse.json(
        { message: "If an account with that email exists, we've sent password reset instructions." },
        { status: 200 }
      );
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

    // Save token to database
    await db.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry,
      } as any,
    });

    // Create reset URL
    const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${resetToken}`;

    // Send email
    await sendEmail({
      to: user.email,
      subject: "Reset your Meal Tracker password",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #6366f1;">Reset Your Password</h2>
          <p>Hello ${user.name || "there"},</p>
          <p>We received a request to reset your password for your Meal Tracker account. If you didn't make this request, you can safely ignore this email.</p>
          <p>To reset your password, click the button below:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Reset Password</a>
          </div>
          <p>Or copy and paste this URL into your browser:</p>
          <p style="word-break: break-all; color: #6366f1;">${resetUrl}</p>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request a password reset, please ignore this email or contact support if you have concerns.</p>
          <p>Thanks,<br>The Meal Tracker Team</p>
        </div>
      `,
    });

    return NextResponse.json(
      { message: "If an account with that email exists, we've sent password reset instructions." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Password reset request error:", error);
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
} 