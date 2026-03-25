"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { getCloudflareGraphqlUrl } from "@/lib/cloudflare-sync";

type TeacherRequest = {
  id: string;
  status: string;
  school: string;
  subject: string;
};

type Classroom = {
  id: string;
  className: string;
  classCode: string;
  school: string;
};

type GraphQLError = {
  message?: string;
};

type TeacherWorkspaceResponse = {
  myTeacherRequest?: TeacherRequest | null;
  myClassrooms?: Classroom[];
};

type CreateClassroomResponse = {
  createClassroom?: Classroom | null;
};

const teacherWorkspaceQuery = `
  query TeacherWorkspace {
    myTeacherRequest {
      id
      status
      school
      subject
    }
    myClassrooms {
      id
      className
      classCode
      school
    }
  }
`;

const createClassroomMutation = `
  mutation CreateClassroom($input: createClassroomInput!) {
    createClassroom(input: $input) {
      id
      className
      classCode
      school
    }
  }
`;

async function fetchGraphql<T>({
  apiUrl,
  token,
  query,
  variables,
}: {
  apiUrl: string;
  token: string;
  query: string;
  variables?: Record<string, unknown>;
}) {
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

  const payload = (await response.json()) as {
    data?: T;
    errors?: GraphQLError[];
  };

  const message = payload.errors?.find((error) => error.message)?.message;
  if (message) {
    throw new Error(message);
  }

  if (!payload.data) {
    throw new Error("GraphQL response is missing data.");
  }

  return payload.data;
}

export function TeacherClassroomManager() {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const [request, setRequest] = useState<TeacherRequest | null>(null);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [className, setClassName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [status, setStatus] = useState("");

  const loadWorkspace = async () => {
    const apiUrl = getCloudflareGraphqlUrl();
    if (!apiUrl) {
      setStatus("Cloudflare GraphQL URL not configured.");
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setStatus("");
      const token = await getToken();
      if (!token) {
        throw new Error("Missing Clerk session token.");
      }

      const data = await fetchGraphql<TeacherWorkspaceResponse>({
        apiUrl,
        token,
        query: teacherWorkspaceQuery,
      });

      setRequest(data.myTeacherRequest ?? null);
      setClassrooms(data.myClassrooms ?? []);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to load teacher workspace.";
      setStatus(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isLoaded || !isSignedIn) {
      return;
    }

    void loadWorkspace();
  }, [isLoaded, isSignedIn]);

  const handleCreateClassroom = async () => {
    const apiUrl = getCloudflareGraphqlUrl();
    if (!apiUrl) {
      setStatus("Cloudflare GraphQL URL not configured.");
      return;
    }

    const normalizedClassName = className.trim();
    if (!normalizedClassName) {
      setStatus("Class name is required.");
      return;
    }

    try {
      setIsCreating(true);
      setStatus("");
      const token = await getToken();
      if (!token) {
        throw new Error("Missing Clerk session token.");
      }

      const data = await fetchGraphql<CreateClassroomResponse>({
        apiUrl,
        token,
        query: createClassroomMutation,
        variables: {
          input: {
            className: normalizedClassName,
          },
        },
      });

      const created = data.createClassroom;
      if (!created) {
        throw new Error("Classroom was not created.");
      }

      setClassrooms((prev) => [created, ...prev]);
      setClassName("");
      setStatus(`Class created. Code: ${created.classCode}`);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to create classroom.";
      setStatus(message);
    } finally {
      setIsCreating(false);
    }
  };

  if (isLoading) {
    return (
      <section className="rounded-3xl border border-[#E7E8F0] bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm text-[#6D6A76]">Loading teacher classroom data...</p>
      </section>
    );
  }

  if (!request || request.status !== "approved") {
    return (
      <section className="rounded-3xl border border-[#E7E8F0] bg-white p-6 shadow-sm sm:p-8">
        <h2 className="text-xl font-semibold text-[#111111]">Classroom Manager</h2>
        <p className="mt-2 text-sm text-[#6D6A76]">
          Your teacher request is not approved yet. Once approved, you can create class
          codes here.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-[#E7E8F0] bg-white p-6 shadow-sm sm:p-8">
      <h2 className="text-xl font-semibold text-[#111111]">Classroom Manager</h2>
      <p className="mt-2 text-sm text-[#6D6A76]">
        Create classes and share class codes with students.
      </p>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <input
          className="h-11 flex-1 rounded-xl border border-[#E0E3EE] px-4 text-sm outline-none focus:border-[#8B6FF7]"
          placeholder="Class name (e.g. 10A)"
          value={className}
          onChange={(event) => setClassName(event.target.value)}
        />
        <Button
          className="h-11 rounded-xl bg-[#8B6FF7] px-6 text-white hover:bg-[#7A61DC]"
          disabled={isCreating}
          onClick={() => {
            void handleCreateClassroom();
          }}
        >
          {isCreating ? "Creating..." : "Create class"}
        </Button>
      </div>

      {status ? (
        <p className="mt-4 rounded-xl border border-[#E8E2FF] bg-[#F7F4FF] px-4 py-3 text-sm text-[#4C3C8A]">
          {status}
        </p>
      ) : null}

      {classrooms.length === 0 ? (
        <p className="mt-5 text-sm text-[#6D6A76]">No classes yet.</p>
      ) : (
        <div className="mt-5 space-y-3">
          {classrooms.map((room) => (
            <article
              key={room.id}
              className="rounded-2xl border border-[#E7E8F0] bg-[#FCFCFE] px-4 py-4"
            >
              <p className="text-sm font-semibold text-[#111111]">{room.className}</p>
              <p className="mt-1 text-sm text-[#6D6A76]">Code: {room.classCode}</p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
