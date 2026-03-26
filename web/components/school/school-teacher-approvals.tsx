"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cloudflareGraphqlRequest } from "@/lib/cloudflare-graphql-client";

type TeacherRequestItem = {
  id: string;
  teacherName: string;
  teacherEmail: string;
  teacherPhone: string;
  subject: string;
  status: string;
  createdAt: number;
};

const pendingRequestsQuery = `
  query PendingRequestsForMySchool {
    teacherRequestsForMySchool(status: "PENDING") {
      id
      teacherName
      teacherEmail
      teacherPhone
      subject
      status
      createdAt
    }
  }
`;

const approveTeacherRequestMutation = `
  mutation ApproveTeacherRequest($input: approveTeacherRequestInput!) {
    approveTeacherRequest(input: $input) {
      id
      status
      approvedAt
    }
  }
`;

function formatDate(timestamp: number) {
  if (!timestamp) {
    return "-";
  }

  return new Date(timestamp).toLocaleString();
}

export function SchoolTeacherApprovals() {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const [requests, setRequests] = useState<TeacherRequestItem[]>([]);
  const [statusMessage, setStatusMessage] = useState("");
  const [approvingId, setApprovingId] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) {
      return;
    }

    void (async () => {
      try {
        setStatusMessage("Loading pending requests...");
        const token = await getToken();
        if (!token) {
          throw new Error("Missing Clerk session token.");
        }

        const data = await cloudflareGraphqlRequest<{
          teacherRequestsForMySchool: TeacherRequestItem[];
        }>({
          token,
          query: pendingRequestsQuery,
        });

        setRequests(data.teacherRequestsForMySchool ?? []);
        setStatusMessage("");
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to load teacher requests.";
        setStatusMessage(message);
      }
    })();
  }, [getToken, isLoaded, isSignedIn]);

  const handleApprove = async (requestId: string) => {
    try {
      setApprovingId(requestId);
      const token = await getToken();
      if (!token) {
        throw new Error("Missing Clerk session token.");
      }

      await cloudflareGraphqlRequest({
        token,
        query: approveTeacherRequestMutation,
        variables: {
          input: {
            requestId,
          },
        },
      });

      setRequests((current) => current.filter((item) => item.id !== requestId));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to approve request.";
      setStatusMessage(message);
    } finally {
      setApprovingId(null);
    }
  };

  return (
    <section className="rounded-3xl border border-border/70 bg-card/90 p-6 shadow-sm backdrop-blur">
      <h2 className="text-xl font-semibold tracking-tight text-foreground">
        Teacher approval requests
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Teachers can create classes only after you approve them.
      </p>

      {statusMessage ? (
        <p className="mt-4 text-sm text-muted-foreground">{statusMessage}</p>
      ) : null}

      {requests.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">
          No pending teacher requests.
        </p>
      ) : (
        <div className="mt-5 space-y-3">
          {requests.map((request) => (
            <article
              key={request.id}
              className="rounded-2xl border border-border/80 bg-background p-4"
            >
              <p className="text-sm font-semibold text-foreground">
                {request.teacherName}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {request.teacherEmail}
              </p>
              <p className="text-sm text-muted-foreground">
                {request.teacherPhone || "No phone"}
              </p>
              <p className="mt-2 text-sm text-foreground">
                Subject: <span className="font-medium">{request.subject}</span>
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Requested at: {formatDate(request.createdAt)}
              </p>

              <Button
                size="sm"
                className="mt-3"
                onClick={() => handleApprove(request.id)}
                disabled={approvingId === request.id}
              >
                {approvingId === request.id ? "Approving..." : "Approve teacher"}
              </Button>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
