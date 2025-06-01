import Dexie, { type EntityTable } from 'dexie';

type App = {
    id: number,
    name: string,
    path: string,
};

const db = new Dexie('FriendsDatabase') as Dexie & {
    app: EntityTable<App, 'id'>,
};

// Schema declaration:
db.version(1).stores({
    app: '++id, name, path', // primary key "id" (for the runtime!)
});

export type { App };
export { db };
