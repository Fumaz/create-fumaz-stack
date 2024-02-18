import shell from "shelljs";
import fs from "node:fs";
import {getPackageManagerAddCommand, getPackageManagerExecuteCommand} from "./utils.js";

export function setupRemixAuth(packageManager: string, options: Record<string, boolean>) {
    shell.exec(`${packageManager} ${getPackageManagerAddCommand(packageManager)} remix-auth remix-auth-json bcrypt @types/bcrypt`);
    shell.mkdir('-p', `./app/auth`);

    fs.writeFileSync(`./app/auth/auth.server.ts`, `import {Authenticator} from "remix-auth";
import {sessionStorage} from "~/auth/session.server";
import {User} from "@prisma/client";
import {JsonStrategy} from "remix-auth-json";
import {database} from "~/database/database";
import bcrypt from "bcrypt";

export const authenticator = new Authenticator<User>(sessionStorage);

authenticator.use(
    new JsonStrategy(async ({json}) => {
        const {
            email,
            password
        } = json;

        if (!email) {
            throw new Error("Email is required");
        }

        if (!password) {
            throw new Error("Password is required");
        }

        const user = await database.user.findUnique({
            where: {
                email: email as string
            }
        });

        if (!user) {
            throw new Error("Invalid credentials");
        }

        const isValid = await bcrypt.compare(password as string, user.password);
        
        if (!isValid) {
            throw new Error("Invalid credentials");
        }
        
        return user;
    }),
    "user-password"
);`);

    fs.writeFileSync(`./app/auth/session.server.ts`, `import {createCookieSessionStorage} from "@remix-run/node";

export const sessionStorage = createCookieSessionStorage({
    cookie: {
        name: "__session",
        sameSite: "lax",
        path: "/",
        httpOnly: true,
        secrets: [process.env.SESSION_SECRET || "CHANGE_ME_PLEASE"],
        secure: process.env.NODE_ENV === "production",
    }
});

export const {
    getSession,
    commitSession,
    destroySession
} = sessionStorage;`);

    let prismaSchema = fs.readFileSync(`./prisma/schema.prisma`, 'utf-8');
    prismaSchema = prismaSchema + `
            
model User {
  id       Int    @id @default(autoincrement())
  uuid     String @unique @default(uuid())
  email    String @unique
  name     String
  password String
}`;

    fs.writeFileSync(`./prisma/schema.prisma`, prismaSchema);

    shell.exec(`${getPackageManagerExecuteCommand(packageManager)} prisma generate`);
}
