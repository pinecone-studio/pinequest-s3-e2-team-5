"use client";

import {
  createElement,
  type ComponentProps,
  useEffect,
  useRef,
  useState,
} from "react";
import type {
  EditToolbarOptions,
  VirtualKeyboardKeycap,
  VirtualKeyboardLayout,
  VirtualKeyboardName,
} from "mathlive";
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

type SubjectTab = "math" | "physics" | "chemistry";

type SnippetItem = {
  label: string;
  value: string;
  keyboardValue?: string;
};

type KeyboardKey = string | Partial<VirtualKeyboardKeycap>;
type KeyboardLayoutSpec = VirtualKeyboardName | VirtualKeyboardLayout;

type MathVirtualKeyboardLike = {
  visible: boolean;
  show?: () => void;
  hide?: () => void;
  layouts: readonly KeyboardLayoutSpec[];
  editToolbar: EditToolbarOptions;
};

type MathWindow = Window & {
  MathfieldElement?: {
    soundsDirectory: string | null;
  };
  mathVirtualKeyboard?: MathVirtualKeyboardLike;
};

type SubjectTabConfig = {
  key: SubjectTab;
  label: string;
  snippets: readonly SnippetItem[];
};

const DEFAULT_KEYBOARD_LAYOUTS: readonly KeyboardLayoutSpec[] = [
  "numeric",
  "symbols",
  "alphabetic",
  "greek",
];

const CUSTOM_TAB_ROW_SIZE = 9;
const CUSTOM_TAB_CONTENT_ROWS = 3;
const CUSTOM_TAB_VISIBLE_SNIPPETS =
  CUSTOM_TAB_ROW_SIZE * CUSTOM_TAB_CONTENT_ROWS;

const KEYBOARD_THEME_STYLE_ID = "formula-keyboard-dialog-theme";
const KEYBOARD_THEME_CSS = `
  body > .ML__keyboard {
    --keyboard-accent-color: #9c7cf7;
    --keyboard-background: #121019;
    --keyboard-border: rgba(164, 143, 224, 0.18);
    --keyboard-toolbar-text: #c9c0dd;
    --keyboard-toolbar-text-active: #ffffff;
    --keyboard-toolbar-background: rgba(255, 255, 255, 0.03);
    --keyboard-toolbar-background-hover: rgba(156, 124, 247, 0.14);
    --keyboard-toolbar-background-selected: linear-gradient(135deg, #9c7cf7 0%, #7f63ea 100%);
    --keyboard-padding-top: 10px;
    --keyboard-padding-horizontal: 14px;
    border-top: 1px solid rgba(164, 143, 224, 0.14);
    box-shadow: 0 -20px 48px rgba(7, 5, 20, 0.46);
  }

  body > .ML__keyboard .MLK__toolbar {
    justify-content: center;
    width: 100%;
    max-width: none;
    padding: 6px 18px 12px;
  }

  body > .ML__keyboard .MLK__toolbar > .left {
    flex: 0 1 auto;
    flex-wrap: nowrap;
    justify-content: center;
    row-gap: 4px;
    overflow-x: auto;
    scrollbar-width: none;
    -ms-overflow-style: none;
  }

  body > .ML__keyboard .MLK__toolbar > .left::-webkit-scrollbar {
    display: none;
  }

  body > .ML__keyboard .MLK__toolbar > .right {
    display: none;
  }

  body > .ML__keyboard .MLK__toolbar > div > div {
    min-height: 48px;
    margin: 4px 5px;
    padding: 10px 18px;
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.03);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
    font-size: 15px;
    font-weight: 600;
    letter-spacing: 0.01em;
    transition:
      background-color 120ms ease,
      color 120ms ease,
      transform 120ms ease,
      box-shadow 120ms ease;
  }

  body > .ML__keyboard .MLK__toolbar > div > div:hover {
    transform: translateY(-1px);
  }

  body > .ML__keyboard .MLK__toolbar > div > div.selected {
    margin-bottom: 4px;
    padding-bottom: 10px;
    border-radius: 999px;
    border-bottom-color: transparent;
    box-shadow: 0 10px 26px rgba(124, 91, 232, 0.34);
  }

  body > .ML__keyboard .MLK__row {
    justify-content: center;
  }

  body > .ML__keyboard .MLK__keycap {
    border-radius: 18px;
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
  }
`;

const snippetTabs: readonly SubjectTabConfig[] = [
  {
    key: "math",
    label: "Math",
    snippets: [
      { label: "x²", value: "x^2", keyboardValue: "#@^2" },
      { label: "xⁿ", value: "x^n", keyboardValue: "#@^{#?}" },
      { label: "√x", value: "\\sqrt{x}", keyboardValue: "\\sqrt{#?}" },
      { label: "ⁿ√x", value: "\\sqrt[n]{x}", keyboardValue: "\\sqrt[#?]{#?}" },
      { label: "a/b", value: "\\frac{a}{b}", keyboardValue: "\\frac{#?}{#?}" },

      {
        label: "|x|",
        value: "\\left|x\\right|",
        keyboardValue: "\\left|#?\\right|",
      },
      {
        label: "( )",
        value: "\\left( x \\right)",
        keyboardValue: "\\left(#?\\right)",
      },
      {
        label: "[ ]",
        value: "\\left[ x \\right]",
        keyboardValue: "\\left[#?\\right]",
      },
      {
        label: "{ }",
        value: "\\left\\{ x \\right\\}",
        keyboardValue: "\\left\\{#?\\right\\}",
      },

      { label: "π", value: "\\pi" },
      { label: "∞", value: "\\infty" },
      { label: "θ", value: "\\theta" },
      { label: "α", value: "\\alpha" },
      { label: "β", value: "\\beta" },
      { label: "γ", value: "\\gamma" },
      { label: "Δ", value: "\\Delta" },

      { label: "≠", value: "\\ne" },
      { label: "≤", value: "\\le" },
      { label: "≥", value: "\\ge" },
      { label: "±", value: "\\pm" },
      { label: "×", value: "\\times" },
      { label: "÷", value: "\\div" },
      { label: "·", value: "\\cdot" },

      {
        label: "∑",
        value: "\\sum_{i=1}^{n}",
        keyboardValue: "\\sum_{#?}^{#?}",
      },
      {
        label: "∏",
        value: "\\prod_{i=1}^{n}",
        keyboardValue: "\\prod_{#?}^{#?}",
      },
      { label: "∫", value: "\\int_a^b", keyboardValue: "\\int_{#?}^{#?}" },
      { label: "∬", value: "\\iint", keyboardValue: "\\iint_{#?}" },

      {
        label: "lim",
        value: "\\lim_{x \\to 0}",
        keyboardValue: "\\lim_{x \\to #?}",
      },
      { label: "log", value: "\\log_{a}(x)", keyboardValue: "\\log_{#?}(#?)" },
      { label: "ln", value: "\\ln(x)", keyboardValue: "\\ln(#?)" },
      { label: "sin", value: "\\sin(x)", keyboardValue: "\\sin(#?)" },
      { label: "cos", value: "\\cos(x)", keyboardValue: "\\cos(#?)" },
      { label: "tan", value: "\\tan(x)", keyboardValue: "\\tan(#?)" },

      { label: "xᵢ", value: "x_i", keyboardValue: "#@_{#?}" },
      { label: "xⁱ", value: "x^i", keyboardValue: "#@^{#?}" },
      { label: "xᵢʲ", value: "x_i^j", keyboardValue: "#@_{#?}^{#?}" },

      { label: "a₁", value: "a_1", keyboardValue: "#@_{#?}" },
      { label: "aₙ", value: "a_n", keyboardValue: "#@_{#?}" },
      { label: "Sₙ", value: "S_n", keyboardValue: "#@_{#?}" },

      { label: "f(x)", value: "f(x)", keyboardValue: "f(#?)" },
      { label: "f'(x)", value: "f'(x)", keyboardValue: "f'(#?)" },
      {
        label: "d/dx",
        value: "\\frac{d}{dx}",
        keyboardValue: "\\frac{d}{d#?}",
      },

      { label: "→", value: "\\to" },
      { label: "↔", value: "\\leftrightarrow" },
      { label: "∈", value: "\\in" },
      { label: "∉", value: "\\notin" },
      { label: "⊂", value: "\\subset" },
      { label: "⊆", value: "\\subseteq" },
      { label: "∪", value: "\\cup" },
      { label: "∩", value: "\\cap" },

      { label: "P(A)", value: "P(A)", keyboardValue: "P(#?)" },
      { label: "n!", value: "n!", keyboardValue: "#?!" },
      { label: "C(n,r)", value: "C_n^r", keyboardValue: "C_{#?}^{#?}" },

      { label: "x̄", value: "\\bar{x}", keyboardValue: "\\bar{#?}" },
      { label: "ŷ", value: "\\hat{y}", keyboardValue: "\\hat{#?}" },
      { label: "⃗a", value: "\\vec{a}", keyboardValue: "\\vec{#?}" },

      {
        label: "matrix",
        value: "\\begin{bmatrix} a & b \\\\ c & d \\end{bmatrix}",
        keyboardValue: "\\begin{bmatrix} #? & #? \\\\ #? & #? \\end{bmatrix}",
      },
      {
        label: "cases",
        value: "\\begin{cases} x+y=1 \\\\ x-y=2 \\end{cases}",
        keyboardValue: "\\begin{cases} #? \\\\ #? \\end{cases}",
      },

      { label: "x+y", value: "x+y", keyboardValue: "#?+#?" },
      { label: "x-y", value: "x-y", keyboardValue: "#?-#?" },
      { label: "xy", value: "xy", keyboardValue: "#?\\cdot#?" },
      { label: "x/y", value: "\\frac{x}{y}", keyboardValue: "\\frac{#?}{#?}" },

      { label: "ax²+bx+c", value: "ax^2+bx+c", keyboardValue: "#?x^2+#?x+#?" },
      {
        label: "quadratic",
        value: "x=\\frac{-b\\pm\\sqrt{b^2-4ac}}{2a}",
        keyboardValue:
          "x=\\frac{-#?\\pm\\sqrt{#?^2-4\\cdot#?\\cdot#?}}{2\\cdot#?}",
      },
      { label: "(a+b)²", value: "(a+b)^2", keyboardValue: "(#?+#?)^2" },
      { label: "(a-b)²", value: "(a-b)^2", keyboardValue: "(#?-#?)^2" },
      { label: "a²-b²", value: "a^2-b^2", keyboardValue: "#?^2-#?^2" },
    ],
  },
  {
    key: "physics",
    label: "Physics",
    snippets: [
      // Variables
      { label: "v", value: "v" },
      { label: "a", value: "a" },
      { label: "t", value: "t" },
      { label: "s", value: "s" },
      { label: "x", value: "x" },
      { label: "y", value: "y" },

      // Subscript / superscript
      { label: "₀", value: "_0", keyboardValue: "#@_0" },
      { label: "₁", value: "_1", keyboardValue: "#@_1" },
      { label: "ⁿ", value: "^n", keyboardValue: "#@^{#?}" },
      { label: "²", value: "^2", keyboardValue: "#@^2" },

      // Delta
      { label: "Δ", value: "\\Delta" },
      { label: "Δx", value: "\\Delta x" },
      { label: "Δt", value: "\\Delta t" },
      { label: "Δv", value: "\\Delta v" },

      // Greek symbols
      { label: "λ", value: "\\lambda" },
      { label: "θ", value: "\\theta" },
      { label: "ω", value: "\\omega" },
      { label: "Ω", value: "\\Omega" },
      { label: "ρ", value: "\\rho" },
      { label: "μ", value: "\\mu" },

      // Units (fraction form)
      { label: "m/s", value: "\\frac{m}{s}", keyboardValue: "\\frac{#?}{#?}" },
      {
        label: "m/s²",
        value: "\\frac{m}{s^2}",
        keyboardValue: "\\frac{#?}{#?^2}",
      },
      { label: "kg", value: "\\mathrm{kg}" },
      { label: "N", value: "\\mathrm{N}" },
      { label: "J", value: "\\mathrm{J}" },
      { label: "W", value: "\\mathrm{W}" },

      // Math operators (physics дээр байнга хэрэглэнэ)
      { label: "+", value: "+" },
      { label: "-", value: "-" },
      { label: "×", value: "\\times" },
      { label: "÷", value: "\\div" },
      { label: "·", value: "\\cdot" },
      { label: "=", value: "=" },

      // Fractions & structure
      { label: "a/b", value: "\\frac{a}{b}", keyboardValue: "\\frac{#?}{#?}" },
      {
        label: "( )",
        value: "\\left( x \\right)",
        keyboardValue: "\\left(#?\\right)",
      },

      // Vector / arrow
      { label: "→", value: "\\rightarrow" },
      { label: "←", value: "\\leftarrow" },
      { label: "↑", value: "\\uparrow" },
      { label: "↓", value: "\\downarrow" },
      { label: "⃗a", value: "\\vec{a}", keyboardValue: "\\vec{#?}" },

      // Special physics notation
      {
        label: "| |",
        value: "\\left|x\\right|",
        keyboardValue: "\\left|#?\\right|",
      },
      { label: "∝", value: "\\propto" },
      { label: "≈", value: "\\approx" },
    ],
  },
  {
    key: "chemistry",
    label: "Chemistry",
    snippets: [
      // ===== ELEMENTS =====
      { label: "H", value: "H" },
      { label: "O", value: "O" },
      { label: "C", value: "C" },
      { label: "N", value: "N" },
      { label: "S", value: "S" },
      { label: "P", value: "P" },

      { label: "Na", value: "Na" },
      { label: "K", value: "K" },
      { label: "Ca", value: "Ca" },
      { label: "Mg", value: "Mg" },
      { label: "Al", value: "Al" },

      { label: "Fe", value: "Fe" },
      { label: "Cu", value: "Cu" },
      { label: "Zn", value: "Zn" },
      { label: "Ag", value: "Ag" },
      { label: "Ba", value: "Ba" },
      { label: "Pb", value: "Pb" },

      { label: "Cl", value: "Cl" },
      { label: "Br", value: "Br" },
      { label: "I", value: "I" },

      // ===== SUBSCRIPT =====
      { label: "₂", value: "_2", keyboardValue: "#@_2" },
      { label: "₃", value: "_3", keyboardValue: "#@_3" },
      { label: "₄", value: "_4", keyboardValue: "#@_4" },
      { label: "₅", value: "_5", keyboardValue: "#@_5" },
      { label: "ₙ", value: "_n", keyboardValue: "#@_{#?}" },

      // ===== CHARGE =====
      { label: "⁺", value: "^+", keyboardValue: "#@^+" },
      { label: "⁻", value: "^-", keyboardValue: "#@^-" },
      { label: "²⁺", value: "^2+", keyboardValue: "#@^{2+}" },
      { label: "²⁻", value: "^2-", keyboardValue: "#@^{2-}" },
      { label: "³⁺", value: "^3+", keyboardValue: "#@^{3+}" },
      { label: "³⁻", value: "^3-", keyboardValue: "#@^{3-}" },

      // ===== STATES =====
      { label: "(s)", value: "\\mathrm{(s)}" },
      { label: "(l)", value: "\\mathrm{(l)}" },
      { label: "(g)", value: "\\mathrm{(g)}" },
      { label: "(aq)", value: "\\mathrm{(aq)}" },

      // ===== REACTION =====
      { label: "→", value: "\\rightarrow" },
      { label: "⇌", value: "\\rightleftharpoons" },
      { label: "←", value: "\\leftarrow" },

      // ===== CONDITIONS =====
      { label: "Δ", value: "\\Delta" },
      { label: "heat", value: "\\Delta" },
      { label: "hν", value: "h\\nu" },
      { label: "Pt", value: "\\mathrm{Pt}" },
      { label: "Ni", value: "\\mathrm{Ni}" },

      // ===== RADICALS / IONS =====
      { label: "OH", value: "OH" },
      { label: "NH₄", value: "NH_4" },
      { label: "NO₃", value: "NO_3" },
      { label: "NO₂", value: "NO_2" },
      { label: "SO₄", value: "SO_4" },
      { label: "SO₃", value: "SO_3" },
      { label: "CO₃", value: "CO_3" },
      { label: "PO₄", value: "PO_4" },
      { label: "HCO₃", value: "HCO_3" },

      // ===== COMMON COMPOUNDS =====
      { label: "H₂O", value: "H_2O" },
      { label: "CO₂", value: "CO_2" },
      { label: "O₂", value: "O_2" },
      { label: "HCl", value: "HCl" },
      { label: "H₂SO₄", value: "H_2SO_4" },
      { label: "HNO₃", value: "HNO_3" },
      { label: "NaOH", value: "NaOH" },
      { label: "KOH", value: "KOH" },
      { label: "CaCO₃", value: "CaCO_3" },

      // ===== OPERATORS =====
      { label: "+", value: "+" },
      { label: "-", value: "-" },
      { label: "=", value: "=" },

      // ===== GAS / PRECIPITATE =====
      { label: "↑", value: "\\uparrow" },
      { label: "↓", value: "\\downarrow" },

      // ===== AMOUNT / UNITS =====
      { label: "mol", value: "\\mathrm{mol}" },
      { label: "M", value: "\\mathrm{M}" },
      { label: "L", value: "\\mathrm{L}" },

      // ===== STRUCTURE =====
      {
        label: "( )",
        value: "\\left( x \\right)",
        keyboardValue: "\\left(#?\\right)",
      },
      {
        label: "[ ]",
        value: "\\left[ x \\right]",
        keyboardValue: "\\left[#?\\right]",
      },

      // ===== COEFFICIENT =====
      { label: "2x", value: "2x", keyboardValue: "#?\\cdot#?" },
      { label: "3x", value: "3x", keyboardValue: "#?\\cdot#?" },
    ],
  },
];

const advancedKeyboardSnippets: readonly SnippetItem[] = [
  {
    label: "abs",
    value: "\\mathrm{abs}\\left(x\\right)",
    keyboardValue: "\\mathrm{abs}\\left(#?\\right)",
  },
  {
    label: "|x|",
    value: "\\left|x\\right|",
    keyboardValue: "\\left|#?\\right|",
  },
  {
    label: "||x||",
    value: "\\left\\Vert x\\right\\Vert",
    keyboardValue: "\\left\\Vert#?\\right\\Vert",
  },
  {
    label: "√",
    value: "\\sqrt{x}",
    keyboardValue: "\\sqrt{#?}",
  },
  {
    label: "ⁿ√",
    value: "\\sqrt[n]{x}",
    keyboardValue: "\\sqrt[#?]{#?}",
  },
  {
    label: "a/b",
    value: "\\frac{a}{b}",
    keyboardValue: "\\frac{#?}{#?}",
  },
  {
    label: "sin",
    value: "\\sin(x)",
    keyboardValue: "\\sin\\left(#?\\right)",
  },
  {
    label: "cos",
    value: "\\cos(x)",
    keyboardValue: "\\cos\\left(#?\\right)",
  },
  {
    label: "tan",
    value: "\\tan(x)",
    keyboardValue: "\\tan\\left(#?\\right)",
  },
  {
    label: "ln",
    value: "\\ln(x)",
    keyboardValue: "\\ln\\left(#?\\right)",
  },
  {
    label: "log",
    value: "\\log_{a}(x)",
    keyboardValue: "\\log_{#?}(#?)",
  },
  {
    label: "lim",
    value: "\\lim_{x \\to 0}",
    keyboardValue: "\\lim_{x \\to #?}",
  },
  {
    label: "∫",
    value: "\\int_a^b",
    keyboardValue: "\\int_{#?}^{#?}",
  },
  {
    label: "∑",
    value: "\\sum_{i=1}^{n}",
    keyboardValue: "\\sum_{#?}^{#?}",
  },
  {
    label: "→",
    value: "\\rightarrow",
  },
  {
    label: "≤",
    value: "\\le",
  },
  {
    label: "≥",
    value: "\\ge",
  },
  {
    label: "≠",
    value: "\\ne",
  },
] as const;

const KEYBOARD_CONTROL_ROW: readonly KeyboardKey[] = [
  "[separator]",
  "[left]",
  "[right]",
  { label: "[backspace]", width: 1.5 },
  { label: "[action]", width: 1.5 },
  "[hide-keyboard]",
];

function chunkItems<T>(items: readonly T[], size: number) {
  const result: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    result.push([...items.slice(index, index + size)]);
  }

  return result;
}

function toKeyboardKey(snippet: SnippetItem): Partial<VirtualKeyboardKeycap> {
  return {
    label: snippet.label,
    insert: snippet.keyboardValue ?? snippet.value,
    class: snippet.label.length > 4 ? "small" : undefined,
  };
}

function createLayerSwitchKey(
  direction: "left" | "right",
  layer: string,
  width: VirtualKeyboardKeycap["width"] = 1.5,
): Partial<VirtualKeyboardKeycap> {
  return {
    label:
      direction === "left"
        ? "<svg class=svg-glyph><use xlink:href=#svg-arrow-left /></svg>"
        : "<svg class=svg-glyph><use xlink:href=#svg-arrow-right /></svg>",
    layer,
    width,
    class: "action hide-shift",
  };
}

function buildPagedKeyboardLayout(
  id: string,
  label: string,
  snippets: readonly SnippetItem[],
  rowSize = CUSTOM_TAB_ROW_SIZE,
  pageSize = CUSTOM_TAB_VISIBLE_SNIPPETS,
): VirtualKeyboardLayout {
  const snippetPages = chunkItems(snippets, pageSize);

  if (snippetPages.length <= 1) {
    return buildKeyboardLayout(id, label, snippets, rowSize);
  }

  return {
    id,
    label,
    displayEditToolbar: false,
    layers: snippetPages.map((pageSnippets, pageIndex) => {
      const layerId = `${id}-page-${pageIndex + 1}`;
      const previousLayerId =
        pageIndex > 0 ? `${id}-page-${pageIndex}` : undefined;
      const nextLayerId =
        pageIndex < snippetPages.length - 1
          ? `${id}-page-${pageIndex + 2}`
          : undefined;

      const navigationRow: KeyboardKey[] = [
        previousLayerId
          ? createLayerSwitchKey("left", previousLayerId)
          : "[separator-15]",
        nextLayerId
          ? createLayerSwitchKey("right", nextLayerId)
          : "[separator-15]",
        "[separator-20]",
        { label: "[backspace]", width: 1.5 },
        { label: "[action]", width: 1.5 },
        "[hide-keyboard]",
      ];

      return {
        id: layerId,
        rows: [
          ...chunkItems(pageSnippets.map(toKeyboardKey), rowSize),
          navigationRow,
        ],
      };
    }),
  };
}

function buildKeyboardLayout(
  id: string,
  label: string,
  snippets: readonly SnippetItem[],
  rowSize = CUSTOM_TAB_ROW_SIZE,
): VirtualKeyboardLayout {
  return {
    id,
    label,
    displayEditToolbar: false,
    rows: [
      ...chunkItems(snippets.map(toKeyboardKey), rowSize),
      [...KEYBOARD_CONTROL_ROW],
    ],
  };
}

const subjectKeyboardLayouts = snippetTabs.map((tab) =>
  buildPagedKeyboardLayout(`subject-${tab.key}`, tab.label, tab.snippets),
);

const FULL_CUSTOM_KEYBOARD_LAYOUTS: readonly KeyboardLayoutSpec[] = [
  ...DEFAULT_KEYBOARD_LAYOUTS,
  ...subjectKeyboardLayouts,
  buildKeyboardLayout("subject-advanced", "abs", advancedKeyboardSnippets),
];

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

function initializeMathfield(
  mathField: MathfieldElementLike | null,
  initialLatex: string,
  keyboard?: MathVirtualKeyboardLike,
) {
  if (!mathField) {
    return false;
  }

  try {
    if (mathField.setValue) {
      mathField.setValue(initialLatex);
    } else {
      mathField.value = initialLatex;
    }

    mathField.focus();

    if (keyboard?.show) {
      keyboard.show();
    } else if (keyboard) {
      keyboard.visible = true;
    }

    return true;
  } catch {
    return false;
  }
}

function ensureKeyboardThemeStyles() {
  if (typeof document === "undefined") {
    return;
  }

  if (document.getElementById(KEYBOARD_THEME_STYLE_ID)) {
    return;
  }

  const style = document.createElement("style");
  style.id = KEYBOARD_THEME_STYLE_ID;
  style.textContent = KEYBOARD_THEME_CSS;
  document.head.appendChild(style);
}

function removeKeyboardThemeStyles() {
  if (typeof document === "undefined") {
    return;
  }

  document.getElementById(KEYBOARD_THEME_STYLE_ID)?.remove();
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

      const w = window as MathWindow;

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
    if (!open || !isMathLiveReady || !mathFieldElement) {
      return;
    }

    const w = window as MathWindow;
    const keyboard = w.mathVirtualKeyboard;

    if (!keyboard) {
      return;
    }

    ensureKeyboardThemeStyles();

    const previousLayouts = keyboard.layouts;
    const previousEditToolbar = keyboard.editToolbar;

    keyboard.layouts = FULL_CUSTOM_KEYBOARD_LAYOUTS;
    keyboard.editToolbar = "none";

    return () => {
      keyboard.layouts = previousLayouts;
      keyboard.editToolbar = previousEditToolbar;
      removeKeyboardThemeStyles();
    };
  }, [open, isMathLiveReady, mathFieldElement]);

  useEffect(() => {
    if (!isMathLiveReady || !mathFieldElement) {
      return;
    }

    const w = window as MathWindow;

    if (!open) {
      w.mathVirtualKeyboard?.hide?.();
      if (w.mathVirtualKeyboard) {
        w.mathVirtualKeyboard.visible = false;
      }
      return;
    }

    let frameId = 0;
    let cancelled = false;

    const tryInitialize = (attempt = 0) => {
      if (cancelled) {
        return;
      }

      const initialized = initializeMathfield(
        mathFieldRef.current,
        initialLatex,
        w.mathVirtualKeyboard,
      );

      if (initialized || attempt >= 10) {
        return;
      }

      frameId = window.requestAnimationFrame(() => {
        tryInitialize(attempt + 1);
      });
    };

    const timeoutId = window.setTimeout(() => {
      tryInitialize();
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
      if (frameId) {
        window.cancelAnimationFrame(frameId);
      }
    };
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
              Keyboard дээрх tab-уудаас томьёогоо сонгоод `Оруулах` дарна уу.
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
