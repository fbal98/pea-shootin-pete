import { Alert } from 'react-native';
import { useEconomyStore } from '../store/economyStore';
import { trackPurchase } from '../utils/analytics';

export interface IAPProduct {
  id: string;
  type: 'consumable' | 'non_consumable' | 'subscription';
  price: string;
  currency: string;
  localizedPrice: string;
  title: string;
  description: string;
  available: boolean;
}

export interface PurchaseResult {
  success: boolean;
  productId?: string;
  transactionId?: string;
  error?: string;
}

// Simulated IAP products for development
const MOCK_PRODUCTS: IAPProduct[] = [
  {
    id: 'coins_small',
    type: 'consumable',
    price: '0.99',
    currency: 'USD',
    localizedPrice: '$0.99',
    title: 'Small Coin Pack',
    description: '1,000 coins',
    available: true,
  },
  {
    id: 'coins_medium',
    type: 'consumable',
    price: '4.99',
    currency: 'USD',
    localizedPrice: '$4.99',
    title: 'Medium Coin Pack',
    description: '6,000 coins (20% bonus)',
    available: true,
  },
  {
    id: 'coins_large',
    type: 'consumable',
    price: '9.99',
    currency: 'USD',
    localizedPrice: '$9.99',
    title: 'Large Coin Pack',
    description: '15,000 coins (50% bonus)',
    available: true,
  },
  {
    id: 'gems_small',
    type: 'consumable',
    price: '1.99',
    currency: 'USD',
    localizedPrice: '$1.99',
    title: 'Small Gem Pack',
    description: '100 gems',
    available: true,
  },
  {
    id: 'gems_large',
    type: 'consumable',
    price: '19.99',
    currency: 'USD',
    localizedPrice: '$19.99',
    title: 'Large Gem Pack',
    description: '1,200 gems (20% bonus)',
    available: true,
  },
  {
    id: 'premium_pass',
    type: 'non_consumable',
    price: '4.99',
    currency: 'USD',
    localizedPrice: '$4.99',
    title: 'Premium Pass',
    description: 'Unlock premium features and exclusive content',
    available: true,
  },
  {
    id: 'vip_subscription',
    type: 'subscription',
    price: '9.99',
    currency: 'USD',
    localizedPrice: '$9.99/month',
    title: 'VIP Subscription',
    description: 'Monthly VIP benefits including daily gems and exclusive skins',
    available: true,
  },
];

const PRODUCT_REWARDS: Record<string, { currency?: string; amount?: number; premium?: boolean }> = {
  coins_small: { currency: 'coins', amount: 1000 },
  coins_medium: { currency: 'coins', amount: 6000 },
  coins_large: { currency: 'coins', amount: 15000 },
  gems_small: { currency: 'gems', amount: 100 },
  gems_large: { currency: 'gems', amount: 1200 },
  premium_pass: { premium: true },
  vip_subscription: { premium: true },
};

class IAPManager {
  private static instance: IAPManager;
  private products: IAPProduct[] = [];
  private isInitialized = false;

  private constructor() {}

  public static getInstance(): IAPManager {
    if (!IAPManager.instance) {
      IAPManager.instance = new IAPManager();
    }
    return IAPManager.instance;
  }

  public async initialize(): Promise<boolean> {
    try {
      // In a real implementation, this would:
      // 1. Initialize the IAP library (react-native-iap)
      // 2. Get available products from app stores
      // 3. Set up purchase listeners

      // For now, use mock products
      this.products = MOCK_PRODUCTS;
      this.isInitialized = true;

      console.log('✅ IAP Manager initialized with mock products');
      return true;
    } catch (error) {
      console.error('❌ IAP Manager initialization failed:', error);
      return false;
    }
  }

  public getProducts(): IAPProduct[] {
    return this.products.filter(product => product.available);
  }

  public getProduct(productId: string): IAPProduct | undefined {
    return this.products.find(product => product.id === productId);
  }

  public async purchaseProduct(productId: string): Promise<PurchaseResult> {
    if (!this.isInitialized) {
      return {
        success: false,
        error: 'IAP Manager not initialized',
      };
    }

    const product = this.getProduct(productId);
    if (!product) {
      return {
        success: false,
        error: 'Product not found',
      };
    }

    try {
      // In a real implementation, this would:
      // 1. Initiate the platform purchase flow
      // 2. Handle purchase validation
      // 3. Process the purchase result

      // For development, simulate purchase with confirmation dialog
      return new Promise<PurchaseResult>(resolve => {
        Alert.alert(
          'Confirm Purchase',
          `Purchase ${product.title} for ${product.localizedPrice}?`,
          [
            {
              text: 'Cancel',
              style: 'cancel',
              onPress: () =>
                resolve({
                  success: false,
                  error: 'User cancelled',
                }),
            },
            {
              text: 'Buy',
              onPress: async () => {
                try {
                  const result = await this.processPurchase(productId);
                  resolve(result);
                } catch (error) {
                  resolve({
                    success: false,
                    error: error instanceof Error ? error.message : 'Purchase failed',
                  });
                }
              },
            },
          ]
        );
      });
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Purchase failed',
      };
    }
  }

  private async processPurchase(productId: string): Promise<PurchaseResult> {
    const product = this.getProduct(productId);
    if (!product) {
      throw new Error('Product not found');
    }

    const transactionId = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Award the purchase rewards
    this.awardPurchaseRewards(productId);

    // Track analytics
    trackPurchase({
      itemId: productId,
      itemName: product.title,
      category: product.type,
      price: {
        currency: product.currency,
        amount: parseFloat(product.price),
      },
      currency: product.currency,
      amount: parseFloat(product.price),
      timestamp: Date.now(),
    });

    console.log(`✅ Purchase completed: ${productId} (${transactionId})`);

    return {
      success: true,
      productId,
      transactionId,
    };
  }

  private awardPurchaseRewards(productId: string) {
    const rewards = PRODUCT_REWARDS[productId];
    if (!rewards) {
      console.warn(`No rewards defined for product: ${productId}`);
      return;
    }

    const economyStore = useEconomyStore.getState();

    if (rewards.currency && rewards.amount) {
      economyStore.addCurrency(
        rewards.currency as 'coins' | 'gems' | 'energy' | 'tokens',
        rewards.amount,
        `IAP Purchase: ${productId}`
      );

      console.log(`💰 Awarded ${rewards.amount} ${rewards.currency} for purchase: ${productId}`);
    }

    if (rewards.premium) {
      economyStore.setPremiumPass(true, Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
      console.log(`👑 Premium features unlocked for purchase: ${productId}`);
    }
  }

  public async restorePurchases(): Promise<string[]> {
    if (!this.isInitialized) {
      throw new Error('IAP Manager not initialized');
    }

    try {
      // In a real implementation, this would:
      // 1. Query the platform for previous purchases
      // 2. Restore non-consumable items and subscriptions
      // 3. Update the user's entitlements

      // For development, simulate restoration
      console.log('🔄 Restoring purchases...');

      const restoredProducts: string[] = [];

      // Simulate restoring premium pass if previously purchased
      // This would be based on actual purchase history from the platform

      return restoredProducts;
    } catch (error) {
      console.error('❌ Purchase restoration failed:', error);
      throw error;
    }
  }

  public async validateReceipt(receipt: string): Promise<boolean> {
    try {
      // In a real implementation, this would:
      // 1. Send the receipt to your backend server
      // 2. Validate with Apple/Google servers
      // 3. Return validation result

      console.log('🔐 Validating receipt...');

      // For development, always return true
      return true;
    } catch (error) {
      console.error('❌ Receipt validation failed:', error);
      return false;
    }
  }

  public getProductsByType(type: 'consumable' | 'non_consumable' | 'subscription'): IAPProduct[] {
    return this.products.filter(product => product.type === type && product.available);
  }

  public isProductPurchased(productId: string): boolean {
    // In a real implementation, this would check:
    // 1. Local storage for non-consumable purchases
    // 2. Subscription status for subscriptions
    // 3. Server-side validation

    const economyStore = useEconomyStore.getState();

    if (productId === 'premium_pass') {
      return economyStore.hasPremiumPass;
    }

    // For consumable products, always return false
    return false;
  }

  public cleanup() {
    // In a real implementation, this would:
    // 1. Remove purchase listeners
    // 2. Clean up the IAP library

    this.isInitialized = false;
    console.log('🧹 IAP Manager cleaned up');
  }
}

export const iapManager = IAPManager.getInstance();
