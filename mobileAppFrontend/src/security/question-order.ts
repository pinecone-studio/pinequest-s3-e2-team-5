import type { Question } from "@/data/types";

function buildSeedFromString(seedSource: string) {
  let hash = 2166136261;

  for (let index = 0; index < seedSource.length; index += 1) {
    hash ^= seedSource.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function createSeededRandom(seedSource: string) {
  let seed = buildSeedFromString(seedSource) || 1;

  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

export function shuffleQuestionsForUser(questions: Question[], userId: string, examId: string) {
  const random = createSeededRandom(`${userId}:${examId}`);
  const next = [...questions];

  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    const temporary = next[index];
    next[index] = next[swapIndex];
    next[swapIndex] = temporary;
  }

  return next;
}
