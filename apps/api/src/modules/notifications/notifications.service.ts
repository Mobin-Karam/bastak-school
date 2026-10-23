import { Injectable, Optional } from "@nestjs/common";
import { decodeCursor, encodeCursor, normalizePageLimit, projectNotification } from "@moshaver/cmb-notifications";
import { InjectRepository } from "@nestjs/typeorm";
import { IsNull, Repository } from "typeorm";
import { ApiException } from "../../common/exceptions/api.exception";
import { Notification, NotificationType } from "../../database/entities/notification.entity";
import { Student } from "../../database/entities/student.entity";
import { User } from "../../database/entities/user.entity";
import { Organization } from "../../database/entities/organization.entity";
import { AuthenticatedUser } from "../auth";
import { RealtimeService } from "../realtime";
import { PushService } from "./push.service";

export type CreateNotificationInput={type:NotificationType|string;category?:string;title:string;body:string;url?:string;data?:Record<string,unknown>;priority?:string;expiresAt?:Date;dedupeKey?:string;organizationId?:string};
@Injectable()
export class NotificationsService {
  constructor(@InjectRepository(Notification) private notifications:Repository<Notification>,@InjectRepository(Student) private students:Repository<Student>,private realtime:RealtimeService,@InjectRepository(User) private users?:Repository<User>,@Optional() private push?:PushService){}
  async createForUser(userId:string,input:CreateNotificationInput){const user=this.users?await this.users.findOneByOrFail({id:userId}):({id:userId} as User);if(input.dedupeKey){const old=await this.notifications.findOne({where:{user:{id:userId},dedupeKey:input.dedupeKey}});if(old)return old;}const {organizationId,...values}=input;const row=await this.notifications.save(this.notifications.create({user,...values,organization:organizationId?({id:organizationId} as Organization):null,category:input.category||"general",priority:input.priority||"normal"}));this.realtime.emitToUser(userId,"notification.created",this.publicNotification(row));if(this.push)await this.push.sendToUser(userId,{...row}).catch(()=>undefined);return row;}
  createForUsers(userIds:string[],input:CreateNotificationInput){return Promise.all([...new Set(userIds)].map(id=>this.createForUser(id,input)));}
  async create(studentId:string,type:NotificationType,title:string,message:string){const student=await this.students.findOneOrFail({where:{id:studentId},relations:{user:true,organization:true}});if(!student.user)throw new ApiException(409,"STUDENT_USER_MISSING","حساب کاربری دانش‌آموز موجود نیست.");return this.createForUser(student.user.id,{type,title,body:message,organizationId:student.organization?.id});}
  async findForUser(userId:string,options:{limit?:number;cursor?:string;unreadOnly?:boolean;category?:string;organizationId?:string}={}){const limit=normalizePageLimit(options.limit);const qb=this.notifications.createQueryBuilder("n").leftJoinAndSelect("n.organization","organization").where("n.userId = :userId",{userId});if(options.organizationId)qb.andWhere("(n.organizationId IS NULL OR n.organizationId = :organizationId)",{organizationId:options.organizationId});if(options.unreadOnly)qb.andWhere("n.readAt IS NULL");if(options.category)qb.andWhere("n.category = :category",{category:options.category});if(options.cursor){try{qb.andWhere("(n.createdAt < :createdAt OR (n.createdAt = :createdAt AND n.id < :id))",decodeCursor(options.cursor));}catch{throw new ApiException(400,"INVALID_CURSOR","نشانگر صفحه نامعتبر است.");}}const rows=await qb.orderBy("n.createdAt","DESC").addOrderBy("n.id","DESC").take(limit+1).getMany();const hasMore=rows.length>limit;const items=rows.slice(0,limit);const last=items.at(-1);return{items:items.map(x=>this.publicNotification(x)),unreadCount:await this.getUnreadCount(userId,options.organizationId),hasMore,nextCursor:hasMore&&last?encodeCursor({createdAt:last.createdAt,id:last.id}):null};}
  list(user:AuthenticatedUser,limit=20){return this.findForUser(user.id,{limit,organizationId:user.activeOrganizationId});}
  getUnreadCount(userId:string,organizationId?:string){const qb=this.notifications.createQueryBuilder("n").where("n.userId=:userId",{userId}).andWhere("n.readAt IS NULL");if(organizationId)qb.andWhere("(n.organizationId IS NULL OR n.organizationId = :organizationId)",{organizationId});return qb.getCount();}
  async markRead(user:AuthenticatedUser,id:string){const where=user.activeOrganizationId?[{id,user:{id:user.id},organization:{id:user.activeOrganizationId}},{id,user:{id:user.id},organization:IsNull()}]:{id,user:{id:user.id}};const row=await this.notifications.findOne({where,relations:{organization:true}});if(!row)throw new ApiException(404,"NOTIFICATION_NOT_FOUND","اعلان پیدا نشد.");if(!row.readAt){row.readAt=new Date();await this.notifications.save(row);}return this.publicNotification(row);}
  async markAllRead(user:AuthenticatedUser){const qb=this.notifications.createQueryBuilder().update(Notification).set({readAt:new Date()}).where("userId=:userId AND readAt IS NULL",{userId:user.id});if(user.activeOrganizationId)qb.andWhere("(organizationId IS NULL OR organizationId = :organizationId)",{organizationId:user.activeOrganizationId});const result=await qb.execute();return{updated:result.affected||0};}
  private publicNotification(n:Notification){return {...projectNotification(n),organizationId:n.organization?.id??null};}
}
