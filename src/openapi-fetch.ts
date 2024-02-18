import shell from "shelljs";
import {getPackageManagerAddCommand} from "./utils.js";

export function setupOpenAPIFetch(packageManager: string) {
    shell.exec(`${packageManager} ${getPackageManagerAddCommand(packageManager)} openapi-fetch openapi-typescript`);
}
