import shell from "shelljs";
import {getPackageManagerAddCommand} from "./utils.js";

export function setupZustand(packageManager: string) {
    shell.exec(`${packageManager} ${getPackageManagerAddCommand(packageManager)} zustand`);
}
