require('dotenv').config();
const mongoose = require('mongoose');

const DEFAULT_BATCH_SIZE = 500;

const getDbNameFromUri = (uri) => {
  try {
    const parsed = new URL(uri);
    const dbPath = parsed.pathname?.replace(/^\//, '').trim();
    return dbPath || null;
  } catch {
    return null;
  }
};

const toBoolean = (value, fallback = false) => {
  if (typeof value !== 'string') return fallback;
  return ['1', 'true', 'yes', 'y', 'on'].includes(value.toLowerCase());
};

const closeConnections = async (...connections) => {
  await Promise.all(
    connections
      .filter(Boolean)
      .map(async (connection) => {
        try {
          await connection.close();
        } catch {
          // ignore close errors during shutdown
        }
      })
  );
};

const migrateCollection = async ({ sourceDb, targetDb, name, batchSize, dropTarget }) => {
  const sourceCollection = sourceDb.collection(name);
  const targetCollection = targetDb.collection(name);

  const sourceCount = await sourceCollection.countDocuments({});

  if (dropTarget) {
    await targetCollection.deleteMany({});
  }

  if (sourceCount > 0) {
    let buffer = [];
    const cursor = sourceCollection.find({}).batchSize(batchSize);

    for await (const doc of cursor) {
      buffer.push(doc);
      if (buffer.length >= batchSize) {
        await targetCollection.insertMany(buffer, { ordered: false });
        buffer = [];
      }
    }

    if (buffer.length) {
      await targetCollection.insertMany(buffer, { ordered: false });
    }
  }

  // Recreate source indexes in target (except the default _id index).
  const sourceIndexes = await sourceCollection.indexes();
  const customIndexes = sourceIndexes
    .filter((idx) => idx.name !== '_id_')
    .map((idx) => {
      const { key, name: indexName, ...rest } = idx;
      return {
        key,
        name: indexName,
        ...rest,
      };
    });

  if (customIndexes.length) {
    await targetCollection.createIndexes(customIndexes);
  }

  const targetCount = await targetCollection.countDocuments({});

  if (dropTarget && targetCount !== sourceCount) {
    throw new Error(
      `Integrity check failed for collection "${name}": source=${sourceCount}, target=${targetCount}`
    );
  }

  return { name, sourceCount, targetCount };
};

const main = async () => {
  const oldUri = process.env.OLD_MONGO_URI;
  const newUri = process.env.NEW_MONGO_URI || process.env.MONGO_URI;
  const batchSize = Number(process.env.MIGRATION_BATCH_SIZE || DEFAULT_BATCH_SIZE);
  const dropTarget = toBoolean(process.env.MIGRATION_DROP_TARGET, true);

  if (!oldUri || !newUri) {
    throw new Error(
      'Missing URI(s). Set OLD_MONGO_URI and NEW_MONGO_URI (or MONGO_URI) in your environment before running migration.'
    );
  }

  if (oldUri === newUri) {
    throw new Error('OLD_MONGO_URI and NEW_MONGO_URI/MONGO_URI are identical. Aborting migration.');
  }

  if (!Number.isInteger(batchSize) || batchSize <= 0) {
    throw new Error('MIGRATION_BATCH_SIZE must be a positive integer.');
  }

  let sourceConn;
  let targetConn;

  try {
    sourceConn = await mongoose.createConnection(oldUri).asPromise();
    targetConn = await mongoose.createConnection(newUri).asPromise();

    const sourceDbName = sourceConn.name || getDbNameFromUri(oldUri) || '<default>';
    const targetDbName = targetConn.name || getDbNameFromUri(newUri) || '<default>';

    console.log(`Source DB connected: ${sourceDbName}`);
    console.log(`Target DB connected: ${targetDbName}`);
    console.log(`Migration mode: ${dropTarget ? 'replace-target-data' : 'append-target-data'}`);
    console.log(`Batch size: ${batchSize}`);

    const collections = await sourceConn.db.listCollections({}, { nameOnly: true }).toArray();
    const collectionNames = collections
      .map((collection) => collection.name)
      .filter((name) => !name.startsWith('system.'));

    if (!collectionNames.length) {
      console.log('No user collections found in source database. Nothing to migrate.');
      return;
    }

    console.log(`Found ${collectionNames.length} collection(s) to migrate.`);

    const report = [];
    for (const name of collectionNames) {
      const result = await migrateCollection({
        sourceDb: sourceConn.db,
        targetDb: targetConn.db,
        name,
        batchSize,
        dropTarget,
      });
      report.push(result);
      console.log(`[OK] ${name}: ${result.sourceCount} -> ${result.targetCount}`);
    }

    console.log('Migration completed successfully.');
    console.table(report);
  } finally {
    await closeConnections(sourceConn, targetConn);
  }
};

main().catch((error) => {
  console.error('Migration failed:', error.message);
  process.exit(1);
});
