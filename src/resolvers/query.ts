import { ObjectId } from "mongo";
import { verifyJWT } from "../lib/jwt.ts";
import { User, MatchStatus } from "../types.ts";
import { PlayerCollection, TeamsCollection, UsersCollection,MatchesCollection } from "../db/dbconnection.ts";
import { PlayerSchema, TeamSchema, UserSchema, MatchSchema } from "../db/schema.ts";


export const Query = {
  Me: async (parent: unknown, args: { token: string }) => {
    try {
      const user: User = (await verifyJWT(
        args.token,
        Deno.env.get("JWT_SECRET")!
      )) as User;
      return user;
    } catch (e) {
      throw new Error(e);
    }
  },
  teams: async (
    _: unknown,
    args: { classified?: boolean }
  ): Promise<TeamSchema[]> => {
    try {
      if (args.classified !== undefined) {
        return await TeamsCollection.find({}).toArray();
      }

      const teams = await TeamsCollection.find({
        classified: args.classified,
      }).toArray();
      return teams;
    } catch (e) {
      throw new Error(e);
    }
  },
  team: async (_: unknown, args: { id: string }): Promise<TeamSchema> => {
    try {
      const team = await TeamsCollection.findOne({ _id: new ObjectId(args.id) });
      if (!team) {
        throw new Error("Team not found");
      }
      return team;
    } catch (e) {
      throw new Error(e);
    }
  },
  players: async (
    _: unknown,
    args: { team_id?: string }
  ): Promise<PlayerSchema[]> => {
    try {
      if (args.team_id) {
        const team = await TeamsCollection.findOne({
          _id: new ObjectId(args.team_id),
        });
        if (!team) {
          throw new Error("Team not found");
        }
        return await PlayerCollection.find({
          _id: { $in: team.players },
        }).toArray();
      }

      const players = await PlayerCollection.find({}).toArray();
      return players;
    } catch (e) {
      throw new Error(e);
    }
  },
  player: async (_: unknown, args: { id: string }): Promise<PlayerSchema> => {
    try {
      const player = await PlayerCollection.findOne({
        _id: new ObjectId(args.id),
      });
      if (!player) {
        throw new Error("Player not found");
      }
      return player;
    } catch (e) {
      throw new Error(e);
    }
  },
  matches: async (
    _: unknown,
    args: { status?: MatchStatus; team?: string; date?: Date }
  ): Promise<MatchSchema[]> => {
    try {
      let filter = {};
      if (args.status) {
        filter = { status: args.status };
      }

      if (args.team) {
        filter = {
          ...filter,
          $or: [
            { team1: new ObjectId(args.team) },
            { team2: new ObjectId(args.team) },
          ],
        };
      }

      if (args.date) {
        filter = { ...filter, date: args.date };
      }

      const matches = await MatchesCollection.find(filter).toArray();
      return matches;
    } catch (e) {
      throw new Error(e);
    }
  },
  match: async (_: unknown, args: { id: string }): Promise<MatchSchema> => {
    try {
      const match = await MatchesCollection.findOne({
        _id: new ObjectId(args.id),
      });
      if (!match) {
        throw new Error("Match not found");
      }
      return match;
    } catch (e) {
      throw new Error(e);
    }
  },
};