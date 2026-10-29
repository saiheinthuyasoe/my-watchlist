"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import type { UserPreferences } from "@/types/user";
import { DEFAULT_PREFERENCES } from "@/types/user";
import type { TMDBApiProvider } from "@/types/tmdb";

interface PreferencesContextValue {
  preferences: UserPreferences;
  loading: boolean;
  setAnimeProvider: (provider: TMDBApiProvider) => Promise<void>;
  setDonghuaProvider: (provider: TMDBApiProvider) => Promise<void>;
  refreshPreferences: () => Promise<void>;
}

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [loading, setLoading] = useState(true);

  // Load preferences when user logs in
  useEffect(() => {
    if (!user) {
      setPreferences(DEFAULT_PREFERENCES);
      setLoading(false);
      return;
    }

    let cancelled = false;

    const loadPreferences = async () => {
      try {
        const docRef = doc(db, "userPreferences", user.uid);
        const docSnap = await getDoc(docRef);

        if (cancelled) return;

        if (docSnap.exists()) {
          const data = docSnap.data() as UserPreferences;
          setPreferences({ ...DEFAULT_PREFERENCES, ...data });
        } else {
          // Create default preferences for new user
          const newPrefs: UserPreferences = {
            ...DEFAULT_PREFERENCES,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };
          await setDoc(docRef, newPrefs);
          setPreferences(newPrefs);
        }
      } catch (error) {
        console.error("Failed to load preferences:", error);
        setPreferences(DEFAULT_PREFERENCES);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    setLoading(true);
    void loadPreferences();

    return () => {
      cancelled = true;
    };
  }, [user]);

  const setAnimeProvider = useCallback(
    async (provider: TMDBApiProvider) => {
      if (!user) {
        throw new Error("Must be signed in to change preferences");
      }

      try {
        const docRef = doc(db, "userPreferences", user.uid);
        const updates = {
          animeProvider: provider,
          updatedAt: Date.now(),
        };

        await updateDoc(docRef, updates);
        setPreferences((prev) => ({ ...prev, ...updates }));
      } catch (error) {
        console.error("Failed to update anime provider:", error);
        throw error;
      }
    },
    [user]
  );

  const setDonghuaProvider = useCallback(
    async (provider: TMDBApiProvider) => {
      if (!user) {
        throw new Error("Must be signed in to change preferences");
      }

      try {
        const docRef = doc(db, "userPreferences", user.uid);
        const updates = {
          donghuaProvider: provider,
          updatedAt: Date.now(),
        };

        await updateDoc(docRef, updates);
        setPreferences((prev) => ({ ...prev, ...updates }));
      } catch (error) {
        console.error("Failed to update donghua provider:", error);
        throw error;
      }
    },
    [user]
  );

  const refreshPreferences = useCallback(async () => {
    if (!user) return;

    try {
      const docRef = doc(db, "userPreferences", user.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data() as UserPreferences;
        setPreferences({ ...DEFAULT_PREFERENCES, ...data });
      }
    } catch (error) {
      console.error("Failed to refresh preferences:", error);
    }
  }, [user]);

  return (
    <PreferencesContext.Provider
      value={{
        preferences,
        loading,
        setAnimeProvider,
        setDonghuaProvider,
        refreshPreferences,
      }}
    >
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error("usePreferences must be used within PreferencesProvider");
  }
  return context;
}
