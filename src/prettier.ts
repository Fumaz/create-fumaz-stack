import fs from "node:fs";
import shell from "shelljs";
import prettier from "prettier";
import {glob} from "glob";

export async function runPrettier() {
    fs.writeFileSync('.prettierrc', `{
    "semi": true,
    "singleQuote": true,
    "tabWidth": 4,
    "trailingComma": "all",
    "arrowParens": "always"
    }\n`);
    fs.writeFileSync('.prettierignore', 'node_modules\nbuild\npublic\n.idea\n.vscode\n.git');

    const directoryPath = shell.pwd().toString();
    await formatDirectory(directoryPath);
}

async function formatFile(path: string) {
    try {
        const contents = fs.readFileSync(path, 'utf-8');
        const formatted = await prettier.format(contents, {
            filepath: path,
            semi: true,
            singleQuote: true,
            tabWidth: 4,
            trailingComma: 'all',
            arrowParens: 'always'
        });

        fs.writeFileSync(path, formatted);
    } catch (e) {
        console.error(e);
    }
}

async function formatDirectory(directory: string) {
    for (const file of glob.sync(`${directory}/**/*.{ts,tsx,js,jsx,css,html,json,md,mdx}`)) {
        if (file.includes('node_modules')) {
            continue;
        }

        await formatFile(file);
    }
}
