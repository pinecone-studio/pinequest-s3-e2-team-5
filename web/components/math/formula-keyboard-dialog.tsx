"use client";

import {
  createElement,
  type ComponentProps,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type FormulaKeyboardDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInsert: (latex: string) => void;
  initialLatex?: string;
  title?: string;
};

type MathfieldElementLike = HTMLElement & {
  value: string;
  getValue?: (format?: string) => string;
  setValue?: (value?: string) => void;
  insert: (value: string, options?: { format?: string }) => boolean;
  focus: () => void;
  mathVirtualKeyboardPolicy?: "auto" | "manual" | "sandboxed";
  smartMode?: boolean;
};

const quickInsertSnippets = [
  { label: "x²", value: "x^2" },
  { label: "√x", value: "\\sqrt{x}" },
  { label: "a/b", value: "\\frac{a}{b}" },
  { label: "π", value: "\\pi" },
  { label: "∑", value: "\\sum_{i=1}^{n}" },
  { label: "∫", value: "\\int_a^b" },
] as const;

const MATHLIVE_KEYBOARD_SELECTOR =
  ".ML__keyboard, .ML__virtual-keyboard-toggle";

function getMathfieldLatex(mathField: MathfieldElementLike | null) {
  if (!mathField) {
    return "";
  }

  return mathField.getValue?.("latex") ?? mathField.value ?? "";
}

function isMathLiveKeyboardTarget(target: EventTarget | null) {
  return (
    target instanceof HTMLElement &&
    target.closest(MATHLIVE_KEYBOARD_SELECTOR) !== null
  );
}

export function FormulaKeyboardDialog({
  open,
  onOpenChange,
  onInsert,
  initialLatex = "",
  title = "Томьёоны keyboard",
}: FormulaKeyboardDialogProps) {
  const mathFieldRef = useRef<MathfieldElementLike | null>(null);
  const [mathFieldElement, setMathFieldElement] =
    useState<MathfieldElementLike | null>(null);
  const [isMathLiveReady, setIsMathLiveReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    void import("mathlive").then(() => {
      if (!mounted) return;

      const w = window as Window & {
        MathfieldElement?: {
          soundsDirectory: string | null;
        };
      };

      if (w.MathfieldElement) {
        w.MathfieldElement.soundsDirectory = null;
      }

      setIsMathLiveReady(true);
    });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isMathLiveReady || !mathFieldElement) {
      return;
    }

    mathFieldElement.mathVirtualKeyboardPolicy = "manual";
    mathFieldElement.smartMode = true;
  }, [isMathLiveReady, mathFieldElement]);

  useEffect(() => {
    if (!isMathLiveReady || !mathFieldElement) {
      return;
    }

    const w = window as Window & {
      mathVirtualKeyboard?: {
        visible: boolean;
        show?: () => void;
        hide?: () => void;
        layouts?: unknown;
      };
    };

    if (!open) {
      w.mathVirtualKeyboard?.hide?.();
      if (w.mathVirtualKeyboard) {
        w.mathVirtualKeyboard.visible = false;
      }
      return;
    }

    const timeoutId = window.setTimeout(() => {
      const mathField = mathFieldRef.current;
      if (!mathField) return;

      if (mathField.setValue) {
        mathField.setValue(initialLatex);
      } else {
        mathField.value = initialLatex;
      }
      mathField.focus();

      if (w.mathVirtualKeyboard?.show) {
        w.mathVirtualKeyboard.show();
      } else if (w.mathVirtualKeyboard) {
        w.mathVirtualKeyboard.visible = true;
      }
    }, 100);

    return () => window.clearTimeout(timeoutId);
  }, [open, initialLatex, isMathLiveReady, mathFieldElement]);

  const handleInteractOutside: NonNullable<
    ComponentProps<typeof DialogContent>["onInteractOutside"]
  > = (event) => {
    const target = event.detail.originalEvent.target;

    if (!isMathLiveKeyboardTarget(target)) {
      return;
    }

    event.preventDefault();
    window.setTimeout(() => {
      mathFieldRef.current?.focus();
    }, 0);
  };

  const handleInsertSnippet = (snippet: string) => {
    const mathField = mathFieldRef.current;
    if (!mathField) return;

    mathField.insert(snippet, { format: "latex" });
    mathField.focus();
  };

  const handleConfirm = () => {
    const value = getMathfieldLatex(mathFieldRef.current).trim();
    if (!value) return;

    onInsert(value);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[720px] rounded-[24px] border border-[#E8E2F1] bg-white p-0 shadow-[0_24px_80px_rgba(32,18,72,0.18)]"
        onOpenAutoFocus={(event) => event.preventDefault()}
        onInteractOutside={handleInteractOutside}
      >
        <DialogHeader className="border-b border-[#F0EBFA] px-6 py-5">
          <DialogTitle className="text-[24px] font-semibold tracking-tight text-[#16111D]">
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 px-6 py-6">
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
            {quickInsertSnippets.map((snippet) => (
              <button
                key={snippet.label}
                type="button"
                onClick={() => handleInsertSnippet(snippet.value)}
                className="rounded-[14px] border border-[#E8E2F1] bg-[#FAF8FE] px-3 py-3 text-[15px] font-medium text-[#3A3247] transition hover:border-[#B59AF8] hover:bg-white"
              >
                {snippet.label}
              </button>
            ))}
          </div>

          <div className="rounded-[20px] border border-[#E8E2F1] bg-[#FBFAFE] p-4">
            {isMathLiveReady &&
              createElement("math-field", {
                ref: (node: Element | null) => {
                  const nextMathField = node as MathfieldElementLike | null;
                  mathFieldRef.current = nextMathField;
                  setMathFieldElement((currentMathField) =>
                    currentMathField === nextMathField
                      ? currentMathField
                      : nextMathField,
                  );
                },
                className:
                  "min-h-[72px] w-full rounded-[16px] border border-[#DCD3F1] bg-white px-4 py-4 text-[20px] text-[#1A1623] outline-none",
              })}
            <p className="mt-3 text-[13px] text-[#7C7688]">
              `mathlive` суулгагдаагүй үед энэ fallback editor ажиллана.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-[#F0EBFA] px-6 py-5">
          <Button
            type="button"
            variant="outline"
            className="h-11 rounded-full px-6"
            onClick={() => onOpenChange(false)}
          >
            Болих
          </Button>
          <Button
            type="button"
            className="h-11 rounded-full bg-[#9c7cf7] px-6 text-white hover:bg-[#8f6df5]"
            onClick={handleConfirm}
          >
            Оруулах
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
