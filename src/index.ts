#!/usr/bin/env node

import prompts from 'prompts';
import shell from 'shelljs';
import kleur from 'kleur';
import {setupPrisma} from "./prisma.js";
import {runPrettier} from "./prettier.js";
import {setupMantine} from "./mantine.js";
import {setupRemixUtils} from "./remix-utils.js";
import {setupZod} from "./zod.js";
import {setupZustand} from "./zustand.js";
import {setupNanoid} from "./nanoid.js";
import {setupOpenAPIFetch} from "./openapi-fetch.js";
import {setupI18n} from "./i18n.js";
import {setupRemixFlatRoutes} from "./remix-flat-routes.js";
import {setupRemixAuth} from "./remix-auth.js";
import {setupRemixRoutes} from "./remix-routes.js";

async function main() {
    console.log(kleur.bold().magenta('Create Fumaz App 🚀'));
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
            type: 'toggle',
            name: 'prisma',
            message: 'Would you like to include Prisma?',
            active: 'yes',
            inactive: 'no',
            initial: false,
        },
        {
            type: 'toggle',
            name: 'remixAuth',
            message: 'Would you like to include Remix Auth? (requires Prisma)',
            active: 'yes',
            inactive: 'no',
            initial: false,
        },
        // {
        //     type: 'multiselect',
        //     name: 'remixAuthOptions',
        //     message: 'Which Remix Auth strategies would you like to include?',
        //     hint: '- Space to select. Return to submit',
        //     instructions: false,
        //     choices: [
        //         {
        //             title: 'Email and password',
        //             value: 'email-password',
        //             selected: true
        //         },
        //         {
        //             title: 'OAuth',
        //             value: 'oauth',
        //             selected: false
        //         },
        //         {
        //             title: 'JWT',
        //             value: 'jwt',
        //             selected: false
        //         },
        //         {
        //             title: 'Magic link',
        //             value: 'magic-link',
        //             selected: false
        //         },
        //         {
        //             title: 'Two-factor authentication',
        //             value: '2fa',
        //             selected: false
        //         }
        //     ]
        // },
        // {
        //     type: 'toggle',
        //     name: 'remixAuthPrisma',
        //     message: 'Would you like to setup Prisma to work with Remix Auth?',
        //     active: 'yes',
        //     inactive: 'no',
        //     initial: false,
        // },
        {
            type: 'toggle',
            name: 'i18n',
            message: 'Would you like to include i18n (localization)?',
            active: 'yes',
            inactive: 'no',
            initial: true,
        },
        {
            type: 'multiselect',
            name: 'otherFeatures',
            message: 'Which other features would you like to include?',
            hint: '- Space to select. Return to submit',
            instructions: false,
            choices: [
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
                    title: 'Remix Flat Routes',
                    value: 'remix-flat-routes',
                    selected: true
                },
                {
                    title: 'Type Safe Routes',
                    value: 'remix-routes',
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
            instructions: false,
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

    let {
        directory,
        git,
        mantine,
        mantinePackages,
        otherFeatures,
        packageManager,
        prisma,
        remixAuth,
    } = response;

    createRemixProject(directory, packageManager);
    shell.cd(directory);

    if (mantine) {
        setupMantine(packageManager, mantinePackages);
    }

    if (prisma) {
        setupPrisma(packageManager);
    }

    if (otherFeatures.includes('remix-utils')) {
        setupRemixUtils(packageManager, mantine, mantinePackages);
    }

    if (otherFeatures.includes('zod')) {
        setupZod(packageManager);
    }

    if (otherFeatures.includes('zustand')) {
        setupZustand(packageManager);
    }

    if (otherFeatures.includes('nanoid')) {
        setupNanoid(packageManager);
    }

    if (otherFeatures.includes('openapi-fetch')) {
        setupOpenAPIFetch(packageManager);
    }

    if (otherFeatures.includes('i18n')) {
        setupI18n(packageManager);
    }

    if (otherFeatures.includes('remix-flat-routes')) {
        setupRemixFlatRoutes(packageManager);
    }

    if (remixAuth) {
        setupRemixAuth(packageManager, {});
    }

    if (otherFeatures.includes('remix-routes')) {
        setupRemixRoutes(packageManager);
    }

    await runPrettier();

    if (git) {
        createGitRepository();
    }

    console.log();
    console.log(kleur.bold().green('Project created successfully! 🎉'));
}

function createRemixProject(directory: string, packageManager: string) {
    shell.exec(`${packageManager} create remix ${directory} --template remix-run/remix/templates/unstable-vite --package-manager ${packageManager} --yes --no-git-init --install --no-motion`);
}

function createGitRepository() {
    shell.exec(`git init`);
    shell.exec(`git add .`);
}

main().catch(console.error);
