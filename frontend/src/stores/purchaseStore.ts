import { create } from 'zustand';
import { Purchases, LOG_LEVEL } from '@revenuecat/purchases-capacitor';
import { Capacitor } from '@capacitor/core';

export const AI_PRODUCT_ID = 'pm_ai_unlock';
export const REVENUECAT_API_KEY_IOS = 'appl_REPLACE_WITH_YOUR_REVENUECAT_IOS_KEY';

interface PurchaseStore {
  aiUnlocked: boolean;
  loading: boolean;
  error: string | null;
  initialized: boolean;
  initRevenueCat: () => Promise<void>;
  purchaseAiUnlock: () => Promise<boolean>;
  restorePurchases: () => Promise<void>;
  checkEntitlements: () => Promise<void>;
}

export const usePurchaseStore = create<PurchaseStore>((set, get) => ({
  aiUnlocked: false,
  loading: false,
  error: null,
  initialized: false,

  initRevenueCat: async () => {
    // On web/dev, skip native SDK — unlock for testing
    if (!Capacitor.isNativePlatform()) {
      set({ aiUnlocked: false, initialized: true });
      return;
    }

    try {
      await Purchases.setLogLevel({ level: LOG_LEVEL.ERROR });
      await Purchases.configure({ apiKey: REVENUECAT_API_KEY_IOS });
      set({ initialized: true });
      await get().checkEntitlements();
    } catch (e) {
      console.error('[RevenueCat] init error:', e);
      set({ initialized: true });
    }
  },

  checkEntitlements: async () => {
    if (!Capacitor.isNativePlatform()) return;
    try {
      const { customerInfo } = await Purchases.getCustomerInfo();
      const unlocked = 'ai_features' in customerInfo.entitlements.active;
      set({ aiUnlocked: unlocked });
    } catch (e) {
      console.error('[RevenueCat] entitlement check error:', e);
    }
  },

  purchaseAiUnlock: async () => {
    if (!Capacitor.isNativePlatform()) {
      // Dev/web: simulate purchase
      set({ aiUnlocked: true });
      return true;
    }

    set({ loading: true, error: null });
    try {
      const offerings = await Purchases.getOfferings();
      const pkg = offerings.current?.availablePackages.find(
        (p) => p.product.identifier === AI_PRODUCT_ID
      ) ?? offerings.current?.availablePackages[0];

      if (!pkg) throw new Error('Product not found');

      const { customerInfo } = await Purchases.purchasePackage({ aPackage: pkg });
      const unlocked = 'ai_features' in customerInfo.entitlements.active;
      set({ aiUnlocked: unlocked, loading: false });
      return unlocked;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Purchase failed';
      // User cancelled — don't show error
      if (msg.toLowerCase().includes('cancel') || msg.toLowerCase().includes('usercancel')) {
        set({ loading: false });
        return false;
      }
      set({ error: msg, loading: false });
      return false;
    }
  },

  restorePurchases: async () => {
    if (!Capacitor.isNativePlatform()) return;
    set({ loading: true, error: null });
    try {
      const { customerInfo } = await Purchases.restorePurchases();
      const unlocked = 'ai_features' in customerInfo.entitlements.active;
      set({ aiUnlocked: unlocked, loading: false });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Restore failed';
      set({ error: msg, loading: false });
    }
  },
}));
