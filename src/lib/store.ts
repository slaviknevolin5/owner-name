import { Redis } from "@upstash/redis";
import { promises as fs } from "fs";
import path from "path";
import { getCandidates } from "./candidates";

export type VoteRecord = {
  candidateId: string;
  votedAt: string;
};

export type VoteStoreData = {
  devices: Record<string, VoteRecord>;
  counts: Record<string, number>;
};

const DATA_DIR = path.join(process.cwd(), ".data");
const DATA_FILE = path.join(DATA_DIR, "votes.json");

function emptyStore(): VoteStoreData {
  const counts: Record<string, number> = {};
  for (const c of getCandidates()) {
    counts[c.id] = 0;
  }
  return { devices: {}, counts };
}

function hasRedis(): boolean {
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN,
  );
}

function getRedis(): Redis {
  return Redis.fromEnv();
}

async function readFileStore(): Promise<VoteStoreData> {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw) as VoteStoreData;
    const base = emptyStore();
    return {
      devices: parsed.devices ?? {},
      counts: { ...base.counts, ...(parsed.counts ?? {}) },
    };
  } catch {
    return emptyStore();
  }
}

async function writeFileStore(data: VoteStoreData): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), "utf8");
}

const REDIS_DEVICES = "olympiad:devices";
const REDIS_COUNTS = "olympiad:counts";

async function ensureRedisCounts(redis: Redis): Promise<void> {
  const existing = await redis.hgetall<Record<string, string>>(REDIS_COUNTS);
  if (existing && Object.keys(existing).length > 0) return;
  const init: Record<string, number> = {};
  for (const c of getCandidates()) {
    init[c.id] = 0;
  }
  if (Object.keys(init).length > 0) {
    await redis.hset(REDIS_COUNTS, init);
  }
}

export async function getDeviceVote(
  deviceId: string,
): Promise<VoteRecord | null> {
  if (hasRedis()) {
    const redis = getRedis();
    const record = await redis.hget<VoteRecord>(REDIS_DEVICES, deviceId);
    return record ?? null;
  }
  const store = await readFileStore();
  return store.devices[deviceId] ?? null;
}

export async function getResults(): Promise<Record<string, number>> {
  if (hasRedis()) {
    const redis = getRedis();
    await ensureRedisCounts(redis);
    const counts = await redis.hgetall<Record<string, string>>(REDIS_COUNTS);
    const result: Record<string, number> = {};
    for (const c of getCandidates()) {
      result[c.id] = Number(counts?.[c.id] ?? 0);
    }
    return result;
  }
  const store = await readFileStore();
  return store.counts;
}

export type CastVoteResult =
  | { ok: true; candidateId: string; counts: Record<string, number> }
  | {
      ok: false;
      reason: "already_voted" | "invalid_candidate";
      candidateId?: string;
      counts: Record<string, number>;
    };

export async function castVote(
  deviceId: string,
  candidateId: string,
): Promise<CastVoteResult> {
  const candidate = getCandidates().find((c) => c.id === candidateId);
  if (!candidate) {
    return {
      ok: false,
      reason: "invalid_candidate",
      counts: await getResults(),
    };
  }

  if (hasRedis()) {
    const redis = getRedis();
    await ensureRedisCounts(redis);

    const existing = await redis.hget<VoteRecord>(REDIS_DEVICES, deviceId);
    if (existing) {
      return {
        ok: false,
        reason: "already_voted",
        candidateId: existing.candidateId,
        counts: await getResults(),
      };
    }

    const record: VoteRecord = {
      candidateId,
      votedAt: new Date().toISOString(),
    };

    // hsetnx returns 1 if field was set, 0 if it already existed
    const set = await redis.hsetnx(REDIS_DEVICES, deviceId, record);
    if (!set) {
      const again = await redis.hget<VoteRecord>(REDIS_DEVICES, deviceId);
      return {
        ok: false,
        reason: "already_voted",
        candidateId: again?.candidateId,
        counts: await getResults(),
      };
    }

    await redis.hincrby(REDIS_COUNTS, candidateId, 1);
    return { ok: true, candidateId, counts: await getResults() };
  }

  // File store with simple lock via sequential read-modify-write
  const store = await readFileStore();
  if (store.devices[deviceId]) {
    return {
      ok: false,
      reason: "already_voted",
      candidateId: store.devices[deviceId].candidateId,
      counts: store.counts,
    };
  }

  store.devices[deviceId] = {
    candidateId,
    votedAt: new Date().toISOString(),
  };
  store.counts[candidateId] = (store.counts[candidateId] ?? 0) + 1;
  await writeFileStore(store);

  return { ok: true, candidateId, counts: store.counts };
}

export function storageBackend(): "redis" | "file" {
  return hasRedis() ? "redis" : "file";
}
