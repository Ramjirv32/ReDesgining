#!/bin/bash

# Script to clear all collections from MongoDB database
# Usage: ./clear_database.sh

DB_NAME="ticpin"
MONGO_URI="mongodb://localhost:27017"

echo "🔌 Connecting to MongoDB..."
echo "Database: $DB_NAME"
echo "URI: $MONGO_URI"
echo ""

# List all collections
echo "📋 Listing all collections..."
collections=$(mongo "$MONGO_URI/$DB_NAME" --quiet --eval "db.getCollectionNames().forEach(function(name) { print(name) })")

if [ -z "$collections" ]; then
    echo "❌ No collections found or connection failed."
    exit 1
fi

echo "Found collections:"
echo "$collections" | nl
echo ""

# Confirmation
echo "⚠️  WARNING: This will permanently delete ALL collections and data!"
echo "Type 'DELETE ALL' to confirm: "
read confirmation

if [ "$confirmation" != "DELETE ALL" ]; then
    echo "❌ Operation cancelled."
    exit 0
fi

echo ""
echo "🗑️  Deleting all collections..."
echo ""

# Delete each collection
echo "$collections" | while read -r collection; do
    if [ -n "$collection" ]; then
        echo -n "Deleting collection: $collection... "
        result=$(mongo "$MONGO_URI/$DB_NAME" --quiet --eval "db.$collection.drop()")
        if echo "$result" | grep -q "true"; then
            echo "✅ SUCCESS"
        else
            echo "❌ FAILED: $result"
        fi
    fi
done

echo ""
echo "✅ All collections deleted successfully!"
echo "Database '$DB_NAME' is now empty."
