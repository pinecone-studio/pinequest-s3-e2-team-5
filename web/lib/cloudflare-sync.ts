type SyncStudentInput = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  inviteCode: string;
};

type SyncTeacherInput = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
};


type SyncRole = "student" | "teacher";

type GraphQLError = {
  message?: string;
};

type SyncResponse = {
  errors?: GraphQLError[];
  data?: {
    upsertStudent?: {
      id: string;
    } | null;
    upsertTeacher?: {
      id: string;
    } | null;
  };
};

const upsertStudentMutation = `
  mutation SyncStudentProfile($input: upsertStudentInput!) {
    upsertStudent(input: $input) {
      id
    }
  }
`;

const upsertTeacherMutation = `
  mutation SyncTeacherProfile($input: upsertTeacherInput!) {
    upsertTeacher(input: $input) {
      id
    }
  }
`;

export function getCloudflareGraphqlUrl() {
  const configuredUrl =
    process.env.NEXT_PUBLIC_GRAPHQL_URL ||
    process.env.NEXT_PUBLIC_CLOUDFLARE_GRAPHQL_URL ||
    null;

  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    if (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "::1"
    ) {
      return configuredUrl || "http://127.0.0.1:8787/graphql";
    }

    // In production on Cloudflare, prefer the current origin so the frontend
    // can talk to a co-hosted/proxied GraphQL route without a localhost-only env.
    return configuredUrl || `${window.location.origin}/graphql`;
  }

  return configuredUrl;
}

export async function syncRoleProfileToCloudflare({
  token,
  apiUrl,
  role,
  input,
}: {
  token: string;
  apiUrl: string;
  role: SyncRole;
  input: SyncStudentInput | SyncTeacherInput;
}) {
  const query =
    role === "teacher"
      ? upsertTeacherMutation
      : upsertStudentMutation;
  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      query,
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

  const recordId =
    role === "teacher"
      ? payload.data?.upsertTeacher?.id
      : payload.data?.upsertStudent?.id;

  if (!recordId) {
    throw new Error("Cloudflare sync did not return a profile record.");
  }
}
