type GraphQLErrorLike = {
  message?: string;
};

type ApolloLikeError = {
  graphQLErrors?: GraphQLErrorLike[];
  networkError?: {
    message?: string;
  };
  cause?: {
    message?: string;
  };
  message?: string;
};

function localizeGraphqlMessage(message: string) {
  if (message === "Unauthorized") {
    return "Нэвтрэх эрх баталгаажаагүй байна. Хуудсаа refresh хийгээд дахин нэвтэрч оролдоно уу.";
  }

  if (message === "Exam not found.") {
    return "Шалгалт олдсонгүй.";
  }

  return message;
}

function getNetworkMessage(message: string) {
  const normalized = message.toLowerCase();

  if (
    normalized.includes("failed to fetch") ||
    normalized.includes("networkerror") ||
    normalized.includes("fetch failed")
  ) {
    return "GraphQL server-т холбогдож чадсангүй. Local дээр ажиллаж байвал `cold-king-fc65` worker-ээ асаасан эсэхээ шалгана уу.";
  }

  return message;
}

export function getApolloErrorMessage(error: unknown, fallback: string) {
  if (!error || typeof error !== "object") {
    return fallback;
  }

  const apolloError = error as ApolloLikeError;
  const graphQLErrorMessage = apolloError.graphQLErrors
    ?.map((item) => item.message?.trim())
    .find(Boolean);

  if (graphQLErrorMessage) {
    return localizeGraphqlMessage(graphQLErrorMessage);
  }

  if (apolloError.networkError?.message) {
    return getNetworkMessage(apolloError.networkError.message);
  }

  if (apolloError.cause?.message) {
    return getNetworkMessage(apolloError.cause.message);
  }

  if (apolloError.message) {
    if (apolloError.message.trim() === "Unexpected error.") {
      return "Сервер талд алдаа гарлаа. Дахин нэвтэрч refresh хийгээд оролдоно уу.";
    }

    return getNetworkMessage(localizeGraphqlMessage(apolloError.message));
  }

  return fallback;
}
