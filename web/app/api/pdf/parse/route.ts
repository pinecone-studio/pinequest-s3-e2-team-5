import { NextResponse } from "next/server";

export const runtime = "nodejs";

function extractTextValue(item: unknown) {
  if (!item || typeof item !== "object") {
    return "";
  }

  const maybeText = (item as { str?: unknown }).str;
  return typeof maybeText === "string" ? maybeText : "";
}

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

    const { getDocument } = await import("pdfjs-dist/legacy/build/pdf.mjs");
    const bytes = new Uint8Array(await file.arrayBuffer());
    const loadingTask = getDocument({
      data: bytes,
      isEvalSupported: false,
      isOffscreenCanvasSupported: false,
      isImageDecoderSupported: false,
      useWorkerFetch: false,
    });
    const pdf = await loadingTask.promise;

    try {
      const pageTexts: string[] = [];

      for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
        const page = await pdf.getPage(pageNumber);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map(extractTextValue)
          .join(" ")
          .replace(/\s+/g, " ")
          .trim();

        if (pageText) {
          pageTexts.push(pageText);
        }
      }

      return NextResponse.json({
        text: pageTexts.join("\n"),
        pageCount: pdf.numPages,
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
