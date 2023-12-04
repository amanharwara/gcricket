import "react-native-get-random-values";
import { nanoid } from "nanoid";
import { Instance, getParentOfType, onSnapshot, types } from "mobx-state-tree";
import { autorun } from "mobx";
import { MMKV } from "react-native-mmkv";

const isDev = process.env.NODE_ENV === "development";
const isOdd = (num: number) => num % 2 === 1;

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
    out: types.boolean,
  })
  .views((self) => ({
    get balls(): Ball[] {
      const parentInnings = getParentOfType(self, InningsModel);
      return parentInnings.balls.filter((ball) => ball.player === self.player);
    },
  }))
  .views((self) => ({
    get totalRuns(): number {
      return self.balls.reduce((acc, curr) => acc + curr.runs, 0);
    },
    get ballsFaced(): number {
      return self.balls.length;
    },
  }))
  .views((self) => ({
    get strikeRate() {
      if (self.ballsFaced === 0) return 0;
      return (self.totalRuns / self.ballsFaced) * 100;
    },
  }));

export type PlayerScore = Instance<typeof PlayerScoreModel>;

const BallModel = types.model({
  runs: types.number,
  wicket: types.boolean,
  player: types.reference(PlayerModel),
});

export type Ball = Instance<typeof BallModel>;

const InningsModel = types
  .model({
    id: types.identifier,
    scores: types.array(PlayerScoreModel),
    team: types.reference(TeamModel),
    balls: types.array(BallModel),
    oversToPlay: types.number,
    declared: types.boolean,
  })
  .views((self) => ({
    get totalRuns() {
      return self.balls.reduce((acc, curr) => acc + curr.runs, 0);
    },
    get totalWickets() {
      return self.scores.reduce((acc, curr) => acc + (curr.out ? 1 : 0), 0);
    },
    get oversPlayed() {
      const totalNumberOfBalls = self.balls.length;
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
    get canUndo() {
      return self.balls.length > 0;
    },
  }))
  .actions((self) => ({
    addPlayerScore(player: Player) {
      self.scores.push(
        PlayerScoreModel.create({ player: player.id, out: false }),
      );
    },
    declare() {
      self.declared = true;
    },
  }))
  .actions((self) => ({
    addBall(runs: number, wicket: boolean, player: Player) {
      self.balls.push({ runs, wicket, player });
      const playerScore = self.scores.find((score) => score.player === player)!;
      if (wicket) {
        playerScore.out = true;
      }
    },
    undoLastBall() {
      const lastBall = self.balls[self.balls.length - 1];
      if (lastBall) {
        const playerScore = self.scores.find(
          (score) => score.player === lastBall.player,
        );
        if (!playerScore) return;
        if (playerScore.out) {
          playerScore.out = false;
        }
        self.balls.pop();
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

      if (players.length < 2) return;

      const commonPlayer = isOdd(players.length) ? players.pop()! : null;

      const team1 = TeamModel.create({
        id: nanoid(),
        players: players
          .slice(0, players.length / 2)
          .map((player) => player.id)
          .concat(commonPlayer ? [commonPlayer.id] : []),
      });

      const team2 = TeamModel.create({
        id: nanoid(),
        players: players
          .slice(players.length / 2, players.length)
          .map((player) => player.id)
          .concat(commonPlayer ? [commonPlayer.id] : []),
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
    deleteMatch(id: string) {
      self.matches.delete(id);
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
const parsed = stored
  ? JSON.parse(stored, (key, value) => {
      if (value === "Infinity") return Infinity;
      return value;
    })
  : null;

const initialState =
  parsed && RootStore.is(parsed)
    ? parsed
    : {
        players: {},
        matches: {},
      };

// @ts-ignore
export const store = RootStore.create(initialState);

onSnapshot(store, (snapshot) => {
  storage.set(
    "store",
    JSON.stringify(snapshot, (key, value) => {
      if (value === Infinity) return "Infinity";
      return value;
    }),
  );
});
