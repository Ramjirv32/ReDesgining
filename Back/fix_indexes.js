// MongoDB Script to fix SlotLocksCol indexes
// Run with: mongosh mental < fix_indexes.js

console.log("=== FIXING SLOT LOCKS INDEXES ===\n");

// Drop all existing indexes
console.log("Dropping all old indexes...");
try {
  db.slot_locks.dropIndexes();
  console.log("✅ All old indexes dropped\n");
} catch (e) {
  console.log("ℹ️ No indexes to drop (first run): " + e.message + "\n");
}

// Create UNIQUE index for play slots
console.log("Creating UNIQUE index on (play_id, date, slot, court_name) for play...");
db.slot_locks.createIndex(
  { play_id: 1, date: 1, slot: 1, court_name: 1 },
  { unique: true, partialFilterExpression: { type: "play" } }
);
console.log("✅ Play UNIQUE index created\n");

// Create UNIQUE index for dining slots
console.log("Creating UNIQUE index on (dining_id, date, time_slot) for dining...");
db.slot_locks.createIndex(
  { dining_id: 1, date: 1, time_slot: 1 },
  { unique: true, partialFilterExpression: { type: "dining" } }
);
console.log("✅ Dining UNIQUE index created\n");

// Create TTL index for auto-cleanup on expires_at (5 minutes)
console.log("Creating TTL index on expires_at (expireAfterSeconds: 0 since field has exact timestamp)...");
db.slot_locks.createIndex(
  { expires_at: 1 },
  { expireAfterSeconds: 0 }
);
console.log("✅ TTL index created\n");

// Create index for efficient lock_key lookups
console.log("Creating index on lock_key...");
db.slot_locks.createIndex(
  { lock_key: 1, type: 1 }
);
console.log("✅ lock_key index created\n");

// Create index for reference_id lookups
console.log("Creating index on reference_id...");
db.slot_locks.createIndex(
  { reference_id: 1, type: 1 }
);
console.log("✅ reference_id index created\n");

// List all indexes
console.log("=== FINAL INDEXES ===");
const indexes = db.slot_locks.getIndexes();
indexes.forEach((idx, i) => {
  const keys = Object.keys(idx.key).map(k => k + ": " + idx.key[k]).join(", ");
  console.log((i + 1) + ". " + keys + 
    (idx.unique ? " [UNIQUE]" : "") + 
    (idx.expireAfterSeconds ? " [TTL: " + idx.expireAfterSeconds + "s]" : ""));
});

console.log("\n✅ All indexes configured correctly!");
