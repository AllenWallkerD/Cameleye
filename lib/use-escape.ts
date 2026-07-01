import { useEffect, useState } from "react";

// A stack of currently-open dismissible layers. Only the topmost one reacts to
// Escape, so nested drawers/dialogs close one at a time instead of all at once.
const stack: symbol[] = [];

// Calls onClose when Escape is pressed — but only for the top-most open layer.
// Pass `active` (usually the drawer's `open`) so closed layers don't register.
export function useEscape(onClose: () => void, active = true) {
  const [id] = useState(() => Symbol("layer"));

  useEffect(() => {
    if (!active) return;
    stack.push(id);
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (stack[stack.length - 1] !== id) return; // not the top layer
      e.stopPropagation();
      onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      const i = stack.lastIndexOf(id);
      if (i >= 0) stack.splice(i, 1);
    };
  }, [onClose, active, id]);
}
