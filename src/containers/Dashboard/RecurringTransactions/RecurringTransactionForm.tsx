import { zodResolver } from "@hookform/resolvers/zod";
import {
  DatabaseMutationOperation,
  useLofikAccount,
  useLofikMutation,
} from "@lofik/react";
import Mexp from "math-expression-evaluator";
import { z, type TypeOf } from "zod";
import { CategoryPicker } from "../../../components/CategoryPicker";
import { CurrencyPicker } from "../../../components/CurrencyPicker";
import { Form } from "../../../components/Form";
import { Input } from "../../../components/Input";
import { useRefetchQueries } from "../../../hooks/useRefetchQueries";
import { getUnixTimestamp } from "../../../utils/dates";
import {
  RecurringTransactionRepeatInterval,
  type RecurringTransaction,
} from "../../../validators/types";
import { TableNames } from "../constants";
import styles from "./styles.module.css";

export type FormRecurringTransaction = Omit<
  RecurringTransaction,
  "id" | "amount" | "pubKeyHex" | "updatedAt" | "deletedAt" | "createdAt"
> & { id: string | null; amount: number | null; createdAt: number | null };

type Props = {
  recurringTransaction: FormRecurringTransaction;
  onSuccess?: () => void;
  onCancel?: () => void;
};

const schema = z.object({
  title: z.string(),
  amount: z.string(),
  categoryId: z.string().nullable(),
  currency: z.string(),
  repeatDay: z
    .number()
    .gte(1, "Must be 1 of greater")
    .lte(28, "Must be 28 or lower"),
  repeatInterval: z.nativeEnum(RecurringTransactionRepeatInterval),
});

type FormValues = TypeOf<typeof schema>;

const mexp = new Mexp();

export const RecurringTransactionForm = ({
  recurringTransaction,
  onSuccess,
  onCancel,
}: Props) => {
  const { pubKeyHex } = useLofikAccount();

  const refetchQueries = useRefetchQueries();
  const { mutate } = useLofikMutation({
    shouldSync: true,
    onSuccess: () => {
      refetchQueries();

      onSuccess?.();
    },
  });

  const onSubmit = ({
    categoryId,
    title,
    amount,
    repeatDay,
    repeatInterval,
    currency,
  }: FormValues) => {
    let amountEval: number;

    try {
      amountEval = mexp.eval(amount);
    } catch (err) {
      alert(err);

      return;
    }

    mutate({
      operation: DatabaseMutationOperation.Upsert,
      tableName: TableNames.RECURRING_TRANSACTIONS,
      columnDataMap: {
        id: recurringTransaction.id || crypto.randomUUID(),
        title,
        amount: Math.abs(amountEval),
        pubKeyHex,
        categoryId: categoryId || null,
        currency,
        repeatDay,
        repeatInterval,
        deletedAt: null,
        createdAt: recurringTransaction.createdAt || getUnixTimestamp(),
      },
    });
  };

  return (
    <Form<FormValues>
      onSubmit={onSubmit}
      resolver={zodResolver(schema)}
      values={{
        categoryId: recurringTransaction.categoryId,
        title: recurringTransaction.title,
        amount: recurringTransaction.amount?.toString() ?? "",
        repeatDay: recurringTransaction.repeatDay,
        repeatInterval: recurringTransaction.repeatInterval,
        currency: recurringTransaction.currency,
      }}
      confirmModalProps={
        !recurringTransaction.id
          ? {
              enabled: true,
              children:
                "You won't be able to change repeat day and interval after creating.",
            }
          : undefined
      }
    >
      <fieldset>
        <Input name="title" placeholder="title" aria-label="title" autoFocus />

        <CategoryPicker name="categoryId" />

        <div role="group">
          <div className={`${styles["margin-right"]} ${styles.flex}`}>
            <Input
              name="amount"
              placeholder="5+5"
              aria-label="amount"
              inputMode="tel"
              minLength={1}
            />
          </div>

          <div className={styles.flex}>
            <CurrencyPicker name="currency" />
          </div>
        </div>

        <div role="group">
          <div className={styles["margin-right"]}>
            <Input
              name="repeatDay"
              type="number"
              aria-label="repeat day"
              inputMode="numeric"
              min={1}
              max={28}
              options={{ valueAsNumber: true }}
              disabled={!!recurringTransaction.id}
            />
          </div>

          <Input name="repeatInterval" aria-label="repeat interval" disabled />
        </div>
      </fieldset>

      <div className={styles["flex-container"]}>
        <button
          type="button"
          className={`contrast ${styles.flex} ${styles["no-margin-bottom"]}`}
          onClick={onCancel}
        >
          cancel
        </button>

        <button
          className={`${styles.flex} ${styles["no-margin-bottom"]}`}
          type="submit"
        >
          {recurringTransaction.id ? "save" : "create"}
        </button>
      </div>
    </Form>
  );
};
