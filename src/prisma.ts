import shell from "shelljs";
import fs from "node:fs";
import {getPackageManagerAddCommand, getPackageManagerExecuteCommand} from "./utils.js";

const databaseTemplate = `import {PrismaClient} from '@prisma/client';

export const database = new PrismaClient();
`;

export function setupPrisma(packageManager: string) {
    shell.exec(`${packageManager} ${getPackageManagerAddCommand(packageManager)} prisma`);
    shell.exec(`${getPackageManagerExecuteCommand(packageManager)} prisma init`);
    shell.mkdir('-p', `./app/database`);

    fs.writeFileSync(`./app/database/database.ts`, databaseTemplate);

    shell.exec(`${getPackageManagerExecuteCommand(packageManager)} prisma generate`);
}
