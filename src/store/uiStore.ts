"use client";

import { create } from "zustand";

interface UIStore {
  // Search
  searchQuery: string;
  setSearchQuery: (q: string) => void;

  // Mobile menu
  isMobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;

  // Modals
  activeModal: string | null;
  openModal: (id: string) => void;
  closeModal: () => void;

  // Product image gallery
  activeImageIndex: number;
  setActiveImageIndex: (i: number) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  searchQuery: "",
  setSearchQuery: (q) => set({ searchQuery: q }),

  isMobileMenuOpen: false,
  setMobileMenuOpen: (open) => set({ isMobileMenuOpen: open }),

  activeModal: null,
  openModal: (id) => set({ activeModal: id }),
  closeModal: () => set({ activeModal: null }),

  activeImageIndex: 0,
  setActiveImageIndex: (i) => set({ activeImageIndex: i }),
}));
