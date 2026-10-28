import { createDialogController } from '@/lib/dialog-controller';

export const dialogs = createDialogController();
export const confirmAction = dialogs.confirm;
export const promptAction = dialogs.prompt;
export const dialogSession = dialogs.session;
