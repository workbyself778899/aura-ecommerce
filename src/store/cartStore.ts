"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { CartItem } from "@/types";

interface CartStore {
  items: CartItem[];
  isOpen: boolean;

  // Actions
  addItem: (item: CartItem) => void;
  removeItem: (productId: string, variantName?: string) => void;
  updateQuantity: (
    productId: string,
    quantity: number,
    variantName?: string
  ) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;

  // Computed (derived inline)
  getTotalItems: () => number;
  getTotalPrice: () => number;
  getItemCount: (productId: string, variantName?: string) => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addItem: (newItem) => {
        set((state) => {
          const existing = state.items.find(
            (item) =>
              item.productId === newItem.productId &&
              item.variantName === newItem.variantName
          );

          if (existing) {
            return {
              items: state.items.map((item) =>
                item.productId === newItem.productId &&
                item.variantName === newItem.variantName
                  ? { ...item, quantity: item.quantity + (newItem.quantity || 1) }
                  : item
              ),
              isOpen: true,
            };
          }

          return {
            items: [...state.items, { ...newItem, quantity: newItem.quantity || 1 }],
            isOpen: true,
          };
        });
      },

      removeItem: (productId, variantName) => {
        set((state) => ({
          items: state.items.filter(
            (item) =>
              !(
                item.productId === productId &&
                item.variantName === variantName
              )
          ),
        }));
      },

      updateQuantity: (productId, quantity, variantName) => {
        if (quantity <= 0) {
          get().removeItem(productId, variantName);
          return;
        }
        set((state) => ({
          items: state.items.map((item) =>
            item.productId === productId && item.variantName === variantName
              ? { ...item, quantity }
              : item
          ),
        }));
      },

      clearCart: () => set({ items: [] }),

      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),

      getTotalItems: () =>
        get().items.reduce((sum, item) => sum + item.quantity, 0),

      getTotalPrice: () =>
        get().items.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0
        ),

      getItemCount: (productId, variantName) => {
        const item = get().items.find(
          (i) =>
            i.productId === productId && i.variantName === variantName
        );
        return item?.quantity ?? 0;
      },
    }),
    {
      name: "aura-cart",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
