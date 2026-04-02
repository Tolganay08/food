import { create } from 'zustand';

const useCartStore = create((set, get) => ({
  items: [],
  restaurantId: null,
  restaurantName: null,
  deliveryFee: 0,

  addItem: (item, restaurant) => {
    const state = get();

    // If adding from different restaurant, clear cart
    if (state.restaurantId && state.restaurantId !== restaurant.id) {
      set({
        items: [{ ...item, quantity: 1 }],
        restaurantId: restaurant.id,
        restaurantName: restaurant.name,
        deliveryFee: restaurant.deliveryFee,
      });
      return;
    }

    const existingIndex = state.items.findIndex((i) => i.id === item.id);
    if (existingIndex >= 0) {
      const newItems = [...state.items];
      newItems[existingIndex] = {
        ...newItems[existingIndex],
        quantity: newItems[existingIndex].quantity + 1,
      };
      set({ items: newItems });
    } else {
      set({
        items: [...state.items, { ...item, quantity: 1 }],
        restaurantId: restaurant.id,
        restaurantName: restaurant.name,
        deliveryFee: restaurant.deliveryFee,
      });
    }
  },

  removeItem: (itemId) => {
    const state = get();
    const newItems = state.items.filter((i) => i.id !== itemId);
    if (newItems.length === 0) {
      set({ items: [], restaurantId: null, restaurantName: null, deliveryFee: 0 });
    } else {
      set({ items: newItems });
    }
  },

  updateQuantity: (itemId, quantity) => {
    if (quantity <= 0) {
      get().removeItem(itemId);
      return;
    }
    set((state) => ({
      items: state.items.map((i) => (i.id === itemId ? { ...i, quantity } : i)),
    }));
  },

  getSubtotal: () => {
    return get().items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  },

  getTotal: () => {
    const state = get();
    return state.items.reduce((sum, item) => sum + item.price * item.quantity, 0) + state.deliveryFee;
  },

  getItemCount: () => {
    return get().items.reduce((sum, item) => sum + item.quantity, 0);
  },

  clearCart: () => {
    set({ items: [], restaurantId: null, restaurantName: null, deliveryFee: 0 });
  },
}));

export default useCartStore;
