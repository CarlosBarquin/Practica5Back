import { MongoClient, Database } from "mongo";
import { MatchSchema, PlayerSchema, TeamSchema, UserSchema } from "./schema.ts";

import { config } from "std/dotenv/mod.ts";

await config({ export: true, allowEmptyValues: true });

const connectMongoDB = async (): Promise<Database> => {
  const mongo_usr = Deno.env.get("MONGO_USR");
  const mongo_pwd = Deno.env.get("MONGO_PWD");
  const db_name = Deno.env.get("DB_NAME");
  const mongo_uri = Deno.env.get("MONGO_URI");

  if (!mongo_usr || !mongo_pwd || !db_name || !mongo_uri) {
    throw new Error(
      "Missing environment variables, check env.sample for creating .env file"
    );
  }

  const mongo_url = `mongodb+srv://${mongo_usr}:${mongo_pwd}@${mongo_uri}/${db_name}?authMechanism=SCRAM-SHA-1`;

  const client = new MongoClient();
  await client.connect(mongo_url);
  const db = client.database(db_name);
  return db;
};

const db = await connectMongoDB();
console.info(`MongoDB ${db.name} connected`);

export const UsersCollection = db.collection<UserSchema>("users");

export const TeamsCollection = db.collection<TeamSchema>("teams");

export const MatchesCollection = db.collection<MatchSchema>("matches");
export const PlayerCollection = db.collection<PlayerSchema>("players");