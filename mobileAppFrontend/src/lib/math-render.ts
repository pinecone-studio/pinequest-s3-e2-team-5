import katex from "katex";
import type { TextStyle } from "react-native";
import { LOCAL_KATEX_CSS } from "@/lib/katex-local-css";

const MATH_PATTERN = /\$\$([\s\S]+?)\$\$|\$([^$]+?)\$/g;

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function getCssFontWeight(fontFamily?: string) {
  if (!fontFamily) {
    return 400;
  }

  const normalized = fontFamily.toLowerCase();

  if (normalized.includes("bold")) {
    return 700;
  }

  if (normalized.includes("semibold")) {
    return 600;
  }

  if (normalized.includes("medium")) {
    return 500;
  }

  return 400;
}

function renderFormula(latex: string, displayMode: boolean) {
  return katex.renderToString(latex.trim(), {
    displayMode,
    throwOnError: false,
    strict: "ignore",
  });
}

export function hasMathMarkup(value: string) {
  MATH_PATTERN.lastIndex = 0;
  return MATH_PATTERN.test(value);
}

export function buildMathHtml(value: string, style?: TextStyle) {
  const fontSize = style?.fontSize ?? 16;
  const lineHeight =
    typeof style?.lineHeight === "number" ? style.lineHeight : Math.round(fontSize * 1.45);
  const textColor = typeof style?.color === "string" ? style.color : "#1F1B2D";
  const textAlign = typeof style?.textAlign === "string" ? style.textAlign : "left";
  const fontWeight = getCssFontWeight(style?.fontFamily);

  MATH_PATTERN.lastIndex = 0;

  let lastIndex = 0;
  const parts: string[] = [];

  for (const match of value.matchAll(MATH_PATTERN)) {
    const [fullMatch, blockLatex, inlineLatex] = match;
    const matchIndex = match.index ?? 0;
    const leadingText = value.slice(lastIndex, matchIndex);

    if (leadingText) {
      parts.push(escapeHtml(leadingText));
    }

    parts.push(
      blockLatex
        ? `<div class="pq-block">${renderFormula(blockLatex, true)}</div>`
        : `<span class="pq-inline">${renderFormula(inlineLatex ?? "", false)}</span>`,
    );

    lastIndex = matchIndex + fullMatch.length;
  }

  const trailingText = value.slice(lastIndex);
  if (trailingText) {
    parts.push(escapeHtml(trailingText));
  }

  return `<!DOCTYPE html>
<html lang="mn">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
    <style>
      ${LOCAL_KATEX_CSS}

      html, body {
        margin: 0;
        padding: 0;
        background: transparent;
      }

      body {
        overflow: hidden;
        color: ${textColor};
        font-size: ${fontSize}px;
        line-height: ${lineHeight}px;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        font-weight: ${fontWeight};
        text-align: ${textAlign};
        -webkit-user-select: none;
        user-select: none;
        -webkit-touch-callout: none;
        word-break: break-word;
      }

      .pq-root {
        white-space: pre-wrap;
      }

      .pq-inline {
        display: inline;
      }

      .pq-block {
        margin: 8px 0;
      }

      .katex-display {
        margin: 0.35em 0;
        overflow-x: auto;
        overflow-y: hidden;
        padding: 2px 0;
      }
    </style>
  </head>
  <body>
    <div class="pq-root">${parts.join("")}</div>
    <script>
      (function () {
        var lastHeight = 0;

        function postHeight() {
          var nextHeight = Math.max(
            document.documentElement ? document.documentElement.scrollHeight : 0,
            document.body ? document.body.scrollHeight : 0
          );

          if (!nextHeight || Math.abs(nextHeight - lastHeight) < 1) {
            return;
          }

          lastHeight = nextHeight;

          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(String(Math.ceil(nextHeight)));
          }
        }

        var resizeObserver = typeof ResizeObserver !== "undefined"
          ? new ResizeObserver(postHeight)
          : null;

        if (resizeObserver && document.body) {
          resizeObserver.observe(document.body);
        }

        window.addEventListener("load", postHeight);
        if (document.fonts && document.fonts.ready) {
          document.fonts.ready.then(postHeight);
        }

        requestAnimationFrame(postHeight);
        setTimeout(postHeight, 60);
        setTimeout(postHeight, 250);
      })();
    </script>
  </body>
</html>`;
}
