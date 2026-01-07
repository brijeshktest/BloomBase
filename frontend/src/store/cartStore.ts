import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CartItem } from '@/types';

interface CartState {
  items: CartItem[];
  sellerAlias: string | null;
  total: number;
  setCart: (items: CartItem[], total: number, sellerAlias: string) => void;
  clearCart: () => void;
  getItemCount: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      sellerAlias: null,
      total: 0,
      setCart: (items, total, sellerAlias) => {
        set({ items, total, sellerAlias });
      },
      clearCart: () => {
        set({ items: [], total: 0, sellerAlias: null });
      },
      getItemCount: () => {
        return get().items.reduce((acc, item) => acc + item.quantity, 0);
      },
    }),
    {
      name: 'cart-storage',
    }
  )
);

