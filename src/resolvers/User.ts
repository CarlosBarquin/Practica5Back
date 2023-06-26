import { ObjectId } from "mongo";
import { createJWT, verifyJWT } from "../libs/jwt.ts";
import * as bcrypt from "https://deno.land/x/bcrypt/mod.ts";
import { User } from "../types.ts";
import { UserSchema } from "../db/schema.ts";


const UserResolver = {
    id : (parent : UserSchema | User) =>{
        const p = parent as UserSchema
        return p._id.toString()
    },
}

export default UserResolver