#!/usr/bin/env node

import prompts from 'prompts';
import shell from 'shelljs';
import kleur from 'kleur';

async function main() {
    console.log(kleur.bold().magenta('Create Fumaz App'));
    console.log();

    const response = await prompts([
        {
            type: 'text',
            name: 'directory',
            message: 'Where would you like to create the project?',
        },
        {
            type: 'toggle',
            name: 'git',
            message: 'Would you like to initialize a git repository?',
            active: 'yes',
            initial: true,
            inactive: 'no'
        },
        {
            type: 'toggle',
            name: 'mantine',
            message: 'Would you like to include Mantine?',
            active: 'yes',
            initial: true,
            inactive: 'no'
        },
        {
            type: prev => prev ? 'multiselect' : null,
            name: 'mantinePackages',
            message: 'Which Mantine packages would you like to include?',
            hint: '- Space to select. Return to submit',
            instructions: false,
            choices: [
                {
                    title: 'carousel',
                    value: '@mantine/carousel',
                    selected: true
                },
                {
                    title: 'notifications',
                    value: '@mantine/notifications',
                    selected: true
                },
                {
                    title: 'charts',
                    value: '@mantine/charts',
                    selected: true
                },
                {
                    title: 'dropzone',
                    value: '@mantine/dropzone',
                    selected: true
                },
                {
                    title: 'form',
                    value: '@mantine/form',
                    selected: true
                },
                {
                    title: 'modals',
                    value: '@mantine/modals',
                    selected: true
                },
                {
                    title: 'spotlight',
                    value: '@mantine/spotlight',
                    selected: true
                },
                {
                    title: 'tiptap',
                    value: '@mantine/tiptap',
                    selected: true
                },
                {
                    title: 'react-table',
                    value: 'mantine-react-table@alpha',
                    selected: true
                },
            ]
        },
        {
            type: 'multiselect',
            name: 'otherFeatures',
            message: 'Which other features would you like to include?',
            hint: '- Space to select. Return to submit',
            instructions: false,
            choices: [
                {
                    title: 'Prisma',
                    value: 'prisma',
                    selected: true
                },
                {
                    title: 'Remix Utils',
                    value: 'remix-utils',
                    selected: true
                },
                {
                    title: 'Zod',
                    value: 'zod',
                    selected: true
                },
                {
                    title: 'Zustand',
                    value: 'zustand',
                    selected: true
                },
                {
                    title: 'Nanoid',
                    value: 'nanoid',
                    selected: true
                },
                {
                    title: 'OpenAPI Fetch',
                    value: 'openapi-fetch',
                    selected: false
                }
            ]
        },
        {
            type: 'select',
            name: 'packageManager',
            message: 'Which package manager would you like to use?',
            choices: [
                {
                    title: 'npm',
                    value: 'npm'
                },
                {
                    title: 'yarn',
                    value: 'yarn'
                },
                {
                    title: 'pnpm',
                    value: 'pnpm'
                },
                {
                    title: 'bun',
                    value: 'bun'
                }
            ]
        }
    ]);

    const {
        directory,
        git,
        mantine,
        mantinePackages,
        otherFeatures,
        packageManager
    } = response;

    createRemixProject(directory, packageManager);
    shell.cd(directory);

    if (git) {
        createGitRepository();
    }

    if (mantine) {
        installMantine(packageManager, mantinePackages);
    }

    if (otherFeatures.includes('prisma')) {
        installPrisma(packageManager);
    }

    if (otherFeatures.includes('remix-utils')) {
        shell.exec(`${packageManager} install remix-utils`);
    }

    if (otherFeatures.includes('zod')) {
        shell.exec(`${packageManager} install zod`);
    }

    if (otherFeatures.includes('zustand')) {
        shell.exec(`${packageManager} install zustand`);
    }

    if (otherFeatures.includes('nanoid')) {
        shell.exec(`${packageManager} install nanoid`);
    }

    if (otherFeatures.includes('openapi-fetch')) {
        shell.exec(`${packageManager} install openapi-fetch`);
    }

    console.log();
    console.log(kleur.bold().green('Project created successfully!'));
}

function createRemixProject(directory: string, packageManager: string) {
    shell.exec(`${packageManager} create remix ${directory} --template remix-run/remix/templates/unstable-vite --package-manager ${packageManager} --yes --no-git-init --install --no-motion`);
}

function createGitRepository() {
    shell.exec(`git init`);
}

function installMantine(packageManager: string, mantinePackages: string[]) {
    const secondCommand = packageManager === 'npm' ? 'install' : 'add';

    shell.exec(`${packageManager} ${secondCommand} @mantine/core @mantine/hooks @mantine/dates ${mantinePackages.join(' ')}`);
}

function installPrisma(packageManager: string) {
    shell.exec(`${packageManager} install prisma`);
    shell.exec(`${getPackageManagerExecuteCommand(packageManager)} prisma init`);
}

function getPackageManagerExecuteCommand(packageManager: string) {
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

main().catch(console.error);
