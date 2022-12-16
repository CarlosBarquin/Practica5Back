import { ObjectId } from "mongo";
import { createJWT } from "../lib/jwt.ts";
import { User, MatchStatus } from "../types.ts";
import { PlayerCollection, TeamsCollection, UsersCollection,MatchesCollection } from "../db/dbconnection.ts";
import { PlayerSchema, TeamSchema, UserSchema, MatchSchema } from "../db/schema.ts";

import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";



export const Mutation = {
  register: async (
    parent: unknown,
    args: {
      username: string;
      email: string;
      password: string;
      name: string;
      surname: string;
      clave: String;
    }
  ): Promise<UserSchema & { token: string }> => {
    try {
      const user: UserSchema | undefined = await UsersCollection.findOne({
        username: args.username,
      });
      if(args.clave === "TENGO_PERMISO_PARA_REGISTRARME"){

      if (user) {
        throw new Error("User already exists");
      }
      const hashedPassword = await bcrypt.hash(args.password);
      const _id = new ObjectId();
      const token = createJWT(
        {
          username: args.username,
          email: args.email,
          name: args.name,
          surname: args.surname,
          id: _id.toString(),
        },
        Deno.env.get("JWT_SECRET")!
      );
      const newUser: UserSchema = {
        _id,
        username: args.username,
        email: args.email,
        password: hashedPassword,
        name: args.name,
        surname: args.surname,
      };
      await UsersCollection.insertOne(newUser);
      return {
        ...newUser,
        token,
      };
    }else{
      throw new Error("clave incorrecta para registrarse tonto")
      
    }
    } catch (e) {
      throw new Error(e);
    }
  },
  login: async (
    parent: unknown,
    args: {
      username: string;
      password: string;
    }
  ): Promise<string> => {
    try {
      const user: UserSchema | undefined = await UsersCollection.findOne({
        username: args.username,
      });
      if (!user) {
        throw new Error("User does not exist");
      }
      const validPassword = await bcrypt.compare(args.password, user.password?.toString()!);
      if (!validPassword) {
        throw new Error("Invalid password");
      }
      const token = await createJWT(
        {
          username: user.username,
          email: user.email,
          name: user.name,
          surname: user.surname,
          id: user._id.toString(),
        },
        Deno.env.get("JWT_SECRET")!
      );
      return token;
    } catch (e) {
      throw new Error(e);
    }
  },
  createTeam: async ( parent: unknown,
    args: {
      name: string;
      players: string[];
      classified: boolean; 
      token: string;
    }) : Promise<TeamSchema | undefined> => {
      try{
        const found : TeamSchema | undefined = await TeamsCollection.findOne({name: args.name});
        if(found){
          console.log("Team already exists");
          return found;
        }else{
          const U: User = (await verifyJWT(
            args.token,
            Deno.env.get("JWT_SECRET")!
          )) as User;
          if(U){
        const player: PlayerSchema[] = await PlayerCollection.find({name: {_id: args.players}}).toArray();
        const objectidplayers = player.map((user) => user._id);
        const id = new ObjectId();
        const objid : UserSchema = await UsersCollection.findOne({_id: U.id})
        const newTeam: TeamSchema = {
          _id: id,
          name: args.name,
          players: objectidplayers,
          classified: args.classified,
          UpdateBy: U._id.toString()
        };
        await TeamsCollection.insertOne(newTeam);
        return newTeam;
      }else{
        throw new Error ("iuefesf")
      }
      }
      
  }catch(e){
    throw new Error(e);
  }
    },

    createPlayer: async (parent: unknown, args: {name: string, token:string}) => {
      try{
        const found : PlayerSchema | undefined = await PlayerCollection.findOne({name: args.name});
  
        if(found){
          console.log("Player already exists");
          return found;
        }else{
          const id = new ObjectId();
          const U: User = (await verifyJWT(
            args.token,
            Deno.env.get("JWT_SECRET")!
          )) as User;
          if(U){
            const objid : UserSchema = await UsersCollection.findOne({_id: U.id})
          const xd: PlayerSchema = {
            _id: id,
            name: args.name,
            UpdateBy: objid._id.toString()
          }
          await PlayerCollection.insertOne(xd);
          return xd;
        }else{
          throw new Error ("u9ef9feehfesf")
        }
        }
  
      }catch(e){
        throw new Error(e);
      }
    },
  updateTeam: async (
    _: unknown,
    args: {
      id: string;
      players?: string[];
      classified?: boolean;
      token: string;
    }
  ): Promise<TeamSchema> => {
    try {
      

      const U: User = (await verifyJWT(
        args.token,
        Deno.env.get("JWT_SECRET")!
      )) as User;
      if(U){
        const objid : UserSchema = await UsersCollection.findOne({_id: U.id})
      const { id, players, classified } = args;
      const _id = new ObjectId(id);
      let set = {};
      if (players) {
        set = { ...set, players: players?.map((p) => new ObjectId(p)) };
      }
      if (classified) {
        set = { ...set, classified };
      }
      const team = await TeamsCollection.updateOne(
        { _id},
        {
          $set: set,
        },
      );

      if (team.matchedCount === 0) {
        throw new Error("Team not found");
      }

      return (await TeamsCollection.findOne({
        _id,
      })) as TeamSchema;
    }else{
      throw new Error ("fiuefiuesf")
    }
    } catch (e) {
      throw new Error(e);
    }
  },
  deleteTeam: async (_: unknown, args: { id: string }): Promise<TeamSchema> => {
    try {
      const { id } = args;
      const _id = new ObjectId(id);
      const team = await TeamsCollection.findOne({
        _id,
      });
      if (!team) {
        throw new Error("Team not found");
      }
      await TeamsCollection.deleteOne({ _id });
      return team;
    } catch (e) {
      throw new Error(e);
    }
  },

  createMatch: async (
    _: unknown,
    args: {
      team1: string;
      team2: string;
      goals_team1: number;
      goals_team2: number;
      date: Date;
      status: MatchStatus;
    }
  ): Promise<MatchSchema> => {
    try {
      const { team1, team2, goals_team1, goals_team2, date, status } = args;
      const exists = await MatchesCollection.findOne({
        team1: new ObjectId(team1),
        team2: new ObjectId(team2),
        date,
      });
      if (exists) {
        throw new Error("Match already exists");
      }

      const _id = await MatchesCollection.insertOne({
        team1: new ObjectId(team1),
        team2: new ObjectId(team2),
        goals_team1,
        goals_team2,
        date,
        status,
      });
      return {
        _id,
        team1: new ObjectId(team1),
        team2: new ObjectId(team2),
        goals_team1,
        goals_team2,
        date,
        status,
      };
    } catch (e) {
      throw new Error(e);
    }
  },
  updateMatch: async (
    _: unknown,
    args: {
      id: string;
      goals_team1: number;
      goals_team2: number;
      status: MatchStatus;
    }
  ): Promise<MatchSchema> => {
    try {
      const { id, goals_team1, goals_team2, status } = args;
      const _id = new ObjectId(id);
      const match = await MatchesCollection.updateOne(
        {
          _id,
        },
        {
          $set: {
            goals_team1,
            goals_team2,
            status,
          },
        }
      );
      if (match.matchedCount === 0) {
        throw new Error("Match not found");
      }
      return (await MatchesCollection.findOne({
        _id,
      })) as MatchSchema;
    } catch (e) {
      throw new Error(e);
    }
  },
  deleteMatch: async (
    _: unknown,
    args: { id: string }
  ): Promise<MatchSchema> => {
    try {
      const { id } = args;
      const _id = new ObjectId(id);
      const match = await MatchesCollection.findOne({
        _id,
      });
      if (!match) {
        throw new Error("Match not found");
      }
      await MatchesCollection.deleteOne({ _id });
      return match;
    } catch (e) {
      throw new Error(e);
    }
  },
  deletePlayer: async (
    _: unknown,
    args: { id: string }
  ): Promise<PlayerSchema> => {
    try {
      const { id } = args;
      const _id = new ObjectId(id);
      const player = await PlayerCollection.findOne({
        _id,
      });
      if (!player) {
        throw new Error("Player not found");
      }
      await PlayerCollection.deleteOne({
        _id,
      });
      return player;
    } catch (e) {
      throw new Error(e);
    }
}
}
function verifyJWT(token: any, arg1: any): any {
  throw new Error("Function not implemented.");
}

function createJWT(arg0: { username: string; email: string; name: string; surname: string; id: any; }, arg1: any) {
  throw new Error("Function not implemented.");
}

