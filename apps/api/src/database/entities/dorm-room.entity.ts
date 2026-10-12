import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Organization } from "./organization.entity";
import { DormRoomAssignment } from "./dorm-room-assignment.entity";

@Entity("dorm_rooms")
@Index(["organization", "code"], { unique: true })
export class DormRoom {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => Organization, { nullable: false, onDelete: "CASCADE" })
  organization!: Organization;

  @Column({ length: 80 })
  code!: string;

  @Column({ length: 160 })
  name!: string;

  /** A residence can have several buildings; room codes remain unique per school. */
  @Column({ length: 120, default: "ساختمان اصلی" })
  building!: string;

  @Column({ type: "integer", default: 1 })
  floor!: number;

  @Column({ type: "integer", default: 1 })
  capacity!: number;

  @Column({ length: 24, default: "ACTIVE" })
  status!: "ACTIVE" | "ARCHIVED";

  @OneToMany(() => DormRoomAssignment, (assignment) => assignment.room)
  assignments!: DormRoomAssignment[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
