import { Injectable, Inject } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, DataSource } from "typeorm";
import { StudentDocument, DocumentStatus, DocumentTypeCode } from "../../database/entities/student-document.entity";
import { DocumentType } from "../../database/entities/document-type.entity";
import { Student } from "../../database/entities/student.entity";
import { User } from "../../database/entities/user.entity";
import { ApiException } from "../../common/exceptions/api.exception";
import { AuthenticatedUser } from "../auth";
import { SchoolAccessService } from "../school-access/school-access.service";
import { Express } from "express";
import { Multer } from "multer";

@Injectable()
export class StudentDocumentsService {
  constructor(
    @InjectRepository(StudentDocument) private readonly documents: Repository<StudentDocument>,
    @InjectRepository(DocumentType) private readonly documentTypes: Repository<DocumentType>,
    @InjectRepository(Student) private readonly students: Repository<Student>,
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly access: SchoolAccessService,
  ) {}

  async list(user: AuthenticatedUser, studentId?: string) {
    const student = await this.getStudent(user, studentId);
    
    const documents = await this.documents.find({
      where: { student: { id: student.id } },
      relations: { type: true } as any,
      order: { createdAt: "DESC" },
    });
    
    return documents.map(doc => ({
      id: doc.id,
      type: doc.type,
      fileName: doc.fileName,
      fileUrl: doc.fileUrl,
      originalFileName: doc.originalFileName,
      status: doc.status,
      verificationNote: doc.verificationNote,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    }));
  }

  async upload(user: AuthenticatedUser, studentId: string, type: string, file: Express.Multer.File | any) {
    const student = await this.getStudent(user, studentId);
    
    // Check if document type exists
    const documentType = await this.documentTypes.findOne({ where: { code: type } });
    if (!documentType) {
      throw new ApiException(404, "DOCUMENT_TYPE_NOT_FOUND", "نوع مدرک مورد نظر یافت نشد.");
    }
    
    // Check if student already has this document type
    const existing = await this.documents.findOne({ 
      where: { student: { id: student.id }, type: { code: type } } as any
    });
    
    // In a real implementation, we would store the file and get a URL
    // For now, we'll use a placeholder URL
    const fileUrl = `/api/documents/${studentId}/${type}/${Date.now()}`;
    
    const document = this.documents.create();
    document.student = student;
    document.type = documentType.code as DocumentTypeCode;
    document.fileName = fileUrl;
    document.fileUrl = fileUrl;
    document.originalFileName = file.originalname;
    document.status = DocumentStatus.PENDING;
    
    await this.documents.save(document);
    
    return {
      id: document.id,
      type: documentType,
      fileName: document.fileName,
      fileUrl: document.fileUrl,
      originalFileName: document.originalFileName,
      status: document.status,
      createdAt: document.createdAt,
    };
  }

  async verify(user: AuthenticatedUser, documentId: string, status: "VERIFIED" | "REJECTED", note?: string) {
    const document = await this.documents.findOne({ 
      where: { id: documentId }, 
      relations: { student: { organization: true } } 
    });
    
    if (!document) {
      throw new ApiException(404, "DOCUMENT_NOT_FOUND", "مدرک یافت نشد.");
    }
    
    // Check if user has permission to verify
    if (document.student.organization && document.student.organization.id) {
      await this.access.organizationForUser(user, document.student.organization.id);
    }
    
    if (status === "REJECTED" || status === "VERIFIED") {
      document.status = status as DocumentStatus;
    }
    document.verificationNote = note || "";
    document.verifiedBy = { id: user.id, username: user.username } as any;
    document.updatedAt = new Date();
    
    await this.documents.save(document);
    
    return {
      id: document.id,
      status: document.status,
      verificationNote: document.verificationNote,
      verifiedBy: user,
      updatedAt: document.updatedAt,
    };
  }

  private async getStudent(user: AuthenticatedUser, studentId?: string): Promise<Student> {
    if (studentId) {
      const student = await this.students.findOne({ 
        where: { id: studentId }, 
        relations: { organization: true, user: true } 
      });
      
      if (!student) {
        throw new ApiException(404, "STUDENT_NOT_FOUND", "طلبه پیدا نشد.");
      }
      
      // Check if user has access to this student
      if (student.organization && student.organization.id) {
        await this.access.organizationForUser(user, student.organization.id);
      }
      
      return student;
    }
    
    // Get student for current user
    const student = await this.students.findOne({ 
      where: { user: { id: user.id } }, 
      relations: { organization: true, user: true } 
    });
    
    if (!student) {
      throw new ApiException(404, "STUDENT_NOT_FOUND", "پرونده طلبه پیدا نشد.");
    }
    
    return student;
  }
}
