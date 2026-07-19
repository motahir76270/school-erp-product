import { eq, inArray } from "drizzle-orm";
import { db }  from "../../db/db.js";
import { errorResponse, successResponse } from "../../lib/response.js";
import path from 'path'
import {
  classes,
  feePayments,
  students,
  users,
  sections,
  feeTypes,
  studentFees,
} from "../../db/schema/users.js";

export const getPreviewStudentFeeRecipts = async(req,res) => {
  
    const receiptId = req.params.id;
    
            const receiptsData = await db.query.feePayments.findFirst({
                where: eq(feePayments.id, receiptId),
                with: {
                  studentFee: true,
                },
              });

             if(!receiptsData) {
                errorResponse(res,"reacipts data not found" ,404)
             }

             const [feetypeData] = await db
               .select()
               .from(feeTypes)
               .where(eq(feeTypes.id, receiptsData.studentFee.feeTypeId));


             const userData = await db.query.users.findFirst({
               where: eq(users.id, receiptsData.studentFee.userId),
               with:{
                schools:true
               }
             });

              const [studentData] = await db
                .select()
                .from(students)
                .where(eq(students.id, receiptsData.studentFee.studentId));

              const [classData] = await db
              .select()
              .from(classes)
              .where(eq(classes.id, studentData.classId))

              const [sectionData] =  await db
              .select()
              .from(sections)
              .where(eq(sections.id, studentData.sectionId))
          
               const resData = {
                 receiptsData:receiptsData ,
                 feetype:feetypeData,
                 schoolData: userData,
                 student: studentData,
                 class: {
                   className: classData.name,
                   sectionName: sectionData.name,
                 },
               };
              console.log(resData);
              
             res.sendFile(
               path.join(process.cwd(), "src", "Views", "feeReceipt.html"),
               {
                  receiptsData,
                  userData
               },
             );
}  

export const getFeeReceptsOfStudent = async (req, res) => {
  try {
    const studentId = req.user.id;

    // Get all fee records for the student
    const studentFeeData = await db
      .select()
      .from(studentFees)
      .where(eq(studentFees.studentId, studentId));

    if (!studentFeeData.length) {
      return errorResponse(res, "No fee records found for this student", 404);
    }

    // Extract all studentFee IDs
    const studentFeeIds = studentFeeData.map((fee) => fee.id);

    // Get all payment receipts
    const receiptsData = await db.query.feePayments.findMany({
      where: inArray(feePayments.studentFeeId, studentFeeIds),
      with: {
        studentFee: true,
      },
      orderBy: (feePayments, { desc }) => [desc(feePayments.createdAt)],
    });

    return successResponse(
      res,
      receiptsData,
      "Payments fetched successfully",
      200,
    );
  } catch (error) {
    console.error("Get payments error:", error);
    return errorResponse(res, error.message || "Failed to get payments", 500);
  }
};


//=========== admin controller
export const getFeeReceptsStudentByAdmin = async (req, res) => {
  try {
    const studentId = req.params.id;

    // Get all fee records for the student
    const studentFeeData = await db
      .select()
      .from(studentFees)
      .where(eq(studentFees.studentId, studentId));

    if (!studentFeeData.length) {
      return errorResponse(res, "No fee records found for this student", 404);
    }

    // Extract all studentFee IDs
    const studentFeeIds = studentFeeData.map((fee) => fee.id);

    // Get all payment receipts
    const receiptsData = await db.query.feePayments.findMany({
      where: inArray(feePayments.studentFeeId, studentFeeIds),
      with: {
        studentFee: true,
      },
      orderBy: (feePayments, { desc }) => [desc(feePayments.createdAt)],
    });

    return successResponse(
      res,
      receiptsData,
      "Payments fetched successfully",
      200,
    );
  } catch (error) {
    console.error("Get payments error:", error);
    return errorResponse(res, error.message || "Failed to get payments", 500);
  }
};

