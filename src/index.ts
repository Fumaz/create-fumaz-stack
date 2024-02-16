#!/usr/bin/env node

import prompts from 'prompts';
import shell from 'shelljs';
import kleur from 'kleur';
import * as fs from "node:fs";

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
                    title: 'i18n',
                    value: 'i18n',
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
                    title: 'Remix Auth',
                    value: 'remix-auth',
                    selected: false
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

    let {
        directory,
        git,
        mantine,
        mantinePackages,
        otherFeatures,
        packageManager
    } = response;

    createRemixProject(directory, packageManager);
    shell.cd(directory);

    if (mantine) {
        installMantine(packageManager, mantinePackages, directory);
    }

    if (otherFeatures.includes('prisma')) {
        installPrisma(packageManager, directory);
    }

    if (otherFeatures.includes('remix-utils')) {
        shell.exec(`${packageManager} install remix-utils`);
        shell.mkdir('-p', `./app/utils`);

        fs.writeFileSync(`./app/utils/error-wrapper.ts`, `import {json} from "@remix-run/node";
import type {TypedResponse} from "@remix-run/server-runtime";
import {nanoid} from "nanoid/non-secure";

type ActionsRecord = Record<string, () => Promise<TypedResponse<unknown>>>;

export function wrapActions<Actions extends ActionsRecord>(actions: Actions, error: string = 'Si é verificato un errore.'): Actions {
    const wrappedActions: Partial<Actions> = {};

    Object.keys(actions).forEach(key => {
        const action = actions[key];
        (wrappedActions as any)[key] = async () => {
            try {
                return await action();
            } catch (err) {
                console.error(err);

                return json({
                    success: false,
                    snowflake: nanoid(16),
                    error: error
                });
            }
        };
    });

    return wrappedActions as Actions;
}

export function snowflakeJSON<T>(data: T): TypedResponse<T & { snowflake: string }> {
    return json({
        ...data,
        snowflake: nanoid(16)
    });
}`);

        fs.writeFileSync(`./app/utils/actions.ts`, `import type {TypedResponse} from "@remix-run/server-runtime";
import {namedAction} from "remix-utils/named-action";
import {wrapActions} from "~/utils/error-wrapper";

type ActionsRecord = Record<string, () => Promise<TypedResponse<unknown>>>;
type ResponsesRecord<Actions extends ActionsRecord> = {
    [Action in keyof Actions]: Actions[Action] extends () => Promise<TypedResponse<infer Result>> ? Result : never;
}
type ResponsesUnion<Actions extends ActionsRecord> = ResponsesRecord<Actions>[keyof Actions];

export function actions<Actions extends ActionsRecord>(request: Request, actions: Actions): Promise<TypedResponse<ResponsesUnion<Actions>>> {
    return namedAction<Actions>(new URL(request.url) as any, wrapActions(actions))
}`);

        fs.writeFileSync(`./app/utils/fetcher.ts`, `import {SerializeFrom} from "@remix-run/node";
import {FetcherWithComponents} from "@remix-run/react";
import {useEffect, useState} from "react";
import {showErrorNotification, showSuccessNotification} from "~/utils/notifications";

type ActionData = SerializeFrom<{
    action?: string,
    snowflake?: string,
    success: boolean,
}>;

export function useFetcherState<T extends ActionData>({
                                                          fetcher,
                                                          action,
                                                          onSuccess,
                                                          onFailure,
                                                          sendNotification = true,
                                                          defaultSuccessMessage,
                                                          defaultFailureMessage
                                                      }: {
    fetcher: FetcherWithComponents<ActionData>,
    action?: string,
    onSuccess?: (message: string, data: T) => void,
    onFailure?: (error: string, data: T) => void,
    sendNotification?: boolean,
    defaultSuccessMessage?: string,
    defaultFailureMessage?: string,
}) {
    const [lastSnowflake, setLastSnowflake] = useState<string | null>(null);

    useEffect(() => {
        if (fetcher.data?.action != action || fetcher.data?.snowflake === lastSnowflake) {
            return;
        }

        setLastSnowflake(fetcher.data?.snowflake ?? null);

        if (fetcher.data?.success === true && 'message' in fetcher.data && typeof fetcher.data.message === 'string') {
            if (sendNotification) {
                showSuccessNotification(fetcher.data.message ?? defaultSuccessMessage ?? 'Operazione completata con successo.');
            }

            if (onSuccess) {
                onSuccess(fetcher.data.message ?? defaultSuccessMessage ?? 'Operazione completata con successo.', fetcher.data as T);
            }
        }

        if (fetcher.data?.success === false && 'error' in fetcher.data && typeof fetcher.data.error === 'string') {
            if (sendNotification) {
                showErrorNotification(fetcher.data.error ?? defaultFailureMessage ?? 'Si è verificato un errore.');
            }

            if (onFailure) {
                onFailure(fetcher.data.error ?? defaultFailureMessage ?? 'Si è verificato un errore.', fetcher.data as T);
            }
        }
    }, [fetcher.state]);
}`);

        fs.writeFileSync(`./app/utils/add-click-to-component.tsx`, `import React, {ReactElement, ReactNode} from 'react';

export const addClickToComponent = (component: ReactNode, onClick: () => void): ReactElement => {
    if (React.isValidElement(component)) {
        return React.cloneElement(component as ReactElement, {onClick: onClick});
    }

    throw new Error('Invalid component');
};`);

        fs.writeFileSync(`./app/utils/notifications.tsx`, `import {notifications} from "@mantine/notifications";
import {IconCheck, IconExclamationMark} from "@tabler/icons-react";

export function showSuccessNotification(message: string) {
    notifications.show({
        title: "Success!",
        color: 'green',
        message: message,
        withBorder: true,
        icon: <IconCheck/>
    });
}

export function showErrorNotification(message: string) {
    notifications.show({
        title: "Error!",
        color: 'red',
        message: message,
        withBorder: true,
        icon: <IconExclamationMark/>
    });
}`);

        fs.writeFileSync(`./app/utils/modals.tsx`, `import React, {ReactNode} from "react";
import {nanoid} from "nanoid/non-secure";
import {modals} from "@mantine/modals";
import {Button, Stack} from "@mantine/core";

export function confirmModal({
                                 title = 'Are you sure?',
                                 message,
                                 onConfirm,
                                 onCancel = () => {
                                 },
                                 onClose = () => {
                                 }
                             }: {
    title?: string;
    message: string;
    onConfirm: () => void;
    onCancel?: () => void;
    onClose?: () => void;
}) {
    modals.openConfirmModal({
        title: title,
        children: message,
        centered: true,
        labels: {
            confirm: 'Confirm',
            cancel: 'Cancel'
        },
        onConfirm() {
            onConfirm();
        },
        onCancel() {
            onCancel();
        },
        onClose() {
            onClose();
        }
    });
}

export function okModal({
                            title = 'Hey!',
                            message,
                            onClose = () => {
                            }
                        }: {
    title?: string;
    message: ReactNode;
    onClose?: () => void;
}) {
    const modalId = nanoid(8);

    modals.open({
        modalId: modalId,
        title: title,
        children: <Stack>
            {message}

            <Button fullWidth onClick={() => {
                modals.close(modalId);
                onClose();
            }}>Ok</Button>
        </Stack>,
        centered: true,
        onClose() {
            onClose();
        }
    });
}
`);
    }

    const secondCommand = packageManager === 'npm' ? 'install' : 'add';

    if (otherFeatures.includes('zod')) {
        shell.exec(`${packageManager} ${secondCommand} zod`);
    }

    if (otherFeatures.includes('zustand')) {
        shell.exec(`${packageManager} ${secondCommand} zustand`);
    }

    if (otherFeatures.includes('nanoid')) {
        shell.exec(`${packageManager} ${secondCommand} nanoid`);
    }

    if (otherFeatures.includes('openapi-fetch')) {
        shell.exec(`${packageManager} ${secondCommand} openapi-fetch`);
    }

    if (otherFeatures.includes('i18n')) {
        shell.exec(`${packageManager} ${secondCommand} remix-i18next i18next react-i18next i18next-browser-languagedetector i18next-http-backend i18next-fs-backend`);

        shell.mkdir('-p', `./public/locales/en`);
        fs.writeFileSync(`./public/locales/en/common.json`, `{
  "greeting": "Hello"
}`);

        shell.mkdir('-p', `./public/locales/it`);
        fs.writeFileSync(`./public/locales/it/common.json`, `{
    "greeting": "Ciao"
}`);

        fs.writeFileSync(`./app/i18n.ts`, `export default {
  // This is the list of languages your application supports
  supportedLngs: ["en", "it"],
  // This is the language you want to use in case
  // if the user language is not in the supportedLngs
  fallbackLng: "en",
  // The default namespace of i18next is "translation", but you can customize it here
  defaultNS: "common",
  // Disabling suspense is recommended
  react: { useSuspense: false },
};`);

        fs.writeFileSync(`./app/i18next.server.ts`, `import Backend from "i18next-fs-backend";
import { resolve } from "node:path";
import { RemixI18Next } from "remix-i18next";
import i18n from "~/i18n"; // your i18n configuration file

let i18next = new RemixI18Next({
  detection: {
    supportedLanguages: i18n.supportedLngs,
    fallbackLanguage: i18n.fallbackLng,
  },
  // This is the configuration for i18next used
  // when translating messages server-side only
  i18next: {
    ...i18n,
    backend: {
      loadPath: resolve("./public/locales/{{lng}}/{{ns}}.json"),
    },
  },
  // The i18next plugins you want RemixI18next to use for \`i18n.getFixedT\` inside loaders and actions.
  // E.g. The Backend plugin for loading translations from the file system
  // Tip: You could pass \`resources\` to the \`i18next\` configuration and avoid a backend here
  plugins: [Backend],
});

export default i18next;`);

        fs.writeFileSync(`./app/entry.client.tsx`, `import { RemixBrowser } from "@remix-run/react";
import { startTransition, StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import i18n from "./i18n";
import i18next from "i18next";
import { I18nextProvider, initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import Backend from "i18next-http-backend";
import { getInitialNamespaces } from "remix-i18next";

async function hydrate() {
  await i18next
    .use(initReactI18next) // Tell i18next to use the react-i18next plugin
    .use(LanguageDetector) // Setup a client-side language detector
    .use(Backend) // Setup your backend
    .init({
      ...i18n, // spread the configuration
      // This function detects the namespaces your routes rendered while SSR use
      ns: getInitialNamespaces(),
      backend: { loadPath: "/locales/{{lng}}/{{ns}}.json" },
      detection: {
        // Here only enable htmlTag detection, we'll detect the language only
        // server-side with remix-i18next, by using the \`<html lang>\` attribute
        // we can communicate to the client the language detected server-side
        order: ["htmlTag"],
        // Because we only use htmlTag, there's no reason to cache the language
        // on the browser, so we disable it
        caches: [],
      },
    });

  startTransition(() => {
    hydrateRoot(
      document,
      <I18nextProvider i18n={i18next}>
        <StrictMode>
          <RemixBrowser />
        </StrictMode>
      </I18nextProvider>
    );
  });
}

if (window.requestIdleCallback) {
  window.requestIdleCallback(hydrate);
} else {
  // Safari doesn't support requestIdleCallback
  // https://caniuse.com/requestidlecallback
  window.setTimeout(hydrate, 1);
}`);

        fs.writeFileSync(`./app/entry.server.tsx`, `import { PassThrough } from "stream";
import { createReadableStreamFromReadable, EntryContext } from "@remix-run/node";
import { RemixServer } from "@remix-run/react";
import { isbot } from "isbot";
import { renderToPipeableStream } from "react-dom/server";
import { createInstance } from "i18next";
import i18next from "./i18next.server";
import { I18nextProvider, initReactI18next } from "react-i18next";
import Backend from "i18next-fs-backend";
import i18n from "./i18n"; // your i18n configuration file
import { resolve } from "node:path";

const ABORT_DELAY = 5000;

export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: EntryContext
) {
  let callbackName = isbot(request.headers.get("user-agent"))
    ? "onAllReady"
    : "onShellReady";

  let instance = createInstance();
  let lng = await i18next.getLocale(request);
  let ns = i18next.getRouteNamespaces(remixContext);

  await instance
    .use(initReactI18next) // Tell our instance to use react-i18next
    .use(Backend) // Setup our backend
    .init({
      ...i18n, // spread the configuration
      lng, // The locale we detected above
      ns, // The namespaces the routes about to render wants to use
      backend: { loadPath: resolve("./public/locales/{{lng}}/{{ns}}.json") },
    });

  return new Promise((resolve, reject) => {
    let didError = false;

    let { pipe, abort } = renderToPipeableStream(
      <I18nextProvider i18n={instance}>
        <RemixServer context={remixContext} url={request.url} />
      </I18nextProvider>,
      {
        [callbackName]: () => {
          let body = new PassThrough();
          const stream = createReadableStreamFromReadable(body);

          responseHeaders.set("Content-Type", "text/html");

          resolve(
            new Response(stream, {
              headers: responseHeaders,
              status: didError ? 500 : responseStatusCode,
            })
          );

          pipe(body);
        },
        onShellError(error: unknown) {
          reject(error);
        },
        onError(error: unknown) {
          didError = true;

          console.error(error);
        },
      }
    );

    setTimeout(abort, ABORT_DELAY);
  });
}`);

        let rootTsx = fs.readFileSync(`./app/root.tsx`, 'utf-8');

        rootTsx = `import {useTranslation} from "react-i18next";
import i18next from "~/i18next.server";
import {json, LoaderFunctionArgs} from "@remix-run/node";
import {useEffect} from "react";
import {useLoaderData} from "@remix-run/react";
${rootTsx}`;


        rootTsx = rootTsx.replace('export default function App() {', `
       export async function loader({ request }: LoaderArgs) {
  let locale = await i18next.getLocale(request);
  return json({ locale });
}

export let handle = {
  // In the handle export, we can add a i18n key with namespaces our route
  // will need to load. This key can be a single string or an array of strings.
  // TIP: In most cases, you should set this to your defaultNS from your i18n config
  // or if you did not set one, set it to the i18next default namespace "translation"
  i18n: "common",
};

export function useChangeLanguage(locale: string) {
  let { i18n } = useTranslation();
  
  useEffect(() => {
    i18n.changeLanguage(locale);
  }, [locale, i18n]);
}

export default function App() {
  // Get the locale from the loader
  let { locale } = useLoaderData<typeof loader>();

  let { i18n } = useTranslation();

  // This hook will change the i18n instance language to the current locale
  // detected by the loader, this way, when we do something to change the
  // language, this locale will change and i18next will load the correct
  // translation files
  useChangeLanguage(locale);
        `);

        rootTsx = rootTsx.replace(`<html lang="en"`, `<html lang={locale} dir={i18n.dir()}`);

        fs.writeFileSync(`./app/root.tsx`, rootTsx);
    }

    if (otherFeatures.includes('remix-flat-routes')) {
        shell.exec(`${packageManager} ${secondCommand} remix-flat-routes`);

        let viteConfig = fs.readFileSync(`./vite.config.ts`, 'utf-8');
        viteConfig = `import flatRoutes from "remix-flat-routes";
        ${viteConfig}`;

        viteConfig = viteConfig.replace(`remix(`, `remix({
    routes: async (defineRoutes) => {
      return flatRoutes('routes', defineRoutes);
    }
  }`);

        fs.writeFileSync(`./vite.config.ts`, viteConfig);
    }

    if (otherFeatures.includes('remix-auth')) {
        shell.exec(`${packageManager} ${secondCommand} remix-auth remix-auth-form bcrypt @types/bcrypt`);
        shell.mkdir('-p', `./app/auth`);

        fs.writeFileSync(`./app/auth/auth.server.ts`, `import {Authenticator} from "remix-auth";
import {sessionStorage} from "~/auth/session.server";
import {User} from "@prisma/client";
import {FormStrategy} from "remix-auth-form";
import {database} from "~/database/database";
import bcrypt from "bcrypt";

export const authenticator = new Authenticator<User>(sessionStorage);

authenticator.use(
    new FormStrategy(async ({form}) => {
        const email = form.get("email");
        const password = form.get("password");

        if (!email) {
            throw new Error("Email is required");
        }

        if (!password) {
            throw new Error("Password is required");
        }

        const user = await database.user.findUnique({
            where: {
                email: email as string
            }
        });

        if (!user) {
            throw new Error("Invalid credentials");
        }

        const isValid = await bcrypt.compare(password as string, user.password);
        
        if (!isValid) {
            throw new Error("Invalid credentials");
        }
        
        return user;
    }),
    "user-password"
);`);

            fs.writeFileSync(`./app/auth/session.server.ts`, `import {createCookieSessionStorage} from "@remix-run/node";

export const sessionStorage = createCookieSessionStorage({
    cookie: {
        name: "__session",
        sameSite: "lax",
        path: "/",
        httpOnly: true,
        secrets: [process.env.SESSION_SECRET || "CHANGE_ME_PLEASE"],
        secure: process.env.NODE_ENV === "production",
    }
});

export const {
    getSession,
    commitSession,
    destroySession
} = sessionStorage;`);

            let prismaSchema = fs.readFileSync(`./prisma/schema.prisma`, 'utf-8');
            prismaSchema = prismaSchema + `
            
model User {
  id       Int    @id @default(autoincrement())
  uuid     String @unique @default(uuid())
  email    String @unique
  name     String
  password String
}`;

            fs.writeFileSync(`./prisma/schema.prisma`, prismaSchema);

            shell.exec(`${getPackageManagerExecuteCommand(packageManager)} prisma generate`);
    }

    if (otherFeatures.includes('remix-routes')) {
        shell.exec(`${packageManager} ${secondCommand} remix-routes`);

        let viteConfig = fs.readFileSync(`./vite.config.ts`, 'utf-8');
        viteConfig = `import { remixRoutes } from "remix-routes/vite";
        ${viteConfig}`;

        viteConfig = viteConfig.replace(`tsconfigPaths()`, `remixRoutes(), tsconfigPaths()`);

        fs.writeFileSync(`./vite.config.ts`, viteConfig);
    }

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

function installMantine(packageManager: string, mantinePackages: string[], directory: string) {
    const secondCommand = packageManager === 'npm' ? 'install' : 'add';

    shell.exec(`${packageManager} ${secondCommand} @tabler/icons-react @mantine/core @mantine/hooks @mantine/dates ${mantinePackages.join(' ')}`);

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

    if (mantinePackages.includes('modals')) {
        rootTsx = `import {ModalsProvider} from '@mantine/core';\n${rootTsx}`;
    }

    if (mantinePackages.includes('notifications')) {
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

function installPrisma(packageManager: string, directory: string) {
    shell.exec(`${packageManager} install prisma`);
    shell.exec(`${getPackageManagerExecuteCommand(packageManager)} prisma init`);
    shell.mkdir('-p', `./app/database`);

    fs.writeFileSync(`./app/database/database.ts`, `import {PrismaClient} from '@prisma/client';

export const database = new PrismaClient();
`);

    shell.exec(`${getPackageManagerExecuteCommand(packageManager)} prisma generate`);
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
