import type { open } from 'sqlite';

export type CrmDatabase = Awaited<ReturnType<typeof open>>;
