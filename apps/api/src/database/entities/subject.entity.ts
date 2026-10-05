import { Column, CreateDateColumn, Entity, Index, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Organization } from "./organization.entity";
@Entity("subjects") @Index(["organization","code"],{unique:true})
export class Subject{@PrimaryGeneratedColumn("uuid")id!:string;@ManyToOne(()=>Organization,{nullable:true,onDelete:"CASCADE"})organization?:Organization|null;@Column({length:80})code!:string;@Column({length:160})name!:string;@Column({length:80,default:"عمومی"})category!:string;@Column({default:true})active!:boolean;@CreateDateColumn()createdAt!:Date;@UpdateDateColumn()updatedAt!:Date;}
