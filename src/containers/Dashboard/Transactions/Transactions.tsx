import { type Transaction as TransactionType } from "../../../validators/types";
import { TransactionRow } from "./TransactionRow";
import styles from "./styles.module.css";

type Props = {
  transactions: TransactionType[] | undefined;
  onDetailClick: (transaction: TransactionType) => void;
};

export const Transactions = ({ transactions, onDetailClick }: Props) => {
  return (
    <div className={styles.scroll}>
      {!!transactions?.length ? (
        transactions.map((transaction) => (
          <TransactionRow
            key={transaction.id}
            transaction={transaction}
            onDetailClick={onDetailClick}
          />
        ))
      ) : (
        <div>nothing yet..</div>
      )}
    </div>
  );
};
