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

export type StorageBackend = "kv" | "redis" | "file";

const DATA_DIR = path.join(process.cwd(), ".data");
const DATA_FILE = path.join(DATA_DIR, "votes.json");

const REDIS_DEVICES = "olympiad:devices";
const REDIS_COUNTS = "olympiad:counts";
const KV_DEVICE_PREFIX = "device:";
const KV_COUNT_PREFIX = "count:";

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

type KvNamespace = {
  get(key: string, type?: "text"): Promise<string | null>;
  put(key: string, value: string): Promise<void>;
};

async function getVotesKv(): Promise<KvNamespace | null> {
  try {
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    const ctx = await getCloudflareContext({ async: true });
    const kv = (ctx.env as { OLYMPIAD_VOTES?: KvNamespace } | undefined)
      ?.OLYMPIAD_VOTES;
    return kv ?? null;
  } catch {
    return null;
  }
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

async function getKvResults(kv: KvNamespace): Promise<Record<string, number>> {
  const result: Record<string, number> = {};
  for (const c of getCandidates()) {
    const raw = await kv.get(`${KV_COUNT_PREFIX}${c.id}`);
    result[c.id] = Number(raw ?? 0);
  }
  return result;
}

export async function getDeviceVote(
  deviceId: string,
): Promise<VoteRecord | null> {
  const kv = await getVotesKv();
  if (kv) {
    const raw = await kv.get(`${KV_DEVICE_PREFIX}${deviceId}`);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as VoteRecord;
    } catch {
      return null;
    }
  }

  if (hasRedis()) {
    const redis = getRedis();
    const record = await redis.hget<VoteRecord>(REDIS_DEVICES, deviceId);
    return record ?? null;
  }

  const store = await readFileStore();
  return store.devices[deviceId] ?? null;
}

export async function getResults(): Promise<Record<string, number>> {
  const kv = await getVotesKv();
  if (kv) return getKvResults(kv);

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

  const kv = await getVotesKv();
  if (kv) {
    const existingRaw = await kv.get(`${KV_DEVICE_PREFIX}${deviceId}`);
    if (existingRaw) {
      let existingId: string | undefined;
      try {
        existingId = (JSON.parse(existingRaw) as VoteRecord).candidateId;
      } catch {
        existingId = undefined;
      }
      return {
        ok: false,
        reason: "already_voted",
        candidateId: existingId,
        counts: await getKvResults(kv),
      };
    }

    const record: VoteRecord = {
      candidateId,
      votedAt: new Date().toISOString(),
    };
    // Best-effort one-vote: check-then-set (KV has no native compare-and-swap).
    await kv.put(`${KV_DEVICE_PREFIX}${deviceId}`, JSON.stringify(record));
    const current = Number(
      (await kv.get(`${KV_COUNT_PREFIX}${candidateId}`)) ?? 0,
    );
    await kv.put(`${KV_COUNT_PREFIX}${candidateId}`, String(current + 1));
    return { ok: true, candidateId, counts: await getKvResults(kv) };
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

export async function storageBackend(): Promise<StorageBackend> {
  if (await getVotesKv()) return "kv";
  if (hasRedis()) return "redis";
  return "file";
}
