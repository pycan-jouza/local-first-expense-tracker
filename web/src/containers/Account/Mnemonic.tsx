import { Form } from "@/components/Form";
import { Input } from "@/components/Input";
import { CopyIcon } from "@/components/icons/Copy";
import { useAccountContext } from "@/hooks/contexts";
import { useMutation } from "@/hooks/useMutation";
import { QueryKeys } from "@/queries";
import {
  generateNewAccountKeyPair,
  getAccountKeyPairFromMnemonic,
} from "@/utils/account";
import { getUnixTimestamp } from "@/utils/dates";
import { DatabaseMutationOperation } from "@/validators/types";
import { entropyToMnemonic } from "@scure/bip39";
import { wordlist as english } from "@scure/bip39/wordlists/english";
import { useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { UseFormReturn } from "react-hook-form";
import styles from "./styles.module.css";

type FormValues = {
  mnemonic: string;
};

export const Mnemonic = () => {
  const { privKey } = useAccountContext();
  const queryClient = useQueryClient();
  const { mutate } = useMutation({
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [QueryKeys.GET_ACCOUNT] });
    },
    shouldSync: false,
  });

  const currentMnemonic = useMemo(
    () => entropyToMnemonic(privKey, english),
    [privKey]
  );

  const onSubmit = (
    { mnemonic }: FormValues,
    methods: UseFormReturn<FormValues>
  ) => {
    const keys = getAccountKeyPairFromMnemonic(mnemonic);

    if (!keys) {
      return;
    }

    const { privKey, pubKey } = keys;

    mutate({
      operation: DatabaseMutationOperation.Upsert,
      tableName: "accounts",
      columnDataMap: { privKey, pubKey, createdAt: getUnixTimestamp() },
    });

    methods.reset({ mnemonic: "" });
  };

  const handleGenerateNewMnemonic = () => {
    const { privKey, pubKey } = generateNewAccountKeyPair();

    mutate({
      operation: DatabaseMutationOperation.Upsert,
      tableName: "accounts",
      columnDataMap: { privKey, pubKey, createdAt: getUnixTimestamp() },
    });
  };

  return (
    <Form onSubmit={onSubmit} defaultValues={{ mnemonic: "" }}>
      <p>your mnemonic:</p>

      <p>
        <strong>{currentMnemonic}</strong>{" "}
        <CopyIcon
          className={styles.copy}
          onClick={() => navigator.clipboard.writeText(currentMnemonic)}
        />
      </p>

      <fieldset role="group">
        <Input
          name="mnemonic"
          aria-label="mnemonic"
          placeholder="mnemonic"
          className={styles.flex}
        />
      </fieldset>

      <div className={styles["flex-container"]}>
        <button
          type="button"
          onClick={handleGenerateNewMnemonic}
          className={`contrast ${styles["flex"]}`}
        >
          new account
        </button>

        <button type="submit" className={styles["flex"]}>
          set account
        </button>
      </div>
    </Form>
  );
};
