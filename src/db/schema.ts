import { Match, Player, Team, User } from "../types.ts";
import { ObjectId } from "mongo";

export type UserSchema = Omit<User, "id" | "token"> & {
  _id: ObjectId;
};

export type PlayerSchema = Omit<Player, "id" | "team" | "UpdateBy"> & {
  _id: ObjectId;
  UpdateBy : ObjectId;
};

export type TeamSchema = Omit<
  Team,
  "id" | "matches" | "players" | "goals_for" | "goals_against" | "UpdateBy"
> & {
  _id: ObjectId;
  players: ObjectId[];
  UpdateBy : ObjectId;
};

export type MatchSchema = Omit<Match, "id" | "team1" | "team2" | "UpdateBy"> & {
  _id: ObjectId;
  team1: ObjectId;
  team2: ObjectId;
  UpdateBy : ObjectId;
};
