import { performance } from "node:perf_hooks";

const targetUrl = process.env.STRESS_TEST_URL ?? "http://127.0.0.1:8787/";
const totalRequests = Number.parseInt(process.env.STRESS_TEST_REQUESTS ?? "500", 10);
const concurrency = Number.parseInt(process.env.STRESS_TEST_CONCURRENCY ?? "50", 10);
const method = (process.env.STRESS_TEST_METHOD ?? "GET").toUpperCase();
const body =
  method === "POST"
    ? JSON.stringify({
        query: "{ __typename }",
      })
    : undefined;

const headers =
  method === "POST"
    ? {
        "content-type": "application/json",
      }
    : undefined;

let completed = 0;
let successCount = 0;
let failureCount = 0;
let activeCount = 0;

const latencies = [];
const statusCounts = new Map();
const errors = new Map();

function percentile(values, p) {
  if (values.length === 0) {
    return 0;
  }

  const index = Math.min(
    values.length - 1,
    Math.max(0, Math.ceil((p / 100) * values.length) - 1),
  );
  return values[index];
}

async function runOneRequest() {
  activeCount += 1;
  const startedAt = performance.now();

  try {
    const response = await fetch(targetUrl, {
      method,
      headers,
      body,
    });
    const elapsedMs = performance.now() - startedAt;

    latencies.push(elapsedMs);
    statusCounts.set(response.status, (statusCounts.get(response.status) ?? 0) + 1);

    if (response.ok) {
      successCount += 1;
    } else {
      failureCount += 1;
      errors.set(
        `HTTP ${response.status}`,
        (errors.get(`HTTP ${response.status}`) ?? 0) + 1,
      );
    }

    await response.text();
  } catch (error) {
    const elapsedMs = performance.now() - startedAt;
    latencies.push(elapsedMs);
    failureCount += 1;

    const key = error instanceof Error ? error.message : "Unknown fetch error";
    errors.set(key, (errors.get(key) ?? 0) + 1);
  } finally {
    completed += 1;
    activeCount -= 1;
  }
}

async function main() {
  const suiteStartedAt = performance.now();
  let launched = 0;

  await new Promise((resolve) => {
    const pump = () => {
      while (activeCount < concurrency && launched < totalRequests) {
        launched += 1;
        void runOneRequest().finally(() => {
          if (completed >= totalRequests) {
            resolve(undefined);
            return;
          }

          pump();
        });
      }
    };

    pump();
  });

  const totalDurationMs = performance.now() - suiteStartedAt;
  latencies.sort((left, right) => left - right);

  const results = {
    targetUrl,
    method,
    totalRequests,
    concurrency,
    successCount,
    failureCount,
    successRate: `${((successCount / totalRequests) * 100).toFixed(2)}%`,
    totalDurationMs: Number(totalDurationMs.toFixed(2)),
    requestsPerSecond: Number(((totalRequests / totalDurationMs) * 1000).toFixed(2)),
    latencyMs: {
      min: Number((latencies[0] ?? 0).toFixed(2)),
      avg: Number(
        (
          latencies.reduce((sum, value) => sum + value, 0) /
          Math.max(latencies.length, 1)
        ).toFixed(2),
      ),
      p50: Number(percentile(latencies, 50).toFixed(2)),
      p95: Number(percentile(latencies, 95).toFixed(2)),
      p99: Number(percentile(latencies, 99).toFixed(2)),
      max: Number((latencies[latencies.length - 1] ?? 0).toFixed(2)),
    },
    statuses: Object.fromEntries([...statusCounts.entries()].sort((a, b) => a[0] - b[0])),
    errors: Object.fromEntries(errors.entries()),
  };

  console.log(JSON.stringify(results, null, 2));
}

await main();
