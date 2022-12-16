import { ObjectId } from "mongo";
import { TeamsCollection } from "../db/dbconnection.ts";
import { PlayerSchema, TeamSchema } from "../db/schema.ts";

export const Player= {
  id: (parent: PlayerSchema): string => parent._id.toString(),
  team: async (parent: PlayerSchema): Promise<TeamSchema | undefined> => {
    try {
      const team = await TeamsCollection.findOne({
        players: parent._id,
      });
      return team;
    } catch (e) {
      throw new Error(e);
    }
  },
};
