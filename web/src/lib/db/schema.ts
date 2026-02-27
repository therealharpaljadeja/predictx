import { pgTable, serial, integer, text, real, index } from "drizzle-orm/pg-core";

export const metricSnapshots = pgTable(
  "metric_snapshots",
  {
    id: serial("id").primaryKey(),
    marketId: integer("market_id").notNull(),
    endpointPath: text("endpoint_path").notNull(),
    jsonPath: text("json_path").notNull(),
    value: real("value").notNull(),
    timestamp: integer("timestamp").notNull(),
  },
  (table) => [
    index("idx_market_id").on(table.marketId),
    index("idx_endpoint_timestamp").on(table.endpointPath, table.jsonPath, table.timestamp),
  ],
);
