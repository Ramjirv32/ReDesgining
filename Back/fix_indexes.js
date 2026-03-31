// MongoDB Script to fix SlotLocksCol indexes
// Run with: mongosh mental < fix_indexes.js

console.log("=== FIXING SLOT LOCKS INDEXES ===\n");

// Drop all existing indexes
console.log("Dropping all old indexes...");
try {
  db.play_slot_locks.dropIndexes();
  console.log("✅ All old indexes dropped\n");
} catch (e) {
  console.log("ℹ️ No indexes to drop (first run): " + e.message + "\n");
}

// Create correct UNIQUE index
console.log("Creating UNIQUE index on (play_id, date, slot, court_name)...");
db.play_slot_locks.createIndex(
  { play_id: 1, date: 1, slot: 1, court_name: 1 },
  { unique: true }
);
console.log("✅ UNIQUE index created\n");

// Create TTL index for auto-cleanup
console.log("Creating TTL index on created_at (900 seconds = 15 minutes)...");
db.play_slot_locks.createIndex(
  { created_at: 1 },
  { expireAfterSeconds: 900 }
);
console.log("✅ TTL index created\n");

// Create index for efficient lock_key lookups
console.log("Creating index on lock_key...");
db.play_slot_locks.createIndex(
  { lock_key: 1 }
);
console.log("✅ lock_key index created\n");

// List all indexes
console.log("=== FINAL INDEXES ===");
const indexes = db.play_slot_locks.getIndexes();
indexes.forEach((idx, i) => {
  const keys = Object.keys(idx.key).map(k => k + ": " + idx.key[k]).join(", ");
  console.log((i + 1) + ". " + keys + 
    (idx.unique ? " [UNIQUE]" : "") + 
    (idx.expireAfterSeconds ? " [TTL: " + idx.expireAfterSeconds + "s]" : ""));
});

console.log("\n✅ All indexes configured correctly!");
