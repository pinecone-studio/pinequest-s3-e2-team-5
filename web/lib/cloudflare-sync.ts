type SyncStudentInput = {
  fullName: string;
  email: string;
  phone: string;
  inviteCode: string;
};

type SyncTeacherInput = {
  fullName: string;
  email: string;
  phone: string;
  school: string;
  subject: string;
};

type SyncSchoolInput = {
  schoolName: string;
  email: string;
  managerName: string;
  address: string;
  aimag: string;
};

type SyncRole = "school" | "student" | "teacher";

type GraphQLError = {
  message?: string;
};

type SyncResponse = {
  errors?: GraphQLError[];
  data?: {
    upsertSchoolProfile?: {
      id: string;
    } | null;
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

const upsertSchoolMutation = `
  mutation SyncSchoolProfile($input: upsertSchoolInput!) {
    upsertSchoolProfile(input: $input) {
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
  const configuredUrl = process.env.NEXT_PUBLIC_CLOUDFLARE_GRAPHQL_URL?.trim();

  if (configuredUrl) {
    return configuredUrl;
  }

  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    if (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "::1"
    ) {
      return "http://127.0.0.1:8787/graphql";
    }
  }

  return null;
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
  input: SyncSchoolInput | SyncStudentInput | SyncTeacherInput;
}) {
  const query =
    role === "school"
      ? upsertSchoolMutation
      : role === "teacher"
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
    role === "school"
      ? payload.data?.upsertSchoolProfile?.id
      : role === "teacher"
        ? payload.data?.upsertTeacher?.id
        : payload.data?.upsertStudent?.id;

  if (!recordId) {
    throw new Error("Cloudflare sync did not return a profile record.");
  }
}
