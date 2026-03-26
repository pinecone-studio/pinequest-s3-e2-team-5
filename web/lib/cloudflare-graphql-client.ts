import { getCloudflareGraphqlUrl } from "./cloudflare-sync";

type GraphQLError = {
  message?: string;
};

type GraphQLResponse<TData> = {
  data?: TData;
  errors?: GraphQLError[];
};

export async function cloudflareGraphqlRequest<TData>({
  token,
  query,
  variables,
}: {
  token: string;
  query: string;
  variables?: Record<string, unknown>;
}) {
  const apiUrl = getCloudflareGraphqlUrl();
  if (!apiUrl) {
    throw new Error("Cloudflare sync URL missing.");
  }

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      query,
      variables,
    }),
  });

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  const payload = (await response.json()) as GraphQLResponse<TData>;
  const errorMessage = payload.errors?.find((error) => error.message)?.message;
  if (errorMessage) {
    throw new Error(errorMessage);
  }

  if (!payload.data) {
    throw new Error("No data returned from Cloudflare API.");
  }

  return payload.data;
}
