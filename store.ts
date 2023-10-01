import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import "react-native-get-random-values";
import { nanoid } from "nanoid";

type Player = {
  id: string;
  name: string;
};

type Team = {
  id: string;
  name: string;
  players: Player[];
};

type Store = {
  players: Player[];
  addPlayer: (name: string) => void;
  removePlayer: (id: string) => void;

  teams: Team[];
};

export const useStore = create<Store>()(
  persist(
    (set) => ({
      players: [],
      addPlayer: (name: string) => {
        set((state) => ({
          players: [...state.players, { id: nanoid(), name }],
        }));
      },
      removePlayer: (id: string) => {
        set((state) => ({
          players: state.players.filter((player) => player.id !== id),
        }));
      },

      teams: [],
    }),
    {
      name: "store",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
