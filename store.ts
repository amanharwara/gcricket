import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import "react-native-get-random-values";
import { nanoid } from "nanoid";

export type Player = {
  id: string;
  name: string;
};

type Team = {
  id: string;
  name: string;
  players: Player[];
};

type Store = {
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;

  players: Player[];
  addPlayer: (name: string) => void;
  updatePlayer: (id: string, props: Omit<Partial<Player>, "id">) => void;
  removePlayer: (id: string) => void;
};

const KeysToIgnoreWhenPersisting: (keyof Store)[] = [
  "_hasHydrated",
  "setHasHydrated",
];

export const useStore = create<Store>()(
  persist(
    (set) => ({
      _hasHydrated: false,
      setHasHydrated: (state: boolean) => {
        set({
          _hasHydrated: state,
        });
      },

      players: [],
      addPlayer: (name: string) => {
        set((state) => ({
          players: [...state.players, { id: nanoid(), name }],
        }));
      },
      updatePlayer: (id: string, props: Omit<Partial<Player>, "id">) => {
        set((state) => ({
          players: state.players.map((player) =>
            player.id === id ? { ...player, ...props } : player
          ),
        }));
      },
      removePlayer: (id: string) => {
        set((state) => ({
          players: state.players.filter((player) => player.id !== id),
        }));
      },
    }),
    {
      name: "store",
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
      partialize: (state) =>
        Object.fromEntries(
          Object.entries(state).filter(
            ([key]) => !KeysToIgnoreWhenPersisting.includes(key as keyof Store)
          )
        ),
    }
  )
);
