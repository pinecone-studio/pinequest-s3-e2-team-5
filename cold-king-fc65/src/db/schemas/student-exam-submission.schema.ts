import { int, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { exams } from './exam.schema';
import { students } from './student.schema';

export const studentExamSubmissions = sqliteTable('student_exam_submissions', {
	id: text().primaryKey(),
	studentId: text()
		.notNull()
		.references(() => students.id, { onDelete: 'cascade' }),
	examId: text()
		.notNull()
		.references(() => exams.id, { onDelete: 'cascade' }),
	startedAt: int().notNull(),
	submittedAt: int().notNull(),
	totalQuestions: int().notNull(),
	correctAnswers: int().notNull(),
	scorePercent: int().notNull(),
	tabSwitchCount: int().default(0),
	reasonForTermination: text(),
	integrityReason: text(),
	integrityMessage: text(),
});
