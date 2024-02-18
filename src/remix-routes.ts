import shell from "shelljs";
import fs from "node:fs";
import {getPackageManagerAddCommand} from "./utils.js";

export function setupRemixRoutes(packageManager: string) {
    shell.exec(`${packageManager} ${getPackageManagerAddCommand(packageManager)} remix-routes`);

    let viteConfig = fs.readFileSync(`./vite.config.ts`, 'utf-8');
    viteConfig = `import { remixRoutes } from "remix-routes/vite";
        ${viteConfig}`;

    viteConfig = viteConfig.replace(`tsconfigPaths()`, `remixRoutes(), tsconfigPaths()`);

    fs.writeFileSync(`./vite.config.ts`, viteConfig);
}
