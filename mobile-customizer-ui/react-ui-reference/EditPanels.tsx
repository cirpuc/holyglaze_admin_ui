import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type CSSProperties,
  type ReactNode,
} from "react";
import { Swatch, SwatchFace } from "@/components/ds/swatch";
import { ICON_CATALOG, IconGlyph, iconPickerCategories } from "./mobileIcons";
import { useEditorControlsCopy } from "./editorControlsCopyContext";
import {
  FONTS,
  ICING_WHITE,
  MOBILE_ADJUST_UI_MAX,
  MOBILE_ADJUST_UI_MIN,
  MORPH_PALETTE,
  readAdjustUi,
  type DrawStrokeStyle,
  type DrawTool,
  type MobileImageLayer,
  type MobileTextLayer,
} from "./mobileConstants";

/* ═══════════════════════════════════════════════════════════════════
 * MorphDock anatomy — one structure for Text / Image / Draw / Icons.
 * Change chrome here → every edit panel inherits it.
 *   MorphDock        shell: ← back + title + body slot
 *   MorphTools       base tool strip
 *   MorphTool        one tool tile (preview + label)
 *   MorphPanel       morph body (same footprint as MorphTools)
 *   MorphOption      selectable cell inside MorphPanel
 * ═══════════════════════════════════════════════════════════════════ */

function BackIcon() {
  return (
    <svg
      width="14"
      height="12"
      viewBox="0 0 18 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M16 8H3.5" />
      <path d="M8 3.5 3 8l5 4.5" />
    </svg>
  );
}

function MorphDock({
  title,
  onBack,
  children,
}: {
  title: string;
  onBack: () => void;
  children: ReactNode;
}) {
  const copy = useEditorControlsCopy();
  return (
    <div className="mcm-edit-panel mcm-morph">
      <div className="mcm-morph__head">
        <button
          type="button"
          className="mcm-morph__back"
          aria-label={copy.backTo(title)}
          onClick={onBack}
        >
          <BackIcon />
          <span className="mcm-morph__title">{title}</span>
        </button>
      </div>
      <div className="mcm-morph__body">{children}</div>
    </div>
  );
}

function MorphTools({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="mcm-morph__tools" role="toolbar" aria-label={label}>
      {children}
    </div>
  );
}

function MorphTool({
  label,
  active,
  disabled,
  onClick,
  children,
  ...rest
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  children: ReactNode;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children" | "onClick">) {
  return (
    <button
      type="button"
      className={`mcm-morph__tool${active ? " is-active" : ""}${disabled ? " is-off" : ""}`}
      disabled={disabled}
      aria-pressed={active}
      onClick={onClick}
      {...rest}
    >
      <span className="mcm-morph__orb" aria-hidden>
        <span className="mcm-morph__preview">{children}</span>
      </span>
      <span className="mcm-morph__label">{label}</span>
    </button>
  );
}

type MorphPanelVariant =
  | "row"
  | "color"
  | "size"
  | "style"
  | "options"
  | "adjust"
  | "scroll"
  | "spectrum";

function MorphPanel({
  variant = "row",
  label,
  role = "group",
  children,
}: {
  variant?: MorphPanelVariant;
  label: string;
  role?: "group" | "listbox" | "toolbar";
  children: ReactNode;
}) {
  return (
    <div
      className={`mcm-morph__panel mcm-morph__panel--${variant}`}
      role={role}
      aria-label={label}
    >
      {children}
    </div>
  );
}

function MorphOption({
  active,
  label,
  className,
  style,
  onClick,
  children,
  ...rest
}: {
  active?: boolean;
  label?: string;
  className?: string;
  style?: CSSProperties;
  onClick?: () => void;
  children: ReactNode;
} & Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "children" | "onClick" | "className"
>) {
  return (
    <button
      type="button"
      className={`mcm-morph__option${active ? " is-active" : ""}${className ? ` ${className}` : ""}`}
      style={style}
      aria-pressed={active}
      onClick={onClick}
      {...rest}
    >
      {children}
      {label ? <span className="mcm-morph__option-label">{label}</span> : null}
    </button>
  );
}

/** Shared morph-mode state: base ↔ sub-view, with optional nested color custom. */
function useMorphMode<T extends string>(
  labels: Record<T, string>,
  baseTitle: string,
) {
  const [mode, setMode] = useState<T | null>(null);
  const [colorCustomOpen, setColorCustomOpen] = useState(false);

  const close = () => {
    setColorCustomOpen(false);
    setMode(null);
  };

  const open = (next: T) => {
    setColorCustomOpen(false);
    setMode(next);
  };

  const back = () => {
    if (mode != null && colorCustomOpen) {
      setColorCustomOpen(false);
      return;
    }
    close();
  };

  return {
    mode,
    title: mode ? labels[mode] : baseTitle,
    isMorphing: mode != null,
    colorCustomOpen,
    setColorCustomOpen,
    open,
    close,
    back,
  };
}

/* ── Shared morph controls ── */

function SliderTrack({
  value,
  min = 0,
  max = 100,
  onChange,
  ariaLabel,
}: {
  value: number;
  min?: number;
  max?: number;
  onChange: (v: number) => void;
  ariaLabel: string;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  const trackRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const fromEvent = (clientX: number) => {
    const el = trackRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const t = Math.min(1, Math.max(0, (clientX - r.left) / r.width));
    onChange(Math.round(min + t * (max - min)));
  };

  return (
    <div
      ref={trackRef}
      className="mcm-edit-panel__track"
      role="slider"
      tabIndex={0}
      aria-label={ariaLabel}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value}
      onPointerDown={(e) => {
        dragging.current = true;
        e.currentTarget.setPointerCapture(e.pointerId);
        fromEvent(e.clientX);
      }}
      onPointerMove={(e) => {
        if (!dragging.current) return;
        fromEvent(e.clientX);
      }}
      onPointerUp={() => {
        dragging.current = false;
      }}
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
          e.preventDefault();
          onChange(Math.max(min, value - 1));
        }
        if (e.key === "ArrowRight" || e.key === "ArrowUp") {
          e.preventDefault();
          onChange(Math.min(max, value + 1));
        }
      }}
    >
      <div className="mcm-edit-panel__fill" style={{ width: `${pct}%` }} />
      <div className="mcm-edit-panel__thumb" style={{ left: `${pct}%` }} />
    </div>
  );
}

function morphResolvedColor(color: string) {
  if (color.startsWith("var(") && color.includes("primary"))
    return MORPH_PALETTE[0];
  if (color.startsWith("var(")) return "#1C1C1C";
  return color;
}

function normalizeColorKey(color: string): string {
  const c = morphResolvedColor(color).trim();
  const hsl =
    /^hsla?\(\s*([\d.]+)\s*,?\s*([\d.]+)%?\s*,?\s*([\d.]+)%?\s*\)/i.exec(c);
  if (hsl) {
    return `hsl(${Math.round(parseFloat(hsl[1]!))}, ${Math.round(parseFloat(hsl[2]!))}%, ${Math.round(parseFloat(hsl[3]!))}%)`;
  }
  return c.toLowerCase();
}

function morphColorsMatch(a: string, b: string): boolean {
  return normalizeColorKey(a) === normalizeColorKey(b);
}

function isMorphPaletteColor(color: string): boolean {
  return MORPH_PALETTE.some((entry) => morphColorsMatch(entry, color));
}

const MORPH_COLOR_KEYS: Record<
  string,
  keyof ReturnType<typeof useEditorControlsCopy>["colourNames"]
> = {
  "#840d00": "terra",
  "#c8102e": "red",
  "#ff6a00": "orange",
  "#ffd100": "yellow",
  "#007a33": "green",
  "#0057b8": "blue",
  "#1c1c1c": "black",
  "#fdfbf4": "cream",
};

function morphColorShortLabel(
  color: string,
  names: ReturnType<typeof useEditorControlsCopy>["colourNames"],
): string {
  const key = MORPH_COLOR_KEYS[normalizeColorKey(color)];
  return key ? names[key] : names.custom;
}

const MAX_RECENT_SPECTRUM = 9;
let recentSpectrumColors: string[] = [];
const recentSpectrumListeners = new Set<() => void>();

function useRecentSpectrumColors() {
  const [, tick] = useState(0);

  useEffect(() => {
    const bump = () => tick((n) => n + 1);
    recentSpectrumListeners.add(bump);
    return () => {
      recentSpectrumListeners.delete(bump);
    };
  }, []);

  const addRecent = (color: string) => {
    const key = normalizeColorKey(color);
    if (isMorphPaletteColor(key)) return;
    recentSpectrumColors = [
      key,
      ...recentSpectrumColors.filter((c) => !morphColorsMatch(c, key)),
    ].slice(0, MAX_RECENT_SPECTRUM);
    recentSpectrumListeners.forEach((l) => l());
  };

  return { recentSpectrumColors, addRecent };
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.trim());
  if (!m) return null;
  return {
    r: parseInt(m[1]!, 16),
    g: parseInt(m[2]!, 16),
    b: parseInt(m[3]!, 16),
  };
}

function rgbToHsl(r: number, g: number, b: number) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l: l * 100 };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return { h: h * 360, s: s * 100, l: l * 100 };
}

function parseColorToHsl(color: string): { h: number; s: number; l: number } {
  const hsl = /^hsla?\(\s*([\d.]+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%/i.exec(
    color,
  );
  if (hsl) {
    return {
      h: parseFloat(hsl[1]!),
      s: parseFloat(hsl[2]!),
      l: parseFloat(hsl[3]!),
    };
  }
  const rgb = hexToRgb(morphResolvedColor(color));
  if (rgb) return rgbToHsl(rgb.r, rgb.g, rgb.b);
  return { h: 12, s: 68, l: 42 };
}

/** 2D spectrum pad — X = hue, Y = lightness (saturation fixed for print-safe icing). */
function SpectrumPad({
  value,
  onChange,
  onCommit,
}: {
  value: string;
  onChange: (color: string) => void;
  onCommit?: (color: string) => void;
}) {
  const copy = useEditorControlsCopy();
  const padRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const lastPick = useRef(value);
  const { h, l } = parseColorToHsl(value);
  const thumbX = (h / 360) * 100;
  const thumbY = ((72 - Math.min(72, Math.max(18, l))) / 54) * 100;

  const pick = (clientX: number, clientY: number) => {
    const el = padRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = Math.min(1, Math.max(0, (clientX - r.left) / r.width));
    const y = Math.min(1, Math.max(0, (clientY - r.top) / r.height));
    const hue = Math.round(x * 360);
    const light = Math.round(72 - y * 54);
    const color = `hsl(${hue}, 68%, ${light}%)`;
    lastPick.current = color;
    onChange(color);
  };

  const finish = () => {
    if (!dragging.current) return;
    dragging.current = false;
    onCommit?.(lastPick.current);
  };

  return (
    <div
      ref={padRef}
      className="mcm-morph__spectrum"
      role="slider"
      aria-label={copy.colourSpectrum}
      aria-valuetext={value}
      tabIndex={0}
      onPointerDown={(e) => {
        e.preventDefault();
        dragging.current = true;
        e.currentTarget.setPointerCapture(e.pointerId);
        pick(e.clientX, e.clientY);
      }}
      onPointerMove={(e) => {
        if (!dragging.current) return;
        pick(e.clientX, e.clientY);
      }}
      onPointerUp={finish}
      onPointerCancel={finish}
    >
      <span
        className="mcm-morph__spectrum-thumb"
        style={{ left: `${thumbX}%`, top: `${thumbY}%` }}
        aria-hidden
      />
    </div>
  );
}

function MorphColorPanel({
  value,
  customOpen,
  onCustomOpen,
  onChange,
}: {
  value: string;
  customOpen: boolean;
  onCustomOpen: () => void;
  onChange: (color: string) => void;
}) {
  const copy = useEditorControlsCopy();
  const { recentSpectrumColors, addRecent } = useRecentSpectrumColors();

  if (customOpen) {
    return (
      <MorphPanel variant="spectrum" label={copy.customColour}>
        <SpectrumPad
          value={value}
          onChange={onChange}
          onCommit={(color) => addRecent(color)}
        />
      </MorphPanel>
    );
  }

  return (
    <MorphPanel variant="color" label={copy.chooseColour}>
      <div className="mcm-morph__color-presets">
        {MORPH_PALETTE.map((hex) => (
          <Swatch
            key={hex}
            color={hex}
            size="sm"
            light={hex.toLowerCase() === ICING_WHITE.toLowerCase()}
            selected={morphColorsMatch(hex, value)}
            aria-label={copy.colourValue(hex)}
            onClick={() => onChange(hex)}
          />
        ))}
        <Swatch
          variant="spectrum"
          size="sm"
          title={copy.customColour}
          aria-label={copy.customColour}
          onClick={onCustomOpen}
        />
      </div>
      {recentSpectrumColors.length > 0 && (
        <div className="mcm-morph__color-recent">
          {recentSpectrumColors.map((hex) => (
            <Swatch
              key={normalizeColorKey(hex)}
              color={hex}
              size="sm"
              selected={morphColorsMatch(hex, value)}
              aria-label={copy.colourValue(hex)}
              onClick={() => onChange(hex)}
            />
          ))}
        </div>
      )}
    </MorphPanel>
  );
}

function MorphStepper({
  value,
  min,
  max,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  const copy = useEditorControlsCopy();
  return (
    <MorphPanel variant="row" label={copy.stepValue}>
      <div className="mcm-morph__stepper">
        <button
          type="button"
          className="mcm-morph__stepper-btn"
          aria-label={copy.decrease}
          onClick={() => onChange(Math.max(min, value - 1))}
        >
          −
        </button>
        <output className="mcm-morph__stepper-val">{value}</output>
        <button
          type="button"
          className="mcm-morph__stepper-btn"
          aria-label={copy.increase}
          onClick={() => onChange(Math.min(max, value + 1))}
        >
          +
        </button>
      </div>
    </MorphPanel>
  );
}

function MorphSwatchPreview({ color }: { color: string }) {
  const resolved = morphResolvedColor(color);
  return (
    <SwatchFace
      color={resolved}
      size="xxs"
      light={resolved.toLowerCase() === "#fdfbf4"}
      className="mcm-morph__swatch"
    />
  );
}

/* ── TEXT ── */

export type TextEditPanelProps = {
  layer: MobileTextLayer;
  fonts: readonly (typeof FONTS)[number][];
  onDone: () => void;
  onChange: (patch: Partial<MobileTextLayer>) => void;
};

function textFontPreview(label: string) {
  if (label === "Serif" || label === "Script") return "Aa";
  if (label === "Mono") return "A1";
  return "Ag";
}

function textStyleShortLabel(
  layer: MobileTextLayer,
  copy: ReturnType<typeof useEditorControlsCopy>["text"],
): string {
  const flags: string[] = [];
  if (layer.weight >= 700) flags.push(copy.bold);
  if (layer.italic) flags.push(copy.italic);
  if (layer.outline) flags.push(copy.outline);
  if (layer.underline) flags.push(copy.underline);
  if (layer.spaced) flags.push(copy.spacing);
  if (flags.length === 0) return copy.regular;
  if (flags.length === 1) return flags[0]!;
  return copy.mixed;
}

export function TextEditPanel({
  layer,
  fonts,
  onDone,
  onChange,
}: TextEditPanelProps) {
  const copy = useEditorControlsCopy();
  const morph = useMorphMode(copy.text.modes, copy.text.title);
  const fontMeta = FONTS.find((f) => f.value === layer.font) ?? FONTS[0];
  const fontLabel = copy.fontName(fontMeta.key, fontMeta.label);
  const fontSize = layer.fontSize ?? 18;
  const curveMode = layer.curve < 0 ? "down" : layer.curve > 0 ? "up" : "flat";

  return (
    <MorphDock
      title={morph.title}
      onBack={morph.isMorphing ? morph.back : onDone}
    >
      {morph.mode === "font" ? (
        <MorphPanel variant="options" label={copy.text.fontFamily}>
          {fonts.map((font) => (
            <MorphOption
              key={font.label}
              active={layer.font === font.value}
              style={{ fontFamily: font.value }}
              onClick={() => onChange({ font: font.value })}
            >
              {copy.fontName(font.key, font.label)}
            </MorphOption>
          ))}
        </MorphPanel>
      ) : morph.mode === "style" ? (
        <MorphPanel variant="options" label={copy.text.textStyle}>
          <MorphOption
            className="mcm-morph__option--glyph"
            active={layer.weight >= 700}
            label={copy.text.bold}
            onClick={() =>
              onChange({ weight: layer.weight >= 700 ? 400 : 700 })
            }
          >
            <span className="mcm-morph__style-face">B</span>
          </MorphOption>
          <MorphOption
            className="mcm-morph__option--glyph"
            active={layer.italic}
            label={copy.text.italic}
            onClick={() => onChange({ italic: !layer.italic })}
          >
            <span className="mcm-morph__style-face mcm-morph__style-face--italic">
              I
            </span>
          </MorphOption>
          <MorphOption
            className="mcm-morph__option--glyph"
            active={!!layer.outline}
            label={copy.text.outline}
            onClick={() => onChange({ outline: !layer.outline })}
          >
            <span className="mcm-morph__style-face mcm-morph__style-face--outline">
              O
            </span>
          </MorphOption>
          <MorphOption
            className="mcm-morph__option--glyph"
            active={!!layer.underline}
            label={copy.text.underline}
            onClick={() => onChange({ underline: !layer.underline })}
          >
            <span className="mcm-morph__style-face mcm-morph__style-face--underline">
              U
            </span>
          </MorphOption>
          <MorphOption
            className="mcm-morph__option--glyph"
            active={!!layer.spaced}
            label={copy.text.spacing}
            onClick={() => onChange({ spaced: !layer.spaced })}
          >
            <span className="mcm-morph__style-face mcm-morph__style-face--spaced">
              AB
            </span>
          </MorphOption>
        </MorphPanel>
      ) : morph.mode === "size" ? (
        <MorphStepper
          value={fontSize}
          min={8}
          max={64}
          onChange={(next) => onChange({ fontSize: next })}
        />
      ) : morph.mode === "color" ? (
        <MorphColorPanel
          value={layer.color}
          customOpen={morph.colorCustomOpen}
          onCustomOpen={() => morph.setColorCustomOpen(true)}
          onChange={(color) => onChange({ color })}
        />
      ) : morph.mode === "curve" ? (
        <MorphPanel variant="options" label={copy.text.textCurve}>
          <MorphOption
            className="mcm-morph__option--stack"
            active={curveMode === "down"}
            label={copy.text.down}
            onClick={() => onChange({ curve: curveMode === "down" ? 0 : -28 })}
          >
            <svg
              width="38"
              height="14"
              viewBox="0 0 40 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              aria-hidden
            >
              <path d="M3 6c10 12 24 12 34 0" />
            </svg>
          </MorphOption>
          <MorphOption
            className="mcm-morph__option--stack"
            active={curveMode === "flat"}
            label={copy.text.flat}
            onClick={() => onChange({ curve: 0 })}
          >
            <svg
              width="38"
              height="14"
              viewBox="0 0 40 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              aria-hidden
            >
              <path d="M3 10h34" />
            </svg>
          </MorphOption>
          <MorphOption
            className="mcm-morph__option--stack"
            active={curveMode === "up"}
            label={copy.text.up}
            onClick={() => onChange({ curve: curveMode === "up" ? 0 : 28 })}
          >
            <svg
              width="38"
              height="14"
              viewBox="0 0 40 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              aria-hidden
            >
              <path d="M3 16C13 4 27 4 37 16" />
            </svg>
          </MorphOption>
        </MorphPanel>
      ) : (
        <MorphTools label={copy.textTools}>
          <MorphTool label={fontLabel} onClick={() => morph.open("font")}>
            <span
              className="mcm-morph__preview--font"
              style={{ fontFamily: fontMeta.value }}
            >
              {textFontPreview(fontMeta.label)}
            </span>
          </MorphTool>
          <MorphTool
            label={textStyleShortLabel(layer, copy.text)}
            onClick={() => morph.open("style")}
          >
            <span className="mcm-morph__preview--style">
              <span
                className={`mcm-morph__glyph-b${layer.weight >= 700 ? " is-on" : ""}`}
              >
                B
              </span>
              <span
                className={`mcm-morph__glyph-i${layer.italic ? " is-on" : ""}`}
              >
                I
              </span>
            </span>
          </MorphTool>
          <MorphTool
            label={String(fontSize)}
            onClick={() => morph.open("size")}
          >
            <span className="mcm-morph__preview--size">{fontSize}</span>
          </MorphTool>
          <MorphTool
            label={morphColorShortLabel(layer.color, copy.colourNames)}
            onClick={() => morph.open("color")}
          >
            <MorphSwatchPreview color={layer.color} />
          </MorphTool>
          <MorphTool
            label={copy.text[curveMode]}
            onClick={() => morph.open("curve")}
          >
            <svg
              width="25"
              height="25"
              viewBox="0 0 30 30"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            >
              <path d="M5 12C11 4.8 19 4.8 25 12" />
              <path d="M5 18C11 25.2 19 25.2 25 18" />
            </svg>
          </MorphTool>
        </MorphTools>
      )}
    </MorphDock>
  );
}

/* ── IMAGE ── */

export type ImageEditPanelProps = {
  layer: MobileImageLayer;
  adjustKey: "brightness" | "contrast" | "saturation";
  onDone: () => void;
  onAdjustKey: (key: "brightness" | "contrast" | "saturation") => void;
  onChange: (patch: Partial<MobileImageLayer>) => void;
  onReset: () => void;
};

const IMAGE_MODES = [
  {
    key: "brightness" as const,
    icon: (
      <svg
        width="19"
        height="19"
        viewBox="0 0 20 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        aria-hidden
      >
        <circle cx="10" cy="10" r="3.5" />
        <path d="M10 2.5v2M10 15.5v2M2.5 10h2M15.5 10h2M4.7 4.7l1.4 1.4M13.9 13.9l1.4 1.4M15.3 4.7l-1.4 1.4M6.1 13.9l-1.4 1.4" />
      </svg>
    ),
  },
  {
    key: "contrast" as const,
    icon: (
      <svg
        width="19"
        height="19"
        viewBox="0 0 20 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        aria-hidden
      >
        <circle cx="10" cy="10" r="7" />
        <path d="M10 3a7 7 0 0 1 0 14z" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    key: "saturation" as const,
    icon: (
      <svg
        width="19"
        height="19"
        viewBox="0 0 20 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        aria-hidden
      >
        <circle cx="10" cy="10" r="7" />
        <circle cx="10" cy="10" r="2.5" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
] as const;

export function ImageEditPanel({
  layer,
  adjustKey,
  onDone,
  onAdjustKey,
  onChange,
  onReset,
}: ImageEditPanelProps) {
  const copy = useEditorControlsCopy();
  const imageLabels = {
    brightness: copy.image.brightness,
    contrast: copy.image.contrast,
    saturation: copy.image.saturation,
  } as const;
  const imageToolLabels = {
    brightness: copy.image.light,
    contrast: copy.image.contrast,
    saturation: copy.image.color,
  } as const;
  const morph = useMorphMode(imageLabels, copy.image.title);
  const value = readAdjustUi(layer[adjustKey]);
  const activeMode =
    IMAGE_MODES.find((m) => m.key === adjustKey) ?? IMAGE_MODES[0];
  const activeLabel = imageLabels[activeMode.key];

  return (
    <MorphDock
      title={morph.title}
      onBack={morph.isMorphing ? morph.back : onDone}
    >
      {morph.isMorphing ? (
        <MorphPanel variant="adjust" label={activeLabel}>
          <span className="mcm-morph__adjust-icon" aria-hidden>
            {activeMode.icon}
          </span>
          <SliderTrack
            value={value}
            min={MOBILE_ADJUST_UI_MIN}
            max={MOBILE_ADJUST_UI_MAX}
            ariaLabel={activeLabel}
            onChange={(v) =>
              onChange({
                [adjustKey]: v,
                preset: "custom",
              } as Partial<MobileImageLayer>)
            }
          />
          <output className="mcm-morph__adjust-val">{value}</output>
        </MorphPanel>
      ) : (
        <MorphTools label={copy.imageTools}>
          {IMAGE_MODES.map((mode) => (
            <MorphTool
              key={mode.key}
              label={imageToolLabels[mode.key]}
              active={adjustKey === mode.key}
              onClick={() => {
                onAdjustKey(mode.key);
                morph.open(mode.key);
              }}
            >
              {mode.icon}
            </MorphTool>
          ))}
          <MorphTool
            label={copy.reset}
            aria-label={copy.resetAdjustments}
            onClick={onReset}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4.5 8a6 6 0 1 1-.6 4.5" />
              <path d="M4.5 4v4h4" />
            </svg>
          </MorphTool>
        </MorphTools>
      )}
    </MorphDock>
  );
}

/* ── DRAW ── */

export type DrawEditPanelProps = {
  tool: DrawTool;
  active: boolean;
  style: DrawStrokeStyle;
  color: string;
  width: number;
  onDone: () => void;
  onTool: (tool: DrawTool) => void;
  onStyle: (style: DrawStrokeStyle) => void;
  onColor: (color: string) => void;
  onWidth: (width: number) => void;
};

const DRAW_WIDTHS = [
  { w: 1.5, labelKey: "thin", dot: 5 },
  { w: 3, labelKey: "medium", dot: 9 },
  { w: 5, labelKey: "thick", dot: 13 },
] as const;

export function DrawBrushGlyph({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

function DrawSolidIcon() {
  return (
    <svg
      width="28"
      height="10"
      viewBox="0 0 28 10"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden
    >
      <path d="M2 5h24" />
    </svg>
  );
}

function DrawDotsIcon() {
  return (
    <svg
      width="28"
      height="10"
      viewBox="0 0 28 10"
      fill="currentColor"
      aria-hidden
    >
      <circle cx="3" cy="5" r="1.6" />
      <circle cx="10" cy="5" r="1.6" />
      <circle cx="17" cy="5" r="1.6" />
      <circle cx="24" cy="5" r="1.6" />
    </svg>
  );
}

function DrawWavyIcon() {
  return (
    <svg
      width="28"
      height="10"
      viewBox="0 0 28 10"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden
    >
      <path d="M2 5c1.8-3.2 3.7-3.2 5.5 0s3.7 3.2 5.5 0 3.7-3.2 5.5 0 3.7 3.2 5.5 0" />
    </svg>
  );
}

/** @deprecated aliases kept for stale HMR / cached bundles */
const DrawWaveSolidIcon = DrawSolidIcon;
const DrawWaveDotsIcon = DrawDotsIcon;
void DrawWaveSolidIcon;
void DrawWaveDotsIcon;

function DrawStylePreview({ style }: { style: DrawStrokeStyle }) {
  if (style === "dotted") return <DrawDotsIcon />;
  if (style === "wavy") return <DrawWavyIcon />;
  return <DrawSolidIcon />;
}

function drawWidthLabel(
  width: number,
  copy: ReturnType<typeof useEditorControlsCopy>["draw"],
): string {
  const key = DRAW_WIDTHS.find((entry) => entry.w === width)?.labelKey;
  return key ? copy[key] : `${width}px`;
}

function drawStyleLabel(
  style: DrawStrokeStyle,
  copy: ReturnType<typeof useEditorControlsCopy>["draw"],
): string {
  if (style === "dotted") return copy.dots;
  if (style === "wavy") return copy.wavy;
  return copy.solid;
}

function DrawThicknessIcon({ width }: { width: number }) {
  return (
    <svg width="26" height="20" viewBox="0 0 26 20" fill="none" aria-hidden>
      {DRAW_WIDTHS.map((entry, index) => {
        const y = 5 + index * 5;
        const active = entry.w === width;
        return (
          <line
            key={entry.w}
            x1="3"
            y1={y}
            x2="23"
            y2={y}
            stroke="currentColor"
            strokeWidth={entry.dot / 4}
            strokeLinecap="round"
            opacity={active ? 1 : 0.32}
          />
        );
      })}
    </svg>
  );
}

export function DrawEditPanel({
  tool,
  active,
  style,
  color,
  width,
  onDone,
  onTool,
  onStyle,
  onColor,
  onWidth,
}: DrawEditPanelProps) {
  const copy = useEditorControlsCopy();
  const morph = useMorphMode(copy.draw.modes, copy.draw.title);
  const eraserActive = active && tool === "eraser";

  const showMorph =
    morph.mode === "size" ||
    (morph.mode === "color" && !eraserActive) ||
    (morph.mode === "style" && !eraserActive);

  return (
    <MorphDock
      title={morph.title}
      onBack={morph.isMorphing ? morph.back : onDone}
    >
      {showMorph && morph.mode === "color" ? (
        <MorphColorPanel
          value={color}
          customOpen={morph.colorCustomOpen}
          onCustomOpen={() => morph.setColorCustomOpen(true)}
          onChange={onColor}
        />
      ) : showMorph && morph.mode === "size" ? (
        <MorphPanel variant="size" label={copy.draw.brushThickness}>
          {DRAW_WIDTHS.map((entry) => (
            <MorphOption
              key={entry.w}
              className="mcm-morph__option--size"
              active={width === entry.w}
              aria-label={copy.draw[entry.labelKey]}
              onClick={() => onWidth(entry.w)}
            >
              <span
                className="mcm-morph__size-dot"
                style={{ width: entry.dot, height: entry.dot }}
                aria-hidden
              />
              <span className="mcm-morph__option-label">
                {copy.draw[entry.labelKey]}
              </span>
            </MorphOption>
          ))}
        </MorphPanel>
      ) : showMorph && morph.mode === "style" ? (
        <MorphPanel variant="style" label={copy.draw.drawingStyle}>
          <MorphOption
            className="mcm-morph__option--stack"
            active={style === "solid"}
            label={copy.draw.solid}
            onClick={() => onStyle("solid")}
          >
            <DrawSolidIcon />
          </MorphOption>
          <MorphOption
            className="mcm-morph__option--stack"
            active={style === "dotted"}
            label={copy.draw.dots}
            onClick={() => onStyle("dotted")}
          >
            <DrawDotsIcon />
          </MorphOption>
          <MorphOption
            className="mcm-morph__option--stack"
            active={style === "wavy"}
            label={copy.draw.wavy}
            onClick={() => onStyle("wavy")}
          >
            <DrawWavyIcon />
          </MorphOption>
        </MorphPanel>
      ) : (
        <MorphTools label={copy.drawingTools}>
          <MorphTool
            label={copy.draw.draw}
            active={active && tool === "brush"}
            onClick={() => onTool("brush")}
          >
            <DrawBrushGlyph />
          </MorphTool>
          <MorphTool
            label={copy.draw.erase}
            active={active && tool === "eraser"}
            onClick={() => onTool("eraser")}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <g transform="rotate(-45 11 12)">
                <rect x="4" y="8.5" width="14" height="7" rx="2" />
                <path
                  d="M6 8.7 h2.6 v6.6 H6 a2 2 0 0 1 -2 -2 v-2.6 a2 2 0 0 1 2 -2 z"
                  fill="currentColor"
                  stroke="none"
                />
              </g>
              <path d="M9 20.5 H19" />
            </svg>
          </MorphTool>
          <MorphTool
            label={morphColorShortLabel(color, copy.colourNames)}
            disabled={eraserActive}
            onClick={() => morph.open("color")}
          >
            <MorphSwatchPreview color={color} />
          </MorphTool>
          <MorphTool
            label={drawWidthLabel(width, copy.draw)}
            onClick={() => morph.open("size")}
          >
            <DrawThicknessIcon width={width} />
          </MorphTool>
          <MorphTool
            label={drawStyleLabel(style, copy.draw)}
            disabled={eraserActive}
            onClick={() => morph.open("style")}
          >
            <DrawStylePreview style={style} />
          </MorphTool>
        </MorphTools>
      )}
    </MorphDock>
  );
}

/* ── Icon picker ── */

const ICON_CAT_GLYPHS: Record<string, string> = {
  all: "sparkle",
  love: "heart",
  party: "star",
  xmas: "snowflake",
  nature: "leaf",
};

export function IconPickerPanel({
  onClose,
  onSelect,
}: {
  onClose: () => void;
  onSelect: (iconId: string) => void;
}) {
  const copy = useEditorControlsCopy();
  const categories = useMemo(() => iconPickerCategories().slice(0, 5), []);
  const morph = useMorphMode({ icons: copy.icons.icons }, copy.icons.title);
  const [activeCat, setActiveCat] = useState("all");

  const items = ICON_CATALOG.filter(
    (item) => activeCat === "all" || item.category === activeCat,
  );

  const title =
    morph.mode === "icons"
      ? copy.icons.categories[activeCat as keyof typeof copy.icons.categories]
      : morph.title;

  return (
    <MorphDock title={title} onBack={morph.isMorphing ? morph.back : onClose}>
      {morph.mode === "icons" ? (
        <MorphPanel
          variant="scroll"
          label={copy.icons.chooseIcon}
          role="listbox"
        >
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              role="option"
              className="mcm-morph__cell"
              aria-label={copy.iconName(item.id, item.label)}
              onClick={() => onSelect(item.id)}
            >
              <IconGlyph id={item.id} size={22} color="currentColor" />
            </button>
          ))}
        </MorphPanel>
      ) : (
        <MorphTools label={copy.iconCategories}>
          {categories.map((cat) => (
            <MorphTool
              key={cat}
              label={
                copy.icons.categories[cat as keyof typeof copy.icons.categories]
              }
              onClick={() => {
                setActiveCat(cat);
                morph.open("icons");
              }}
            >
              <IconGlyph
                id={ICON_CAT_GLYPHS[cat] ?? "sparkle"}
                size={22}
                color="currentColor"
              />
            </MorphTool>
          ))}
        </MorphTools>
      )}
    </MorphDock>
  );
}
