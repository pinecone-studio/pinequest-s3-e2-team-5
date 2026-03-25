"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { getCloudflareGraphqlUrl } from "@/lib/cloudflare-sync";

type TeacherRequest = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  school: string;
  subject: string;
  status: string;
};

type GraphQLError = {
  message?: string;
};

type TeacherRequestsResponse = {
  teacherRequestsForMySchool?: TeacherRequest[];
};

type SchoolTeacherApprovalsProps = {
  schoolName: string;
};

const teacherRequestsQuery = `
  query TeacherRequestsForMySchool($status: String, $schoolName: String) {
    teacherRequestsForMySchool(status: $status, schoolName: $schoolName) {
      id
      fullName
      email
      phone
      school
      subject
      status
    }
  }
`;

const approveTeacherRequestMutation = `
  mutation ApproveTeacherRequest($input: approveTeacherRequestInput!) {
    approveTeacherRequest(input: $input) {
      id
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

export function SchoolTeacherApprovals({ schoolName }: SchoolTeacherApprovalsProps) {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const [requests, setRequests] = useState<TeacherRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [approvingId, setApprovingId] = useState("");
  const normalizedSchoolName = schoolName.trim();

  const loadPendingRequests = async () => {
    const apiUrl = getCloudflareGraphqlUrl();
    if (!apiUrl) {
      setStatus("Cloudflare GraphQL URL not configured.");
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setStatus("");

      if (!normalizedSchoolName) {
        setRequests([]);
        setStatus("School name not found in profile yet. Please wait and refresh.");
        return;
      }

      const token = await getToken();
      if (!token) {
        throw new Error("Missing Clerk session token.");
      }

      const data = await fetchGraphql<TeacherRequestsResponse>({
        apiUrl,
        token,
        query: teacherRequestsQuery,
        variables: {
          status: "pending",
          schoolName: normalizedSchoolName,
        },
      });

      setRequests(data.teacherRequestsForMySchool ?? []);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to load requests.";
      setStatus(
        message === "Failed to fetch"
          ? "Cloudflare API reachable биш байна. Backend dev server ажиллаж байгаа эсэхээ шалгана уу."
          : message,
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isLoaded || !isSignedIn) {
      return;
    }

    void loadPendingRequests();
  }, [isLoaded, isSignedIn]);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) {
      return;
    }

    void loadPendingRequests();
  }, [normalizedSchoolName]);

  const handleApprove = async (teacherUserId: string) => {
    const apiUrl = getCloudflareGraphqlUrl();
    if (!apiUrl) {
      setStatus("Cloudflare GraphQL URL not configured.");
      return;
    }

    try {
      setApprovingId(teacherUserId);
      setStatus("");
      const token = await getToken();
      if (!token) {
        throw new Error("Missing Clerk session token.");
      }

      await fetchGraphql({
        apiUrl,
        token,
        query: approveTeacherRequestMutation,
        variables: {
          input: {
            teacherUserId,
            schoolName: normalizedSchoolName || undefined,
          },
        },
      });

      setRequests((prev) => prev.filter((request) => request.id !== teacherUserId));
      setStatus("Teacher request approved.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to approve request.";
      setStatus(
        message === "Failed to fetch"
          ? "Cloudflare API reachable биш байна. Backend dev server ажиллаж байгаа эсэхээ шалгана уу."
          : message,
      );
    } finally {
      setApprovingId("");
    }
  };

  return (
    <section className="rounded-3xl border border-border/70 bg-card/90 p-6 shadow-sm backdrop-blur">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">
            Pending Teacher Requests
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Approve teachers who requested to join your school.
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            void loadPendingRequests();
          }}
          disabled={isLoading}
        >
          {isLoading ? "Refreshing..." : "Refresh"}
        </Button>
      </div>

      {status ? (
        <p className="mt-4 rounded-xl border border-border bg-muted/60 px-4 py-3 text-sm text-muted-foreground">
          {status}
        </p>
      ) : null}

      {isLoading ? (
        <p className="mt-5 text-sm text-muted-foreground">Loading requests...</p>
      ) : requests.length === 0 ? (
        <p className="mt-5 text-sm text-muted-foreground">
          No pending teacher requests.
        </p>
      ) : (
        <div className="mt-5 space-y-3">
          {requests.map((request) => (
            <article
              key={request.id}
              className="rounded-2xl border border-border/70 bg-background px-4 py-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {request.fullName}
                  </p>
                  <p className="text-sm text-muted-foreground">{request.email}</p>
                  <p className="text-sm text-muted-foreground">
                    {request.subject} • {request.phone || "No phone"}
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => {
                    void handleApprove(request.id);
                  }}
                  disabled={approvingId === request.id}
                >
                  {approvingId === request.id ? "Approving..." : "Approve"}
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
