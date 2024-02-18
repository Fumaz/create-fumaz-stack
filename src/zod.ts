import shell from "shelljs";
import {getPackageManagerAddCommand} from "./utils.js";

export function setupZod(packageManager: string) {
    shell.exec(`${packageManager} ${getPackageManagerAddCommand(packageManager)} zod remix-zod`);
}
