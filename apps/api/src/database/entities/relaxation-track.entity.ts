import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity("relaxation_tracks")
export class RelaxationTrack {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @Column({ length: 180 }) title!: string;
  @Column({ length: 120, default: "" }) artist!: string;
  @Column({ length: 1600 }) url!: string;
  @Column({ default: true }) active!: boolean;
  @Index() @Column({ type: "varchar", nullable: true }) organizationId?: string | null;
  @Column({ type: "simple-json", nullable: true }) gradeIds?: number[] | null;
  @Column({ type: "varchar", length: 10, nullable: true }) availableFrom?: string | null;
  @Column({ type: "varchar", length: 10, nullable: true }) availableUntil?: string | null;
  @CreateDateColumn() createdAt!: Date;
  @UpdateDateColumn() updatedAt!: Date;
}
