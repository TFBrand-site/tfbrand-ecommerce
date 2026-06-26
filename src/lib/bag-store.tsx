/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useReducer, type ReactNode } from "react";
import type { Product } from "@/data/products";

export type CartItem = {
  cartItemId: string;
  product: Product;
  qty: number;
  selectedSize?: string;
  selectedColor?: string;
};

type State = { items: CartItem[] };

type Action =
  | { type: "add"; product: Product; selectedSize?: string; selectedColor?: string }
  | { type: "remove"; id: string }
  | { type: "setQty"; id: string; qty: number }
  | { type: "clear" }
  | { type: "hydrate"; items: CartItem[] };

const STORAGE_KEY = "tfbrand-cart-v2";

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "add": {
      const cartItemId = `${action.product.id}-${action.selectedSize || "default"}-${
        action.selectedColor || "default"
      }`;

      const existing = state.items.find((i) => i.cartItemId === cartItemId);
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.cartItemId === cartItemId ? { ...i, qty: i.qty + 1 } : i,
          ),
        };
      }
      return {
        items: [
          ...state.items,
          {
            cartItemId,
            product: action.product,
            qty: 1,
            selectedSize: action.selectedSize,
            selectedColor: action.selectedColor,
          },
        ],
      };
    }
    case "remove":
      return { items: state.items.filter((i) => i.cartItemId !== action.id) };
    case "setQty":
      return {
        items: state.items
          .map((i) => (i.cartItemId === action.id ? { ...i, qty: Math.max(1, action.qty) } : i))
          .filter((i) => i.qty > 0),
      };
    case "clear":
      return { items: [] };
    case "hydrate": {
      // Evita crash se os dados antigos do localStorage não tiverem cartItemId
      const validItems = action.items.filter((i) => !!i.cartItemId);
      return { items: validItems };
    }
  }
}

type CartCtx = {
  items: CartItem[];
  count: number;
  subtotal: number;
  open: boolean;
  setOpen: (v: boolean) => void;
  add: (p: Product, size?: string, color?: string) => void;
  remove: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  clear: () => void;
};

const Ctx = createContext<CartCtx | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { items: [] });
  const [open, setOpen] = useReducer((_: boolean, v: boolean) => v, false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) dispatch({ type: "hydrate", items: JSON.parse(raw) });
    } catch (e) {
      console.error("Error accessing localStorage", e);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items));
    } catch (e) {
      console.error("Error accessing localStorage", e);
    }
  }, [state.items]);

  const value = useMemo<CartCtx>(
    () => ({
      items: state.items,
      count: state.items.reduce((a, i) => a + i.qty, 0),
      subtotal: state.items.reduce((a, i) => {
        const itemPrice = i.product.precoPromocional ?? i.product.preco;
        return a + i.qty * itemPrice;
      }, 0),
      open,
      setOpen,
      add: (p, size, color) => {
        dispatch({ type: "add", product: p, selectedSize: size, selectedColor: color });
        setOpen(true);
      },
      remove: (id) => dispatch({ type: "remove", id }),
      setQty: (id, qty) => dispatch({ type: "setQty", id, qty }),
      clear: () => dispatch({ type: "clear" }),
    }),
    [state.items, open],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useCart fora do CartProvider");
  return v;
}
