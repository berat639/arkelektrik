import { NextRequest, NextResponse } from "next/server";
import { createMessage } from "@/lib/db";
import { resend } from "@/lib/resend";
import { contactFormSchema } from "@/lib/validators";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = contactFormSchema.parse(body);

    // Save to Redis
    await createMessage({
      name: validatedData.name,
      email: validatedData.email,
      message: validatedData.message,
    });

    // Send email notification
    const contactEmail = process.env.CONTACT_EMAIL;
    if (contactEmail && process.env.RESEND_API_KEY && process.env.RESEND_API_KEY !== "your_resend_api_key") {
      await resend.emails.send({
        from: "Ark Blog <onboarding@resend.dev>",
        to: contactEmail,
        subject: `Yeni İletişim Mesajı: ${validatedData.name}`,
        html: `
          <h2>Yeni İletişim Formu Mesajı</h2>
          <p><strong>İsim:</strong> ${validatedData.name}</p>
          <p><strong>E-posta:</strong> ${validatedData.email}</p>
          <p><strong>Mesaj:</strong></p>
          <p>${validatedData.message.replace(/\n/g, "<br>")}</p>
        `,
      });
    }

    return NextResponse.json(
      { message: "Mesajınız başarıyla gönderildi." },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Geçersiz form verisi." },
        { status: 400 }
      );
    }
    console.error("Contact API error:", error);
    return NextResponse.json(
      { error: "Bir hata oluştu." },
      { status: 500 }
    );
  }
}
