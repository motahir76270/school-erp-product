import { mysqlTable, varchar, timestamp, boolean, int, bigint, text, decimal, date, json, uniqueIndex, index } from 'drizzle-orm/mysql-core';
import { relations } from 'drizzle-orm';

// ==================== USER & AUTH ====================

export const users = mysqlTable('users', {
  id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  role: varchar('role', { length: 20 }).notNull().default('student'),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  phone: varchar('phone', { length: 20 }),
  address: text('address'),
  profileImage: varchar('profile_image', { length: 500 }),
  isActive: boolean('is_active').default(true),
  refreshToken: varchar('refresh_token', { length: 500 }),
  resetPasswordToken: varchar('reset_password_token', { length: 500 }),
  resetPasswordExpires: timestamp('reset_password_expires'),
  lastLoginAt: timestamp('last_login_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  emailIdx: uniqueIndex('email_idx').on(table.email),
  roleIdx: index('role_idx').on(table.role),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  student: one(students, { fields: [users.id], references: [students.userId] }),
  teacher: one(teachers, { fields: [users.id], references: [teachers.userId] }),
  notifications: many(notifications),
  auditLogs: many(auditLogs),
}));

// ==================== CLASSES & SECTIONS ====================

export const classes = mysqlTable('classes', {
  id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
  name: varchar('name', { length: 50 }).notNull(),
  numericValue: int('numeric_value').notNull(),
  description: text('description'),
  classTeacherId: bigint('class_teacher_id', { mode: 'number' }),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  nameIdx: index('class_name_idx').on(table.name),
}));

export const classesRelations = relations(classes, ({ one, many }) => ({
  sections: many(sections),
  subjects: many(classSubjects),
  students: many(students),
  classTeacher: one(teachers, { fields: [classes.classTeacherId], references: [teachers.id] }),
  timetables: many(timetables),
}));

export const sections = mysqlTable('sections', {
  id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
  name: varchar('name', { length: 50 }).notNull(),
  classId: bigint('class_id', { mode: 'number' }).notNull(),
  capacity: int('capacity').default(40),
  currentStrength: int('current_strength').default(0),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  classIdx: index('section_class_idx').on(table.classId),
}));

export const sectionsRelations = relations(sections, ({ one, many }) => ({
  class: one(classes, { fields: [sections.classId], references: [classes.id] }),
  students: many(students),
  timetables: many(timetables),
}));

// ==================== SUBJECTS ====================

export const subjects = mysqlTable('subjects', {
  id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
  name: varchar('name', { length: 100 }).notNull(),
  code: varchar('code', { length: 20 }).notNull().unique(),
  description: text('description'),
  creditHours: int('credit_hours').default(1),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  codeIdx: uniqueIndex('subject_code_idx').on(table.code),
}));

export const subjectsRelations = relations(subjects, ({ many }) => ({
  classSubjects: many(classSubjects),
  teacherSubjects: many(teacherSubjects),
  timetables: many(timetables),
  examSubjects: many(examSubjects),
  marks: many(marks),
  mcqQuestions: many(mcqQuestions),
}));

export const classSubjects = mysqlTable('class_subjects', {
  id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
  classId: bigint('class_id', { mode: 'number' }).notNull(),
  subjectId: bigint('subject_id', { mode: 'number' }).notNull(),
  isCompulsory: boolean('is_compulsory').default(true),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  classSubjectIdx: index('class_subject_idx').on(table.classId, table.subjectId),
}));

export const classSubjectsRelations = relations(classSubjects, ({ one }) => ({
  class: one(classes, { fields: [classSubjects.classId], references: [classes.id] }),
  subject: one(subjects, { fields: [classSubjects.subjectId], references: [subjects.id] }),
}));

// ==================== STUDENTS ====================

export const students = mysqlTable('students', {
  id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
  userId: bigint('user_id', { mode: 'number' }).notNull(),
  rollNumber: varchar('roll_number', { length: 20 }).notNull(),
  admissionNumber: varchar('admission_number', { length: 50 }).notNull().unique(),
  classId: bigint('class_id', { mode: 'number' }).notNull(),
  sectionId: bigint('section_id', { mode: 'number' }).notNull(),
  dateOfBirth: date('date_of_birth').notNull(),
  gender: varchar('gender', { length: 10 }).notNull(),
  bloodGroup: varchar('blood_group', { length: 10 }).default('unknown'),
  qrCode: varchar('qr_code', { length: 255 }).unique(),
  emergencyContact: varchar('emergency_contact', { length: 20 }),
  admissionDate: date('admission_date').notNull(),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  userIdx: uniqueIndex('student_user_idx').on(table.userId),
  admissionIdx: uniqueIndex('admission_number_idx').on(table.admissionNumber),
  classIdx: index('student_class_idx').on(table.classId),
  sectionIdx: index('student_section_idx').on(table.sectionId),
  qrCodeIdx: index('student_qr_code_idx').on(table.qrCode),
}));

export const studentsRelations = relations(students, ({ one, many }) => ({
  user: one(users, { fields: [students.userId], references: [users.id] }),
  class: one(classes, { fields: [students.classId], references: [classes.id] }),
  section: one(sections, { fields: [students.sectionId], references: [sections.id] }),
  parent: one(parents, { fields: [students.id], references: [parents.studentId] }),
  attendance: many(attendance),
  feePayments: many(feePayments),
  marks: many(marks),
  examResults: many(examResults),
  assignments: many(submissions),
  mcqAnswers: many(mcqAnswers),
  bookIssues: many(bookIssues),
}));

export const parents = mysqlTable('parents', {
  id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
  studentId: bigint('student_id', { mode: 'number' }).notNull(),
  fatherName: varchar('father_name', { length: 100 }).notNull(),
  fatherPhone: varchar('father_phone', { length: 20 }),
  fatherOccupation: varchar('father_occupation', { length: 100 }),
  fatherEmail: varchar('father_email', { length: 255 }),
  motherName: varchar('mother_name', { length: 100 }).notNull(),
  motherPhone: varchar('mother_phone', { length: 20 }),
  motherOccupation: varchar('mother_occupation', { length: 100 }),
  motherEmail: varchar('mother_email', { length: 255 }),
  guardianName: varchar('guardian_name', { length: 100 }),
  guardianPhone: varchar('guardian_phone', { length: 20 }),
  guardianRelation: varchar('guardian_relation', { length: 50 }),
  address: text('address'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  studentIdx: uniqueIndex('parent_student_idx').on(table.studentId),
}));

export const parentsRelations = relations(parents, ({ one }) => ({
  student: one(students, { fields: [parents.studentId], references: [students.id] }),
}));

// ==================== TEACHERS ====================

export const teachers = mysqlTable('teachers', {
  id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
  userId: bigint('user_id', { mode: 'number' }).notNull(),
  employeeId: varchar('employee_id', { length: 50 }).notNull().unique(),
  qualification: varchar('qualification', { length: 255 }),
  experience: int('experience').default(0),
  specialization: varchar('specialization', { length: 255 }),
  salary: decimal('salary', { precision: 12, scale: 2 }).default('0'),
  joiningDate: date('joining_date').notNull(),
  qrCode: varchar('qr_code', { length: 255 }).unique(),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  userIdx: uniqueIndex('teacher_user_idx').on(table.userId),
  employeeIdx: uniqueIndex('employee_id_idx').on(table.employeeId),
  qrCodeIdx: index('teacher_qr_code_idx').on(table.qrCode),
}));

export const teachersRelations = relations(teachers, ({ one, many }) => ({
  user: one(users, { fields: [teachers.userId], references: [users.id] }),
  teacherSubjects: many(teacherSubjects),
  timetables: many(timetables),
  attendance: many(teacherAttendance),
  assignedClasses: many(classes, { relationName: 'classTeacher' }),
}));

export const teacherSubjects = mysqlTable('teacher_subjects', {
  id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
  teacherId: bigint('teacher_id', { mode: 'number' }).notNull(),
  subjectId: bigint('subject_id', { mode: 'number' }).notNull(),
  classId: bigint('class_id', { mode: 'number' }).notNull(),
  isPrimary: boolean('is_primary').default(false),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  teacherClassSubjectIdx: index('teacher_class_subject_idx').on(table.teacherId, table.classId, table.subjectId),
}));

export const teacherSubjectsRelations = relations(teacherSubjects, ({ one }) => ({
  teacher: one(teachers, { fields: [teacherSubjects.teacherId], references: [teachers.id] }),
  subject: one(subjects, { fields: [teacherSubjects.subjectId], references: [subjects.id] }),
  class: one(classes, { fields: [teacherSubjects.classId], references: [classes.id] }),
}));

// ==================== ATTENDANCE ====================

export const attendance = mysqlTable('attendance', {
  id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
  studentId: bigint('student_id', { mode: 'number' }).notNull(),
  classId: bigint('class_id', { mode: 'number' }).notNull(),
  sectionId: bigint('section_id', { mode: 'number' }).notNull(),
  date: date('date').notNull(),
  status: varchar('status', { length: 10 }).notNull(),
  markedByTeacherId: bigint('marked_by_teacher_id', { mode: 'number' }).notNull(),
  markedMethod: varchar('marked_method', { length: 10 }).default('manual'),
  remarks: varchar('remarks', { length: 255 }),
  checkInTime: timestamp('check_in_time'),
  checkOutTime: timestamp('check_out_time'),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  studentDateIdx: index('attendance_student_date_idx').on(table.studentId, table.date),
  classDateIdx: index('attendance_class_date_idx').on(table.classId, table.date),
  dateIdx: index('attendance_date_idx').on(table.date),
}));

export const attendanceRelations = relations(attendance, ({ one }) => ({
  student: one(students, { fields: [attendance.studentId], references: [students.id] }),
  class: one(classes, { fields: [attendance.classId], references: [classes.id] }),
  section: one(sections, { fields: [attendance.sectionId], references: [sections.id] }),
  markedByTeacher: one(teachers, { fields: [attendance.markedByTeacherId], references: [teachers.id] }),
}));

export const teacherAttendance = mysqlTable('teacher_attendance', {
  id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
  teacherId: bigint('teacher_id', { mode: 'number' }).notNull(),
  date: date('date').notNull(),
  status: varchar('status', { length: 10 }).notNull(),
  markedByAdminId: bigint('marked_by_admin_id', { mode: 'number' }),
  markedMethod: varchar('marked_method', { length: 10 }).default('manual'),
  checkInTime: timestamp('check_in_time'),
  checkOutTime: timestamp('check_out_time'),
  remarks: varchar('remarks', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  teacherDateIdx: index('teacher_attendance_date_idx').on(table.teacherId, table.date),
  dateIdx: index('teacher_attendance_date_idx_2').on(table.date),
}));

export const teacherAttendanceRelations = relations(teacherAttendance, ({ one }) => ({
  teacher: one(teachers, { fields: [teacherAttendance.teacherId], references: [teachers.id] }),
  markedByAdmin: one(users, { fields: [teacherAttendance.markedByAdminId], references: [users.id] }),
}));

// ==================== FEES ====================

export const fees = mysqlTable('fees', {
  id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
  name: varchar('name', { length: 100 }).notNull(),
  feeType: varchar('fee_type', { length: 20 }).notNull(),
  classId: bigint('class_id', { mode: 'number' }),
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  dueDate: date('due_date'),
  penaltyPerDay: decimal('penalty_per_day', { precision: 12, scale: 2 }).default('0'),
  description: text('description'),
  academicYear: varchar('academic_year', { length: 10 }).notNull(),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  typeIdx: index('fee_type_idx').on(table.feeType),
  classIdx: index('fee_class_idx').on(table.classId),
}));

export const feesRelations = relations(fees, ({ one, many }) => ({
  class: one(classes, { fields: [fees.classId], references: [classes.id] }),
  payments: many(feePayments),
}));

export const feePayments = mysqlTable('fee_payments', {
  id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
  studentId: bigint('student_id', { mode: 'number' }).notNull(),
  feeId: bigint('fee_id', { mode: 'number' }).notNull(),
  amountPaid: decimal('amount_paid', { precision: 12, scale: 2 }).notNull(),
  penaltyAmount: decimal('penalty_amount', { precision: 12, scale: 2 }).default('0'),
  discount: decimal('discount', { precision: 12, scale: 2 }).default('0'),
  totalAmount: decimal('total_amount', { precision: 12, scale: 2 }).notNull(),
  paymentMethod: varchar('payment_method', { length: 20 }).notNull(),
  transactionId: varchar('transaction_id', { length: 100 }),
  receiptNumber: varchar('receipt_number', { length: 50 }).notNull().unique(),
  paymentDate: timestamp('payment_date').defaultNow(),
  receivedBy: bigint('received_by', { mode: 'number' }).notNull(),
  remarks: text('remarks'),
  status: varchar('status', { length: 20 }).default('completed'),
  academicYear: varchar('academic_year', { length: 10 }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  studentIdx: index('fee_payment_student_idx').on(table.studentId),
  feeIdx: index('fee_payment_fee_idx').on(table.feeId),
  receiptIdx: uniqueIndex('receipt_number_idx').on(table.receiptNumber),
  dateIdx: index('fee_payment_date_idx').on(table.paymentDate),
}));

export const feePaymentsRelations = relations(feePayments, ({ one }) => ({
  student: one(students, { fields: [feePayments.studentId], references: [students.id] }),
  fee: one(fees, { fields: [feePayments.feeId], references: [fees.id] }),
  receivedByUser: one(users, { fields: [feePayments.receivedBy], references: [users.id] }),
}));

// ==================== EXAMS & MARKS ====================

export const exams = mysqlTable('exams', {
  id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
  name: varchar('name', { length: 100 }).notNull(),
  examType: varchar('exam_type', { length: 20 }).notNull(),
  classId: bigint('class_id', { mode: 'number' }).notNull(),
  startDate: date('start_date').notNull(),
  endDate: date('end_date').notNull(),
  totalMarks: int('total_marks').default(100),
  passingMarks: int('passing_marks').default(35),
  academicYear: varchar('academic_year', { length: 10 }).notNull(),
  description: text('description'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  classIdx: index('exam_class_idx').on(table.classId),
  dateIdx: index('exam_date_idx').on(table.startDate, table.endDate),
}));

export const examsRelations = relations(exams, ({ one, many }) => ({
  class: one(classes, { fields: [exams.classId], references: [classes.id] }),
  examSubjects: many(examSubjects),
  results: many(examResults),
}));

export const examSubjects = mysqlTable('exam_subjects', {
  id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
  examId: bigint('exam_id', { mode: 'number' }).notNull(),
  subjectId: bigint('subject_id', { mode: 'number' }).notNull(),
  examDate: date('exam_date').notNull(),
  startTime: varchar('start_time', { length: 10 }).notNull(),
  endTime: varchar('end_time', { length: 10 }).notNull(),
  totalMarks: int('total_marks').default(100),
  passingMarks: int('passing_marks').default(35),
  room: varchar('room', { length: 50 }),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  examIdx: index('exam_subject_exam_idx').on(table.examId),
  subjectIdx: index('exam_subject_subject_idx').on(table.subjectId),
}));

export const examSubjectsRelations = relations(examSubjects, ({ one, many }) => ({
  exam: one(exams, { fields: [examSubjects.examId], references: [exams.id] }),
  subject: one(subjects, { fields: [examSubjects.subjectId], references: [subjects.id] }),
  marks: many(marks),
}));

export const marks = mysqlTable('marks', {
  id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
  examSubjectId: bigint('exam_subject_id', { mode: 'number' }).notNull(),
  studentId: bigint('student_id', { mode: 'number' }).notNull(),
  subjectId: bigint('subject_id', { mode: 'number' }).notNull(),
  marksObtained: decimal('marks_obtained', { precision: 5, scale: 2 }).notNull(),
  grade: varchar('grade', { length: 5 }),
  gradePoint: decimal('grade_point', { precision: 3, scale: 2 }),
  remarks: varchar('remarks', { length: 255 }),
  enteredBy: bigint('entered_by', { mode: 'number' }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  examStudentIdx: index('marks_exam_student_idx').on(table.examSubjectId, table.studentId),
  studentIdx: index('marks_student_idx').on(table.studentId),
}));

export const marksRelations = relations(marks, ({ one }) => ({
  examSubject: one(examSubjects, { fields: [marks.examSubjectId], references: [examSubjects.id] }),
  student: one(students, { fields: [marks.studentId], references: [students.id] }),
  subject: one(subjects, { fields: [marks.subjectId], references: [subjects.id] }),
  enteredByUser: one(users, { fields: [marks.enteredBy], references: [users.id] }),
}));

export const examResults = mysqlTable('exam_results', {
  id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
  examId: bigint('exam_id', { mode: 'number' }).notNull(),
  studentId: bigint('student_id', { mode: 'number' }).notNull(),
  classId: bigint('class_id', { mode: 'number' }).notNull(),
  totalMarks: decimal('total_marks', { precision: 6, scale: 2 }).notNull(),
  obtainedMarks: decimal('obtained_marks', { precision: 6, scale: 2 }).notNull(),
  percentage: decimal('percentage', { precision: 5, scale: 2 }).notNull(),
  grade: varchar('grade', { length: 5 }).notNull(),
  cgpa: decimal('cgpa', { precision: 3, scale: 2 }),
  rank: int('rank'),
  passed: boolean('passed').default(true),
  remarks: text('remarks'),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  examIdx: index('exam_result_exam_idx').on(table.examId),
  studentIdx: index('exam_result_student_idx').on(table.studentId),
}));

export const examResultsRelations = relations(examResults, ({ one }) => ({
  exam: one(exams, { fields: [examResults.examId], references: [exams.id] }),
  student: one(students, { fields: [examResults.studentId], references: [students.id] }),
  class: one(classes, { fields: [examResults.classId], references: [classes.id] }),
}));

// ==================== TIMETABLE ====================

export const timetables = mysqlTable('timetables', {
  id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
  classId: bigint('class_id', { mode: 'number' }).notNull(),
  sectionId: bigint('section_id', { mode: 'number' }).notNull(),
  subjectId: bigint('subject_id', { mode: 'number' }).notNull(),
  teacherId: bigint('teacher_id', { mode: 'number' }).notNull(),
  day: varchar('day', { length: 10 }).notNull(),
  startTime: varchar('start_time', { length: 10 }).notNull(),
  endTime: varchar('end_time', { length: 10 }).notNull(),
  room: varchar('room', { length: 50 }),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  classSectionIdx: index('timetable_class_section_idx').on(table.classId, table.sectionId),
  teacherIdx: index('timetable_teacher_idx').on(table.teacherId),
  dayIdx: index('timetable_day_idx').on(table.day),
}));

export const timetablesRelations = relations(timetables, ({ one }) => ({
  class: one(classes, { fields: [timetables.classId], references: [classes.id] }),
  section: one(sections, { fields: [timetables.sectionId], references: [sections.id] }),
  subject: one(subjects, { fields: [timetables.subjectId], references: [subjects.id] }),
  teacher: one(teachers, { fields: [timetables.teacherId], references: [teachers.id] }),
}));

// ==================== MCQ ONLINE TEST ====================

export const mcqTests = mysqlTable('mcq_tests', {
  id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
  title: varchar('title', { length: 200 }).notNull(),
  description: text('description'),
  classId: bigint('class_id', { mode: 'number' }).notNull(),
  subjectId: bigint('subject_id', { mode: 'number' }).notNull(),
  teacherId: bigint('teacher_id', { mode: 'number' }).notNull(),
  totalQuestions: int('total_questions').notNull(),
  totalMarks: int('total_marks').notNull(),
  duration: int('duration').notNull(),
  negativeMarking: decimal('negative_marking', { precision: 3, scale: 2 }).default('0'),
  randomQuestions: boolean('random_questions').default(false),
  startTime: timestamp('start_time').notNull(),
  endTime: timestamp('end_time').notNull(),
  passingMarks: int('passing_marks').default(35),
  status: varchar('status', { length: 20 }).default('draft'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  classIdx: index('mcq_test_class_idx').on(table.classId),
  teacherIdx: index('mcq_test_teacher_idx').on(table.teacherId),
  statusIdx: index('mcq_test_status_idx').on(table.status),
}));

export const mcqTestsRelations = relations(mcqTests, ({ one, many }) => ({
  class: one(classes, { fields: [mcqTests.classId], references: [classes.id] }),
  subject: one(subjects, { fields: [mcqTests.subjectId], references: [subjects.id] }),
  teacher: one(teachers, { fields: [mcqTests.teacherId], references: [teachers.id] }),
  questions: many(mcqQuestions),
  answers: many(mcqAnswers),
}));

export const mcqQuestions = mysqlTable('mcq_questions', {
  id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
  testId: bigint('test_id', { mode: 'number' }).notNull(),
  subjectId: bigint('subject_id', { mode: 'number' }).notNull(),
  questionText: text('question_text').notNull(),
  optionA: varchar('option_a', { length: 500 }).notNull(),
  optionB: varchar('option_b', { length: 500 }).notNull(),
  optionC: varchar('option_c', { length: 500 }),
  optionD: varchar('option_d', { length: 500 }),
  correctAnswer: varchar('correct_answer', { length: 1 }).notNull(),
  marks: int('marks').default(1),
  explanation: text('explanation'),
  imageUrl: varchar('image_url', { length: 500 }),
  order: int('order').default(0),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  testIdx: index('mcq_question_test_idx').on(table.testId),
}));

export const mcqQuestionsRelations = relations(mcqQuestions, ({ one, many }) => ({
  test: one(mcqTests, { fields: [mcqQuestions.testId], references: [mcqTests.id] }),
  subject: one(subjects, { fields: [mcqQuestions.subjectId], references: [subjects.id] }),
  answers: many(mcqAnswers),
}));

export const mcqAnswers = mysqlTable('mcq_answers', {
  id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
  testId: bigint('test_id', { mode: 'number' }).notNull(),
  questionId: bigint('question_id', { mode: 'number' }).notNull(),
  studentId: bigint('student_id', { mode: 'number' }).notNull(),
  selectedAnswer: varchar('selected_answer', { length: 1 }),
  isCorrect: boolean('is_correct').default(false),
  marksObtained: decimal('marks_obtained', { precision: 5, scale: 2 }).default('0'),
  timeTaken: int('time_taken'),
  submittedAt: timestamp('submitted_at').defaultNow(),
}, (table) => ({
  testStudentIdx: index('mcq_answer_test_student_idx').on(table.testId, table.studentId),
  questionIdx: index('mcq_answer_question_idx').on(table.questionId),
}));

export const mcqAnswersRelations = relations(mcqAnswers, ({ one }) => ({
  test: one(mcqTests, { fields: [mcqAnswers.testId], references: [mcqTests.id] }),
  question: one(mcqQuestions, { fields: [mcqAnswers.questionId], references: [mcqQuestions.id] }),
  student: one(students, { fields: [mcqAnswers.studentId], references: [students.id] }),
}));

// ==================== ASSIGNMENTS ====================

export const assignments = mysqlTable('assignments', {
  id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
  title: varchar('title', { length: 200 }).notNull(),
  description: text('description'),
  classId: bigint('class_id', { mode: 'number' }).notNull(),
  subjectId: bigint('subject_id', { mode: 'number' }).notNull(),
  teacherId: bigint('teacher_id', { mode: 'number' }).notNull(),
  dueDate: timestamp('due_date').notNull(),
  totalMarks: int('total_marks').default(100),
  fileUrl: varchar('file_url', { length: 500 }),
  fileName: varchar('file_name', { length: 255 }),
  fileType: varchar('file_type', { length: 50 }),
  status: varchar('status', { length: 20 }).default('active'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  classIdx: index('assignment_class_idx').on(table.classId),
  teacherIdx: index('assignment_teacher_idx').on(table.teacherId),
  dueDateIdx: index('assignment_due_date_idx').on(table.dueDate),
}));

export const assignmentsRelations = relations(assignments, ({ one, many }) => ({
  class: one(classes, { fields: [assignments.classId], references: [classes.id] }),
  subject: one(subjects, { fields: [assignments.subjectId], references: [subjects.id] }),
  teacher: one(teachers, { fields: [assignments.teacherId], references: [teachers.id] }),
  submissions: many(submissions),
}));

export const submissions = mysqlTable('submissions', {
  id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
  assignmentId: bigint('assignment_id', { mode: 'number' }).notNull(),
  studentId: bigint('student_id', { mode: 'number' }).notNull(),
  fileUrl: varchar('file_url', { length: 500 }),
  fileName: varchar('file_name', { length: 255 }),
  fileType: varchar('file_type', { length: 50 }),
  remarks: text('remarks'),
  marksObtained: decimal('marks_obtained', { precision: 5, scale: 2 }),
  feedback: text('feedback'),
  status: varchar('status', { length: 20 }).default('submitted'),
  submittedAt: timestamp('submitted_at').defaultNow(),
  gradedAt: timestamp('graded_at'),
  gradedBy: bigint('graded_by', { mode: 'number' }),
}, (table) => ({
  assignmentIdx: index('submission_assignment_idx').on(table.assignmentId),
  studentIdx: index('submission_student_idx').on(table.studentId),
}));

export const submissionsRelations = relations(submissions, ({ one }) => ({
  assignment: one(assignments, { fields: [submissions.assignmentId], references: [assignments.id] }),
  student: one(students, { fields: [submissions.studentId], references: [students.id] }),
  gradedByUser: one(users, { fields: [submissions.gradedBy], references: [users.id] }),
}));

// ==================== LIBRARY ====================

export const libraryBooks = mysqlTable('library_books', {
  id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
  title: varchar('title', { length: 200 }).notNull(),
  author: varchar('author', { length: 100 }).notNull(),
  isbn: varchar('isbn', { length: 20 }).unique(),
  publisher: varchar('publisher', { length: 100 }),
  category: varchar('category', { length: 50 }),
  totalCopies: int('total_copies').default(1),
  availableCopies: int('available_copies').default(1),
  shelfLocation: varchar('shelf_location', { length: 50 }),
  description: text('description'),
  coverImage: varchar('cover_image', { length: 500 }),
  price: decimal('price', { precision: 10, scale: 2 }),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  titleIdx: index('book_title_idx').on(table.title),
  authorIdx: index('book_author_idx').on(table.author),
  isbnIdx: uniqueIndex('book_isbn_idx').on(table.isbn),
}));

export const libraryBooksRelations = relations(libraryBooks, ({ many }) => ({
  issues: many(bookIssues),
}));

export const bookIssues = mysqlTable('book_issues', {
  id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
  bookId: bigint('book_id', { mode: 'number' }).notNull(),
  studentId: bigint('student_id', { mode: 'number' }).notNull(),
  issueDate: date('issue_date').notNull(),
  dueDate: date('due_date').notNull(),
  returnDate: date('return_date'),
  fineAmount: decimal('fine_amount', { precision: 10, scale: 2 }).default('0'),
  finePaid: boolean('fine_paid').default(false),
  status: varchar('status', { length: 20 }).default('issued'),
  issuedBy: bigint('issued_by', { mode: 'number' }).notNull(),
  returnedTo: bigint('returned_to', { mode: 'number' }),
  remarks: text('remarks'),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  bookIdx: index('book_issue_book_idx').on(table.bookId),
  studentIdx: index('book_issue_student_idx').on(table.studentId),
  statusIdx: index('book_issue_status_idx').on(table.status),
}));

export const bookIssuesRelations = relations(bookIssues, ({ one }) => ({
  book: one(libraryBooks, { fields: [bookIssues.bookId], references: [libraryBooks.id] }),
  student: one(students, { fields: [bookIssues.studentId], references: [students.id] }),
  issuedByUser: one(users, { fields: [bookIssues.issuedBy], references: [users.id] }),
  returnedToUser: one(users, { fields: [bookIssues.returnedTo], references: [users.id] }),
}));

// ==================== NOTICES & EVENTS ====================

export const notices = mysqlTable('notices', {
  id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
  title: varchar('title', { length: 200 }).notNull(),
  content: text('content').notNull(),
  target: varchar('target', { length: 20 }).notNull(),
  targetClassId: bigint('target_class_id', { mode: 'number' }),
  attachmentUrl: varchar('attachment_url', { length: 500 }),
  publishDate: timestamp('publish_date').notNull(),
  expiryDate: timestamp('expiry_date'),
  priority: varchar('priority', { length: 10 }).default('normal'),
  createdBy: bigint('created_by', { mode: 'number' }).notNull(),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  publishIdx: index('notice_publish_idx').on(table.publishDate),
  targetIdx: index('notice_target_idx').on(table.target),
}));

export const noticesRelations = relations(notices, ({ one }) => ({
  targetClass: one(classes, { fields: [notices.targetClassId], references: [classes.id] }),
  createdByUser: one(users, { fields: [notices.createdBy], references: [users.id] }),
}));

export const holidays = mysqlTable('holidays', {
  id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  holidayType: varchar('holiday_type', { length: 20 }).notNull(),
  startDate: date('start_date').notNull(),
  endDate: date('end_date').notNull(),
  isRecurring: boolean('is_recurring').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  dateIdx: index('holiday_date_idx').on(table.startDate, table.endDate),
}));

export const events = mysqlTable('events', {
  id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
  title: varchar('title', { length: 200 }).notNull(),
  description: text('description'),
  venue: varchar('venue', { length: 200 }),
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date').notNull(),
  organizer: varchar('organizer', { length: 100 }),
  contactPerson: varchar('contact_person', { length: 100 }),
  contactPhone: varchar('contact_phone', { length: 20 }),
  maxParticipants: int('max_participants'),
  registrationRequired: boolean('registration_required').default(false),
  registrationDeadline: timestamp('registration_deadline'),
  status: varchar('status', { length: 20 }).default('upcoming'),
  imageUrl: varchar('image_url', { length: 500 }),
  createdBy: bigint('created_by', { mode: 'number' }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  dateIdx: index('event_date_idx').on(table.startDate, table.endDate),
  statusIdx: index('event_status_idx').on(table.status),
}));

export const eventsRelations = relations(events, ({ one }) => ({
  createdByUser: one(users, { fields: [events.createdBy], references: [users.id] }),
}));

// ==================== SETTINGS & AUDIT LOGS ====================

export const settings = mysqlTable('settings', {
  id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
  key: varchar('key', { length: 100 }).notNull().unique(),
  value: text('value').notNull(),
  category: varchar('category', { length: 50 }).notNull(),
  description: varchar('description', { length: 255 }),
  isPublic: boolean('is_public').default(false),
  updatedAt: timestamp('updated_at').defaultNow(),
  updatedBy: bigint('updated_by', { mode: 'number' }),
}, (table) => ({
  keyIdx: uniqueIndex('setting_key_idx').on(table.key),
  categoryIdx: index('setting_category_idx').on(table.category),
}));

export const settingsRelations = relations(settings, ({ one }) => ({
  updatedByUser: one(users, { fields: [settings.updatedBy], references: [users.id] }),
}));

export const auditLogs = mysqlTable('audit_logs', {
  id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
  userId: bigint('user_id', { mode: 'number' }),
  action: varchar('action', { length: 100 }).notNull(),
  entityType: varchar('entity_type', { length: 50 }).notNull(),
  entityId: bigint('entity_id', { mode: 'number' }),
  oldValues: json('old_values'),
  newValues: json('new_values'),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: varchar('user_agent', { length: 500 }),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  userIdx: index('audit_user_idx').on(table.userId),
  actionIdx: index('audit_action_idx').on(table.action),
  entityIdx: index('audit_entity_idx').on(table.entityType, table.entityId),
  dateIdx: index('audit_date_idx').on(table.createdAt),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, { fields: [auditLogs.userId], references: [users.id] }),
}));

// ==================== NOTIFICATIONS ====================

export const notifications = mysqlTable('notifications', {
  id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
  userId: bigint('user_id', { mode: 'number' }).notNull(),
  title: varchar('title', { length: 200 }).notNull(),
  message: text('message').notNull(),
  type: varchar('type', { length: 20 }).default('info'),
  read: boolean('read').default(false),
  link: varchar('link', { length: 500 }),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  userIdx: index('notification_user_idx').on(table.userId),
  readIdx: index('notification_read_idx').on(table.userId, table.read),
  dateIdx: index('notification_date_idx').on(table.createdAt),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, { fields: [notifications.userId], references: [users.id] }),
}));

// Type exports
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Class = typeof classes.$inferSelect;
export type NewClass = typeof classes.$inferInsert;
export type Section = typeof sections.$inferSelect;
export type NewSection = typeof sections.$inferInsert;
export type Subject = typeof subjects.$inferSelect;
export type NewSubject = typeof subjects.$inferInsert;
export type Student = typeof students.$inferSelect;
export type NewStudent = typeof students.$inferInsert;
export type Parent = typeof parents.$inferSelect;
export type NewParent = typeof parents.$inferInsert;
export type Teacher = typeof teachers.$inferSelect;
export type NewTeacher = typeof teachers.$inferInsert;
export type Attendance = typeof attendance.$inferSelect;
export type NewAttendance = typeof attendance.$inferInsert;
export type TeacherAttendance = typeof teacherAttendance.$inferSelect;
export type NewTeacherAttendance = typeof teacherAttendance.$inferInsert;
export type Fee = typeof fees.$inferSelect;
export type NewFee = typeof fees.$inferInsert;
export type FeePayment = typeof feePayments.$inferSelect;
export type NewFeePayment = typeof feePayments.$inferInsert;
export type Exam = typeof exams.$inferSelect;
export type NewExam = typeof exams.$inferInsert;
export type Marks = typeof marks.$inferSelect;
export type NewMarks = typeof marks.$inferInsert;
export type Timetable = typeof timetables.$inferSelect;
export type NewTimetable = typeof timetables.$inferInsert;
export type McqTest = typeof mcqTests.$inferSelect;
export type NewMcqTest = typeof mcqTests.$inferInsert;
export type McqQuestion = typeof mcqQuestions.$inferSelect;
export type NewMcqQuestion = typeof mcqQuestions.$inferInsert;
export type Assignment = typeof assignments.$inferSelect;
export type NewAssignment = typeof assignments.$inferInsert;
export type Submission = typeof submissions.$inferSelect;
export type NewSubmission = typeof submissions.$inferInsert;
export type LibraryBook = typeof libraryBooks.$inferSelect;
export type NewLibraryBook = typeof libraryBooks.$inferInsert;
export type BookIssue = typeof bookIssues.$inferSelect;
export type NewBookIssue = typeof bookIssues.$inferInsert;
export type Notice = typeof notices.$inferSelect;
export type NewNotice = typeof notices.$inferInsert;
export type Holiday = typeof holidays.$inferSelect;
export type NewHoliday = typeof holidays.$inferInsert;
export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;
export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
export type Setting = typeof settings.$inferSelect;
export type NewSetting = typeof settings.$inferInsert;
export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;
