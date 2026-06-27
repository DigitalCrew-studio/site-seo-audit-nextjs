"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type ConsentValue = "accepted" | "declined" | null;

type ConsentState = {
  // null = ещё не выбрано (показываем баннер). accepted/declined — выбрано.
  analytics: ConsentValue;
  setAnalytics: (value: Exclude<ConsentValue, null>) => void;
  reset: () => void;
};

export const useConsentStore = create<ConsentState>()(
  persist(
    (set) => ({
      analytics: null,
      setAnalytics: (value) => set({ analytics: value }),
      reset: () => set({ analytics: null }),
    }),
    {
      name: "seofrendly_consent_v1",
      storage: createJSONStorage(() => localStorage),
      // Только согласие на аналитику, остальное не сохраняем.
      partialize: (state) => ({ analytics: state.analytics }),
    }
  )
);
