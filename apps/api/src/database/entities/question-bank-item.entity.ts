import { Column, CreateDateColumn, Entity, Index, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Organization } from "./organization.entity";

/** Reusable source question. Assessment copies retain their own historical snapshot. */
@Entity("question_bank_items")
@Index(["organization", "archivedAt"])
export class QuestionBankItem {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @ManyToOne(() => Organization, { nullable: true, onDelete: "CASCADE" }) organization?: Organization | null;
  @Column() text!: string;
  @Column({ type: "simple-json" }) options!: string[];
  @Column() correctAnswer!: string;
  @Column({ default: "" }) explanation!: string;
  @Column({ default: "" }) subject!: string;
  @Column({ default: "" }) topic!: string;
  @Column({ default: "" }) book!: string;
  @Column({ default: "" }) grade!: string;
  @Column({ default: "" }) chapter!: string;
  @Column({ default: "" }) lesson!: string;
  @Column({ default: "" }) difficulty!: string;
  @Column({ default: "" }) source!: string;
  @Column({ type: "simple-json", default: "[]" }) tags!: string[];
  /** Exam and quiz banks are isolated source collections. */
  @Index() @Column({ type: "varchar", default: "exam" }) bankType!: "exam" | "quiz";
  /** A quiz-bank copy retains its source without linking future edits. */
  @Index() @Column({ type: "varchar", nullable: true }) sourceQuestionBankItemId?: string | null;
  @Column({ type: "datetime", nullable: true }) archivedAt?: Date | null;
  @CreateDateColumn() createdAt!: Date;
  @UpdateDateColumn() updatedAt!: Date;
}
