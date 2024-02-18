import shell from "shelljs";
import fs from "node:fs";
import {getPackageManagerAddCommand} from "./utils.js";

export  function setupMantine(packageManager: string, mantinePackages: string[]) {
    const addCommand = getPackageManagerAddCommand(packageManager);

    shell.exec(`${packageManager} ${addCommand} @tabler/icons-react @mantine/core @mantine/hooks @mantine/dates ${mantinePackages.join(' ')}`);

    // edit root.tsx
    let rootTsx = fs.readFileSync(`./app/root.tsx`, 'utf-8');

    rootTsx = `import '@mantine/core/styles.css';\n${rootTsx}`;
    rootTsx = `import '@mantine/dates/styles.css';\n${rootTsx}`;

    for (const mantinePackage of mantinePackages) {
        if (mantinePackage === 'mantine-react-table@alpha' || mantinePackage === '@mantine/form' || mantinePackage === '@mantine/modals') {
            continue;
        }

        rootTsx = `import '${mantinePackage}/styles.css';\n${rootTsx}`;
    }

    rootTsx = `import {ColorSchemeScript, MantineProvider} from '@mantine/core';\n${rootTsx}`;

    if (mantinePackages.includes('@mantine/modals')) {
        rootTsx = `import {ModalsProvider} from '@mantine/modals';\n${rootTsx}`;
    }

    if (mantinePackages.includes('@mantine/notifications')) {
        rootTsx = `import {Notifications} from '@mantine/notifications';\n${rootTsx}`;
    }

    rootTsx = rootTsx.replace(`<Links />`, `<ColorSchemeScript />
            <Links />
            <title>Fumaz App</title>`);

    rootTsx = rootTsx.replace('<body>', `<body>
<MantineProvider>
${mantinePackages.includes('@mantine/modals') ? '<ModalsProvider>' : ''}
${mantinePackages.includes('@mantine/notifications') ? '<Notifications/>' : ''}
`);

    rootTsx = rootTsx.replace('</body>', `
${mantinePackages.includes('@mantine/modals') ? '</ModalsProvider>' : ''}
</MantineProvider>
</body>
`);

    fs.writeFileSync(`./app/root.tsx`, rootTsx);
}
