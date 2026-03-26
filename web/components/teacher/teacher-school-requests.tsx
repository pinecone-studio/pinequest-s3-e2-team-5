"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { cloudflareGraphqlRequest } from "@/lib/cloudflare-graphql-client";


type ClassroomItem = {
  id: string;
  className: string;
  classCode: string;
  createdAt: number;
};

const teacherPortalQuery = `
  query TeacherPortalData {
    myClassrooms {
      id
      className
      classCode
      createdAt
    }
  }
`;



const createClassroomMutation = `
  mutation CreateClassroom($input: createClassroomInput!) {
    createClassroom(input: $input) {
      id
      className
      classCode
      createdAt
    }
  }
`;


export function TeacherSchoolRequests() {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const [classrooms, setClassrooms] = useState<ClassroomItem[]>([]);
  const [statusMessage, setStatusMessage] = useState("");
  const [creatingClassroom, setCreatingClassroom] = useState(false);
  const [selectedSchoolId, setSelectedSchoolId] = useState("");
  const [className, setClassName] = useState("");

  const loadPortalData = async () => {
    const token = await getToken();
    if (!token) {
      throw new Error("Missing Clerk session token.");
    }

    const data = await cloudflareGraphqlRequest<{
      myClassrooms: ClassroomItem[];
    }>({
      token,
      query: teacherPortalQuery,
    });

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


  const handleCreateClassroom = async () => {
    try {
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
        <h2 className="text-xl font-semibold text-[#111111]">Анги нээх</h2>
        <p className="mt-2 text-sm text-[#6B7280]">
          Зөвшөөрөгдсөн сургууль дээрээ анги нээгээд class code-оо сурагчдад өгнө.
        </p>


        <div className="mt-4 grid gap-3 md:grid-cols-[220px_1fr_auto]">
          <select
            className="h-11 rounded-xl border border-[#E7E8F0] bg-white px-3 text-sm"
            value={selectedSchoolId}
            onChange={(event) => setSelectedSchoolId(event.target.value)}
          >
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

        {classrooms.length > 0 ? (
          <div className="mt-5 space-y-2">
            {classrooms.map((classroom) => (
              <div
                key={classroom.id}
                className="rounded-xl border border-[#E7E8F0] bg-[#FAFAFF] px-4 py-3 text-sm"
              >
                <p className="font-medium text-[#111111]">
                  · {classroom.className}
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
