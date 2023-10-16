import "react-native-get-random-values";
import { nanoid } from "nanoid";
import { Instance, getParentOfType, onSnapshot, types } from "mobx-state-tree";
import { autorun } from "mobx";
import { MMKV } from "react-native-mmkv";

const isDev = process.env.NODE_ENV === "development";

const PlayerModel = types.model({
  id: types.identifier,
  name: types.string,
});

export type Player = Instance<typeof PlayerModel>;

const TeamModel = types
  .model({
    id: types.identifier,
    players: types.array(types.reference(PlayerModel)),
  })
  .views((self) => ({
    get name() {
      return self.players
        .map((player) => player.name.at(0))
        .join("")
        .toLocaleUpperCase()
        .slice(0, 3);
    },
  }));

export type Team = Instance<typeof TeamModel>;

const PlayerScoreModel = types
  .model({
    player: types.reference(PlayerModel),
    balls: types.array(types.number),
    out: types.boolean,
  })
  .views((self) => ({
    get totalRuns() {
      return self.balls.reduce((acc, curr) => acc + curr, 0);
    },
    get ballsFaced() {
      return self.balls.length;
    },
  }))
  .views((self) => ({
    get strikeRate() {
      if (self.ballsFaced === 0) return 0;
      return (self.totalRuns / self.ballsFaced) * 100;
    },
  }))
  .actions((self) => ({
    addBall(runs: number) {
      self.balls.push(runs);
    },
  }));

export type PlayerScore = Instance<typeof PlayerScoreModel>;

const InningsModel = types
  .model({
    id: types.identifier,
    scores: types.array(PlayerScoreModel),
    team: types.reference(TeamModel),
    oversToPlay: types.number,
    declared: types.boolean,
  })
  .views((self) => ({
    get totalRuns() {
      return self.scores.reduce(
        (acc, curr) => acc + curr.balls.reduce((acc, curr) => acc + curr, 0),
        0,
      );
    },
    get totalWickets() {
      return self.scores.reduce((acc, curr) => acc + (curr.out ? 1 : 0), 0);
    },
    get oversPlayed() {
      const totalNumberOfBalls = self.scores.reduce(
        (acc, curr) => acc + curr.balls.length,
        0,
      );
      return Math.floor(totalNumberOfBalls / 6) + (totalNumberOfBalls % 6) / 10;
    },
  }))
  .views((self) => ({
    get isComplete() {
      const oversCompleted = self.oversPlayed >= self.oversToPlay;
      const allOut = self.scores.every((score) => score.out);
      const target = getParentOfType(self, MatchModel).target;
      const chaseCompleted = !!target && self.totalRuns >= target;
      if (chaseCompleted) return true;
      return oversCompleted || allOut || self.declared;
    },
    get runRate() {
      if (self.oversPlayed === 0) return 0;
      return self.totalRuns / self.oversPlayed;
    },
    get playersYetToBat() {
      return self.team.players.filter(
        (player) => !self.scores.find((score) => score.player === player),
      );
    },
  }))
  .actions((self) => ({
    addPlayerScore(player: Player) {
      self.scores.push(
        PlayerScoreModel.create({ player: player.id, balls: [], out: false }),
      );
    },
    declare() {
      self.declared = true;
    },
  }))
  .actions((self) => ({
    markPlayerOut(player: Player) {
      const score = self.scores.find((score) => score.player === player);
      if (!score) return;
      score.addBall(0);
      score.out = true;
      const playersYetToBat = self.playersYetToBat;
      if (playersYetToBat[0]) {
        self.addPlayerScore(playersYetToBat[0]);
      }
    },
  }));

export type Innings = Instance<typeof InningsModel>;

const MatchModel = types
  .model({
    id: types.identifier,
    teams: types.array(TeamModel),
    innings: types.array(InningsModel),
    oversPerInnings: types.number,
    inningsPerTeam: types.number,
    completedToss: types.boolean,
    winner: types.maybe(types.reference(TeamModel)),
  })
  .views((self) => ({
    get isComplete() {
      return (
        self.innings.length === self.inningsPerTeam * 2 &&
        self.innings.every((innings) => innings.isComplete)
      );
    },
    get currentInnings() {
      return self.innings[self.innings.length - 1];
    },
    get target() {
      const isLastInnings = self.innings.length === self.inningsPerTeam * 2;
      if (!isLastInnings) return null;
      if (self.inningsPerTeam === 2) {
        const firstBattingTeam = self.innings[0]!.team;
        const firstBattingTeamTotal = self.innings.reduce(
          (acc, curr) =>
            acc + (curr.team === firstBattingTeam ? curr.totalRuns : 0),
          0,
        );
        const secondBattingFirstInnings = self.innings[1]!.totalRuns;
        return firstBattingTeamTotal - secondBattingFirstInnings + 1;
      }
      return self.innings[0]!.totalRuns + 1;
    },
  }))
  .actions((self) => ({
    addTeam(team: Team) {
      self.teams.push(team);
    },
    startInnings(team: Team) {
      const innings = InningsModel.create({
        id: nanoid(),
        team: team.id,
        scores: [],
        oversToPlay: self.oversPerInnings,
        declared: false,
      });
      innings.addPlayerScore(team.players[0]!);
      innings.addPlayerScore(team.players[1]!);
      self.innings.push(innings);
    },
    completeToss() {
      self.completedToss = true;
    },
    setWinner(team: Team) {
      self.winner = team;
    },
  }))
  .actions((self) => ({
    afterAttach() {
      autorun(() => {
        if (!self.currentInnings?.isComplete) return;
        const isLastInnings = self.innings.length === self.inningsPerTeam * 2;
        if (isLastInnings) {
          self.setWinner(
            self.currentInnings.totalRuns >= self.target!
              ? self.currentInnings.team
              : self.teams.find(
                  (team) =>
                    self.currentInnings && team !== self.currentInnings.team,
                )!,
          );
          return;
        }
        const team = self.teams.find(
          (team) => self.currentInnings && team !== self.currentInnings.team,
        );
        if (!team) return;
        self.startInnings(team);
      });
    },
  }));

export type Match = Instance<typeof MatchModel>;

const RootStore = types
  .model({
    players: types.map(PlayerModel),
    matches: types.map(MatchModel),
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
        () => Math.random() - 0.5,
      );

      const team1 = TeamModel.create({
        id: nanoid(),
        players: players
          .slice(0, players.length / 2)
          .map((player) => player.id),
      });

      const team2 = TeamModel.create({
        id: nanoid(),
        players: players
          .slice(players.length / 2, players.length)
          .map((player) => player.id),
      });

      const match = MatchModel.create({
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
  }))
  .actions((self) => ({
    dev__addPlayers() {
      if (!isDev) return;

      [
        "Virat",
        "Rohit",
        "Shikhar",
        "KL",
        "Mark",
        "Pat",
        "David",
        "Joe",
      ].forEach((name) => self.addPlayer(name));
    },
  }));

const storage = new MMKV();

const stored = storage.getString("store");
const parsed = stored ? JSON.parse(stored) : null;

const initialState = parsed
  ? parsed
  : {
      players: {},
      matches: {},
    };

export const store = RootStore.create(initialState);

console.log(store.players);

onSnapshot(store, (snapshot) => {
  storage.set("store", JSON.stringify(snapshot));
});
