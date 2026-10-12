import { EntityManager } from "typeorm";
import { ApiException } from "../../common/exceptions/api.exception";
import { Organization } from "../../database/entities/organization.entity";
import { Student } from "../../database/entities/student.entity";
import { User } from "../../database/entities/user.entity";

/** Provision the domain profile in the same transaction as its STUDENT assignment. */
export async function ensureStudentAccount(
  manager: EntityManager,
  user: User,
  organization: Organization,
) {
  const existing = await manager.findOne(Student, {
    where: { user: { id: user.id } },
    relations: { organization: true },
  });
  if (existing) {
    if (existing.organization && existing.organization.id !== organization.id)
      throw new ApiException(
        409,
        "STUDENT_ORGANIZATION_CONFLICT",
        "پرونده دانش‌آموز متعلق به سازمان دیگری است.",
      );
    if (!existing.organization) {
      existing.organization = organization;
      await manager.save(Student, existing);
    }
    // A role change must not reactivate an archived/inactive student profile.
    return existing;
  }
  return manager.save(
    Student,
    manager.create(Student, {
      user,
      organization,
      name:
        [user.firstName, user.lastName].filter(Boolean).join(" ") ||
        user.phoneNumber ||
        user.username,
      accountStatus: "active",
      onboardingStatus: "ASSIGNED",
      registrationStatus: "ACCOUNT_CREATED",
    }),
  );
}
