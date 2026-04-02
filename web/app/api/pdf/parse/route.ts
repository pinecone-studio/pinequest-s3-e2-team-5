import { NextResponse } from "next/server";
import { extractText, getDocumentProxy } from "unpdf";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
    }

    if (file.type && file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "Only PDF files are supported." },
        { status: 400 },
      );
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    const pdf = await getDocumentProxy(bytes);

    try {
      const { totalPages, text } = await extractText(pdf, { mergePages: true });

      return NextResponse.json({
        text,
        pageCount: totalPages,
      });
    } finally {
      await pdf.destroy();
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to parse PDF.";
    const stack = error instanceof Error ? error.stack : undefined;

    return NextResponse.json(
      {
        error: message,
        stack: process.env.NODE_ENV === "development" ? stack : undefined,
      },
      { status: 500 },
    );
  }
}
