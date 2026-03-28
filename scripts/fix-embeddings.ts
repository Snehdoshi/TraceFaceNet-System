import { db, missingPersonsTable } from "@workspace/db";
import { isNotNull } from "drizzle-orm";

function hashString(str: string): number {
  let hash = 5381;
  for (let i = 0; i < Math.min(str.length, 4096); i++) {
    hash = (Math.imul((hash << 5) + hash, 1) + str.charCodeAt(i)) | 0;
  }
  return hash >>> 0;
}

function seededRng(seed: number): () => number {
  let s = seed;
  return () => {
    s = (Math.imul(1664525, s) + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

function deterministicEmbedding(source: string): string {
  const dims = 128;
  const rng = seededRng(hashString(source));
  const raw = Array.from({ length: dims }, () => rng() * 2 - 1);
  const norm = Math.sqrt(raw.reduce((s, v) => s + v * v, 0));
  return JSON.stringify(raw.map((v) => v / norm));
}

async function main() {
  const records = await db
    .select({ id: missingPersonsTable.id, photoUrl: missingPersonsTable.photoUrl })
    .from(missingPersonsTable)
    .where(isNotNull(missingPersonsTable.photoUrl));

  console.log(`Found ${records.length} records with photos`);

  for (const record of records) {
    if (!record.photoUrl) continue;
    const embedding = deterministicEmbedding(record.photoUrl);
    await db
      .update(missingPersonsTable)
      .set({ faceEmbedding: embedding })
      .where(
        (await import("drizzle-orm")).eq(missingPersonsTable.id, record.id)
      );
    console.log(`Updated record id=${record.id}`);
  }

  console.log("Done — all embeddings are now deterministic.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
