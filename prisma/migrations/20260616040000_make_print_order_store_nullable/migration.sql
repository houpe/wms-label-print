-- RedefineTables for PrintOrder (make storeId nullable)
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_PrintOrder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "storeId" TEXT,
    "temperature" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PrintOrder_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_PrintOrder" ("createdAt", "id", "quantity", "storeId", "temperature") SELECT "createdAt", "id", "quantity", "storeId", "temperature" FROM "PrintOrder";
DROP TABLE "PrintOrder";
ALTER TABLE "new_PrintOrder" RENAME TO "PrintOrder";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
