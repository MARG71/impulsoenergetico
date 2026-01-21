// src/lib/solarCart.ts
"use client";

import { useEffect, useMemo, useState } from "react";
import { solarProducts } from "./solarStore";

export type CartItem = { slug: string; qty: number };

const KEY = "solar_cart_v1";

function readCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    return [];
  }
}

function writeCart(items: CartItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(items));
}

export function useSolarCart() {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    setItems(readCart());
  }, []);

  const add = (slug: string, qty = 1) => {
    setItems((prev) => {
      const next = [...prev];
      const idx = next.findIndex((i) => i.slug === slug);
      if (idx >= 0) next[idx] = { slug, qty: next[idx].qty + qty };
      else next.push({ slug, qty });
      writeCart(next);
      return next;
    });
  };

  const remove = (slug: string) => {
    setItems((prev) => {
      const next = prev.filter((i) => i.slug !== slug);
      writeCart(next);
      return next;
    });
  };

  const setQty = (slug: string, qty: number) => {
    setItems((prev) => {
      const next = prev.map((i) => (i.slug === slug ? { ...i, qty: Math.max(1, qty) } : i));
      writeCart(next);
      return next;
    });
  };

  const clear = () => {
    setItems([]);
    writeCart([]);
  };

  const detailed = useMemo(() => {
    return items
      .map((i) => {
        const p = solarProducts.find((x) => x.slug === i.slug);
        return p ? { ...i, product: p, line: p.precio * i.qty } : null;
      })
      .filter(Boolean) as Array<{ slug: string; qty: number; product: any; line: number }>;
  }, [items]);

  const total = useMemo(() => detailed.reduce((acc, x) => acc + x.line, 0), [detailed]);

  return { items, detailed, total, add, remove, setQty, clear };
}
