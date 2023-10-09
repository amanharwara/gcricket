import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import "react-native-get-random-values";
import { nanoid } from "nanoid";
import { Instance, types } from "mobx-state-tree";

const Player = types.model({
  id: types.identifier,
  name: types.string,
});

export type Player = Instance<typeof Player>;

const Team = types
  .model({
    id: types.identifier,
    players: types.array(types.reference(Player)),
  })
  .views((self) => ({
    get name() {
      return self.players
        .map((player) => player.name.at(0))
        .join("")
        .toLocaleUpperCase();
    },
  }));

type Team = Instance<typeof Team>;

const PlayerScore = types.model({
  player: types.reference(Player),
  score: types.array(types.number),
  out: types.boolean,
});

const Innings = types
  .model({
    id: types.identifier,
    scores: types.array(PlayerScore),
    team: types.reference(Team),
    oversToPlay: types.number,
    declared: types.boolean,
  })
  .views((self) => ({
    get totalRuns() {
      return self.scores.reduce(
        (acc, curr) => acc + curr.score.reduce((acc, curr) => acc + curr, 0),
        0
      );
    },
    get oversPlayed() {
      return self.scores.reduce((acc, curr) => acc + curr.score.length / 6, 0);
    },
  }))
  .views((self) => ({
    get isComplete() {
      const oversCompleted = self.oversPlayed >= self.oversToPlay;
      const allOut = self.scores.every((score) => score.out);
      return oversCompleted || allOut || self.declared;
    },
  }))
  .actions((self) => ({
    addScore(player: Player, score: number) {
      const playerScore = self.scores.find((score) => score.player === player);
      if (!playerScore) return;
      playerScore.score.push(score);
    },
    setOut(player: Player) {
      const playerScore = self.scores.find((score) => score.player === player);
      if (!playerScore) return;
      playerScore.out = true;
    },
    declare() {
      self.declared = true;
    },
  }));

const Match = types
  .model({
    id: types.identifier,
    teams: types.array(Team),
    innings: types.array(Innings),
    oversPerInnings: types.number,
    inningsPerTeam: types.number,
    completedToss: types.boolean,
  })
  .views((self) => ({
    get isComplete() {
      return (
        self.innings.length === self.inningsPerTeam * 2 &&
        self.innings.every((innings) => innings.isComplete)
      );
    },
  }))
  .actions((self) => ({
    addTeam(team: Team) {
      self.teams.push(team);
    },
  }));

export type Match = Instance<typeof Match>;

const RootStore = types
  .model({
    players: types.map(Player),
    matches: types.map(Match),
  })
  .views((self) => ({
    get playersCount() {
      return self.players.size;
    },
  }))
  .actions((self) => ({
    addPlayer(name: string) {
      self.players.put({ id: nanoid(), name });
    },
    updatePlayer(id: string, name: string) {
      const player = self.players.get(id);
      if (!player) return;
      player.name = name;
    },
    removePlayer(id: string) {
      self.players.delete(id);
    },

    addMatch(inningsPerTeam: number, oversPerInnings: number) {
      const players = Array.from(self.players.values()).sort(
        () => Math.random() - 0.5
      );

      const team1 = Team.create({
        id: nanoid(),
        players: players
          .slice(0, players.length / 2)
          .map((player) => player.id),
      });

      const team2 = Team.create({
        id: nanoid(),
        players: players
          .slice(players.length / 2, players.length)
          .map((player) => player.id),
      });

      const match = Match.create({
        id: nanoid(),
        teams: [],
        innings: [],
        inningsPerTeam,
        oversPerInnings,
        completedToss: false,
      });
      match.addTeam(team1);
      match.addTeam(team2);

      self.matches.put(match);
    },
  }));

export const store = RootStore.create({
  players: {},
});
