"use client";

import { useState } from "react";
import { useApp } from "./app-provider";
import { Icon } from "./icons";
import {
  CATEGORY_COLORS,
  CATEGORY_ICON_KEYS,
  CategoryIcon,
} from "./category-icons";
import { useEscape } from "@/lib/use-escape";
import type { CategoryMeta, CatType } from "@/lib/data";

export function AddCategoryDrawer({
  open,
  onClose,
  defaultType = "expense",
  editing = null,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  defaultType?: CatType;
  editing?: CategoryMeta | null;
  onCreated?: (c: CategoryMeta) => void;
}) {
  const { t, addCategory, updateCategory } = useApp();
  const [type, setType] = useState<CatType>(editing?.type ?? defaultType);
  const [name, setName] = useState(editing?.name ?? "");
  const [icon, setIcon] = useState(editing?.icon ?? CATEGORY_ICON_KEYS[0]);
  const [color, setColor] = useState(editing?.color ?? CATEGORY_COLORS[5]);
  const [busy, setBusy] = useState(false);

  useEscape(onClose);

  if (!open) return null;

  async function submit() {
    if (!name.trim()) return;
    setBusy(true);
    const payload = { type, name: name.trim(), icon, color };
    if (editing) {
      await updateCategory(editing.id, payload);
      setBusy(false);
      onClose();
    } else {
      const created = await addCategory(payload);
      setBusy(false);
      if (created) {
        onCreated?.(created);
        onClose();
      }
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex justify-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="animate-fade-up relative flex h-full w-full max-w-md flex-col bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-lg font-semibold">{editing ? t("cat.edit") : t("cat.new")}</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-fg-muted hover:text-fg">
            <Icon.close width={20} height={20} />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-auto px-6 py-6">
          {/* preview */}
          <div className="flex items-center gap-3 rounded-xl border bg-card-muted p-3">
            <span
              className="grid h-11 w-11 place-items-center rounded-xl"
              style={{ background: `color-mix(in srgb, ${color} 16%, transparent)`, color }}
            >
              <CategoryIcon name={icon} width={22} height={22} />
            </span>
            <span className="text-sm font-medium">{name.trim() || t("cat.name")}</span>
          </div>

          <div className="grid grid-cols-2 gap-2 rounded-xl border bg-card-muted p-1">
            {(["expense", "income"] as const).map((ty) => (
              <button
                key={ty}
                onClick={() => setType(ty)}
                className={`rounded-lg py-2 text-sm font-medium transition-colors ${
                  type === ty ? "bg-accent text-white" : "text-fg-muted hover:text-fg"
                }`}
              >
                {t(`tx.${ty}`)}
              </button>
            ))}
          </div>

          <Field label={t("cat.name")}>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="…"
              className="w-full rounded-xl border bg-card px-3 py-2.5 outline-none focus:border-accent"
              autoFocus
            />
          </Field>

          <Field label={t("cat.color")}>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`h-7 w-7 rounded-full transition-transform ${
                    color === c ? "scale-110" : ""
                  }`}
                  style={{ background: c, boxShadow: color === c ? `0 0 0 2px var(--card), 0 0 0 4px ${c}` : undefined }}
                  aria-label={c}
                />
              ))}
            </div>
          </Field>

          <Field label={t("cat.icon")}>
            <div className="grid grid-cols-7 gap-2">
              {CATEGORY_ICON_KEYS.map((k) => (
                <button
                  key={k}
                  onClick={() => setIcon(k)}
                  className={`grid aspect-square place-items-center rounded-lg border transition-colors ${
                    icon === k ? "border-accent bg-accent-soft text-accent" : "text-fg-muted hover:bg-bg-subtle"
                  }`}
                >
                  <CategoryIcon name={k} width={18} height={18} />
                </button>
              ))}
            </div>
          </Field>
        </div>

        <div className="flex gap-3 border-t px-6 py-4">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border py-2.5 text-sm font-medium text-fg-muted hover:text-fg"
          >
            {t("tx.cancel")}
          </button>
          <button
            onClick={submit}
            disabled={busy}
            className="grad-accent flex-1 rounded-xl py-2.5 text-sm font-medium text-white shadow-sm shadow-accent/30 hover:opacity-90 disabled:opacity-60"
          >
            {busy ? "…" : t("tx.save")}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-fg-muted">{label}</label>
      {children}
    </div>
  );
}
