import shell from "shelljs";
import fs from "node:fs";
import {getPackageManagerAddCommand} from "./utils.js";

const errorWrapper = `import {json} from "@remix-run/node";
import type {TypedResponse} from "@remix-run/server-runtime";
import {nanoid} from "nanoid/non-secure";

type ActionsRecord = Record<string, () => Promise<TypedResponse<unknown>>>;

export function wrapActions<Actions extends ActionsRecord>(actions: Actions, error: string = 'An error occurred.'): Actions {
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
}`;

export const actions = `import type {TypedResponse} from "@remix-run/server-runtime";
import {namedAction} from "remix-utils/named-action";
import {wrapActions} from "~/utils/error-wrapper";

type ActionsRecord = Record<string, () => Promise<TypedResponse<unknown>>>;
type ResponsesRecord<Actions extends ActionsRecord> = {
    [Action in keyof Actions]: Actions[Action] extends () => Promise<TypedResponse<infer Result>> ? Result : never;
}
type ResponsesUnion<Actions extends ActionsRecord> = ResponsesRecord<Actions>[keyof Actions];

export function actions<Actions extends ActionsRecord>(request: Request, actions: Actions): Promise<TypedResponse<ResponsesUnion<Actions>>> {
    return namedAction<Actions>(new URL(request.url) as any, wrapActions(actions))
}`;

export const fetcher = `import {SerializeFrom} from "@remix-run/node";
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
                showSuccessNotification(fetcher.data.message ?? defaultSuccessMessage ?? 'Operation completed successfully.');
            }

            if (onSuccess) {
                onSuccess(fetcher.data.message ?? defaultSuccessMessage ?? 'Operation completed successfully.', fetcher.data as T);
            }
        }

        if (fetcher.data?.success === false && 'error' in fetcher.data && typeof fetcher.data.error === 'string') {
            if (sendNotification) {
                showErrorNotification(fetcher.data.error ?? defaultFailureMessage ?? 'An error occurred.');
            }

            if (onFailure) {
                onFailure(fetcher.data.error ?? defaultFailureMessage ?? 'An error occurred.', fetcher.data as T);
            }
        }
    }, [fetcher.state]);
}`;

export const addClickToComponent = `import React, {ReactElement, ReactNode} from 'react';

export const addClickToComponent = (component: ReactNode, onClick: () => void): ReactElement => {
    if (React.isValidElement(component)) {
        return React.cloneElement(component as ReactElement, {onClick: onClick});
    }

    throw new Error('Invalid component');
};`;

export const notifications = `import {notifications} from "@mantine/notifications";
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
}`;

export const modals = `import React, {ReactNode} from "react";
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
`;

export function setupRemixUtils(packageManager: string, mantine: boolean, mantinePackages: string[]) {
    shell.exec(`${packageManager} ${getPackageManagerAddCommand(packageManager)} remix-utils`);
    shell.mkdir('-p', `./app/utils`);

    fs.writeFileSync(`./app/utils/error-wrapper.ts`, errorWrapper);

    fs.writeFileSync(`./app/utils/actions.ts`, actions);

    fs.writeFileSync(`./app/utils/fetcher.ts`, fetcher);

    fs.writeFileSync(`./app/utils/add-click-to-component.tsx`, addClickToComponent);

    if (mantine && mantinePackages.includes('@mantine/notifications')) {
        fs.writeFileSync(`./app/utils/notifications.tsx`, notifications);
    }

    if (mantine && mantinePackages.includes('@mantine/modals')) {
        fs.writeFileSync(`./app/utils/modals.tsx`, modals);
    }
}
