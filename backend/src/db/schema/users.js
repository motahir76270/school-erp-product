import {
  mysqlTable,
  varchar,
  timestamp,
  int,
  boolean,
  text,
  decimal,
  date,
  time,
  json,
} from "drizzle-orm/mysql-core";

// Users Table
export const users = mysqlTable("users", {
  id: varchar("id", { length: 100 }).primaryKey(),
  userId: varchar("user_id", { length: 36 }),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  role: varchar("role", { length: 20 }).notNull(), // super_admin, admin, teacher, student
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  address: text("address"),
  profileImage: varchar("profile_image", { length: 500 }),
  resetPasswordToken:varchar('resetPasswordToken' , {length:600}),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
  lastLoginAt: timestamp("last_login_at"),
});

// Students Table
export const students = mysqlTable("students", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 }).notNull(),
  username: varchar("username", { length: 40 }),
  email: varchar("email", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 50 }),
  password: varchar("password", { length: 255 }).default("123456"),
  role: varchar("role", { length: 20 }).default("student"),
  rollNumber: varchar("roll_number", { length: 20 }).notNull(),
  admissionNumber: varchar("admission_number", { length: 20 }).unique(),
  classId: varchar("class_id", { length: 36 }).notNull(),
  sectionId: varchar("section_id", { length: 36 }),
  dateOfBirth: date("date_of_birth"),
  gender: varchar("gender", { length: 10 }),
  profileImage: varchar("profile_image", { length: 500 }),
  bloodGroup: varchar("blood_group", { length: 5 }),
  religion: varchar("religion", { length: 50 }),
  caste: varchar("caste", { length: 50 }),
  nationality: varchar("nationality", { length: 50 }),
  aadharNumber: varchar("aadhar_number", { length: 20 }),
  admissionDate: date("admission_date").notNull(),
  qrCode: varchar("qrCode", { length: 500 }),
  status: varchar("status", { length: 20 }).default("active"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

// Teachers Table
export const teachers = mysqlTable("teachers", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 }).notNull(),
  username: varchar("username", { length: 40 }),
  email: varchar("email", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 50 }),
  role: varchar("role", { length: 20 }).default("teacher"),
  password: varchar("password", { length: 255 }).default("123456"),
  profileImage: varchar("profile_image", { length: 500 }),
  employeeId: varchar("employee_id", { length: 20 }).notNull().unique(),
  qualification: varchar("qualification", { length: 100 }),
  experience: int("experience"), // in years
  specialization: varchar("specialization", { length: 100 }),
  joiningDate: date("joining_date").notNull(),
  salary: decimal("salary", { precision: 12, scale: 2 }),
  qrCode: varchar("qrCode", { length: 500 }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

// Classes Table - No teacherId
export const classes = mysqlTable("classes", {
  id: varchar("id", { length: 36 }).primaryKey(),
  name: varchar("name", { length: 50 }).notNull(),
  userId: varchar("user_id", { length: 36 }).notNull(), // Admin who created the class
});

// Sections Table - No teacherId
export const sections = mysqlTable("sections", {
  id: varchar("id", { length: 36 }).primaryKey(),
  name: varchar("name", { length: 20 }).notNull(),
  classId: varchar("class_id", { length: 36 }).references(() => classes.id).notNull(),
  userId: varchar("user_id", { length: 36 }),
  capacity: int("capacity").default(30),
});

// Subjects Table
export const subjects = mysqlTable("subjects", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId:varchar('user_id', {length:40}).notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  code: varchar("code", { length: 20 }).notNull().unique(),
  type: varchar("type", { length: 20 }).default("theory"), // theory, practical
  maxMarks: int("max_marks").default(100),
  passMarks: int("pass_marks").default(33),
  status: varchar("status", { length: 20 }).default("active"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

// Class Subjects (Many to Many)
export const classSubjects = mysqlTable("class_subjects", {
  id: varchar("id", { length: 36 }).primaryKey(),
  classId: varchar("class_id", { length: 36 }).notNull(),
  subjectId: varchar("subject_id", { length: 36 }).notNull(),
  userId: varchar("user_id", { length: 36 }),
  createdAt: timestamp("created_at").defaultNow(),
});

// Attendance Table
export const attendance = mysqlTable("attendance", {
  id: varchar("id", { length: 36 }).primaryKey(),
  date: date("date").notNull(),
  classId: varchar("class_id", { length: 36 }).notNull(),
  sectionId: varchar("section_id", { length: 36 }),
  markedBy: varchar("marked_by", { length: 36 }).notNull(), // teacher/admin
  markingMethod: varchar("marking_method", { length: 20 }).default("manual"), // manual, qrcode scan through
  createdAt: timestamp("created_at").defaultNow(),
});

// Attendance Logs Table
export const attendanceLogs = mysqlTable("attendance_logs", {
  id: varchar("id", { length: 36 }).primaryKey(),
  attendanceId: varchar("attendance_id", { length: 36 }).notNull(),
  studentId: varchar("student_id", { length: 36 }).notNull(),
  status: varchar("status", { length: 20 }).notNull(), // present, absent, late, leave
  markedAt: timestamp("marked_at").defaultNow(),
});

// Fee Types Table
export const feeTypes = mysqlTable("fee_types", {
  id: varchar("id", { length: 36 }).primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  code: varchar("code", { length: 20 }).notNull().unique(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  frequency: varchar("frequency", { length: 20 }).default("monthly"), // one-time, monthly, quarterly, yearly
  dueDay: int("due_day").default(10), // Day of month for due
  penaltyPerDay: decimal("penalty_per_day", {
    precision: 12,
    scale: 2,
  }).default("0"),
  applicableClasses: json("applicable_classes").$type(),
  description: text("description"),
  status: varchar("status", { length: 20 }).default("active"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

// Student Fees Table
export const studentFees = mysqlTable("student_fees", {
  id: varchar("id", { length: 36 }).primaryKey(),
  studentId: varchar("student_id", { length: 36 }).notNull(),
  feeTypeId: varchar("fee_type_id", { length: 36 }).notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  dueDate: date("due_date").notNull(),
  paidAmount: decimal("paid_amount", { precision: 12, scale: 2 }).default("0"),
  penaltyAmount: decimal("penalty_amount", { precision: 12, scale: 2 }).default(
    "0",
  ),
  discount: decimal("discount", { precision: 12, scale: 2 }).default("0"),
  scholarship: decimal("scholarship", { precision: 12, scale: 2 }).default("0"),
  status: varchar("status", { length: 20 }).default("pending"), // pending, partial, paid
  academicYear: varchar("academic_year", { length: 10 }).notNull(),
  month: varchar("month", { length: 20 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

// Fee Payments Table
export const feePayments = mysqlTable("fee_payments", {
  id: varchar("id", { length: 36 }).primaryKey(),
  studentFeeId: varchar("student_fee_id", { length: 36 }).notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  paymentMode: varchar("payment_mode", { length: 20 }).notNull(), // cash, card, upi, bank_transfer
  transactionId: varchar("transaction_id", { length: 100 }),
  receiptNumber: varchar("receipt_number", { length: 50 }).notNull(),
  paidBy: varchar("paid_by", { length: 36 }).notNull(),
  remarks: text("remarks"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Fee Penalties Table
export const feePenalties = mysqlTable("fee_penalties", {
  id: varchar("id", { length: 36 }).primaryKey(),
  studentFeeId: varchar("student_fee_id", { length: 36 }).notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  daysLate: int("days_late").notNull(),
  penaltyPerDay: decimal("penalty_per_day", {
    precision: 12,
    scale: 2,
  }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Notices Table
export const notices = mysqlTable("notices", {
  id: varchar("id", { length: 36 }).primaryKey(),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description").notNull(),
  targetType: varchar("target_type", { length: 20 }).notNull(), // all, students, teachers, specific_class
  targetClasses: json("target_classes").$type(),
  attachment: varchar("attachment", { length: 500 }),
  publishDate: date("publish_date").notNull(),
  expiryDate: date("expiry_date"),
  priority: varchar("priority", { length: 20 }).default("normal"), // low, normal, high, urgent
  createdBy: varchar("created_by", { length: 36 }).notNull(),
  status: varchar("status", { length: 20 }).default("draft"), // draft, published, archived
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

// Holidays Table
export const holidays = mysqlTable("holidays", {
  id: varchar("id", { length: 36 }).primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  type: varchar("type", { length: 20 }).notNull(), // national, festival, school
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

// Timetable Table
export const timetable = mysqlTable("timetable", {
  id: varchar("id", { length: 36 }).primaryKey(),
  classId: varchar("class_id", { length: 36 }).notNull(),
  sectionId: varchar("section_id", { length: 36 }),
  subjectId: varchar("subject_id", { length: 36 }).notNull(),
  teacherId: varchar("teacher_id", { length: 36 }).notNull(),
  dayOfWeek: int("day_of_week").notNull(), // 0-6 (Sunday-Saturday)
  startTime: time("start_time").notNull(),
  endTime: time("end_time").notNull(),
  room: varchar("room", { length: 50 }),
  academicYear: varchar("academic_year", { length: 10 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

// MCQ Tests Table
export const mcqTests = mysqlTable("mcq_tests", {
  id: varchar("id", { length: 36 }).primaryKey(),
  title: varchar("title", { length: 200 }).notNull(),
  subjectId: varchar("subject_id", { length: 36 }).notNull(),
  classId: varchar("class_id", { length: 36 }).notNull(),
  duration: int("duration").notNull(), // in minutes
  totalMarks: int("total_marks").notNull(),
  passingMarks: int("passing_marks").notNull(),
  negativeMarking: decimal("negative_marking", {
    precision: 5,
    scale: 2,
  }).default("0"),
  randomizeQuestions: boolean("randomize_questions").default(false),
  randomizeOptions: boolean("randomize_options").default(false),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  createdBy: varchar("created_by", { length: 36 }).notNull(),
  status: varchar("status", { length: 20 }).default("draft"), // draft, published, completed
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

// MCQ Questions Table
export const mcqQuestions = mysqlTable("mcq_questions", {
  id: varchar("id", { length: 36 }).primaryKey(),
  testId: varchar("test_id", { length: 36 }).notNull(),
  questionText: text("question_text").notNull(),
  optionA: varchar("option_a", { length: 500 }).notNull(),
  optionB: varchar("option_b", { length: 500 }).notNull(),
  optionC: varchar("option_c", { length: 500 }).notNull(),
  optionD: varchar("option_d", { length: 500 }).notNull(),
  correctOption: varchar("correct_option", { length: 1 }).notNull(), // A, B, C, D
  marks: int("marks").notNull().default(1),
  explanation: text("explanation"),
  order: int("order").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// MCQ Answers Table
export const mcqAnswers = mysqlTable("mcq_answers", {
  id: varchar("id", { length: 36 }).primaryKey(),
  testId: varchar("test_id", { length: 36 }).notNull(),
  studentId: varchar("student_id", { length: 36 }).notNull(),
  questionId: varchar("question_id", { length: 36 }).notNull(),
  selectedOption: varchar("selected_option", { length: 1 }).notNull(),
  isCorrect: boolean("is_correct").notNull(),
  marksObtained: int("marks_obtained").notNull(),
  timeTaken: int("time_taken"), // in seconds
  answeredAt: timestamp("answered_at").defaultNow(),
});

// MCQ Test Results Table
export const mcqTestResults = mysqlTable("mcq_test_results", {
  id: varchar("id", { length: 36 }).primaryKey(),
  testId: varchar("test_id", { length: 36 }).notNull(),
  studentId: varchar("student_id", { length: 36 }).notNull(),
  totalQuestions: int("total_questions").notNull(),
  correctAnswers: int("correct_answers").notNull(),
  wrongAnswers: int("wrong_answers").notNull(),
  unattempted: int("unattempted").notNull(),
  marksObtained: decimal("marks_obtained", {
    precision: 10,
    scale: 2,
  }).notNull(),
  percentage: decimal("percentage", { precision: 5, scale: 2 }).notNull(),
  rank: int("rank"),
  timeTaken: int("time_taken"), // in seconds
  submittedAt: timestamp("submitted_at").defaultNow(),
});

// Exams Table
export const exams = mysqlTable("exams", {
  id: varchar("id", { length: 36 }).primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  examType: varchar("exam_type", { length: 20 }).notNull(), // unit_test, mid_term, final
  classId: varchar("class_id", { length: 36 }).notNull(),
  subjectId: varchar("subject_id", { length: 36 }).notNull(),
  date: date("date").notNull(),
  startTime: time("start_time").notNull(),
  endTime: time("end_time").notNull(),
  maxMarks: int("max_marks").notNull(),
  passMarks: int("pass_marks").notNull(),
  academicYear: varchar("academic_year", { length: 10 }).notNull(),
  createdBy: varchar("created_by", { length: 36 }).notNull(),
  status: varchar("status", { length: 20 }).default("scheduled"), // scheduled, completed, cancelled
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

// Marks Table
export const marks = mysqlTable("marks", {
  id: varchar("id", { length: 36 }).primaryKey(),
  examId: varchar("exam_id", { length: 36 }).notNull(),
  studentId: varchar("student_id", { length: 36 }).notNull(),
  subjectId: varchar("subject_id", { length: 36 }).notNull(),
  marksObtained: decimal("marks_obtained", {
    precision: 10,
    scale: 2,
  }).notNull(),
  grade: varchar("grade", { length: 5 }),
  remarks: text("remarks"),
  enteredBy: varchar("entered_by", { length: 36 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

// Results Table
export const results = mysqlTable("results", {
  id: varchar("id", { length: 36 }).primaryKey(),
  studentId: varchar("student_id", { length: 36 }).notNull(),
  classId: varchar("class_id", { length: 36 }).notNull(),
  examType: varchar("exam_type", { length: 20 }).notNull(),
  academicYear: varchar("academic_year", { length: 10 }).notNull(),
  totalMarks: decimal("total_marks", { precision: 10, scale: 2 }).notNull(),
  obtainedMarks: decimal("obtained_marks", {
    precision: 10,
    scale: 2,
  }).notNull(),
  percentage: decimal("percentage", { precision: 5, scale: 2 }).notNull(),
  cgpa: decimal("cgpa", { precision: 5, scale: 2 }),
  grade: varchar("grade", { length: 5 }).notNull(),
  rank: int("rank"),
  status: varchar("status", { length: 20 }).default("pass"), // pass, fail
  createdAt: timestamp("created_at").defaultNow(),
});

// Assignments Table
export const assignments = mysqlTable("assignments", {
  id: varchar("id", { length: 36 }).primaryKey(),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description").notNull(),
  subjectId: varchar("subject_id", { length: 36 }).notNull(),
  classId: varchar("class_id", { length: 36 }).notNull(),
  sectionId: varchar("section_id", { length: 36 }),
  dueDate: date("due_date").notNull(),
  maxMarks: int("max_marks").notNull(),
  attachment: varchar("attachment", { length: 500 }),
  createdBy: varchar("created_by", { length: 36 }).notNull(),
  status: varchar("status", { length: 20 }).default("active"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

// Submissions Table
export const submissions = mysqlTable("submissions", {
  id: varchar("id", { length: 36 }).primaryKey(),
  assignmentId: varchar("assignment_id", { length: 36 }).notNull(),
  studentId: varchar("student_id", { length: 36 }).notNull(),
  attachment: varchar("attachment", { length: 500 }),
  remarks: text("remarks"),
  marksObtained: decimal("marks_obtained", { precision: 10, scale: 2 }),
  feedback: text("feedback"),
  submittedAt: timestamp("submitted_at").defaultNow(),
  evaluatedAt: timestamp("evaluated_at"),
  evaluatedBy: varchar("evaluated_by", { length: 36 }),
});

// Library Books Table
export const libraryBooks = mysqlTable("library_books", {
  id: varchar("id", { length: 36 }).primaryKey(),
  title: varchar("title", { length: 200 }).notNull(),
  author: varchar("author", { length: 200 }).notNull(),
  isbn: varchar("isbn", { length: 20 }),
  publisher: varchar("publisher", { length: 100 }),
  category: varchar("category", { length: 50 }),
  edition: varchar("edition", { length: 20 }),
  quantity: int("quantity").notNull().default(1),
  available: int("available").notNull().default(1),
  shelf: varchar("shelf", { length: 20 }),
  status: varchar("status", { length: 20 }).default("available"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

// Book Issues Table
export const bookIssues = mysqlTable("book_issues", {
  id: varchar("id", { length: 36 }).primaryKey(),
  bookId: varchar("book_id", { length: 36 }).notNull(),
  issuedTo: varchar("issued_to", { length: 36 }).notNull(),
  issuedToType: varchar("issued_to_type", { length: 20 }).notNull(), // student, teacher
  issueDate: date("issue_date").notNull(),
  dueDate: date("due_date").notNull(),
  returnDate: date("return_date"),
  fine: decimal("fine", { precision: 10, scale: 2 }).default("0"),
  finePaid: boolean("fine_paid").default(false),
  status: varchar("status", { length: 20 }).default("issued"), // issued, returned, overdue
  issuedBy: varchar("issued_by", { length: 36 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Events Table
export const events = mysqlTable("events", {
  id: varchar("id", { length: 36 }).primaryKey(),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  eventType: varchar("event_type", { length: 50 }).notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date"),
  venue: varchar("venue", { length: 200 }),
  organizer: varchar("organizer", { length: 100 }),
  isPublic: boolean("is_public").default(true),
  status: varchar("status", { length: 20 }).default("upcoming"),
  createdBy: varchar("created_by", { length: 36 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

// Notifications Table
export const notifications = mysqlTable("notifications", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 }).notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  message: text("message").notNull(),
  type: varchar("type", { length: 20 }).notNull(), // info, warning, success, error
  read: boolean("read").default(false),
  link: varchar("link", { length: 500 }),
  createdAt: timestamp("created_at").defaultNow(),
});

// Settings Table
export const settings = mysqlTable("settings", {
  id: varchar("id", { length: 36 }).primaryKey(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  value: text("value"),
  type: varchar("type", { length: 20 }).default("string"), // string, number, boolean, json
  description: text("description"),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

// Audit Logs Table
export const auditLogs = mysqlTable("audit_logs", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 }),
  action: varchar("action", { length: 50 }).notNull(),
  entity: varchar("entity", { length: 50 }).notNull(),
  entityId: varchar("entity_id", { length: 36 }),
  oldValue: json("old_value"),
  newValue: json("new_value"),
  ipAddress: varchar("ip_address", { length: 50 }),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Teacher Salaries Table
export const teacherSalaries = mysqlTable("teacher_salaries", {
  id: varchar("id", { length: 36 }).primaryKey(),
  teacherId: varchar("teacher_id", { length: 36 }).notNull(),
  month: varchar("month", { length: 20 }).notNull(),
  year: int("year").notNull(),
  basicSalary: decimal("basic_salary", { precision: 12, scale: 2 }).notNull(),
  allowances: decimal("allowances", { precision: 12, scale: 2 }).default("0"),
  deductions: decimal("deductions", { precision: 12, scale: 2 }).default("0"),
  netSalary: decimal("net_salary", { precision: 12, scale: 2 }).notNull(),
  paymentDate: date("payment_date"),
  paymentMode: varchar("payment_mode", { length: 20 }),
  transactionId: varchar("transaction_id", { length: 100 }),
  status: varchar("status", { length: 20 }).default("pending"), // pending, paid
  generatedBy: varchar("generated_by", { length: 36 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Permission Table
export const permission = mysqlTable("permission", {
  id: varchar("id", { length: 36 }).primaryKey(),
  teacherId: varchar("teacher_id", { length: 36 }).notNull(),
  attendance: boolean("attendance").default(false),
  classes: boolean("classes").default(false),
  exam: boolean("exam").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

// Payment Gateway Table
export const paymentGateway = mysqlTable("payment_gateway", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 }).notNull(),
  key: varchar("key", { length: 36 }).notNull(),
  secretKey: varchar("secret_key", { length: 36 }).notNull(),
  name: varchar("name", { length: 36 }).notNull(),
  callBackUrl: varchar("callback_url", { length: 120 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});
