"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useMutation, useQuery } from "@apollo/client/react";
import { gql } from "@apollo/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";


type ClassroomItem = {
  id: string;
  className: string;
  classCode: string;
  createdAt: number;
};

type myClassroomData = {
  classroomsByTeacher: ClassroomItem[]
}

export const getMyClassrooms = gql`
  query{
    classroomsByTeacher{
      id
      className
      classCode
      createdAt
    }
  }
`



export const createClassroomMutation = gql`
  mutation CreateClassroom($input: createClassroomInput!) {
    createClassroom(input: $input) {
      id
      className
      classCode
      createdAt
    }
  }
`;

interface createClassroomData {
  createClassroom: {
    id: string
    className: string
    classCode: string
    createdAt: number
  }
}

export function TeacherSchoolRequests() {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const [classrooms, setClassrooms] = useState<ClassroomItem[]>([]);
  const [statusMessage, setStatusMessage] = useState("");
  const [creatingClassroom, setCreatingClassroom] = useState(false);
  const [className, setClassName] = useState("");

  const [showClassCode, setShowClassCode] = useState(false)

  const [createClassRoom, { data: createClassroomData,
    // loading: createClassroomLoading,
    //  error: createClassroomError 
  }] = useMutation<createClassroomData>(createClassroomMutation)

  const { data: myClassroomData,
    // loading: myClassroomLoading, 
    error: myClassroomError
  } = useQuery<myClassroomData>(getMyClassrooms)

  useEffect(() => {
    console.log(myClassroomData)
    console.log(myClassroomError)
  }, [myClassroomData, myClassroomError])

  const loadClassroomData = async () => {
    const token = await getToken()
    if (!token) {
      throw new Error("Missing clerk session token!")
    }

    setClassrooms(myClassroomData?.classroomsByTeacher ?? [])

  }


  useEffect(() => {
    if (!isLoaded || !isSignedIn) {
      return;
    }

    void (async () => {
      try {
        await loadClassroomData();
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

      const res = await createClassRoom({
        variables: {
          input: {
            className: normalizedClassName
          }
        }
      })

      console.log(res)

      if (res.error) {
        console.log(res.error)
        return

      }

      setShowClassCode(true)

      setClassName("");
      await loadClassroomData();
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
        {statusMessage}
        <div className="mt-4 grid gap-3 md:grid-cols-[220px_1fr_auto]">
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

        <Dialog open={showClassCode} onOpenChange={setShowClassCode}>
          <DialogContent className="sm:max-w-lg rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-lg font-semibold">
                Class Code
              </DialogTitle>

              <p className="font-semibold text-2xl">
                {createClassroomData?.createClassroom.classCode}
              </p>
            </DialogHeader>
          </DialogContent>
        </Dialog>


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
