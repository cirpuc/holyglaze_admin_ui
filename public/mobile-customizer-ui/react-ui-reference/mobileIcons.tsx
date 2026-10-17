import type { ReactNode } from "react";
import { DEFAULT_DRAW_COLOR } from "@/src/cookie-maker/mobileConstants";
import {
  ICONS,
  ICON_CATALOG,
  iconById,
  iconPickerCategories,
  type IconPath,
} from "@/src/domain/iconCatalog";

export { ICONS, ICON_CATALOG, iconPickerCategories };

type IconGlyphProps = {
  id: string;
  color?: string;
  size?: number;
  className?: string;
};

function renderIconPaths(paths: IconPath[], color: string): ReactNode {
  return paths.map((path, index) => (
    <path
      key={index}
      d={path.d}
      fill={
        path.fill === "none"
          ? "none"
          : path.fill ?? (path.stroke != null ? "none" : color)
      }
      fillRule={path.rule || "nonzero"}
      stroke={path.stroke === "currentColor" ? color : path.stroke}
      strokeWidth={path.strokeWidth}
      strokeLinecap={path.strokeLinecap}
    />
  ));
}

export function IconGlyph({
  id,
  color = DEFAULT_DRAW_COLOR,
  size = 24,
  className,
}: IconGlyphProps) {
  const icon = iconById(id);
  if (!icon) return null;
  const viewBox = icon.viewBox ?? "0 0 24 24";
  if (icon.inner) {
    return (
      <svg
        width={size}
        height={size}
        viewBox={viewBox}
        fill="currentColor"
        className={className}
        style={{ color }}
        aria-hidden
      >
        <g dangerouslySetInnerHTML={{ __html: icon.inner }} />
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox={viewBox} fill="none" className={className} aria-hidden>
      {icon.paths ? renderIconPaths(icon.paths, color) : null}
    </svg>
  );
}

export function IconLayerGraphic({ id, color }: { id: string; color: string }) {
  const icon = iconById(id);
  if (!icon) return null;
  if (icon.inner) {
    return (
      <g transform="translate(-12 -12)">
        <svg
          width="24"
          height="24"
          viewBox={icon.viewBox ?? "0 0 24 24"}
          fill={color}
          style={{ color }}
          overflow="visible"
          aria-hidden
        >
          <g dangerouslySetInnerHTML={{ __html: icon.inner }} />
        </svg>
      </g>
    );
  }
  return (
    <g transform="translate(-12 -12)">
      {icon.paths ? renderIconPaths(icon.paths, color) : null}
    </g>
  );
}

/** Long-stem navigation arrow for the shape carousel (not a chevron). */
export function ShapePagerTailArrow({
  direction,
}: {
  direction: "left" | "right";
}) {
  return (
    <svg
      viewBox="0 0 32 18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className="mcm-shape-pager__arrow-glyph"
    >
      {direction === "right" ? (
        <path d="M1 9h28M22 2l8 7-8 7" />
      ) : (
        <path d="M31 9H3M10 2L2 9l8 7" />
      )}
    </svg>
  );
}
