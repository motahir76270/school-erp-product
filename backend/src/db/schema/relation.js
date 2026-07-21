import { relations } from "drizzle-orm";
import {
  users,
  students,
  teachers,
  classes,
  sections,
  subjects,
  classSubjects,
  studentAttendance,
  studentAttendanceLogs,
  teacherAttendance,
  teacherAttendanceLogs,
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
  teacherPermission,
  userPermission,
  paymentGateway,
  posts,
  postLikes,
  accounts,
  accountHistory,
  schools,
} from "./users.js";

// ==================== USERS RELATIONS ====================
export const usersRelations = relations(users, ({ many }) => ({
  students: many(students),
  teachers: many(teachers),
  classes: many(classes),
  sections: many(sections),
  subjects: many(subjects),
  feeTypes: many(feeTypes),
  studentFees: many(studentFees),
  notices: many(notices),
  mcqTests: many(mcqTests),
  exams: many(exams),
  assignments: many(assignments),
  events: many(events),
  notifications: many(notifications),
  auditLogs: many(auditLogs),
  teacherSalaries: many(teacherSalaries),
  teacherPermissions: many(teacherPermission),
  userPermissions: many(userPermission),
  paymentGateways: many(paymentGateway),
  posts: many(posts),
  postLikes: many(postLikes),
  accounts: many(accounts),
  accountHistory: many(accountHistory),
  schools: many(schools),
}));

// ==================== STUDENTS RELATIONS ====================
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
  attendanceLogs: many(studentAttendanceLogs),
  studentFees: many(studentFees),
  mcqAnswers: many(mcqAnswers),
  mcqResults: many(mcqTestResults),
  marks: many(marks),
  results: many(results),
  submissions: many(submissions),
  bookIssues: many(bookIssues),
}));

// ==================== TEACHERS RELATIONS ====================
export const teachersRelations = relations(teachers, ({ one, many }) => ({
  user: one(users, {
    fields: [teachers.userId],
    references: [users.id],
  }),
  attendanceLogs: many(teacherAttendanceLogs),
  timetable: many(timetable),
  teacherSalaries: many(teacherSalaries),
  teacherPermissions: many(teacherPermission),
  bookIssues: many(bookIssues),
}));

// ==================== CLASSES RELATIONS ====================
export const classesRelations = relations(classes, ({ one, many }) => ({
  user: one(users, {
    fields: [classes.userId],
    references: [users.id],
  }),
  sections: many(sections),
  classSubjects: many(classSubjects),
  students: many(students),
  studentAttendance: many(studentAttendance),
  timetable: many(timetable),
  mcqTests: many(mcqTests),
  exams: many(exams),
  assignments: many(assignments),
  results: many(results),
}));

// ==================== SECTIONS RELATIONS ====================
export const sectionsRelations = relations(sections, ({ one, many }) => ({
  class: one(classes, {
    fields: [sections.classId],
    references: [classes.id],
  }),
  user: one(users, {
    fields: [sections.userId],
    references: [users.id],
  }),
  students: many(students),
  studentAttendance: many(studentAttendance),
  timetable: many(timetable),
  assignments: many(assignments),
}));

// ==================== SUBJECTS RELATIONS ====================
export const subjectsRelations = relations(subjects, ({ one, many }) => ({
  user: one(users, {
    fields: [subjects.userId],
    references: [users.id],
  }),
  classSubjects: many(classSubjects),
  timetable: many(timetable),
  mcqTests: many(mcqTests),
  exams: many(exams),
  assignments: many(assignments),
  marks: many(marks),
}));

// ==================== CLASS SUBJECTS RELATIONS ====================
export const classSubjectsRelations = relations(classSubjects, ({ one }) => ({
  class: one(classes, {
    fields: [classSubjects.classId],
    references: [classes.id],
  }),
  subject: one(subjects, {
    fields: [classSubjects.subjectId],
    references: [subjects.id],
  }),
  user: one(users, {
    fields: [classSubjects.userId],
    references: [users.id],
  }),
}));

// ==================== STUDENT ATTENDANCE RELATIONS ====================
export const studentAttendanceRelations = relations(
  studentAttendance,
  ({ one, many }) => ({
    class: one(classes, {
      fields: [studentAttendance.classId],
      references: [classes.id],
    }),
    section: one(sections, {
      fields: [studentAttendance.sectionId],
      references: [sections.id],
    }),
    markedByUser: one(users, {
      fields: [studentAttendance.markedBy],
      references: [users.id],
    }),
    logs: many(studentAttendanceLogs),
  }),
);

// ==================== STUDENT ATTENDANCE LOGS RELATIONS ====================
export const studentAttendanceLogsRelations = relations(
  studentAttendanceLogs,
  ({ one }) => ({
    attendance: one(studentAttendance, {
      fields: [studentAttendanceLogs.attendanceId],
      references: [studentAttendance.id],
    }),
    student: one(students, {
      fields: [studentAttendanceLogs.studentId],
      references: [students.id],
    }),
  }),
);

// ==================== TEACHER ATTENDANCE RELATIONS ====================
export const teacherAttendanceRelations = relations(
  teacherAttendance,
  ({ one, many }) => ({
    markedByUser: one(users, {
      fields: [teacherAttendance.markedBy],
      references: [users.id],
    }),
    logs: many(teacherAttendanceLogs),
  }),
);

// ==================== TEACHER ATTENDANCE LOGS RELATIONS ====================
export const teacherAttendanceLogsRelations = relations(
  teacherAttendanceLogs,
  ({ one }) => ({
    attendance: one(teacherAttendance, {
      fields: [teacherAttendanceLogs.attendanceId],
      references: [teacherAttendance.id],
    }),
    teacher: one(teachers, {
      fields: [teacherAttendanceLogs.teacherId],
      references: [teachers.id],
    }),
  }),
);

// ==================== FEE TYPES RELATIONS ====================
export const feeTypesRelations = relations(feeTypes, ({ one, many }) => ({
  user: one(users, {
    fields: [feeTypes.userId],
    references: [users.id],
  }),
  studentFees: many(studentFees),
}));

// ==================== STUDENT FEES RELATIONS ====================
export const studentFeesRelations = relations(studentFees, ({ one, many }) => ({
  user: one(users, {
    fields: [studentFees.userId],
    references: [users.id],
  }),
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

// ==================== FEE PAYMENTS RELATIONS ====================
export const feePaymentsRelations = relations(feePayments, ({ one }) => ({
  studentFee: one(studentFees, {
    fields: [feePayments.studentFeeId],
    references: [studentFees.id],
  }),
  paidByUser: one(users, {
    fields: [feePayments.paidBy],
    references: [users.id],
  }),
}));

// ==================== FEE PENALTIES RELATIONS ====================
export const feePenaltiesRelations = relations(feePenalties, ({ one }) => ({
  studentFee: one(studentFees, {
    fields: [feePenalties.studentFeeId],
    references: [studentFees.id],
  }),
}));

// ==================== NOTICES RELATIONS ====================
export const noticesRelations = relations(notices, ({ one }) => ({
  createdByUser: one(users, {
    fields: [notices.createdBy],
    references: [users.id],
  }),
}));

// ==================== TIMETABLE RELATIONS ====================
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

// ==================== MCQ TESTS RELATIONS ====================
export const mcqTestsRelations = relations(mcqTests, ({ one, many }) => ({
  subject: one(subjects, {
    fields: [mcqTests.subjectId],
    references: [subjects.id],
  }),
  class: one(classes, {
    fields: [mcqTests.classId],
    references: [classes.id],
  }),
  createdByUser: one(users, {
    fields: [mcqTests.createdBy],
    references: [users.id],
  }),
  questions: many(mcqQuestions),
  answers: many(mcqAnswers),
  results: many(mcqTestResults),
}));

// ==================== MCQ QUESTIONS RELATIONS ====================
export const mcqQuestionsRelations = relations(
  mcqQuestions,
  ({ one, many }) => ({
    test: one(mcqTests, {
      fields: [mcqQuestions.testId],
      references: [mcqTests.id],
    }),
    answers: many(mcqAnswers),
  }),
);

// ==================== MCQ ANSWERS RELATIONS ====================
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

// ==================== MCQ TEST RESULTS RELATIONS ====================
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

// ==================== EXAMS RELATIONS ====================
export const examsRelations = relations(exams, ({ one, many }) => ({
  class: one(classes, {
    fields: [exams.classId],
    references: [classes.id],
  }),
  subject: one(subjects, {
    fields: [exams.subjectId],
    references: [subjects.id],
  }),
  createdByUser: one(users, {
    fields: [exams.createdBy],
    references: [users.id],
  }),
  marks: many(marks),
}));

// ==================== MARKS RELATIONS ====================
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
  enteredByUser: one(users, {
    fields: [marks.enteredBy],
    references: [users.id],
  }),
}));

// ==================== RESULTS RELATIONS ====================
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

// ==================== ASSIGNMENTS RELATIONS ====================
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
  createdByUser: one(users, {
    fields: [assignments.createdBy],
    references: [users.id],
  }),
  submissions: many(submissions),
}));

// ==================== SUBMISSIONS RELATIONS ====================
export const submissionsRelations = relations(submissions, ({ one }) => ({
  assignment: one(assignments, {
    fields: [submissions.assignmentId],
    references: [assignments.id],
  }),
  student: one(students, {
    fields: [submissions.studentId],
    references: [students.id],
  }),
  evaluatedByUser: one(users, {
    fields: [submissions.evaluatedBy],
    references: [users.id],
  }),
}));

// ==================== LIBRARY BOOKS RELATIONS ====================
export const libraryBooksRelations = relations(libraryBooks, ({ many }) => ({
  bookIssues: many(bookIssues),
}));

// ==================== BOOK ISSUES RELATIONS ====================
export const bookIssuesRelations = relations(bookIssues, ({ one }) => ({
  book: one(libraryBooks, {
    fields: [bookIssues.bookId],
    references: [libraryBooks.id],
  }),
  issuedToStudent: one(students, {
    fields: [bookIssues.issuedTo],
    references: [students.id],
  }),
  issuedToTeacher: one(teachers, {
    fields: [bookIssues.issuedTo],
    references: [teachers.id],
  }),
  issuedByUser: one(users, {
    fields: [bookIssues.issuedBy],
    references: [users.id],
  }),
}));

// ==================== EVENTS RELATIONS ====================
export const eventsRelations = relations(events, ({ one }) => ({
  createdByUser: one(users, {
    fields: [events.createdBy],
    references: [users.id],
  }),
}));

// ==================== NOTIFICATIONS RELATIONS ====================
export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

// ==================== AUDIT LOGS RELATIONS ====================
export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id],
  }),
}));

// ==================== TEACHER SALARIES RELATIONS ====================
export const teacherSalariesRelations = relations(
  teacherSalaries,
  ({ one }) => ({
    teacher: one(teachers, {
      fields: [teacherSalaries.teacherId],
      references: [teachers.id],
    }),
    generatedByUser: one(users, {
      fields: [teacherSalaries.generatedBy],
      references: [users.id],
    }),
  }),
);

// ==================== TEACHER PERMISSION RELATIONS ====================
export const teacherPermissionRelations = relations(
  teacherPermission,
  ({ one }) => ({
    user: one(users, {
      fields: [teacherPermission.userId],
      references: [users.id],
    }),
    teacher: one(teachers, {
      fields: [teacherPermission.teacherId],
      references: [teachers.id],
    }),
  }),
);

// ==================== USER PERMISSION RELATIONS ====================
export const userPermissionRelations = relations(userPermission, ({ one }) => ({
  user: one(users, {
    fields: [userPermission.userId],
    references: [users.id],
  }),
}));

// ==================== PAYMENT GATEWAY RELATIONS ====================
export const paymentGatewayRelations = relations(paymentGateway, ({ one }) => ({
  user: one(users, {
    fields: [paymentGateway.userId],
    references: [users.id],
  }),
}));

// ==================== POSTS RELATIONS ====================
export const postsRelations = relations(posts, ({ one, many }) => ({
  user: one(users, {
    fields: [posts.userId],
    references: [users.id],
  }),
  likes: many(postLikes),
}));

// ==================== POST LIKES RELATIONS ====================
export const postLikesRelations = relations(postLikes, ({ one }) => ({
  post: one(posts, {
    fields: [postLikes.postId],
    references: [posts.id],
  }),
  user: one(users, {
    fields: [postLikes.userId],
    references: [users.id],
  }),
}));

// ==================== ACCOUNTS RELATIONS ====================
export const accountsRelations = relations(accounts, ({ one, many }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
  history: many(accountHistory),
}));

// ==================== ACCOUNT HISTORY RELATIONS ====================
export const accountHistoryRelations = relations(accountHistory, ({ one }) => ({
  user: one(users, {
    fields: [accountHistory.userId],
    references: [users.id],
  }),
  account: one(accounts, {
    fields: [accountHistory.accountId],
    references: [accounts.id],
  }),
}));

// ==================== SCHOOLS RELATIONS ====================
export const schoolsRelations = relations(schools, ({ one }) => ({
  user: one(users, {
    fields: [schools.userId],
    references: [users.id],
  }),
}));
