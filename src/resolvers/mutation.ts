import { ObjectId } from "mongo";
import { MatchCollection, PlayerCollection, TeamCollection , UsersCollection} from "../db/db.ts";
import { MatchSchema, PlayerSchema, TeamSchema, UserSchema } from "../db/schema.ts";
import { MatchStatus, User } from "../types.ts";
import { createJWT, verifyJWT } from "../libs/jwt.ts";
import * as bcrypt from "https://deno.land/x/bcrypt/mod.ts";

export const Mutation = {
  register: async (
    _: unknown,
    args: {
      username: string;
      email: string;
      password: string;
      name: string;
      surname: string;
      clave: string
    }
  ): Promise<UserSchema & { token : String}> => {
    try {

      if(args.clave != "TENGO_PERMISO_PARA_REGISTRARME"){
        throw new Error("no tienes permiso para registrarte")
      }
      const user: UserSchema | undefined = await UsersCollection.findOne({
        username: args.username,
      });
      if (user) {
        throw new Error("User already exists");
      }
      const hashedPassword = await bcrypt.hash(args.password);
      const _id = new ObjectId();
      const token = await createJWT(
        {
          username: args.username,
          email: args.email,
          name: args.name,
          surname: args.surname,
          id: _id.toString(),
          updatedData : []
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
    } catch (e) {
      throw new Error(e);
    }
  },
  login: async (
    _: unknown,
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
      const pass = user.password as string
      const validPassword = await bcrypt.compare(args.password, pass);
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
          updatedData: []
        },
        Deno.env.get("JWT_SECRET")!
      );
      return token;
    } catch (e) {
      throw new Error(e);
    }
  },
  deleteUser : async (_: unknown, 
    args: {password: string, token : string}) : Promise<UserSchema | undefined> =>{
    try {
      const user: User = (await verifyJWT(
        args.token,
        Deno.env.get("JWT_SECRET")!
      )) as User;

      if(user.id === undefined){
        throw new Error("token invalido")
      }

      const USER: UserSchema | undefined = await UsersCollection.findOne({
        username: user.username,
      });

      const pass = USER?.password as string
      const validPassword = await bcrypt.compare(args.password, pass);

      if (!validPassword) {
        throw new Error("contraseña incorrecta");
      }

      await UsersCollection.deleteOne({_id : new ObjectId(user.id)})

      return USER

    } catch (error) {
      throw new Error(error)
    }
  },
  createTeam: async (
    _: unknown,
    args: { name: string; players: string[]; classified: boolean, token: string}
  ): Promise<TeamSchema> => {
    try {


      const { name, players, classified } = args;
      const exists = await TeamCollection.findOne({
        name,
      });
      if (exists) {
        throw new Error("Team already exists");
      }
      const user: User = (await verifyJWT(
        args.token,
        Deno.env.get("JWT_SECRET")!
      )) as User;

      if(user.id === undefined){
        throw new Error("no existe usuario")
      }

      const _id = await TeamCollection.insertOne({
        name,
        classified,
        players: players.map((p) => new ObjectId(p)),
        updatedBy : new ObjectId(user.id)
      });
      return {
        _id,
        name,
        classified,
        players: players.map((p) => new ObjectId(p)),
        updatedBy : new ObjectId(user.id)
      };
    } catch (e) {
      throw new Error(e);
    }
  },

  updateTeam: async (
    _: unknown,
    args: {
      id: string;
      players?: string[];
      classified?: boolean;
      token: string
    }
  ): Promise<TeamSchema> => {
    try {
      const { id, players, classified } = args;
      const _id = new ObjectId(id);
      let set = {};

      const user: User = (await verifyJWT(
        args.token,
        Deno.env.get("JWT_SECRET")!
      )) as User;

      if(user.id === undefined){
        throw new Error("no existe usuario")
      }


      if (players) {
        set = { ...set, players: players?.map((p) => new ObjectId(p)), updatedBy: new ObjectId(user.id) };
      }
      if (classified) {
        set = { ...set, classified,  updatedBy: new ObjectId(user.id)};
      }
      const team = await TeamCollection.updateOne(
        { _id },
        {
          $set: set,

        }
      );

      if (team.matchedCount === 0) {
        throw new Error("Team not found");
      }

      return (await TeamCollection.findOne({
        _id,
      })) as TeamSchema;
    } catch (e) {
      throw new Error(e);
    }
  },
  deleteTeam: async (_: unknown, args: { id: string,  token: string}): Promise<TeamSchema> => {
    try {
      const { id } = args;
      const _id = new ObjectId(id);
      const team = await TeamCollection.findOne({
        _id,
      });
      if (!team) {
        throw new Error("Team not found");
      }
      
      const user: User = (await verifyJWT(
        args.token,
        Deno.env.get("JWT_SECRET")!
      )) as User;

      if(user.id === undefined){
        throw new Error("no existe usuario")
      }

      
      await TeamCollection.deleteOne({ _id });
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
      token: string
    }
  ): Promise<MatchSchema> => {
    try {
      const { team1, team2, goals_team1, goals_team2, date, status } = args;
      const exists = await MatchCollection.findOne({
        team1: new ObjectId(team1),
        team2: new ObjectId(team2),
        date,
      });
      if (exists) {
        throw new Error("Match already exists");
      }

      
      const user: User = (await verifyJWT(
        args.token,
        Deno.env.get("JWT_SECRET")!
      )) as User;

      if(user.id === undefined){
        throw new Error("no existe usuario")
      }


      const _id = await MatchCollection.insertOne({
        team1: new ObjectId(team1),
        team2: new ObjectId(team2),
        goals_team1,
        goals_team2,
        date,
        status,
        updatedBy : new ObjectId(user.id)
      });
      return {
        _id,
        team1: new ObjectId(team1),
        team2: new ObjectId(team2),
        goals_team1,
        goals_team2,
        date,
        status,
        updatedBy : new ObjectId(user.id)
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
      token: string
    }
  ): Promise<MatchSchema> => {
    try {
      const { id, goals_team1, goals_team2, status } = args;
      const _id = new ObjectId(id);

      
      const user: User = (await verifyJWT(
        args.token,
        Deno.env.get("JWT_SECRET")!
      )) as User;

      if(user.id === undefined){
        throw new Error("no existe usuario")
      }


      const match = await MatchCollection.updateOne(
        {
          _id,
        },
        {
          $set: {
            goals_team1,
            goals_team2,
            status,
            updatedBy : new ObjectId(user.id)
          },
        }
      );
      if (match.matchedCount === 0) {
        throw new Error("Match not found");
      }
      return (await MatchCollection.findOne({
        _id,
      })) as MatchSchema;
    } catch (e) {
      throw new Error(e);
    }
  },
  deleteMatch: async (
    _: unknown,
    args: { id: string,  token: string}
  ): Promise<MatchSchema> => {
    try {
      const { id } = args;
      const _id = new ObjectId(id);
      
      const user: User = (await verifyJWT(
        args.token,
        Deno.env.get("JWT_SECRET")!
      )) as User;

      if(user.id === undefined){
        throw new Error("no existe usuario")
      }


      const match = await MatchCollection.findOne({
        _id,
      });
      if (!match) {
        throw new Error("Match not found");
      }
      await MatchCollection.deleteOne({ _id });
      return match;
    } catch (e) {
      throw new Error(e);
    }
  },
  createPlayer: async (
    _: unknown,
    args: { name: string,  token: string }
  ): Promise<PlayerSchema> => {
    try {
      const { name } = args;
      
      const user: User = (await verifyJWT(
        args.token,
        Deno.env.get("JWT_SECRET")!
      )) as User;

      if(user.id === undefined){
        throw new Error("no existe usuario")
      }

      const _id = await PlayerCollection.insertOne({
        name,
        updatedBy: new ObjectId(user.id)
      });
      return {
        _id,
        name,
        updatedBy : new ObjectId(user.id)
      };
    } catch (e) {
      throw new Error(e);
    }
  },
  deletePlayer: async (
    _: unknown,
    args: { id: string,  token: string }
  ): Promise<PlayerSchema> => {
    try {
      const { id } = args;
      const _id = new ObjectId(id);
      
      const user: User = (await verifyJWT(
        args.token,
        Deno.env.get("JWT_SECRET")!
      )) as User;

      if(user.id === undefined){
        throw new Error("no existe usuario")
      }
      
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
  },
};
