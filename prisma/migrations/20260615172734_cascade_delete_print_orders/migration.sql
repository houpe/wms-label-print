-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_PrintOrder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "storeId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "temperature" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PrintOrder_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PrintOrder_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_PrintOrder" ("contactId", "createdAt", "id", "quantity", "storeId", "temperature") SELECT "contactId", "createdAt", "id", "quantity", "storeId", "temperature" FROM "PrintOrder";
DROP TABLE "PrintOrder";
ALTER TABLE "new_PrintOrder" RENAME TO "PrintOrder";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
