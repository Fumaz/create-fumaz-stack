import shell from "shelljs";
import fs from "node:fs";
import {getPackageManagerAddCommand} from "./utils.js";

export function setupRemixFlatRoutes(packageManager: string) {
    shell.exec(`${packageManager} ${getPackageManagerAddCommand(packageManager)} remix-flat-routes`);

    let viteConfig = fs.readFileSync(`./vite.config.ts`, 'utf-8');
    viteConfig = `import { flatRoutes } from "remix-flat-routes";
        ${viteConfig}`;

    viteConfig = viteConfig.replace(`remix(`, `remix({
    routes: async (defineRoutes) => {
      return flatRoutes('routes', defineRoutes);
    }
  }`);

    fs.writeFileSync(`./vite.config.ts`, viteConfig);
}
