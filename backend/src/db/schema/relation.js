import { relations } from "drizzle-orm";
import {
  users,
  students,
  teachers,
  classes,
  sections,
  subjects,
  classSubjects,
  attendance,
  attendanceLogs,
  feeTypes,
  studentFees,
  feePayments,
  feePenalties,
  notices,
  holidays,
  timetable,
  mcqTests,
  mcqQuestions,
  mcqAnswers,
  mcqTestResults,
  exams,
  marks,
  results,
  assignments,
  submissions,
  libraryBooks,
  bookIssues,
  events,
  notifications,
  settings,
  auditLogs,
  teacherSalaries,
  permission,
  paymentGateway,
  postLikes,
  posts,
  accounts,
  accountHistory,
} from "./users.js";

// User relations
export const usersRelations = relations(users, ({ many, one }) => ({
  notifications: many(notifications),
  post: many(posts),
  like: one(postLikes),
  auditLogs: many(auditLogs),
  accounts: one(accounts),
}));

export const postRelation = relations(posts , ({one}) => ({
   user:one(users , {
    fields: [posts.userId],
    references: [users.id],
   }),
}) )

export const postLikeRlation = relations(postLikes,({one}) => ({
   user:one(users, {
    fields: [postLikes.userId],
    references:[users.id]
   })
}))

// Student relations
export const studentsRelations = relations(students, ({ one, many }) => ({
  user: one(users, {
    fields: [students.userId],
    references: [users.id],
  }),
  class: one(classes, {
    fields: [students.classId],
    references: [classes.id],
  }),
  section: one(sections, {
    fields: [students.sectionId],
    references: [sections.id],
  }),
  attendanceLogs: many(attendanceLogs),
  studentFees: many(studentFees),
  mcqAnswers: many(mcqAnswers),
  mcqTestResults: many(mcqTestResults),
  marks: many(marks),
  results: many(results),
  submissions: many(submissions),
  bookIssues: many(bookIssues),
}));

// Teacher relations
export const teachersRelations = relations(teachers, ({ one, many }) => ({
  user: one(users, {
    fields: [teachers.userId],
    references: [users.id],
  }),
  classSubjects: many(classSubjects),
  attendance: many(attendance),
  mcqTests: many(mcqTests),
  marks: many(marks),
  assignments: many(assignments),
  bookIssues: many(bookIssues),
  salaries: many(teacherSalaries),
  permission: one(permission, {
    fields: [teachers.id],
    references: [permission.teacherId],
  }),
}));

// Class relations - Removed classTeacher relation
export const classesRelations = relations(classes, ({ many }) => ({
  sections: many(sections),
  students: many(students),
  classSubjects: many(classSubjects),
  attendance: many(attendance),
  timetable: many(timetable),
  mcqTests: many(mcqTests),
  exams: many(exams),
  results: many(results),
  assignments: many(assignments),
}));

// Section relations - Removed teacher relation
export const sectionsRelations = relations(sections, ({ one, many }) => ({
  class: one(classes, {
    fields: [sections.classId],
    references: [classes.id],
  }),
  students: many(students),
  attendance: many(attendance),
  timetable: many(timetable),
  assignments: many(assignments),
}));

// Subject relations
export const subjectsRelations = relations(subjects, ({ many }) => ({
  classSubjects: many(classSubjects),
  timetable: many(timetable),
  mcqTests: many(mcqTests),
  exams: many(exams),
  marks: many(marks),
  assignments: many(assignments),
}));

// Class Subject relations
export const classSubjectsRelations = relations(classSubjects, ({ one }) => ({
  class: one(classes, {
    fields: [classSubjects.classId],
    references: [classes.id],
  }),
  subject: one(subjects, {
    fields: [classSubjects.subjectId],
    references: [subjects.id],
  }),
  teacher: one(users, {
    fields: [classSubjects.userId],
    references: [users.id],
  }),
}));

// Attendance relations
export const attendanceRelations = relations(attendance, ({ one, many }) => ({
  class: one(classes, {
    fields: [attendance.classId],
    references: [classes.id],
  }),
  section: one(sections, {
    fields: [attendance.sectionId],
    references: [sections.id],
  }),
  markedBy: one(users, {
    fields: [attendance.markedBy],
    references: [users.id],
  }),
  logs: many(attendanceLogs),
}));

// Attendance Log relations
export const attendanceLogsRelations = relations(attendanceLogs, ({ one }) => ({
  attendance: one(attendance, {
    fields: [attendanceLogs.attendanceId],
    references: [attendance.id],
  }),
  student: one(students, {
    fields: [attendanceLogs.studentId],
    references: [students.id],
  }),
}));

// Fee Type relations
export const feeTypesRelations = relations(feeTypes, ({ many }) => ({
  studentFees: many(studentFees),
}));

// Student Fee relations
export const studentFeesRelations = relations(studentFees, ({ one, many }) => ({
  student: one(students, {
    fields: [studentFees.studentId],
    references: [students.id],
  }),
  feeType: one(feeTypes, {
    fields: [studentFees.feeTypeId],
    references: [feeTypes.id],
  }),
  payments: many(feePayments),
  penalties: many(feePenalties),
}));

// Fee Payment relations
export const feePaymentsRelations = relations(feePayments, ({ one }) => ({
  studentFee: one(studentFees, {
    fields: [feePayments.studentFeeId],
    references: [studentFees.id],
  }),
  paidBy: one(users, {
    fields: [feePayments.paidBy],
    references: [users.id],
  }),
}));

// Fee Penalty relations
export const feePenaltiesRelations = relations(feePenalties, ({ one }) => ({
  studentFee: one(studentFees, {
    fields: [feePenalties.studentFeeId],
    references: [studentFees.id],
  }),
}));

// Notice relations
export const noticesRelations = relations(notices, ({ one }) => ({
  createdBy: one(users, {
    fields: [notices.createdBy],
    references: [users.id],
  }),
}));

// Holiday relations
export const holidaysRelations = relations(holidays, () => ({}));

// Timetable relations
export const timetableRelations = relations(timetable, ({ one }) => ({
  class: one(classes, {
    fields: [timetable.classId],
    references: [classes.id],
  }),
  section: one(sections, {
    fields: [timetable.sectionId],
    references: [sections.id],
  }),
  subject: one(subjects, {
    fields: [timetable.subjectId],
    references: [subjects.id],
  }),
  teacher: one(teachers, {
    fields: [timetable.teacherId],
    references: [teachers.id],
  }),
}));

// MCQ Test relations
export const mcqTestsRelations = relations(mcqTests, ({ one, many }) => ({
  subject: one(subjects, {
    fields: [mcqTests.subjectId],
    references: [subjects.id],
  }),
  class: one(classes, {
    fields: [mcqTests.classId],
    references: [classes.id],
  }),
  createdBy: one(users, {
    fields: [mcqTests.createdBy],
    references: [users.id],
  }),
  questions: many(mcqQuestions),
  answers: many(mcqAnswers),
  results: many(mcqTestResults),
}));

// MCQ Question relations
export const mcqQuestionsRelations = relations(mcqQuestions, ({ one }) => ({
  test: one(mcqTests, {
    fields: [mcqQuestions.testId],
    references: [mcqTests.id],
  }),
}));

// MCQ Answer relations
export const mcqAnswersRelations = relations(mcqAnswers, ({ one }) => ({
  test: one(mcqTests, {
    fields: [mcqAnswers.testId],
    references: [mcqTests.id],
  }),
  student: one(students, {
    fields: [mcqAnswers.studentId],
    references: [students.id],
  }),
  question: one(mcqQuestions, {
    fields: [mcqAnswers.questionId],
    references: [mcqQuestions.id],
  }),
}));

// MCQ Test Results relations
export const mcqTestResultsRelations = relations(mcqTestResults, ({ one }) => ({
  test: one(mcqTests, {
    fields: [mcqTestResults.testId],
    references: [mcqTests.id],
  }),
  student: one(students, {
    fields: [mcqTestResults.studentId],
    references: [students.id],
  }),
}));

// Exam relations
export const examsRelations = relations(exams, ({ one, many }) => ({
  class: one(classes, {
    fields: [exams.classId],
    references: [classes.id],
  }),
  subject: one(subjects, {
    fields: [exams.subjectId],
    references: [subjects.id],
  }),
  createdBy: one(users, {
    fields: [exams.createdBy],
    references: [users.id],
  }),
  marks: many(marks),
}));

// Marks relations
export const marksRelations = relations(marks, ({ one }) => ({
  exam: one(exams, {
    fields: [marks.examId],
    references: [exams.id],
  }),
  student: one(students, {
    fields: [marks.studentId],
    references: [students.id],
  }),
  subject: one(subjects, {
    fields: [marks.subjectId],
    references: [subjects.id],
  }),
  enteredBy: one(users, {
    fields: [marks.enteredBy],
    references: [users.id],
  }),
}));

// Results relations
export const resultsRelations = relations(results, ({ one }) => ({
  student: one(students, {
    fields: [results.studentId],
    references: [students.id],
  }),
  class: one(classes, {
    fields: [results.classId],
    references: [classes.id],
  }),
}));

// Assignment relations
export const assignmentsRelations = relations(assignments, ({ one, many }) => ({
  subject: one(subjects, {
    fields: [assignments.subjectId],
    references: [subjects.id],
  }),
  class: one(classes, {
    fields: [assignments.classId],
    references: [classes.id],
  }),
  section: one(sections, {
    fields: [assignments.sectionId],
    references: [sections.id],
  }),
  createdBy: one(users, {
    fields: [assignments.createdBy],
    references: [users.id],
  }),
  submissions: many(submissions),
}));

// Submission relations
export const submissionsRelations = relations(submissions, ({ one }) => ({
  assignment: one(assignments, {
    fields: [submissions.assignmentId],
    references: [assignments.id],
  }),
  student: one(students, {
    fields: [submissions.studentId],
    references: [students.id],
  }),
  evaluatedBy: one(users, {
    fields: [submissions.evaluatedBy],
    references: [users.id],
  }),
}));

// Library Book relations
export const libraryBooksRelations = relations(libraryBooks, ({ many }) => ({
  issues: many(bookIssues),
}));

// Book Issue relations
export const bookIssuesRelations = relations(bookIssues, ({ one }) => ({
  book: one(libraryBooks, {
    fields: [bookIssues.bookId],
    references: [libraryBooks.id],
  }),
  issuedTo: one(users, {
    fields: [bookIssues.issuedTo],
    references: [users.id],
  }),
  issuedBy: one(users, {
    fields: [bookIssues.issuedBy],
    references: [users.id],
  }),
}));

// Event relations
export const eventsRelations = relations(events, ({ one }) => ({
  createdBy: one(users, {
    fields: [events.createdBy],
    references: [users.id],
  }),
}));

// Notification relations
export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

// Settings relations
export const settingsRelations = relations(settings, () => ({}));

// Audit Log relations
export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id],
  }),
}));

// Teacher Salary relations
export const teacherSalariesRelations = relations(
  teacherSalaries,
  ({ one }) => ({
    teacher: one(teachers, {
      fields: [teacherSalaries.teacherId],
      references: [teachers.id],
    }),
    generatedBy: one(users, {
      fields: [teacherSalaries.generatedBy],
      references: [users.id],
    }),
  }),
);

// Permission relations
export const permissionRelations = relations(permission, ({ one }) => ({
  teacher: one(teachers, {
    fields: [permission.teacherId],
    references: [teachers.id],
  }),
}));

// Payment Gateway relations
export const paymentGatewayRelations = relations(paymentGateway, ({ one }) => ({
  user: one(users, {
    fields: [paymentGateway.userId],
    references: [users.id],
  }),
}));


export const accountsRelations = relations(accounts, ({ many }) => ({
  history: many(accountHistory),
}));

export const accountHistoryRelations = relations(accountHistory, ({ one }) => ({
  account: one(accounts, {
    fields: [accountHistory.accountId],
    references: [accounts.id],
  }),
}));
