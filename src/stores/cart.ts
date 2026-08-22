import { create } from "zustand";
import { cartApi, type CartData, type CartItem, type AddToCartPayload } from "@/api/cart";

interface CartState {
  items: CartItem[];
  count: number;
  subtotal: number;
  currency: string;
  isDrawerOpen: boolean;
  isLoading: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  setCart: (data: CartData) => void;
  sync: () => Promise<void>;
  addItem: (payload: AddToCartPayload) => Promise<void>;
  updateItem: (itemUuid: string, quantity: number) => Promise<void>;
  removeItem: (itemUuid: string) => Promise<void>;
  clear: () => Promise<void>;
}

function applyCart(data: CartData) {
  return {
    items: data.items ?? [],
    count: data.count ?? 0,
    subtotal: data.subtotal ?? 0,
    currency: data.currency ?? "USD",
  };
}

export const useCartStore = create<CartState>((set) => ({
  items: [],
  count: 0,
  subtotal: 0,
  currency: "USD",
  isDrawerOpen: false,
  isLoading: false,

  openDrawer: () => set({ isDrawerOpen: true }),
  closeDrawer: () => set({ isDrawerOpen: false }),

  setCart: (data) => set(applyCart(data)),

  sync: async () => {
    set({ isLoading: true });
    try {
      const data = await cartApi.get();
      set(applyCart(data));
    } catch {
      // Guest cart may not exist yet; keep local state empty.
    } finally {
      set({ isLoading: false });
    }
  },

  addItem: async (payload) => {
    set({ isLoading: true });
    try {
      const data = await cartApi.add(payload);
      set({ ...applyCart(data), isDrawerOpen: true });
    } finally {
      set({ isLoading: false });
    }
  },

  updateItem: async (itemUuid, quantity) => {
    set({ isLoading: true });
    try {
      const data = await cartApi.update(itemUuid, quantity);
      set(applyCart(data));
    } finally {
      set({ isLoading: false });
    }
  },

  removeItem: async (itemUuid) => {
    set({ isLoading: true });
    try {
      const data = await cartApi.remove(itemUuid);
      set(applyCart(data));
    } finally {
      set({ isLoading: false });
    }
  },

  clear: async () => {
    set({ isLoading: true });
    try {
      const data = await cartApi.clear();
      set(applyCart(data));
    } finally {
      set({ isLoading: false });
    }
  },
}));
