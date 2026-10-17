import { useEffect, useRef, useState } from "react";
import type { CommerceCopy } from "./commerceCopy";
import { IconGlyph } from "./mobileIcons";
import {
  strokeDasharray,
  strokeRenderPath,
  type MobileLayer,
} from "./mobileConstants";

function StackIcon() {
  return (
    <svg
      width="21"
      height="21"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M10 3l7 3.8-7 3.8-7-3.8z" fill="currentColor" stroke="none" />
      <path d="M3.5 10.6l6.5 3.5 6.5-3.5" strokeLinecap="round" />
      <path d="M3.5 13.8l6.5 3.5 6.5-3.5" strokeLinecap="round" />
    </svg>
  );
}

function layerLabel(
  layer: MobileLayer,
  copy: CommerceCopy["editor"]["layers"],
): string {
  switch (layer.type) {
    case "text":
      return layer.text.trim() || copy.text;
    case "image":
      return layer.name || copy.image;
    case "icon":
      return copy.icon;
    case "stroke":
      return copy.drawing;
  }
}

function LayerThumb({ layer }: { layer: MobileLayer }) {
  if (layer.type === "image") {
    return (
      <span className="mcm-layers-thumb mcm-layers-thumb--image">
        <img src={layer.src} alt="" />
      </span>
    );
  }

  if (layer.type === "icon") {
    return (
      <span className="mcm-layers-thumb">
        <IconGlyph id={layer.icon} size={20} color={layer.color} />
      </span>
    );
  }

  if (layer.type === "stroke") {
    const pad = 3;
    const w = (layer.boundsW || 24) + pad * 2;
    const h = (layer.boundsH || 24) + pad * 2;
    return (
      <span className="mcm-layers-thumb">
        <svg
          width="22"
          height="22"
          viewBox={`${-w / 2} ${-h / 2} ${w} ${h}`}
          aria-hidden
        >
          <path
            d={strokeRenderPath(layer.d, layer.style, layer.width)}
            fill="none"
            stroke={layer.color}
            strokeWidth={layer.width}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={strokeDasharray(layer.style, layer.width)}
          />
        </svg>
      </span>
    );
  }

  return (
    <span
      className="mcm-layers-thumb mcm-layers-thumb--text"
      style={{ fontFamily: layer.font, color: layer.color }}
    >
      Tt
    </span>
  );
}

export type LayersManagerProps = {
  layers: MobileLayer[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  onReorder: (from: number, to: number) => void;
  onDelete: (id: number) => void;
  inline?: boolean;
  copy: CommerceCopy["editor"]["layers"];
};

export function LayersManager({
  layers,
  selectedId,
  onSelect,
  onReorder,
  onDelete,
  inline = false,
  copy,
}: LayersManagerProps) {
  const [open, setOpen] = useState(false);
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const layersLenRef = useRef(layers.length);
  layersLenRef.current = layers.length;
  const dragRef = useRef<{
    id: number;
    displayIdx: number;
    startY: number;
    rowHeight: number;
  } | null>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDoc);
    return () => document.removeEventListener("pointerdown", onDoc);
  }, [open]);

  const endDrag = () => {
    dragRef.current = null;
    setDraggingId(null);
    window.removeEventListener("pointermove", onDragMove);
    window.removeEventListener("pointerup", endDrag);
  };

  const onDragMove = (e: PointerEvent) => {
    const d = dragRef.current;
    if (!d) return;
    const deltaY = e.clientY - d.startY;
    const steps = Math.round(deltaY / d.rowHeight);
    if (steps === 0) return;
    const total = layersLenRef.current;
    const nextDisplayIdx = Math.max(
      0,
      Math.min(total - 1, d.displayIdx + steps),
    );
    if (nextDisplayIdx === d.displayIdx) return;
    const fromActual = total - 1 - d.displayIdx;
    const toActual = total - 1 - nextDisplayIdx;
    onReorder(fromActual, toActual);
    d.displayIdx = nextDisplayIdx;
    d.startY = e.clientY;
  };

  const startDrag = (e: React.PointerEvent, id: number, displayIdx: number) => {
    e.stopPropagation();
    e.preventDefault();
    const rowH = listRef.current?.firstElementChild
      ? (
          listRef.current.firstElementChild as HTMLElement
        ).getBoundingClientRect().height
      : 44;
    dragRef.current = { id, displayIdx, startY: e.clientY, rowHeight: rowH };
    setDraggingId(id);
    window.addEventListener("pointermove", onDragMove);
    window.addEventListener("pointerup", endDrag);
  };

  useEffect(() => () => endDrag(), []);

  const ordered = [...layers].reverse();

  const panel = (
    <div
      className="mcm-layers-manager__panel"
      role={inline ? "region" : "menu"}
      aria-label={inline ? copy.layers : undefined}
    >
      <div className="mcm-layers-manager__head">
        <span>{copy.layers}</span>
        {inline ? (
          <span className="mcm-layers-manager__count">{layers.length}</span>
        ) : null}
      </div>
      {ordered.length === 0 ? (
        <div className="mcm-layers-manager__empty">{copy.noLayers}</div>
      ) : (
        <div className="mcm-layers-manager__list" ref={listRef}>
          {ordered.map((layer, displayIdx) => (
            <div
              key={layer.id}
              className={`mcm-layers-manager__row${layer.id === selectedId ? " is-sel" : ""}${layer.id === draggingId ? " is-dragging" : ""}`}
              onClick={() => {
                onSelect(layer.id);
                if (!inline) setOpen(false);
              }}
            >
              <button
                type="button"
                className="mcm-layers-manager__grip"
                aria-label={copy.dragToReorder}
                onPointerDown={(e) => startDrag(e, layer.id, displayIdx)}
              >
                <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden>
                  <circle cx="5" cy="4" r="1.2" fill="currentColor" />
                  <circle cx="11" cy="4" r="1.2" fill="currentColor" />
                  <circle cx="5" cy="8" r="1.2" fill="currentColor" />
                  <circle cx="11" cy="8" r="1.2" fill="currentColor" />
                  <circle cx="5" cy="12" r="1.2" fill="currentColor" />
                  <circle cx="11" cy="12" r="1.2" fill="currentColor" />
                </svg>
              </button>
              <LayerThumb layer={layer} />
              <span className="mcm-layers-manager__label">
                {layerLabel(layer, copy)}
              </span>
              <button
                type="button"
                className="mcm-layers-manager__delete"
                aria-label={copy.deleteLayer}
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(layer.id);
                }}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <path d="m5.5 5.5 9 9M14.5 5.5l-9 9" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  if (inline) {
    return (
      <div
        className="mcm-layers-manager mcm-layers-manager--inline"
        ref={wrapRef}
      >
        {panel}
      </div>
    );
  }

  return (
    <div className="mcm-layers-manager" ref={wrapRef}>
      <button
        type="button"
        className="mcm-canvas-action-btn"
        title={copy.layers}
        aria-label={copy.layers}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <StackIcon />
      </button>
      {open ? panel : null}
    </div>
  );
}
