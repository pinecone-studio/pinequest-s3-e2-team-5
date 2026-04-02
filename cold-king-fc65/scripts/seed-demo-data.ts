import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import dotenv from "dotenv";

dotenv.config({ path: join(process.cwd(), ".env") });

const DATABASE_NAME = "shalgalt_db";
const TEACHER_ID = "user_3BohHuZygYCwVhf10Uir6tsu8NQ";
const EXISTING_CLASSROOM_ID = "04b63621-0515-47de-92bf-ff342730990f";
const EXISTING_CLASSROOM_NAME = "10А";
const EXISTING_STUDENT_ID = "user_3BohRrVB3gqmg67PaCUycXKei6S";
const TERMINATION_REASON =
  "Шалгалтыг орхин 5 секунд болсон тул автоматаар илгээгдэв.";

type ClassroomSeed = {
  id: string;
  className: string;
  classCode: string;
  createdAt: number;
};

type StudentSeed = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  grade: string;
  className: string;
  inviteCode: string;
  classroomId: string;
  teacherId: string;
  isExisting?: boolean;
};

type ChoiceSeed = {
  id: string;
  label: string;
  text: string;
  isCorrect: boolean;
};

type QuestionSeed = {
  id: string;
  examId: string;
  type: "mcq";
  question: string;
  indexOnExam: number;
  topic: string;
  difficulty: string;
  choices: ChoiceSeed[];
};

type ExamSeed = {
  id: string;
  announcedExamId: string;
  title: string;
  subject: string;
  description: string;
  duration: number;
  grade: string;
  createdBy: string;
  scheduledDate: string;
  startTime: string;
  questions: QuestionSeed[];
};

type SubmissionSeed = {
  id: string;
  studentId: string;
  examId: string;
  startedAt: number;
  submittedAt: number;
  totalQuestions: number;
  correctAnswers: number;
  scorePercent: number;
  tabSwitchCount: number;
  reasonForTermination: string | null;
};

type AnswerSeed = {
  id: string;
  submissionId: string;
  questionId: string;
  selectedChoiceId: string;
  answerText: string | null;
  isCorrect: boolean;
};

const firstNames = [
  "Anu",
  "Bilguun",
  "Chinguun",
  "Dulguun",
  "Enebish",
  "Gantsetseg",
  "Hulan",
  "Ider",
  "Jargal",
  "Khaliun",
  "Lkhagva",
  "Munkh",
  "Nandia",
  "Ochir",
  "Purev",
  "Sarnai",
  "Temuulen",
  "Uyanga",
  "Vanchin",
  "Yalguun",
  "Zolboo",
  "Ariunaa",
  "Batsaikhan",
  "Cecgee",
  "Delger",
  "Enkhjin",
  "Gerel",
  "Huslen",
  "Itgel",
  "Javkhlan",
];

const lastNames = [
  "Batbold",
  "Dorj",
  "Enkhbayar",
  "Ganbaatar",
  "Khurelbaatar",
  "Lkhagvasuren",
  "Munkhzul",
  "Nyambayar",
  "Otgon",
  "Purevdorj",
  "Sukhbaatar",
  "Temuujin",
  "Uuganbayar",
  "Byambaa",
  "Ganzorig",
  "Altansukh",
  "Erdene",
  "Tsolmon",
  "Amarsaikhan",
  "Bayarmaa",
];

function escapeSql(value: string | null) {
  if (value === null) {
    return "NULL";
  }

  return `'${value.replace(/'/g, "''")}'`;
}

function boolToInt(value: boolean) {
  return value ? 1 : 0;
}

function makeId(parts: Array<string | number>) {
  return parts.join("-");
}

function makeInviteCode(index: number) {
  return `INV${String(index).padStart(4, "0")}`;
}

function makePhone(index: number) {
  return `9900${String(1000 + index).slice(-4)}`;
}

function makeStudentName(index: number) {
  return {
    firstName: firstNames[index % firstNames.length],
    lastName: lastNames[Math.floor(index / firstNames.length) % lastNames.length],
  };
}

function buildClassrooms() {
  const createdAt = Date.UTC(2026, 0, 10, 8, 0, 0);

  return [
    {
      id: EXISTING_CLASSROOM_ID,
      className: EXISTING_CLASSROOM_NAME,
      classCode: "9NGR2V",
      createdAt,
    },
    {
      id: "seed-demo-classroom-10b",
      className: "10Б",
      classCode: "SEED10B",
      createdAt: createdAt + 1,
    },
    {
      id: "seed-demo-classroom-10v",
      className: "10В",
      classCode: "SEED10V",
      createdAt: createdAt + 2,
    },
  ] satisfies ClassroomSeed[];
}

function buildStudents(classrooms: ClassroomSeed[]) {
  const students: StudentSeed[] = [
    {
      id: EXISTING_STUDENT_ID,
      firstName: "Batzorig",
      lastName: "Chinbat",
      email: "breexy20@gmail.com",
      phone: "99112233",
      grade: "10",
      className: EXISTING_CLASSROOM_NAME,
      inviteCode: "REALSTUDENT",
      classroomId: EXISTING_CLASSROOM_ID,
      teacherId: TEACHER_ID,
      isExisting: true,
    },
  ];

  const targets = [
    { classroom: classrooms[0], total: 22, offset: 0 },
    { classroom: classrooms[1], total: 22, offset: 100 },
    { classroom: classrooms[2], total: 22, offset: 200 },
  ];

  for (const target of targets) {
    const existingCount = students.filter(
      (student) => student.classroomId === target.classroom.id,
    ).length;
    const needed = target.total - existingCount;

    for (let index = 0; index < needed; index += 1) {
      const sequence = target.offset + index;
      const { firstName, lastName } = makeStudentName(sequence);
      const id = makeId(["seed-demo-student", target.classroom.className, index + 1]);
      const email = `${firstName}.${lastName}.${target.classroom.className}.${index + 1}`
        .toLowerCase()
        .replace(/[^a-z0-9.]/g, "") + "@pinequest.demo";

      students.push({
        id,
        firstName,
        lastName,
        email,
        phone: makePhone(sequence),
        grade: "10",
        className: target.classroom.className,
        inviteCode: makeInviteCode(sequence + 1),
        classroomId: target.classroom.id,
        teacherId: TEACHER_ID,
      });
    }
  }

  return students;
}

function buildExamTemplate(
  examIndex: number,
  title: string,
  subject: string,
  duration: number,
  scheduledDate: string,
  startTime: string,
  questionCount: number,
) {
  const examId = makeId(["seed-demo-exam", examIndex + 1]);
  const announcedExamId = makeId(["seed-demo-announced-exam", examIndex + 1]);

  const questions: QuestionSeed[] = Array.from(
    { length: questionCount },
    (_, questionIndex) => {
      const questionId = makeId([
        "seed-demo-question",
        examIndex + 1,
        questionIndex + 1,
      ]);
      const correctLabel = ["A", "B", "C", "D"][questionIndex % 4]!;
      const questionText =
        questionIndex % 3 === 0
          ? `${questionIndex + 1}. ${title}: $x^${(questionIndex % 4) + 2}$ утгыг сонгоно уу.`
          : `${questionIndex + 1}. ${title} сэдвийн ${questionIndex + 1}-р асуултын зөв хариуг сонгоно уу.`;

      const choices: ChoiceSeed[] = ["A", "B", "C", "D"].map((label, choiceIndex) => ({
        id: makeId([
          "seed-demo-choice",
          examIndex + 1,
          questionIndex + 1,
          label.toLowerCase(),
        ]),
        label,
        text:
          questionIndex % 3 === 0
            ? `$${choiceIndex + 1}${questionIndex % 2 === 0 ? "x" : ""}$`
            : `${title} ${questionIndex + 1}.${choiceIndex + 1}`,
        isCorrect: label === correctLabel,
      }));

      return {
        id: questionId,
        examId,
        type: "mcq",
        question: questionText,
        indexOnExam: questionIndex + 1,
        topic: title,
        difficulty: ["easy", "medium", "hard"][questionIndex % 3]!,
        choices,
      };
    },
  );

  return {
    id: examId,
    announcedExamId,
    title,
    subject,
    description: `${title} demo seed exam`,
    duration,
    grade: "10",
    createdBy: TEACHER_ID,
    scheduledDate,
    startTime,
    questions,
  } satisfies ExamSeed;
}

function buildExams() {
  return [
    buildExamTemplate(0, "Algebra Review", "math", 45, "2026-01-15", "09:00", 8),
    buildExamTemplate(1, "Geometry Drill", "math", 50, "2026-01-22", "10:30", 6),
    buildExamTemplate(2, "Functions and Graphs", "math", 60, "2026-02-05", "08:45", 10),
    buildExamTemplate(3, "Probability Practice", "math", 40, "2026-02-19", "11:10", 7),
    buildExamTemplate(4, "Comprehensive Math Test", "math", 70, "2026-03-03", "09:20", 12),
  ] satisfies ExamSeed[];
}

function buildSubmissionsAndAnswers(students: StudentSeed[], exams: ExamSeed[]) {
  const submissions: SubmissionSeed[] = [];
  const answers: AnswerSeed[] = [];

  exams.forEach((exam, examIndex) => {
    const terminatedCount = examIndex % 2 === 0 ? 3 : 2;
    const terminatedStudentIds = new Set(
      students
        .filter((student) => !student.isExisting)
        .slice(examIndex * 3, examIndex * 3 + terminatedCount)
        .map((student) => student.id),
    );

    students.forEach((student, studentIndex) => {
      const startedAt = Date.UTC(
        2026,
        0 + examIndex,
        15 + examIndex * 3,
        8 + (studentIndex % 3),
        (studentIndex * 7) % 60,
        0,
      );
      const totalQuestions = exam.questions.length;
      const minCorrect = Math.max(1, Math.floor(totalQuestions * 0.35));
      const spread = totalQuestions - minCorrect;
      const correctAnswers =
        minCorrect + ((studentIndex * 5 + examIndex * 3) % (spread + 1));
      const scorePercent = Math.round((correctAnswers / totalQuestions) * 100);
      const submissionId = makeId(["seed-demo-submission", examIndex + 1, student.id]);
      const durationMinutes =
        Math.max(18, exam.duration - 12 + ((studentIndex + examIndex) % 10));
      const submittedAt = startedAt + durationMinutes * 60 * 1000;
      const tabSwitchCount = (studentIndex + examIndex) % 4;
      const reasonForTermination = terminatedStudentIds.has(student.id)
        ? TERMINATION_REASON
        : null;

      submissions.push({
        id: submissionId,
        studentId: student.id,
        examId: exam.id,
        startedAt,
        submittedAt,
        totalQuestions,
        correctAnswers,
        scorePercent,
        tabSwitchCount,
        reasonForTermination,
      });

      const rankedQuestions = [...exam.questions]
        .map((question, questionIndex) => ({
          question,
          rank: (studentIndex * 11 + examIndex * 17 + questionIndex * 7) % 97,
        }))
        .sort((left, right) => left.rank - right.rank);
      const correctQuestionIds = new Set(
        rankedQuestions
          .slice(0, correctAnswers)
          .map(({ question }) => question.id),
      );

      exam.questions.forEach((question) => {
        const correctChoice = question.choices.find((choice) => choice.isCorrect);
        const wrongChoice = question.choices.find((choice) => !choice.isCorrect);

        if (!correctChoice || !wrongChoice) {
          throw new Error(`Question ${question.id} is missing choice data.`);
        }

        const isCorrect = correctQuestionIds.has(question.id);
        answers.push({
          id: makeId(["seed-demo-answer", submissionId, question.id]),
          submissionId,
          questionId: question.id,
          selectedChoiceId: isCorrect ? correctChoice.id : wrongChoice.id,
          answerText: null,
          isCorrect,
        });
      });
    });
  });

  return { submissions, answers };
}

function statement(values: string[]) {
  if (values.length === 0) {
    return ";\n";
  }

  const [first, ...rest] = values;
  return `${first}\n${rest.join(",\n")};\n`;
}

function chunkArray<T>(items: T[], size: number) {
  const chunks: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
}

function buildSql() {
  const classrooms = buildClassrooms();
  const students = buildStudents(classrooms);
  const exams = buildExams();
  const { submissions, answers } = buildSubmissionsAndAnswers(students, exams);
  const questionIds = exams.flatMap((exam) => exam.questions.map((question) => question.id));

  const sql: string[] = [
    "PRAGMA foreign_keys = OFF;",
    "DELETE FROM student_exam_answers WHERE id LIKE 'seed-demo-answer-%';",
    "DELETE FROM student_exam_submissions WHERE id LIKE 'seed-demo-submission-%';",
    "DELETE FROM student_exam_sessions WHERE examId LIKE 'seed-demo-exam-%';",
    "DELETE FROM choices WHERE id LIKE 'seed-demo-choice-%';",
    `DELETE FROM questions WHERE id IN (${questionIds.map(escapeSql).join(", ")});`,
    "DELETE FROM announced_exam_grades WHERE id LIKE 'seed-demo-announced-grade-%';",
    "DELETE FROM announced_exams WHERE id LIKE 'seed-demo-announced-exam-%';",
    "DELETE FROM exams WHERE id LIKE 'seed-demo-exam-%';",
    "DELETE FROM students WHERE id LIKE 'seed-demo-student-%';",
    "DELETE FROM classrooms WHERE id LIKE 'seed-demo-classroom-%';",
  ];

  const newClassrooms = classrooms.filter(
    (classroom) => classroom.id !== EXISTING_CLASSROOM_ID,
  );
  sql.push(
    statement([
      "INSERT INTO classrooms (id, teacherId, className, classCode, createdAt) VALUES",
      newClassrooms
        .map(
          (classroom) =>
            `(${escapeSql(classroom.id)}, ${escapeSql(TEACHER_ID)}, ${escapeSql(
              classroom.className,
            )}, ${escapeSql(classroom.classCode)}, ${classroom.createdAt})`,
        )
        .join(",\n"),
    ]),
  );

  const newStudents = students.filter((student) => !student.isExisting);
  chunkArray(newStudents, 40).forEach((batch) => {
    sql.push(
      statement([
        "INSERT INTO students (id, firstName, lastName, email, phone, grade, className, inviteCode, classroomId, teacherId) VALUES",
        batch
          .map(
            (student) =>
              `(${escapeSql(student.id)}, ${escapeSql(student.firstName)}, ${escapeSql(
                student.lastName,
              )}, ${escapeSql(student.email)}, ${escapeSql(student.phone)}, ${escapeSql(
                student.grade,
              )}, ${escapeSql(student.className)}, ${escapeSql(
                student.inviteCode,
              )}, ${escapeSql(student.classroomId)}, ${escapeSql(student.teacherId)})`,
          )
          .join(",\n"),
      ]),
    );
  });

  chunkArray(exams, 20).forEach((batch) => {
    sql.push(
      statement([
        "INSERT INTO exams (id, title, subject, description, duration, grade, fileUrl, createdBy) VALUES",
        batch
          .map(
            (exam) =>
              `(${escapeSql(exam.id)}, ${escapeSql(exam.title)}, ${escapeSql(
                exam.subject,
              )}, ${escapeSql(exam.description)}, ${exam.duration}, ${escapeSql(
                exam.grade,
              )}, NULL, ${escapeSql(exam.createdBy)})`,
          )
          .join(",\n"),
      ]),
    );
  });

  chunkArray(exams, 20).forEach((batch) => {
    sql.push(
      statement([
        "INSERT INTO announced_exams (id, examId, openStatus, scheduledDate, startTime, createdBy) VALUES",
        batch
          .map(
            (exam) =>
              `(${escapeSql(exam.announcedExamId)}, ${escapeSql(exam.id)}, 1, ${escapeSql(
                exam.scheduledDate,
              )}, ${escapeSql(exam.startTime)}, ${escapeSql(TEACHER_ID)})`,
          )
          .join(",\n"),
      ]),
    );
  });

  const announcedExamGradesRows = exams.flatMap((exam) =>
    classrooms.map((classroom) => ({
      id: makeId(["seed-demo-announced-grade", exam.id, classroom.id]),
      classroomId: classroom.id,
      announcedExamId: exam.announcedExamId,
      createdBy: TEACHER_ID,
    })),
  );

  chunkArray(announcedExamGradesRows, 40).forEach((batch) => {
    sql.push(
      statement([
        "INSERT INTO announced_exam_grades (id, classroomId, announcedExamId, createdBy) VALUES",
        batch
          .map(
            (row) =>
              `(${escapeSql(row.id)}, ${escapeSql(row.classroomId)}, ${escapeSql(
                row.announcedExamId,
              )}, ${escapeSql(row.createdBy)})`,
          )
          .join(",\n"),
      ]),
    );
  });

  const questions = exams.flatMap((exam) => exam.questions);
  chunkArray(questions, 40).forEach((batch) => {
    sql.push(
      statement([
        "INSERT INTO questions (id, type, question, examId, indexOnExam, imageUrl, videoUrl, topic, difficulty) VALUES",
        batch
          .map(
            (question) =>
              `(${escapeSql(question.id)}, ${escapeSql(question.type)}, ${escapeSql(
                question.question,
              )}, ${escapeSql(question.examId)}, ${question.indexOnExam}, NULL, NULL, ${escapeSql(
                question.topic,
              )}, ${escapeSql(question.difficulty)})`,
          )
          .join(",\n"),
      ]),
    );
  });

  const choices = questions.flatMap((question) => question.choices.map((choice) => ({
    ...choice,
    questionId: question.id,
  })));
  chunkArray(choices, 80).forEach((batch) => {
    sql.push(
      statement([
        "INSERT INTO choices (id, questionId, text, label, imageUrl, videoUrl, isCorrect) VALUES",
        batch
          .map(
            (choice) =>
              `(${escapeSql(choice.id)}, ${escapeSql(choice.questionId)}, ${escapeSql(
                choice.text,
              )}, ${escapeSql(choice.label)}, NULL, NULL, ${boolToInt(choice.isCorrect)})`,
          )
          .join(",\n"),
      ]),
    );
  });

  chunkArray(submissions, 80).forEach((batch) => {
    sql.push(
      statement([
        "INSERT INTO student_exam_submissions (id, studentId, examId, startedAt, submittedAt, totalQuestions, correctAnswers, scorePercent, tabSwitchCount, reasonForTermination) VALUES",
        batch
          .map(
            (submission) =>
              `(${escapeSql(submission.id)}, ${escapeSql(
                submission.studentId,
              )}, ${escapeSql(submission.examId)}, ${submission.startedAt}, ${
                submission.submittedAt
              }, ${submission.totalQuestions}, ${submission.correctAnswers}, ${
                submission.scorePercent
              }, ${submission.tabSwitchCount}, ${escapeSql(
                submission.reasonForTermination,
              )})`,
          )
          .join(",\n"),
      ]),
    );
  });

  chunkArray(answers, 120).forEach((batch) => {
    sql.push(
      statement([
        "INSERT INTO student_exam_answers (id, submissionId, questionId, selectedChoiceId, answerText, isCorrect) VALUES",
        batch
          .map(
            (answer) =>
              `(${escapeSql(answer.id)}, ${escapeSql(answer.submissionId)}, ${escapeSql(
                answer.questionId,
              )}, ${escapeSql(answer.selectedChoiceId)}, ${escapeSql(
                answer.answerText,
              )}, ${boolToInt(answer.isCorrect)})`,
          )
          .join(",\n"),
      ]),
    );
  });

  sql.push("PRAGMA foreign_keys = ON;");

  return {
    sql: sql.join("\n"),
    summary: {
      classrooms: classrooms.length,
      students: students.length,
      exams: exams.length,
      questions: questions.length,
      choices: choices.length,
      submissions: submissions.length,
      answers: answers.length,
    },
  };
}

function run() {
  const tempDir = mkdtempSync(join(tmpdir(), "pinequest-seed-"));

  try {
    const { sql, summary } = buildSql();
    const sqlPath = join(tempDir, "seed-demo-data.sql");
    writeFileSync(sqlPath, sql, "utf8");

    const result = spawnSync(
      "npx",
      ["wrangler", "d1", "execute", DATABASE_NAME, "--remote", "--file", sqlPath],
      {
        cwd: process.cwd(),
        encoding: "utf8",
      },
    );

    if (result.stdout) {
      process.stdout.write(result.stdout);
    }

    if (result.stderr) {
      process.stderr.write(result.stderr);
    }

    if (result.status !== 0) {
      throw new Error(`Seeding failed with exit code ${result.status ?? "unknown"}.`);
    }

    console.log("\nSeed complete.");
    console.log(JSON.stringify(summary, null, 2));
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
}

run();
