type SyncStudentInput = {
  fullName: string;
  email: string;
  phone: string;
};

type GraphQLError = {
  message?: string;
};

type SyncResponse = {
  errors?: GraphQLError[];
  data?: {
    upsertStudent?: {
      id: string;
    } | null;
  };
};

const syncStudentMutation = `
  mutation SyncStudent($input: upsertStudentInput!) {
    upsertStudent(input: $input) {
      id
    }
  }
`;

export function getCloudflareGraphqlUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_CLOUDFLARE_GRAPHQL_URL;

  if (configuredUrl) {
    return configuredUrl;
  }

  if (typeof window !== "undefined" && window.location.hostname === "localhost") {
    return "http://127.0.0.1:8787/graphql";
  }

  return null;
}

export async function syncStudentToCloudflare({
  token,
  apiUrl,
  input,
}: {
  token: string;
  apiUrl: string;
  input: SyncStudentInput;
}) {
  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      query: syncStudentMutation,
      variables: {
        input,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Sync failed with status ${response.status}`);
  }

  const payload = (await response.json()) as SyncResponse;
  const errorMessage = payload.errors?.find((error) => error.message)?.message;

  if (errorMessage) {
    throw new Error(errorMessage);
  }

  if (!payload.data?.upsertStudent?.id) {
    throw new Error("Cloudflare sync did not return a student record.");
  }
}
