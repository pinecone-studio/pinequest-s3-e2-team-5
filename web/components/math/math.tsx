import katex from "katex";
import { cn } from "@/lib/utils";

type RenderOptions = NonNullable<Parameters<typeof katex.renderToString>[1]>;

type MathBaseProps = {
  math: string;
  className?: string;
  options?: Omit<RenderOptions, "displayMode">;
};

function renderMath(
  math: string,
  displayMode: boolean,
  options?: Omit<RenderOptions, "displayMode">,
) {
  return katex.renderToString(math, {
    displayMode,
    throwOnError: false,
    ...options,
  });
}

export function MathInline({ math, className, options }: MathBaseProps) {
  return (
    <span
      aria-label={math}
      className={cn("inline-block", className)}
      dangerouslySetInnerHTML={{
        __html: renderMath(math, false, options),
      }}
    />
  );
}

export function MathBlock({ math, className, options }: MathBaseProps) {
  return (
    <div
      aria-label={math}
      className={cn("overflow-x-auto", className)}
      dangerouslySetInnerHTML={{
        __html: renderMath(math, true, options),
      }}
    />
  );
}
