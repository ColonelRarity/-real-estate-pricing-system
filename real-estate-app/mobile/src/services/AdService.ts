import {
  RewardedAd,
  RewardedAdEventType,
  InterstitialAd,
  BannerAd,
  BannerAdSize,
  TestIds,
} from '@react-native-firebase/admob';

// Ad unit IDs (замінити на реальні після налаштування в AdMob)
const REWARDED_AD_UNIT_ID = __DEV__
  ? TestIds.REWARDED
  : 'ca-app-pub-3940256099942544/5224354917'; // Замінити на реальний ID

const INTERSTITIAL_AD_UNIT_ID = __DEV__
  ? TestIds.INTERSTITIAL
  : 'ca-app-pub-3940256099942544/1033173712'; // Замінити на реальний ID

const BANNER_AD_UNIT_ID = __DEV__
  ? TestIds.BANNER
  : 'ca-app-pub-3940256099942544/6300978111'; // Замінити на реальний ID

export class AdService {
  private static rewardedAd: RewardedAd | null = null;
  private static interstitialAd: InterstitialAd | null = null;
  private static isInitialized = false;

  static async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Initialize rewarded ad
      this.rewardedAd = RewardedAd.createForAdRequest(REWARDED_AD_UNIT_ID);
      this.rewardedAd.onAdEvent((type, error) => {
        if (type === RewardedAdEventType.LOADED) {
          console.log('Rewarded ad loaded');
        } else if (type === RewardedAdEventType.EARNED_REWARD) {
          console.log('User earned reward');
          // Тут можна додати логіку винагороди користувача
        } else if (error) {
          console.error('Rewarded ad error:', error);
        }
      });

      // Initialize interstitial ad
      this.interstitialAd = InterstitialAd.createForAdRequest(INTERSTITIAL_AD_UNIT_ID);

      this.isInitialized = true;
    } catch (error) {
      console.error('Error initializing ads:', error);
    }
  }

  static async showRewardedAd(): Promise<boolean> {
    return new Promise((resolve) => {
      if (!this.rewardedAd) {
        console.warn('Rewarded ad not initialized');
        resolve(false);
        return;
      }

      const unsubscribe = this.rewardedAd.onAdEvent((type) => {
        if (type === RewardedAdEventType.EARNED_REWARD) {
          unsubscribe();
          resolve(true);
        } else if (type === RewardedAdEventType.CLOSED) {
          unsubscribe();
          resolve(false);
        }
      });

      this.rewardedAd.show().catch((error) => {
        console.error('Error showing rewarded ad:', error);
        unsubscribe();
        resolve(false);
      });
    });
  }

  static async showInterstitialAd(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.interstitialAd) {
        console.warn('Interstitial ad not initialized');
        resolve();
        return;
      }

      const unsubscribe = this.interstitialAd.onAdEvent((type) => {
        if (type === RewardedAdEventType.CLOSED) {
          unsubscribe();
          resolve();
        }
      });

      this.interstitialAd.show().catch((error) => {
        console.error('Error showing interstitial ad:', error);
        unsubscribe();
        resolve();
      });
    });
  }

  static renderBannerAd(): JSX.Element | null {
    if (!__DEV__) {
      return (
        <BannerAd
          unitId={BANNER_AD_UNIT_ID}
          size={BannerAdSize.SMART_BANNER}
          requestOptions={{
            requestNonPersonalizedAdsOnly: true,
          }}
          onAdLoaded={() => {
            console.log('Banner ad loaded');
          }}
          onAdFailedToLoad={(error) => {
            console.error('Banner ad failed to load:', error);
          }}
        />
      );
    }
    return null; // Не показуємо рекламу в режимі розробки
  }

  static async preloadRewardedAd(): Promise<void> {
    if (this.rewardedAd) {
      try {
        await this.rewardedAd.load();
      } catch (error) {
        console.error('Error preloading rewarded ad:', error);
      }
    }
  }

  static async preloadInterstitialAd(): Promise<void> {
    if (this.interstitialAd) {
      try {
        await this.interstitialAd.load();
      } catch (error) {
        console.error('Error preloading interstitial ad:', error);
      }
    }
  }

  static showAdAfterDelay(delayMs: number = 30000): void {
    // Показуємо рекламу через певний час після використання додатку
    setTimeout(async () => {
      await this.showInterstitialAd();
    }, delayMs);
  }
}
