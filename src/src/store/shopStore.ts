import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface ShopState {
  shopOwnerId: string | null
  shopDomain: string | null
  shopName: string | null
  setShopData: (data: { shopOwnerId: string; shopDomain: string; shopName?: string }) => void
  clearShopData: () => void
}

export const useShopStore = create<ShopState>()(
  persist(
    (set) => ({
      shopOwnerId: null,
      shopDomain: null,
      shopName: null,
      setShopData: (data) => {
        console.log('[ShopStore] Setting shop data:', data)
        set({
          shopOwnerId: data.shopOwnerId,
          shopDomain: data.shopDomain,
          shopName: data.shopName || null,
        })
      },
      clearShopData: () => {
        console.log('[ShopStore] Clearing shop data')
        set({
          shopOwnerId: null,
          shopDomain: null,
          shopName: null,
        })
      },
    }),
    {
      name: 'shop-storage', // localStorage key
    }
  )
)
