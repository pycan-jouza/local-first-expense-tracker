import { useLofikAccount, useLofikQuery } from "@lofik/react";
import { useState } from "react";
import { QueryKeys } from "../../../queries";
import { categoriesSchema } from "../../../validators/validators";
import { Category } from "./Category";
import { CategoryFormModal, type ModalCategory } from "./CategoryFormModal";
import styles from "./styles.module.css";

export const Categories = () => {
  const { pubKeyHex } = useLofikAccount();

  const [modalCategory, setModalCategory] = useState<ModalCategory | null>(
    null
  );

  const { data, refetch } = useLofikQuery({
    sql: `
      SELECT * FROM categories 
      WHERE 
        pubKeyHex = '${pubKeyHex}' 
        AND deletedAt IS NULL`,
    schema: categoriesSchema,
    queryKey: [QueryKeys.GET_CATEGORIES, pubKeyHex],
  });

  return (
    <>
      <div className={styles["action-container"]}>
        <button
          onClick={() =>
            setModalCategory({
              id: null,
              title: "",
            })
          }
        >
          add category
        </button>
      </div>

      <div className={styles.scroll}>
        {data?.length ? (
          data.map((category) => (
            <Category
              key={category.id}
              category={category}
              onDetailClick={(category) => setModalCategory(category)}
              onDelete={refetch}
            />
          ))
        ) : (
          <div>no categories yet..</div>
        )}
      </div>

      {modalCategory && (
        <CategoryFormModal
          category={modalCategory}
          onSuccess={() => {
            refetch();
          }}
          onClose={() => setModalCategory(null)}
        />
      )}
    </>
  );
};
