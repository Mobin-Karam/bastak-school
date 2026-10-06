import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { StudentDocument } from "./student-document.entity";

@Entity("document_types")
@Index(["code"], { unique: true })
export class DocumentType {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ length: 48 })
  code!: string;

  @Column({ length: 160 })
  name!: string;

  @Column({ length: 255, default: "" })
  description!: string;

  @Column({ type: "boolean", default: true })
  enabled!: boolean;

  @Column({ type: "boolean", default: false })
  required!: boolean;

  @Column({ type: "integer", default: 0 })
  sortOrder!: number;

  @Column({ type: "text", default: "" })
  instructions!: string;

  @Column({ type: "boolean", default: false })
  requiresVerification!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @OneToMany(() => StudentDocument, (document) => document.type)
  documents!: StudentDocument[];
}
