import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { trackCurrencyEarned, trackCurrencySpent, trackPurchase } from '../utils/analytics';

export interface Currency {
  id: string;
  name: string;
  displayName: string;
  icon: string;
  premium: boolean;
  exchangeRate?: number; // Exchange rate to coins (if applicable)
}

export interface CurrencyBalance {
  coins: number;
  gems: number;
  energy: number;
  tokens: number;
}

export interface CurrencyTransaction {
  id: string;
  type: 'earned' | 'spent' | 'purchased' | 'gifted' | 'refunded';
  currency: keyof CurrencyBalance;
  amount: number;
  reason: string;
  metadata?: Record<string, any>;
  timestamp: number;
}

export interface ItemPrice {
  currency: keyof CurrencyBalance;
  amount: number;
  originalAmount?: number; // For sale prices
  salePercentage?: number;
}

export interface StoreItem {
  id: string;
  name: string;
  description: string;
  category: 'skin' | 'booster' | 'currency' | 'premium' | 'limited';
  price: ItemPrice;
  imageUrl?: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  featured: boolean;
  limited: boolean;
  saleEndTime?: number;
  requirements?: {
    level?: number;
    achievement?: string;
    previousPurchase?: string;
  };
  metadata?: Record<string, any>;
  available: boolean;
}

export interface PurchaseHistory {
  id: string;
  itemId: string;
  price: ItemPrice;
  timestamp: number;
  refunded?: boolean;
}

export interface EconomyState {
  // Currency balances
  balances: CurrencyBalance;
  
  // Transaction history
  transactions: CurrencyTransaction[];
  
  // Store items
  storeItems: StoreItem[];
  featuredItems: StoreItem[];
  
  // Owned items
  ownedItems: string[];
  equippedItems: Record<string, string>; // category -> itemId
  
  // Purchase history
  purchaseHistory: PurchaseHistory[];
  
  // Store state
  storeLastRefresh: number;
  dailySpecials: StoreItem[];
  
  // Premium state
  hasPremiumPass: boolean;
  premiumPassExpiry?: number;
  
  // Energy system
  maxEnergy: number;
  energyRegenRate: number; // per minute
  lastEnergyUpdate: number;
}

export interface EconomyActions {
  // Currency management
  addCurrency: (currency: keyof CurrencyBalance, amount: number, reason: string, metadata?: Record<string, any>) => void;
  spendCurrency: (currency: keyof CurrencyBalance, amount: number, reason: string, metadata?: Record<string, any>) => boolean;
  setCurrencyBalance: (currency: keyof CurrencyBalance, amount: number) => void;
  
  // Store management
  setStoreItems: (items: StoreItem[]) => void;
  updateStoreItem: (itemId: string, updates: Partial<StoreItem>) => void;
  setFeaturedItems: (items: StoreItem[]) => void;
  setDailySpecials: (items: StoreItem[]) => void;
  refreshStore: () => void;
  
  // Item management
  purchaseItem: (itemId: string) => Promise<boolean>;
  equipItem: (category: string, itemId: string) => void;
  unequipItem: (category: string) => void;
  refundPurchase: (purchaseId: string) => boolean;
  
  // Premium features
  setPremiumPass: (active: boolean, expiryTime?: number) => void;
  
  // Energy system
  updateEnergy: () => void;
  spendEnergy: (amount: number) => boolean;
  refillEnergy: () => void;
  
  // Utility
  canAfford: (price: ItemPrice) => boolean;
  getItemsByCategory: (category: string) => StoreItem[];
  getAvailableItems: () => StoreItem[];
  clearTransactionHistory: () => void;
}

type EconomyStore = EconomyState & EconomyActions;

const CURRENCIES: Currency[] = [
  {
    id: 'coins',
    name: 'coins',
    displayName: 'Coins',
    icon: '🪙',
    premium: false,
  },
  {
    id: 'gems',
    name: 'gems',
    displayName: 'Gems',
    icon: '💎',
    premium: true,
  },
  {
    id: 'energy',
    name: 'energy',
    displayName: 'Energy',
    icon: '⚡',
    premium: false,
  },
  {
    id: 'tokens',
    name: 'tokens',
    displayName: 'Battle Tokens',
    icon: '🎫',
    premium: false,
  },
];

const DEFAULT_STORE_ITEMS: StoreItem[] = [
  // Pete Skins
  {
    id: 'pete_classic',
    name: 'Classic Pete',
    description: 'The original Pete look',
    category: 'skin',
    price: { currency: 'coins', amount: 0 },
    rarity: 'common',
    featured: false,
    limited: false,
    available: true,
  },
  {
    id: 'pete_golden',
    name: 'Golden Pete',
    description: 'Shiny golden appearance for the elite',
    category: 'skin',
    price: { currency: 'gems', amount: 50 },
    rarity: 'legendary',
    featured: true,
    limited: false,
    available: true,
    requirements: { level: 10 },
  },
  {
    id: 'pete_neon',
    name: 'Neon Pete',
    description: 'Glowing neon style',
    category: 'skin',
    price: { currency: 'coins', amount: 500 },
    rarity: 'epic',
    featured: false,
    limited: false,
    available: true,
  },
  {
    id: 'pete_rainbow',
    name: 'Rainbow Pete',
    description: 'Color-changing rainbow effect',
    category: 'skin',
    price: { currency: 'gems', amount: 100 },
    rarity: 'legendary',
    featured: true,
    limited: true,
    saleEndTime: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
    available: true,
    requirements: { level: 20 },
  },
  
  // Boosters
  {
    id: 'double_score',
    name: 'Double Score',
    description: '2x score for the next game',
    category: 'booster',
    price: { currency: 'coins', amount: 100 },
    rarity: 'common',
    featured: false,
    limited: false,
    available: true,
  },
  {
    id: 'extra_life',
    name: 'Extra Life',
    description: 'Start with an additional life',
    category: 'booster',
    price: { currency: 'gems', amount: 10 },
    rarity: 'rare',
    featured: false,
    limited: false,
    available: true,
  },
  {
    id: 'slow_motion',
    name: 'Slow Motion',
    description: 'Slows down enemy movement for 30 seconds',
    category: 'booster',
    price: { currency: 'coins', amount: 200 },
    rarity: 'rare',
    featured: false,
    limited: false,
    available: true,
  },
  
  // Currency packs
  {
    id: 'coins_small',
    name: 'Small Coin Pack',
    description: '1,000 coins',
    category: 'currency',
    price: { currency: 'gems', amount: 20 },
    rarity: 'common',
    featured: false,
    limited: false,
    available: true,
    metadata: { currencyAmount: 1000, currencyType: 'coins' },
  },
  {
    id: 'coins_large',
    name: 'Large Coin Pack',
    description: '10,000 coins',
    category: 'currency',
    price: { currency: 'gems', amount: 150 },
    rarity: 'rare',
    featured: true,
    limited: false,
    available: true,
    metadata: { currencyAmount: 10000, currencyType: 'coins' },
  },
];

const initialState: EconomyState = {
  balances: {
    coins: 1000, // Starting coins
    gems: 50,    // Starting gems
    energy: 100, // Starting energy
    tokens: 0,   // Starting tokens
  },
  transactions: [],
  storeItems: DEFAULT_STORE_ITEMS,
  featuredItems: [],
  ownedItems: ['pete_classic'], // Start with classic Pete skin
  equippedItems: { skin: 'pete_classic' },
  purchaseHistory: [],
  storeLastRefresh: 0,
  dailySpecials: [],
  hasPremiumPass: false,
  maxEnergy: 100,
  energyRegenRate: 1, // 1 energy per minute
  lastEnergyUpdate: Date.now(),
};

export const useEconomyStore = create<EconomyStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Currency management
      addCurrency: (currency, amount, reason, metadata) => {
        set(state => {
          const newBalance = Math.max(0, state.balances[currency] + amount);
          const transaction: CurrencyTransaction = {
            id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: 'earned',
            currency,
            amount,
            reason,
            metadata,
            timestamp: Date.now(),
          };

          // Track analytics
          trackCurrencyEarned({
            currency,
            amount,
            reason,
            newBalance,
            metadata,
          });

          return {
            balances: { ...state.balances, [currency]: newBalance },
            transactions: [transaction, ...state.transactions].slice(0, 1000), // Keep last 1000 transactions
          };
        });
      },

      spendCurrency: (currency, amount, reason, metadata) => {
        const state = get();
        if (state.balances[currency] < amount) {
          return false; // Insufficient funds
        }

        const newBalance = state.balances[currency] - amount;
        const transaction: CurrencyTransaction = {
          id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: 'spent',
          currency,
          amount: -amount, // Negative for spending
          reason,
          metadata,
          timestamp: Date.now(),
        };

        // Track analytics
        trackCurrencySpent({
          currency,
          amount,
          reason,
          newBalance,
          metadata,
        });

        set(state => ({
          balances: { ...state.balances, [currency]: newBalance },
          transactions: [transaction, ...state.transactions].slice(0, 1000),
        }));

        return true;
      },

      setCurrencyBalance: (currency, amount) => {
        set(state => ({
          balances: { ...state.balances, [currency]: Math.max(0, amount) }
        }));
      },

      // Store management
      setStoreItems: (items) => set({ storeItems: items }),
      
      updateStoreItem: (itemId, updates) => set(state => ({
        storeItems: state.storeItems.map(item =>
          item.id === itemId ? { ...item, ...updates } : item
        )
      })),

      setFeaturedItems: (items) => set({ featuredItems: items }),
      
      setDailySpecials: (items) => set({ dailySpecials: items }),
      
      refreshStore: () => {
        set({ storeLastRefresh: Date.now() });
        // In a real implementation, this would fetch new items from server
      },

      // Item management
      purchaseItem: async (itemId) => {
        const state = get();
        const item = state.storeItems.find(i => i.id === itemId);
        
        if (!item || !item.available) {
          return false;
        }

        // Check requirements
        if (item.requirements) {
          // Check level requirement (would need access to player level)
          // Check achievement requirement
          // Check previous purchase requirement
          // For now, we'll skip these checks
        }

        // Check if can afford
        if (!get().canAfford(item.price)) {
          return false;
        }

        // Check if already owned (for non-consumable items)
        if (['skin', 'premium'].includes(item.category) && state.ownedItems.includes(itemId)) {
          return false; // Already owned
        }

        // Process purchase
        const success = get().spendCurrency(
          item.price.currency,
          item.price.amount,
          `Purchase: ${item.name}`,
          { itemId, category: item.category }
        );

        if (!success) {
          return false;
        }

        // Add to owned items
        const purchase: PurchaseHistory = {
          id: `purchase_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          itemId,
          price: item.price,
          timestamp: Date.now(),
        };

        set(state => ({
          ownedItems: [...state.ownedItems, itemId],
          purchaseHistory: [purchase, ...state.purchaseHistory],
        }));

        // Handle special item types
        if (item.category === 'currency' && item.metadata) {
          const { currencyAmount, currencyType } = item.metadata;
          if (currencyAmount && currencyType) {
            get().addCurrency(
              currencyType as keyof CurrencyBalance,
              currencyAmount,
              'Currency pack purchase',
              { purchaseId: purchase.id }
            );
          }
        }

        // Track purchase analytics
        trackPurchase({
          itemId,
          itemName: item.name,
          category: item.category,
          price: item.price,
          currency: item.price.currency,
          amount: item.price.amount,
          timestamp: Date.now(),
        });

        return true;
      },

      equipItem: (category, itemId) => {
        const state = get();
        if (state.ownedItems.includes(itemId)) {
          set(state => ({
            equippedItems: { ...state.equippedItems, [category]: itemId }
          }));
        }
      },

      unequipItem: (category) => {
        set(state => {
          const newEquipped = { ...state.equippedItems };
          delete newEquipped[category];
          return { equippedItems: newEquipped };
        });
      },

      refundPurchase: (purchaseId) => {
        const state = get();
        const purchase = state.purchaseHistory.find(p => p.id === purchaseId);
        
        if (!purchase || purchase.refunded) {
          return false;
        }

        // Check refund eligibility (within 24 hours)
        const refundWindow = 24 * 60 * 60 * 1000; // 24 hours
        if (Date.now() - purchase.timestamp > refundWindow) {
          return false;
        }

        const item = state.storeItems.find(i => i.id === purchase.itemId);
        if (!item) {
          return false;
        }

        // Process refund
        get().addCurrency(
          purchase.price.currency,
          purchase.price.amount,
          `Refund: ${item.name}`,
          { purchaseId, itemId: purchase.itemId }
        );

        set(state => ({
          ownedItems: state.ownedItems.filter(id => id !== purchase.itemId),
          purchaseHistory: state.purchaseHistory.map(p =>
            p.id === purchaseId ? { ...p, refunded: true } : p
          ),
          equippedItems: Object.fromEntries(
            Object.entries(state.equippedItems).filter(([_, itemId]) => itemId !== purchase.itemId)
          ),
        }));

        return true;
      },

      // Premium features
      setPremiumPass: (active, expiryTime) => {
        set({ hasPremiumPass: active, premiumPassExpiry: expiryTime });
      },

      // Energy system
      updateEnergy: () => {
        set(state => {
          const now = Date.now();
          const timeDiff = now - state.lastEnergyUpdate;
          const energyToAdd = Math.floor(timeDiff / (60 * 1000)) * state.energyRegenRate;
          
          if (energyToAdd > 0) {
            return {
              balances: {
                ...state.balances,
                energy: Math.min(state.maxEnergy, state.balances.energy + energyToAdd)
              },
              lastEnergyUpdate: now,
            };
          }
          
          return state;
        });
      },

      spendEnergy: (amount) => {
        const state = get();
        if (state.balances.energy < amount) {
          return false;
        }

        get().spendCurrency('energy', amount, 'Game play');
        return true;
      },

      refillEnergy: () => {
        set(state => ({
          balances: { ...state.balances, energy: state.maxEnergy }
        }));
      },

      // Utility functions
      canAfford: (price) => {
        const state = get();
        return state.balances[price.currency] >= price.amount;
      },

      getItemsByCategory: (category) => {
        const state = get();
        return state.storeItems.filter(item => item.category === category && item.available);
      },

      getAvailableItems: () => {
        const state = get();
        return state.storeItems.filter(item => item.available);
      },

      clearTransactionHistory: () => {
        set({ transactions: [] });
      },
    }),
    {
      name: 'economy-store',
      storage: {
        getItem: async (name: string) => {
          const value = await AsyncStorage.getItem(name);
          return value ? JSON.parse(value) : null;
        },
        setItem: async (name: string, value: any) => {
          await AsyncStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: async (name: string) => {
          await AsyncStorage.removeItem(name);
        },
      },
      partialize: (state) => ({
        balances: state.balances,
        ownedItems: state.ownedItems,
        equippedItems: state.equippedItems,
        purchaseHistory: state.purchaseHistory,
        hasPremiumPass: state.hasPremiumPass,
        premiumPassExpiry: state.premiumPassExpiry,
        lastEnergyUpdate: state.lastEnergyUpdate,
        transactions: state.transactions.slice(0, 100), // Only persist recent transactions
      }),
    }
  )
);

// Individual selectors for optimal performance
export const useCurrencyBalances = () => useEconomyStore(state => state.balances);
export const useOwnedItems = () => useEconomyStore(state => state.ownedItems);
export const useEquippedItems = () => useEconomyStore(state => state.equippedItems);
export const useStoreItems = () => useEconomyStore(state => state.storeItems);
export const useFeaturedItems = () => useEconomyStore(state => state.featuredItems);
export const usePurchaseHistory = () => useEconomyStore(state => state.purchaseHistory);
export const useHasPremiumPass = () => useEconomyStore(state => state.hasPremiumPass);

// Action selectors
export const useEconomyActions = () => useEconomyStore(state => ({
  addCurrency: state.addCurrency,
  spendCurrency: state.spendCurrency,
  purchaseItem: state.purchaseItem,
  equipItem: state.equipItem,
  unequipItem: state.unequipItem,
  updateEnergy: state.updateEnergy,
  spendEnergy: state.spendEnergy,
  canAfford: state.canAfford,
  getItemsByCategory: state.getItemsByCategory,
}));

export default useEconomyStore;