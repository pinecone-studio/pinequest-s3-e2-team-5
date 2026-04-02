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

type BuiltInVirtualKeyboardLayout =
  | "numeric"
  | "symbols"
  | "alphabetic"
  | "greek";

type VirtualKeyboardKeycap = {
  label?: string;
  latex?: string;
  insert?: string;
  class?: string;
  width?: 0.5 | 1 | 1.5 | 2 | 5;
  aside?: string;
};

type VirtualKeyboardLayout = {
  id: string;
  label: string;
  tooltip?: string;
  displayEditToolbar?: boolean;
  rows: (string | VirtualKeyboardKeycap)[][];
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

const subjectKeyboardLayouts: readonly VirtualKeyboardLayout[] = [
  {
    id: "subject-math",
    label: "Math",
    tooltip: "Math symbols and expressions",
    displayEditToolbar: true,
    rows: [
      [
        { label: "√x", insert: "\\sqrt{x}" },
        { label: "a/b", insert: "\\frac{a}{b}" },
        { label: "x²", insert: "x^2" },
        { label: "x³", insert: "x^3" },
        { label: "xₙ", insert: "x_n" },
        { label: "|x|", insert: "\\left|x\\right|" },
        { latex: "\\pi" },
        { label: "θ", insert: "\\theta" },
        { label: "∞", insert: "\\infty" },
        { label: "%", insert: "\\%" },
      ],
      [
        { label: "∑", insert: "\\sum_{i=1}^{n}" },
        { label: "∫", insert: "\\int_a^b" },
        { label: "lim", insert: "\\lim_{x\\to 0}" },
        { label: "log", insert: "\\log\\left(\\right)" },
        { label: "ln", insert: "\\ln\\left(\\right)" },
        { label: "sin", insert: "\\sin\\left(\\right)" },
        { label: "cos", insert: "\\cos\\left(\\right)" },
        { label: "tan", insert: "\\tan\\left(\\right)" },
        { label: "Δ", insert: "\\Delta" },
        { label: "∇", insert: "\\nabla" },
      ],
      [
        { label: "≤", insert: "\\le" },
        { label: "≥", insert: "\\ge" },
        { label: "≠", insert: "\\ne" },
        { label: "≈", insert: "\\approx" },
        { label: "±", insert: "\\pm" },
        { label: "∝", insert: "\\propto" },
        { label: "∈", insert: "\\in" },
        { label: "∉", insert: "\\notin" },
        { label: "∩", insert: "\\cap" },
        { label: "∪", insert: "\\cup" },
      ],
      [
        { label: "(", insert: "(" },
        { label: ")", insert: ")" },
        { label: "[", insert: "[" },
        { label: "]", insert: "]" },
        { label: "{", insert: "\\{" },
        { label: "}", insert: "\\}" },
        { label: "→", insert: "\\rightarrow" },
        { label: "←", insert: "\\leftarrow" },
        { label: "↔", insert: "\\leftrightarrow" },
        { label: "·", insert: "\\cdot" },
      ],
    ],
  },
  {
    id: "subject-physics",
    label: "Physics",
    tooltip: "Physics notation",
    displayEditToolbar: true,
    rows: [
      [
        { label: "v", insert: "v" },
        { label: "a", insert: "a" },
        { label: "F", insert: "F" },
        { label: "m", insert: "m" },
        { label: "t", insert: "t" },
        { label: "s", insert: "s" },
        { label: "p", insert: "p" },
        { label: "E", insert: "E" },
        { label: "W", insert: "W" },
        { label: "P", insert: "P" },
      ],
      [
        { label: "Δx", insert: "\\Delta x" },
        { label: "Δv", insert: "\\Delta v" },
        { label: "λ", insert: "\\lambda" },
        { label: "ω", insert: "\\omega" },
        { label: "μ", insert: "\\mu" },
        { label: "α", insert: "\\alpha" },
        { label: "β", insert: "\\beta" },
        { label: "γ", insert: "\\gamma" },
        { label: "θ", insert: "\\theta" },
        { label: "φ", insert: "\\phi" },
      ],
      [
        { label: "E=mc²", insert: "E=mc^2", class: "small" },
        { label: "p=mv", insert: "p=mv", class: "small" },
        { label: "v=s/t", insert: "v=\\frac{s}{t}", class: "small" },
        {
          label: "a=Δv/t",
          insert: "a=\\frac{\\Delta v}{t}",
          class: "small",
        },
        { label: "F=ma", insert: "F=ma", class: "small" },
        { label: "W=Fs", insert: "W=Fs", class: "small" },
        { label: "P=W/t", insert: "P=\\frac{W}{t}", class: "small" },
        { label: "ρ=m/V", insert: "\\rho=\\frac{m}{V}", class: "small" },
        { label: "p=F/S", insert: "p=\\frac{F}{S}", class: "small" },
        { label: "q=It", insert: "q=It", class: "small" },
      ],
      [
        { label: "→", insert: "\\rightarrow" },
        { label: "←", insert: "\\leftarrow" },
        { label: "∥", insert: "\\parallel" },
        { label: "⟂", insert: "\\perp" },
        { label: "°", insert: "^{\\circ}" },
        { label: "m/s", insert: "\\frac{m}{s}", class: "small" },
        { label: "N", insert: "\\mathrm{N}" },
        { label: "J", insert: "\\mathrm{J}" },
        { label: "Pa", insert: "\\mathrm{Pa}" },
        { label: "Hz", insert: "\\mathrm{Hz}" },
      ],
    ],
  },
  {
    id: "subject-chemistry",
    label: "Chemistry",
    tooltip: "Chemistry notation",
    displayEditToolbar: true,
    rows: [
      [
        { label: "H₂O", insert: "H_2O" },
        { label: "CO₂", insert: "CO_2" },
        { label: "O₂", insert: "O_2" },
        { label: "NaCl", insert: "NaCl" },
        { label: "H⁺", insert: "H^+" },
        { label: "OH⁻", insert: "OH^-" },
        { label: "NH₃", insert: "NH_3" },
        { label: "HCl", insert: "HCl" },
        { label: "CaCO₃", insert: "CaCO_3" },
        { label: "CH₄", insert: "CH_4" },
      ],
      [
        { label: "→", insert: "\\rightarrow" },
        { label: "⇌", insert: "\\rightleftharpoons" },
        { label: "Δ", insert: "\\Delta" },
        { label: "·", insert: "\\cdot" },
        { label: "(aq)", insert: "_{(aq)}", class: "small" },
        { label: "(s)", insert: "_{(s)}", class: "small" },
        { label: "(l)", insert: "_{(l)}", class: "small" },
        { label: "(g)", insert: "_{(g)}", class: "small" },
        { label: "↑", insert: "\\uparrow" },
        { label: "↓", insert: "\\downarrow" },
      ],
      [
        { label: "e⁻", insert: "e^-", class: "small" },
        { label: "Na⁺", insert: "Na^+", class: "small" },
        { label: "Cl⁻", insert: "Cl^-", class: "small" },
        { label: "pH", insert: "\\mathrm{pH}", class: "small" },
        { label: "Kc", insert: "K_c", class: "small" },
        { label: "Kp", insert: "K_p", class: "small" },
        { label: "n", insert: "n" },
        { label: "M", insert: "\\mathrm{M}" },
        { label: "mol", insert: "\\mathrm{mol}" },
        { label: "g/mol", insert: "\\frac{g}{mol}", class: "small" },
      ],
      [
        { label: "H₂SO₄", insert: "H_2SO_4", class: "small" },
        { label: "HNO₃", insert: "HNO_3", class: "small" },
        { label: "NaOH", insert: "NaOH", class: "small" },
        { label: "KOH", insert: "KOH", class: "small" },
        { label: "AgNO₃", insert: "AgNO_3", class: "small" },
        { label: "CuSO₄", insert: "CuSO_4", class: "small" },
        { label: "Fe₂O₃", insert: "Fe_2O_3", class: "small" },
        { label: "SO₄²⁻", insert: "SO_4^{2-}", class: "small" },
        { label: "CO₃²⁻", insert: "CO_3^{2-}", class: "small" },
        { label: "NH₄⁺", insert: "NH_4^+", class: "small" },
      ],
    ],
  },
] as const;

const defaultKeyboardLayouts: readonly BuiltInVirtualKeyboardLayout[] = [
  "numeric",
  "symbols",
  "alphabetic",
  "greek",
];

const extendedKeyboardLayouts: readonly (
  | BuiltInVirtualKeyboardLayout
  | VirtualKeyboardLayout
)[] = [...defaultKeyboardLayouts, ...subjectKeyboardLayouts];

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
    if (!isMathLiveReady) {
      return;
    }

    const w = window as Window & {
      mathVirtualKeyboard?: {
        visible: boolean;
        show?: () => void;
        hide?: () => void;
        layouts?: readonly (
          | BuiltInVirtualKeyboardLayout
          | VirtualKeyboardLayout
        )[];
      };
    };

    if (w.mathVirtualKeyboard) {
      w.mathVirtualKeyboard.layouts = extendedKeyboardLayouts;
    }
  }, [isMathLiveReady]);

  useEffect(() => {
    if (!isMathLiveReady || !mathFieldElement) {
      return;
    }

    const w = window as Window & {
      mathVirtualKeyboard?: {
        visible: boolean;
        show?: () => void;
        hide?: () => void;
        layouts?: readonly (
          | BuiltInVirtualKeyboardLayout
          | VirtualKeyboardLayout
        )[];
      };
    };

    if (w.mathVirtualKeyboard) {
      w.mathVirtualKeyboard.layouts = extendedKeyboardLayouts;
    }

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

  useEffect(() => {
    if (!open) {
      return;
    }

    const root = document.documentElement;
    const keyboardVars = {
      "--keycap-height": "44px",
      "--keycap-max-width": "56px",
      "--keycap-gap": "6px",
      "--keycap-small-font-size": "13px",
      "--keycap-extra-small-font-size": "11px",
      "--variant-keycap-length": "42px",
      "--variant-keycap-font-size": "20px",
    } as const;

    const previousValues = Object.fromEntries(
      Object.keys(keyboardVars).map((key) => [
        key,
        root.style.getPropertyValue(key),
      ]),
    );

    for (const [key, value] of Object.entries(keyboardVars)) {
      root.style.setProperty(key, value);
    }

    return () => {
      for (const [key, value] of Object.entries(previousValues)) {
        if (value) {
          root.style.setProperty(key, value);
        } else {
          root.style.removeProperty(key);
        }
      }
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    document.body.classList.add("formula-keyboard-open");

    return () => {
      document.body.classList.remove("formula-keyboard-open");
    };
  }, [open]);

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

  const handleConfirm = () => {
    const value = getMathfieldLatex(mathFieldRef.current).trim();
    if (!value) return;

    onInsert(value);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="w-[calc(100vw-2rem)] max-w-[1040px] overflow-hidden rounded-[24px] border border-[#E8E2F1] bg-white p-0 shadow-[0_24px_80px_rgba(32,18,72,0.18)]"
        onOpenAutoFocus={(event) => event.preventDefault()}
        onInteractOutside={handleInteractOutside}
      >
        <DialogHeader className="border-b border-[#F0EBFA] px-6 py-5">
          <DialogTitle className="text-[24px] font-semibold tracking-tight text-[#16111D]">
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 px-6 py-[20px]">
          <div className="overflow-hidden rounded-[20px] border border-[#E8E2F1] bg-[#FBFAFE] p-4">
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
                  "block min-h-[72px] w-full max-w-full overflow-hidden rounded-[16px] border border-[#DCD3F1] bg-white px-4 py-4 text-[20px] text-[#1A1623] outline-none",
              })}
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
        <style jsx global>{`
          body.formula-keyboard-open > .ML__keyboard .MLK__toolbar {
            justify-content: center;
            box-sizing: border-box;
          }

          body.formula-keyboard-open > .ML__keyboard .MLK__toolbar > .left {
            justify-content: center;
            margin-inline: auto;
          }

          body.formula-keyboard-open > .ML__keyboard .MLK__toolbar > .right {
            display: none;
          }
        `}</style>
      </DialogContent>
    </Dialog>
  );
}
