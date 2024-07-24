import { useLofikAccount, useLofikQuery } from "@lofik/react";
import { useMemo, useState } from "react";
import { z } from "zod";
import { LofikProviderWrapper } from "../../layouts/LofikProviderWrapper";
import { QueryKeys } from "../../queries";
import { getTimestampAfterSubtractingDays } from "../../utils/dates";
import { transactionsSchema } from "../../validators/validators";
import { Overview } from "./Transactions/Overview";
import {
  TransactionFormModal,
  type ModalTransaction,
} from "./Transactions/TransactionFormModal";
import { Transactions } from "./Transactions/Transactions";

const DAYS_AGO_30_TS = getTimestampAfterSubtractingDays(30);

export const Dashboard1 = () => {
  const { pubKeyHex } = useLofikAccount();

  const [modalTransaction, setModalTransaction] =
    useState<ModalTransaction | null>(null);

  const { data: totalData } = useLofikQuery({
    sql: `
      SELECT 
        SUM(amount) AS total 
      FROM transactions 
      WHERE 
        pubKeyHex = '${pubKeyHex}' 
        AND deletedAt IS NULL 
        AND createdAt > ${DAYS_AGO_30_TS}
    `,
    schema: z.array(z.object({ total: z.number().nullable() })),
    queryKey: [QueryKeys.GET_TRANSACTIONS_TOTAL, pubKeyHex],
  });

  const { data: transactions } = useLofikQuery({
    sql: `
      SELECT * FROM transactions 
      WHERE 
        pubKeyHex = '${pubKeyHex}' 
        AND deletedAt IS NULL 
        AND createdAt > ${DAYS_AGO_30_TS} 
      ORDER BY createdAt desc`,
    schema: transactionsSchema,
    queryKey: [QueryKeys.GET_TRANSACTIONS, pubKeyHex],
  });

  const total = useMemo(() => totalData?.[0].total ?? NaN, [totalData]);

  return (
    <>
      <Overview total={total} setModalTransaction={setModalTransaction} />

      <Transactions
        transactions={transactions}
        setModalTransaction={setModalTransaction}
      />

      {modalTransaction && (
        <TransactionFormModal
          transaction={modalTransaction}
          onClose={() => setModalTransaction(null)}
        />
      )}
    </>
  );
};

export const Dashboard = () => {
  return (
    <LofikProviderWrapper>
      <Dashboard1 />
    </LofikProviderWrapper>
  );
};
