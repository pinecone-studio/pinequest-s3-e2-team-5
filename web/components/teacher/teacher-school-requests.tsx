"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { cloudflareGraphqlRequest } from "@/lib/cloudflare-graphql-client";

type SchoolItem = {
  id: string;
  schoolName: string;
  aimag: string;
};

type TeacherRequestItem = {
  id: string;
  schoolId: string;
  schoolName: string;
  subject: string;
  status: string;
  createdAt: number;
};

type ClassroomItem = {
  id: string;
  schoolId: string;
  schoolName: string;
  className: string;
  classCode: string;
  createdAt: number;
};

const teacherPortalQuery = `
  query TeacherPortalData {
    schools {
      id
      schoolName
      aimag
    }
    myTeacherRequests {
      id
      schoolId
      schoolName
      subject
      status
      createdAt
    }
    myClassrooms {
      id
      schoolId
      schoolName
      className
      classCode
      createdAt
    }
  }
`;

const requestTeacherApprovalMutation = `
  mutation RequestTeacherApproval($input: requestTeacherApprovalInput!) {
    requestTeacherApproval(input: $input) {
      id
      schoolId
      schoolName
      subject
      status
      createdAt
    }
  }
`;

const createClassroomMutation = `
  mutation CreateClassroom($input: createClassroomInput!) {
    createClassroom(input: $input) {
      id
      schoolId
      schoolName
      className
      classCode
      createdAt
    }
  }
`;

function formatDate(timestamp: number) {
  if (!timestamp) {
    return "-";
  }

  return new Date(timestamp).toLocaleString();
}

export function TeacherSchoolRequests() {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const [schools, setSchools] = useState<SchoolItem[]>([]);
  const [requests, setRequests] = useState<TeacherRequestItem[]>([]);
  const [classrooms, setClassrooms] = useState<ClassroomItem[]>([]);
  const [statusMessage, setStatusMessage] = useState("");
  const [requestingSchoolId, setRequestingSchoolId] = useState<string | null>(null);
  const [creatingClassroom, setCreatingClassroom] = useState(false);
  const [selectedSchoolId, setSelectedSchoolId] = useState("");
  const [className, setClassName] = useState("");

  const loadPortalData = async () => {
    const token = await getToken();
    if (!token) {
      throw new Error("Missing Clerk session token.");
    }

    const data = await cloudflareGraphqlRequest<{
      schools: SchoolItem[];
      myTeacherRequests: TeacherRequestItem[];
      myClassrooms: ClassroomItem[];
    }>({
      token,
      query: teacherPortalQuery,
    });

    setSchools(data.schools ?? []);
    setRequests(data.myTeacherRequests ?? []);
    setClassrooms(data.myClassrooms ?? []);
  };

  useEffect(() => {
    if (!isLoaded || !isSignedIn) {
      return;
    }

    void (async () => {
      try {
        setStatusMessage("Loading schools...");
        await loadPortalData();
        setStatusMessage("");
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to load teacher portal.";
        setStatusMessage(message);
      }
    })();
  }, [getToken, isLoaded, isSignedIn]);

  const requestMap = useMemo(() => {
    const map = new Map<string, TeacherRequestItem>();
    requests.forEach((request) => {
      map.set(request.schoolId, request);
    });
    return map;
  }, [requests]);

  const approvedRequests = useMemo(
    () => requests.filter((request) => request.status === "APPROVED"),
    [requests],
  );

  useEffect(() => {
    if (selectedSchoolId) {
      return;
    }

    if (approvedRequests.length > 0) {
      setSelectedSchoolId(approvedRequests[0].schoolId);
    }
  }, [approvedRequests, selectedSchoolId]);

  const handleSendRequest = async (schoolId: string) => {
    try {
      setRequestingSchoolId(schoolId);
      setStatusMessage("");
      const token = await getToken();
      if (!token) {
        throw new Error("Missing Clerk session token.");
      }

      await cloudflareGraphqlRequest({
        token,
        query: requestTeacherApprovalMutation,
        variables: {
          input: {
            schoolId,
          },
        },
      });

      await loadPortalData();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to send request.";
      setStatusMessage(message);
    } finally {
      setRequestingSchoolId(null);
    }
  };

  const handleCreateClassroom = async () => {
    try {
      if (!selectedSchoolId) {
        throw new Error("Choose an approved school first.");
      }

      const normalizedClassName = className.trim().toUpperCase();
      if (!normalizedClassName) {
        throw new Error("Class name is required.");
      }

      setCreatingClassroom(true);
      setStatusMessage("");
      const token = await getToken();
      if (!token) {
        throw new Error("Missing Clerk session token.");
      }

      await cloudflareGraphqlRequest({
        token,
        query: createClassroomMutation,
        variables: {
          input: {
            schoolId: selectedSchoolId,
            className: normalizedClassName,
          },
        },
      });

      setClassName("");
      await loadPortalData();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to create classroom.";
      setStatusMessage(message);
    } finally {
      setCreatingClassroom(false);
    }
  };

  return (
    <section className="space-y-6">
      <article className="rounded-3xl border border-[#E7E8F0] bg-white p-6">
        <h1 className="text-2xl font-semibold text-[#111111]">Сургуульд хүсэлт илгээх</h1>
        <p className="mt-2 text-sm text-[#6B7280]">
          Өөрийн сургууль руу хүсэлт илгээж, зөвшөөрөгдсөний дараа анги нээнэ.
        </p>

        {statusMessage ? (
          <p className="mt-4 text-sm text-[#6B7280]">{statusMessage}</p>
        ) : null}

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {schools.map((school) => {
            const request = requestMap.get(school.id);
            const isRequested = Boolean(request);

            return (
              <div
                key={school.id}
                className="rounded-2xl border border-[#E7E8F0] bg-[#FAFAFF] p-4"
              >
                <p className="text-sm font-semibold text-[#111111]">{school.schoolName}</p>
                <p className="mt-1 text-xs text-[#6B7280]">{school.aimag}</p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs text-[#6B7280]">
                    {request ? `Status: ${request.status}` : "Not requested"}
                  </span>
                  <Button
                    size="sm"
                    onClick={() => handleSendRequest(school.id)}
                    disabled={isRequested || requestingSchoolId === school.id}
                  >
                    {requestingSchoolId === school.id ? "Sending..." : "Send request"}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </article>

      <article className="rounded-3xl border border-[#E7E8F0] bg-white p-6">
        <h2 className="text-xl font-semibold text-[#111111]">Миний хүсэлтүүд</h2>
        {requests.length === 0 ? (
          <p className="mt-3 text-sm text-[#6B7280]">Хүсэлт илгээгээгүй байна.</p>
        ) : (
          <div className="mt-4 space-y-2">
            {requests.map((request) => (
              <div
                key={request.id}
                className="rounded-xl border border-[#E7E8F0] px-4 py-3 text-sm"
              >
                <p className="font-medium text-[#111111]">{request.schoolName}</p>
                <p className="mt-1 text-[#6B7280]">
                  Subject: {request.subject} · Status: {request.status}
                </p>
                <p className="mt-1 text-xs text-[#9CA3AF]">
                  Sent at: {formatDate(request.createdAt)}
                </p>
              </div>
            ))}
          </div>
        )}
      </article>

      <article className="rounded-3xl border border-[#E7E8F0] bg-white p-6">
        <h2 className="text-xl font-semibold text-[#111111]">Анги нээх</h2>
        <p className="mt-2 text-sm text-[#6B7280]">
          Зөвшөөрөгдсөн сургууль дээрээ анги нээгээд class code-оо сурагчдад өгнө.
        </p>

        {approvedRequests.length === 0 ? (
          <p className="mt-4 text-sm text-[#6B7280]">
            Анги нээхийн тулд эхлээд сургууль дээрээ approved болох шаардлагатай.
          </p>
        ) : (
          <div className="mt-4 grid gap-3 md:grid-cols-[220px_1fr_auto]">
            <select
              className="h-11 rounded-xl border border-[#E7E8F0] bg-white px-3 text-sm"
              value={selectedSchoolId}
              onChange={(event) => setSelectedSchoolId(event.target.value)}
            >
              {approvedRequests.map((item) => (
                <option key={item.schoolId} value={item.schoolId}>
                  {item.schoolName}
                </option>
              ))}
            </select>
            <input
              className="h-11 rounded-xl border border-[#E7E8F0] bg-white px-3 text-sm"
              placeholder="Class name (ex: 10A)"
              value={className}
              onChange={(event) => setClassName(event.target.value)}
            />
            <Button onClick={handleCreateClassroom} disabled={creatingClassroom}>
              {creatingClassroom ? "Creating..." : "Create class"}
            </Button>
          </div>
        )}

        {classrooms.length > 0 ? (
          <div className="mt-5 space-y-2">
            {classrooms.map((classroom) => (
              <div
                key={classroom.id}
                className="rounded-xl border border-[#E7E8F0] bg-[#FAFAFF] px-4 py-3 text-sm"
              >
                <p className="font-medium text-[#111111]">
                  {classroom.schoolName} · {classroom.className}
                </p>
                <p className="mt-1 text-[#6B7280]">
                  Class code: <span className="font-semibold">{classroom.classCode}</span>
                </p>
              </div>
            ))}
          </div>
        ) : null}
      </article>
    </section>
  );
}
