import { env } from "@/lib/env";

type SyncResponse = {
  errors?: { message?: string }[];
  data?: {
    upsertStudent?: {
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

export async function syncStudentProfileToCloudflare({
  token,
  input,
}: {
  token: string;
  input: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    inviteCode: string;
  };
}) {
  const response = await fetch(env.graphqlUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      query: upsertStudentMutation,
      variables: {
        input,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Sync failed with status ${response.status}`);
  }

  const payload = (await response.json()) as SyncResponse;
  const errorMessage = payload.errors?.find((entry) => entry.message)?.message;

  if (errorMessage) {
    throw new Error(errorMessage);
  }

  if (!payload.data?.upsertStudent?.id) {
    throw new Error("Student profile sync хариу буцаасангүй.");
  }
}
