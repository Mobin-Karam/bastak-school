import bcrypt from "bcryptjs";
import { normalizeUsername, projectCapabilities, uniqueValues } from "@moshaver/cmb-identity";
import { TenancyPolicy } from "@moshaver/cmb-tenancy";
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, EntityManager, In, IsNull, Repository } from "typeorm";
import { ApiException } from "../../common/exceptions/api.exception";
import { MembershipStatus, OrganizationMembership } from "../../database/entities/organization-membership.entity";
import { Organization } from "../../database/entities/organization.entity";
import { Role } from "../../database/entities/role.entity";
import { Session } from "../../database/entities/session.entity";
import { UserRoleAssignment } from "../../database/entities/user-role-assignment.entity";
import { User, UserRole, UserStatus } from "../../database/entities/user.entity";
import { AuthenticatedUser } from "../auth";
import { CreateUserDto, SetRolesDto, UpdateUserDto } from "./dto/user.dto";
import { ensureOrganizationChat } from "../chat";

@Injectable()
export class UsersService {
  private readonly tenancy = new TenancyPolicy();
  constructor(@InjectRepository(User) private users: Repository<User>, @InjectRepository(UserRoleAssignment) private assignments: Repository<UserRoleAssignment>, @InjectRepository(Session) private sessions: Repository<Session>, private dataSource: DataSource) {}
  private platform(actor: AuthenticatedUser) { return this.tenancy.isPlatformActor(actor); }
  private assertOrg(actor: AuthenticatedUser, organizationId?: string) { if (!this.tenancy.canAccessOrganization(actor, organizationId)) throw new ApiException(403,"ORGANIZATION_FORBIDDEN","به این سازمان دسترسی ندارید."); }
  private async assertRoles(actor: AuthenticatedUser, roles: string[]) {
    if (!this.tenancy.canAssignRoles(actor, roles)) throw new ApiException(403,"ROLE_ESCALATION","تخصیص این نقش مجاز نیست.");
    if (roles.includes("PLATFORM_ADMIN")) await this.requirePlatformOwner(actor);
  }
  private async requirePlatformOwner(actor: AuthenticatedUser, manager?: EntityManager) {
    if (!this.platform(actor)) throw new ApiException(403, "PLATFORM_OWNER_REQUIRED", "فقط مالک پلتفرم می‌تواند این عملیات را انجام دهد.");
    const repository = manager ? manager.getRepository(User) : this.users;
    const owner = await repository.findOne({ where: { id: actor.id, isPlatformOwner: true, status: UserStatus.ACTIVE } });
    if (!owner) throw new ApiException(403, "PLATFORM_OWNER_REQUIRED", "فقط مالک فعال پلتفرم می‌تواند این عملیات را انجام دهد.");
    return owner;
  }
  private assertProtectedAccount(actor: AuthenticatedUser, target: Pick<User, "id" | "isPlatformOwner">) {
    if (target.id === actor.id) throw new ApiException(400, "SELF_ACCOUNT_PROTECTED", "برای حفظ امکان ورود، نمی‌توانید حساب خودتان را غیرفعال، بایگانی یا تغییر نقش دهید.");
    if (target.isPlatformOwner) throw new ApiException(400, "PLATFORM_OWNER_PROTECTED", "ابتدا مالکیت پلتفرم را واگذار کنید؛ حساب مالک قابل غیرفعال‌سازی، بایگانی یا تغییر نقش نیست.");
  }
  async list(actor: AuthenticatedUser, organizationId?: string, roleCode?: string, status?: UserStatus) {
    const scopedOrganizationId = organizationId ?? (!this.platform(actor) ? actor.organizationIds?.[0] : undefined);
    if (scopedOrganizationId) this.assertOrg(actor, scopedOrganizationId);
    const rows = await this.assignments.find({
      where: { ...(roleCode ? { role: { code: roleCode } } : {}), ...(scopedOrganizationId ? { membership: { organization: { id: scopedOrganizationId }, status: MembershipStatus.ACTIVE } } : {}) },
      relations: { user: true, role: { permissions: { permission: true } }, membership: { organization: true } },
    });
    const users = [...new Map(rows.filter((row) => !status || row.user.status === status).map((row) => [row.user.id, row.user])).values()];
    return users.map((user) => this.project(user, rows.filter((row) => row.user.id === user.id)));
  }
  async get(actor: AuthenticatedUser, id: string) { const rows = await this.assignments.find({ where: { user: { id } }, relations: { user: true, role: { permissions: { permission: true } }, membership: { organization: true } } }); if (!rows.length) throw new ApiException(404,"NOT_FOUND","کاربر یافت نشد."); if (!this.platform(actor) && !rows.some((row) => row.membership && actor.organizationIds?.includes(row.membership.organization.id))) throw new ApiException(404,"NOT_FOUND","کاربر یافت نشد."); return this.project(rows[0].user, rows); }
  async create(actor: AuthenticatedUser, dto: CreateUserDto) { await this.assertRoles(actor,dto.roleCodes); if (dto.organizationId) this.assertOrg(actor,dto.organizationId); if (!this.platform(actor) && !dto.organizationId) throw new ApiException(400,"ORGANIZATION_REQUIRED","سازمان الزامی است."); return this.dataSource.transaction(async (manager) => { const username=normalizeUsername(dto.username);if (await manager.findOne(User,{where:{username}})) throw new ApiException(409,"USERNAME_EXISTS","نام کاربری تکراری است."); const user=await manager.save(User,manager.create(User,{username,passwordHash:await bcrypt.hash(dto.password,12),firstName:dto.firstName??"",lastName:dto.lastName??"",status:UserStatus.ACTIVE,role:(dto.roleCodes.includes("PLATFORM_ADMIN")?UserRole.PLATFORM_ADMIN:dto.roleCodes.includes("STUDENT")?UserRole.STUDENT:UserRole.ADMIN)})); let membership: OrganizationMembership|null=null; if(dto.organizationId){const org=await manager.findOne(Organization,{where:{id:dto.organizationId}});if(!org)throw new ApiException(404,"NOT_FOUND","سازمان یافت نشد.");membership=await manager.save(OrganizationMembership,manager.create(OrganizationMembership,{user,organization:org,status:MembershipStatus.ACTIVE}));} const roles=await manager.find(Role,{where:{code:In(uniqueValues(dto.roleCodes))}}); if(roles.length!==new Set(dto.roleCodes).size)throw new ApiException(400,"INVALID_ROLE","نقش نامعتبر است."); for(const role of roles){if(role.organizationScoped&&!membership)throw new ApiException(400,"ORGANIZATION_REQUIRED","نقش سازمانی به عضویت نیاز دارد.");await manager.save(UserRoleAssignment,manager.create(UserRoleAssignment,{user,role,membership:role.organizationScoped?membership:null}));} if(membership)await ensureOrganizationChat(manager,membership.organization,user); return {id:user.id,username:user.username,roles:roles.map((role)=>role.code)}; }); }
  async update(actor: AuthenticatedUser,id:string,dto:UpdateUserDto){await this.get(actor,id);const patch={...dto};if(patch.username){patch.username=normalizeUsername(patch.username);const duplicate=await this.users.findOne({where:{username:patch.username}});if(duplicate&&duplicate.id!==id)throw new ApiException(409,"USERNAME_EXISTS","نام کاربری تکراری است.");}await this.users.update(id,patch);return this.get(actor,id);}
  async setActive(actor:AuthenticatedUser,id:string,active:boolean){const target=await this.get(actor,id);this.assertProtectedAccount(actor,target);await this.users.update(id,{status:active?UserStatus.ACTIVE:UserStatus.DISABLED});if(!active)await this.sessions.delete({user:{id}});return{userId:id,status:active?UserStatus.ACTIVE:UserStatus.DISABLED};}
  async setRoles(actor:AuthenticatedUser,id:string,dto:SetRolesDto){await this.assertRoles(actor,dto.roleCodes);if(dto.organizationId)this.assertOrg(actor,dto.organizationId);const target=await this.get(actor,id);this.assertProtectedAccount(actor,target);return this.dataSource.transaction(async(manager)=>{const user=await manager.findOneByOrFail(User,{id});const roles=await manager.find(Role,{where:{code:In(dto.roleCodes)}});if(roles.length!==new Set(dto.roleCodes).size)throw new ApiException(400,"INVALID_ROLE","نقش نامعتبر است.");let membership:OrganizationMembership|null=null;if(dto.organizationId)membership=await manager.findOne(OrganizationMembership,{where:{user:{id},organization:{id:dto.organizationId},status:MembershipStatus.ACTIVE}});if(dto.organizationId&&!membership)throw new ApiException(400,"MEMBERSHIP_REQUIRED","عضویت فعال یافت نشد.");if(roles.some((role)=>role.organizationScoped)&&!membership)throw new ApiException(400,"ORGANIZATION_REQUIRED","نقش سازمانی به عضویت نیاز دارد.");if(dto.organizationId)await manager.delete(UserRoleAssignment,{user:{id},membership:{id:membership!.id}});else await manager.delete(UserRoleAssignment,{user:{id},membership:IsNull()});for(const role of roles)await manager.save(UserRoleAssignment,manager.create(UserRoleAssignment,{user,role,membership:role.organizationScoped?membership:null}));return{userId:id,roles:roles.map((role)=>role.code),organizationId:dto.organizationId??null};});}
  async archive(actor:AuthenticatedUser,id:string){if(!this.platform(actor))throw new ApiException(403,"FORBIDDEN","فقط مدیر پلتفرم می‌تواند حساب را بایگانی کند.");const target=await this.get(actor,id);this.assertProtectedAccount(actor,target);await this.users.update(id,{status:UserStatus.ARCHIVED});await this.sessions.delete({user:{id}});return{userId:id,status:UserStatus.ARCHIVED};}
  async transferPlatformOwnership(actor: AuthenticatedUser, targetUserId: string) {
    return this.dataSource.transaction(async (manager) => {
      const currentOwner = await this.requirePlatformOwner(actor, manager);
      if (targetUserId === currentOwner.id) throw new ApiException(400, "OWNERSHIP_TARGET_INVALID", "حساب فعلی از قبل مالک پلتفرم است.");
      const target = await manager.findOne(User, { where: { id: targetUserId, status: UserStatus.ACTIVE } });
      if (!target) throw new ApiException(404, "NOT_FOUND", "مدیر فعال انتخاب‌شده پیدا نشد.");
      const assignment = await manager.findOne(UserRoleAssignment, { where: { user: { id: target.id }, role: { code: "PLATFORM_ADMIN" }, membership: IsNull() } });
      if (!assignment) throw new ApiException(400, "TARGET_NOT_PLATFORM_ADMIN", "برای واگذاری مالکیت، ابتدا این حساب را مدیر پلتفرم کنید.");
      await manager.update(User, { id: currentOwner.id }, { isPlatformOwner: false });
      await manager.update(User, { id: target.id }, { isPlatformOwner: true });
      return { previousOwnerId: currentOwner.id, ownerId: target.id, username: target.username };
    });
  }
  async capabilities(actor:AuthenticatedUser,id:string){const user=await this.get(actor,id);return{userId:id,capabilities:projectCapabilities(user.assignments)};}
  private project(user:User,rows:UserRoleAssignment[]){return{id:user.id,username:user.username,firstName:user.firstName,lastName:user.lastName,status:user.status,isPlatformOwner:user.isPlatformOwner,assignments:rows.map((row)=>({role:row.role.code,organizationId:row.membership?.organization.id??null,capabilities:row.role.permissions?.map((rp)=>rp.permission.code)??[]}))};}
}
