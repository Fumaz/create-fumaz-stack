import shell from "shelljs";
import {getPackageManagerAddCommand} from "./utils.js";

export function setupNanoid(packageManager: string) {
    shell.exec(`${packageManager} ${getPackageManagerAddCommand(packageManager)} nanoid`);
}
