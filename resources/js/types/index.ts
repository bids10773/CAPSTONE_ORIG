export type * from './auth';
export type * from './navigation';
export type * from './ui';
export type * from './availability';
export type * from './medical-certificate';
export type * from './medical-document';

import type { Auth } from './auth';

export type SharedData = {
    name: string;
    auth: Auth;
    sidebarPinned: boolean;
    [key: string]: unknown;
};
