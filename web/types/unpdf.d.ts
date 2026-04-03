declare module "unpdf" {
  export type PdfDocumentProxy = {
    destroy(): Promise<void>;
  };

  export function getDocumentProxy(input: Uint8Array): Promise<PdfDocumentProxy>;

  export function extractText(
    pdf: PdfDocumentProxy,
    options?: { mergePages?: boolean },
  ): Promise<{
    totalPages: number;
    text: string;
  }>;
}
