export function getPackageManagerExecuteCommand(packageManager: string) {
    switch (packageManager) {
        case 'npm':
            return 'npx';
        case 'yarn':
            return 'yarn';
        case 'pnpm':
            return 'pnpx';
        case 'bun':
            return 'bunx';
    }
}

export function getPackageManagerAddCommand(packageManager: string) {
    switch (packageManager) {
        case 'npm':
            return 'install';
        case 'yarn':
            return 'add';
        case 'pnpm':
            return 'add';
        case 'bun':
            return 'add';
        default:
            return 'install';
    }
}
