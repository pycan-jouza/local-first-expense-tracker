import styles from "@/app/dashboard/styles.module.css";
import { SelectRow, initDatabase, utils } from "@/db/db";
import * as comlink from "comlink";
import {
  ReactNode,
  createContext,
  useCallback,
  useEffect,
  useState,
} from "react";

type DatabaseContext = {
  exec: <T extends Record<string, unknown>>(sql: string) => Promise<T[]>;
  exportDatabase: () => Promise<unknown>;
};

export const DatabaseContext = createContext({} as DatabaseContext);

type Props = {
  children: ReactNode;
};

export const DatabaseProvider = ({ children }: Props) => {
  const [isLoading, setIsLoading] = useState(true);
  const [{ promiser, exportDatabase }, setPromiser] = useState({
    promiser: (..._args: unknown[]) => new Promise(() => {}),
    exportDatabase: () => new Promise(() => {}),
  });

  const [dbLoading, setDbLoading] = useState(true);
  const [workerApi, setWorkerApi] = useState();

  useEffect(() => {
    const worker = new Worker(new URL("../db/db2.ts", import.meta.url), {
      type: "module",
    });

    worker.onmessage = (ev) => {
      if (ev.data.type === "dbReady") {
        setDbLoading(false);

        worker.onmessage = null;

        const workerApi = comlink.wrap(worker);

        workerApi.selectObjects("select * from device").then(console.log);

        setWorkerApi(workerApi);
      }
    };
  }, []);

  useEffect(() => {
    import("@sqlite.org/sqlite-wasm").then(
      // @ts-ignore
      ({ sqlite3Worker1Promiser }) => {
        initDatabase(sqlite3Worker1Promiser).then(
          ({ promiser: _promiser, exportDatabase }) => {
            setPromiser({ promiser: _promiser, exportDatabase });
            setIsLoading(false);
          }
        );
      }
    );
  }, []);

  const exec = useCallback(
    async <T extends Record<string, unknown>>(sql: string) => {
      const result: T[] = [];

      await promiser("exec", {
        sql,
        callback: (res: SelectRow) => utils.mergeSelect<T>(res, result),
      });

      return result;
    },
    [promiser]
  );

  // this is a better approach for exporting the database
  // but unfortunately not supported in some major browsers yet (mozilla)

  // const exportDatabase = async () => {
  //   const opfsRoot = await navigator.storage.getDirectory();

  //   const fileHandle = await opfsRoot.getFileHandle(DB_NAME);

  //   try {
  //     const saveHandle = await showSaveFilePicker({
  //       suggestedName: "lofextra.sqlite3",
  //     });

  //     const writable = await saveHandle.createWritable();

  //     await writable.write(await fileHandle.getFile());

  //     await writable.close();
  //   } catch (err) {
  //     console.error(err);
  //   }
  // };

  return (
    <DatabaseContext.Provider value={{ exec, exportDatabase, workerApi }}>
      <main className={styles.main}>
        {isLoading || dbLoading ? <div aria-busy="true" /> : children}
      </main>
    </DatabaseContext.Provider>
  );
};
