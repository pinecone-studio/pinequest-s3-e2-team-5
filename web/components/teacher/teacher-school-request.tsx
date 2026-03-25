"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { getCloudflareGraphqlUrl } from "@/lib/cloudflare-sync";

type SchoolItem = {
  id: string;
  schoolName: string;
  aimag: string;
  managerName: string;
};

const fallbackSchools: SchoolItem[] = [
  {
    id: "mock_school_1",
    schoolName: "Ulaanbaatar Laboratory School",
    aimag: "Ulaanbaatar",
    managerName: "B.Bat-Erdene",
  },
  {
    id: "mock_school_2",
    schoolName: "Darkhan Future High School",
    aimag: "Darkhan-Uul",
    managerName: "S.Narantuya",
  },
  {
    id: "mock_school_3",
    schoolName: "Erdenet Science School",
    aimag: "Orkhon",
    managerName: "T.Ganbold",
  },
  {
    id: "mock_school_4",
    schoolName: "Khuvsgul Education Complex",
    aimag: "Khuvsgul",
    managerName: "M.Oyunbileg",
  },
  {
    id: "mock_school_5",
    schoolName: "Dornod New Era School",
    aimag: "Dornod",
    managerName: "A.Enkhjin",
  },
];

type TeacherSchoolRequestProps = {
  fullName: string;
  email: string;
  phone: string;
  subject: string;
  initialSchool: string;
};

type GraphQLError = {
  message?: string;
};

type SchoolsQueryResponse = {
  schools?: SchoolItem[];
};

type RequestTeacherResponse = {
  requestTeacherAccess?: {
    id: string;
    status: string;
    school: string;
  } | null;
};

const schoolsQuery = `
  query Schools {
    schools {
      id
      schoolName
      aimag
      managerName
    }
  }
`;

const requestTeacherAccessMutation = `
  mutation RequestTeacherAccess($input: requestTeacherAccessInput!) {
    requestTeacherAccess(input: $input) {
      id
      status
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

export function TeacherSchoolRequest({
  fullName,
  email,
  phone,
  subject,
  initialSchool,
}: TeacherSchoolRequestProps) {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const [schools, setSchools] = useState<SchoolItem[]>(fallbackSchools);
  const [isLoadingSchools, setIsLoadingSchools] = useState(true);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [selectedSchool, setSelectedSchool] = useState(initialSchool.trim());
  const [phoneValue, setPhoneValue] = useState(phone);
  const [subjectValue, setSubjectValue] = useState(subject);
  const [fullNameValue, setFullNameValue] = useState(fullName);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) {
      return;
    }

    const apiUrl = getCloudflareGraphqlUrl();
    if (!apiUrl) {
      setStatus("Cloudflare GraphQL URL not configured.");
      setIsLoadingSchools(false);
      return;
    }

    void (async () => {
      try {
        setStatus("");
        setIsLoadingSchools(true);
        const token = await getToken();

        if (!token) {
          throw new Error("Missing Clerk session token.");
        }

        const data = await fetchGraphql<SchoolsQueryResponse>({
          apiUrl,
          token,
          query: schoolsQuery,
        });

        const schoolList = data.schools ?? [];
        const seenNames = new Set<string>();
        const mergedSchools = [...schoolList, ...fallbackSchools].filter((item) => {
          const key = item.schoolName.trim().toLowerCase();
          if (seenNames.has(key)) {
            return false;
          }
          seenNames.add(key);
          return true;
        });
        setSchools(mergedSchools);
        setSelectedSchool((current) => {
          const normalizedCurrent = current.trim().toLowerCase();
          const hasCurrent =
            normalizedCurrent.length > 0 &&
            mergedSchools.some(
              (item) => item.schoolName.trim().toLowerCase() === normalizedCurrent,
            );

          if (hasCurrent) {
            return current;
          }

          return mergedSchools[0]?.schoolName ?? "";
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to load schools.";
        setStatus(`${message} Showing mock schools.`);
        setSchools(fallbackSchools);
        setSelectedSchool((current) => current || fallbackSchools[0]?.schoolName || "");
      } finally {
        setIsLoadingSchools(false);
      }
    })();
  }, [getToken, isLoaded, isSignedIn]);

  const filteredSchools = useMemo(() => {
    const key = search.trim().toLowerCase();
    if (!key) {
      return schools;
    }

    return schools.filter((item) => {
      return (
        item.schoolName.toLowerCase().includes(key) ||
        item.aimag.toLowerCase().includes(key)
      );
    });
  }, [schools, search]);

  const handleSubmit = async () => {
    const apiUrl = getCloudflareGraphqlUrl();
    if (!apiUrl) {
      setStatus("Cloudflare GraphQL URL not configured.");
      return;
    }

    const normalizedSchool = selectedSchool.trim();
    const normalizedPhone = phoneValue.trim();
    const normalizedSubject = subjectValue.trim();
    const normalizedFullName = fullNameValue.trim();

    if (!normalizedSchool) {
      setStatus("Сургууль сонгоно уу.");
      return;
    }

    if (!normalizedPhone) {
      setStatus("Утасны дугаар оруулна уу.");
      return;
    }

    if (!normalizedSubject) {
      setStatus("Хичээл оруулна уу.");
      return;
    }

    if (!normalizedFullName) {
      setStatus("Овог нэр оруулна уу.");
      return;
    }

    try {
      setIsSubmitting(true);
      setStatus("");
      const token = await getToken();

      if (!token) {
        throw new Error("Missing Clerk session token.");
      }

      const data = await fetchGraphql<RequestTeacherResponse>({
        apiUrl,
        token,
        query: requestTeacherAccessMutation,
        variables: {
          input: {
            fullName: normalizedFullName,
            email,
            phone: normalizedPhone,
            school: normalizedSchool,
            subject: normalizedSubject,
          },
        },
      });

      const statusValue = data.requestTeacherAccess?.status;
      if (statusValue === "approved") {
        setStatus(`Та ${normalizedSchool} сургуульд approve хийгдсэн байна.`);
      } else {
        setStatus(`Хүсэлт амжилттай илгээгдлээ. (${normalizedSchool})`);
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Request failed.";
      setStatus(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="mx-auto w-full max-w-4xl">
      <div className="rounded-3xl border border-[#E7E8F0] bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-2xl font-semibold text-[#111111]">
          Teacher School Request
        </h1>
        <p className="mt-2 text-sm text-[#6D6A76]">
          Сургуулиа жагсаалтаас сонгоод request илгээнэ.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#111111]">Full name</label>
            <input
              className="h-11 w-full rounded-xl border border-[#E0E3EE] px-4 text-sm outline-none focus:border-[#8B6FF7]"
              value={fullNameValue}
              onChange={(event) => setFullNameValue(event.target.value)}
              placeholder="Your full name"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#111111]">Email</label>
            <input
              className="h-11 w-full rounded-xl border border-[#E0E3EE] bg-[#F8F9FC] px-4 text-sm text-[#6D6A76]"
              value={email}
              readOnly
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#111111]">Phone</label>
            <input
              className="h-11 w-full rounded-xl border border-[#E0E3EE] px-4 text-sm outline-none focus:border-[#8B6FF7]"
              value={phoneValue}
              onChange={(event) => setPhoneValue(event.target.value)}
              placeholder="99112233"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#111111]">Subject</label>
            <input
              className="h-11 w-full rounded-xl border border-[#E0E3EE] px-4 text-sm outline-none focus:border-[#8B6FF7]"
              value={subjectValue}
              onChange={(event) => setSubjectValue(event.target.value)}
              placeholder="Mathematics"
            />
          </div>
        </div>

        <div className="mt-6 space-y-3">
          <label className="text-sm font-medium text-[#111111]">
            Сургууль хайх
          </label>
          <input
            className="h-11 w-full rounded-xl border border-[#E0E3EE] px-4 text-sm outline-none focus:border-[#8B6FF7]"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Сургуулийн нэр эсвэл аймаг"
          />
          <select
            className="h-11 w-full rounded-xl border border-[#E0E3EE] bg-white px-4 text-sm outline-none focus:border-[#8B6FF7]"
            value={selectedSchool}
            onChange={(event) => setSelectedSchool(event.target.value)}
            disabled={isLoadingSchools}
          >
            <option value="">Сургууль сонгох</option>
            {filteredSchools.map((item) => (
              <option key={item.id} value={item.schoolName}>
                {item.schoolName} ({item.aimag})
              </option>
            ))}
          </select>
          <p className="text-xs text-[#6D6A76]">
            {isLoadingSchools
              ? "Сургуулийн жагсаалт ачаалж байна..."
              : `${filteredSchools.length} сургууль олдлоо.`}
          </p>
        </div>

        {status ? (
          <p className="mt-5 rounded-xl border border-[#E8E2FF] bg-[#F7F4FF] px-4 py-3 text-sm text-[#4C3C8A]">
            {status}
          </p>
        ) : null}

        <Button
          className="mt-6 h-11 rounded-xl bg-[#8B6FF7] px-6 text-white hover:bg-[#7A61DC]"
          disabled={isLoadingSchools || isSubmitting}
          onClick={handleSubmit}
        >
          {isSubmitting ? "Илгээж байна..." : "Request илгээх"}
        </Button>
      </div>
    </section>
  );
}
