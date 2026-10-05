import { createHash } from "node:crypto";
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";
import { ApiException } from "../../common/exceptions/api.exception";
import { RelaxationTrack } from "../../database/entities/relaxation-track.entity";
import { StudentDailyRelaxation } from "../../database/entities/student-daily-relaxation.entity";
import { Student } from "../../database/entities/student.entity";
import { OrganizationMembership, MembershipStatus } from "../../database/entities/organization-membership.entity";
import { AuditLog } from "../../database/entities/audit-log.entity";
import { AuthenticatedUser } from "../auth";
import { SaveRelaxationTrackDto } from "./relaxation.dto";

@Injectable()
export class RelaxationService {
  constructor(
    @InjectRepository(RelaxationTrack) private tracks: Repository<RelaxationTrack>,
    @InjectRepository(StudentDailyRelaxation) private selections: Repository<StudentDailyRelaxation>,
    @InjectRepository(Student) private students: Repository<Student>,
    @InjectRepository(OrganizationMembership) private memberships: Repository<OrganizationMembership>,
    @InjectRepository(AuditLog) private audit: Repository<AuditLog>,
  ) {}

  listManaged() { return this.tracks.find({ order: { active: "DESC", updatedAt: "DESC" } }); }
  async create(actor: AuthenticatedUser, input: SaveRelaxationTrackDto) { const saved = await this.tracks.save(this.tracks.create(this.clean(input))); await this.record(actor, "relaxation.track_created", saved); return saved; }
  async update(actor: AuthenticatedUser, id: string, input: SaveRelaxationTrackDto) { const row = await this.track(id); Object.assign(row, this.clean(input)); const saved = await this.tracks.save(row); await this.record(actor, "relaxation.track_updated", saved); return saved; }
  async audience(id: string) {
    const track = await this.track(id);
    const members = track.organizationId
      ? await this.memberships.find({ where: { organization: { id: track.organizationId }, status: MembershipStatus.ACTIVE }, relations: { user: true } })
      : [];
    const userIds = members.map((member) => member.user.id);
    const students = track.organizationId
      ? (userIds.length ? await this.students.find({ where: { user: { id: In(userIds) } } }) : [])
      : await this.students.find();
    const eligible = students.filter((student) => !track.gradeIds?.length || Boolean(student.gradeId && track.gradeIds.includes(student.gradeId)));
    const byGrade = new Map<number, number>();
    for (const student of eligible) if (student.gradeId) byGrade.set(student.gradeId, (byGrade.get(student.gradeId) || 0) + 1);
    return { trackId: track.id, eligibleStudents: eligible.length, byGrade: [...byGrade.entries()].map(([grade, count]) => ({ grade, count })).sort((a, b) => a.grade - b.grade) };
  }

  async today(userId: string) {
    const student = await this.student(userId);
    const date = this.localDate(student.user?.timezone);
    const organizationIds = await this.organizationIds(student.user!.id);
    const tracks = (await this.tracks.find({ where: { active: true }, order: { title: "ASC" } })).filter((track) => this.availableFor(track, student, date, organizationIds));
    if (!tracks.length) return { date, selectedBy: null, selected: null, tracks: [] };
    let selection = await this.selections.findOne({ where: { student: { id: student.id }, date }, relations: { track: true } });
    if (!selection || !selection.track.active) {
      const digest = createHash("sha256").update(`${student.id}:${date}`).digest();
      const selected = tracks[digest.readUInt32BE(0) % tracks.length];
      selection ||= this.selections.create({ student, date });
      Object.assign(selection, { track: selected, selectedBy: "AUTO" as const });
      selection = await this.selections.save(selection);
      selection.track = selected;
    }
    return { date, selectedBy: selection.selectedBy, selected: selection.track, tracks };
  }

  async select(userId: string, trackId: string) {
    const student = await this.student(userId);
    const track = await this.tracks.findOne({ where: { id: trackId, active: true } });
    if (!track || !this.availableFor(track, student, this.localDate(student.user?.timezone), await this.organizationIds(student.user!.id))) throw new ApiException(404, "RELAXATION_TRACK_NOT_FOUND", "موسیقی فعال پیدا نشد.");
    const date = this.localDate(student.user?.timezone);
    let selection = await this.selections.findOne({ where: { student: { id: student.id }, date } });
    selection ||= this.selections.create({ student, date });
    Object.assign(selection, { track, selectedBy: "STUDENT" as const });
    await this.selections.save(selection);
    return this.today(userId);
  }

  private async student(userId: string) { const row = await this.students.findOne({ where: { user: { id: userId } }, relations: { user: true } }); if (!row) throw new ApiException(404, "STUDENT_NOT_FOUND", "پرونده دانش‌آموز پیدا نشد."); return row; }
  private async track(id: string) { const row = await this.tracks.findOneBy({ id }); if (!row) throw new ApiException(404, "RELAXATION_TRACK_NOT_FOUND", "موسیقی پیدا نشد."); return row; }
  private clean(input: SaveRelaxationTrackDto) { const url = new URL(input.url); if (url.protocol !== "https:") throw new ApiException(400, "RELAXATION_URL_INVALID", "پیوند موسیقی باید HTTPS باشد."); if (input.availableFrom && input.availableUntil && input.availableFrom > input.availableUntil) throw new ApiException(422, "RELAXATION_SCHEDULE_INVALID", "بازه انتشار معتبر نیست."); return { title: input.title.trim(), artist: input.artist?.trim() || "", url: url.toString(), active: input.active ?? true, organizationId: input.organizationId || null, gradeIds: input.gradeIds?.length ? [...new Set(input.gradeIds)] : null, availableFrom: input.availableFrom || null, availableUntil: input.availableUntil || null }; }
  private availableFor(track: RelaxationTrack, student: Student, date: string, organizationIds: string[]) { return (!track.organizationId || organizationIds.includes(track.organizationId)) && (!track.availableFrom || track.availableFrom <= date) && (!track.availableUntil || track.availableUntil >= date) && (!track.gradeIds?.length || Boolean(student.gradeId && track.gradeIds.includes(student.gradeId))); }
  private async organizationIds(userId: string) { return (await this.memberships.find({ where: { user: { id: userId }, status: MembershipStatus.ACTIVE }, relations: { organization: true } })).map((membership) => membership.organization.id); }
  private async record(actor: AuthenticatedUser, action: string, track: RelaxationTrack) { await this.audit.save(this.audit.create({ user: { id: actor.id } as any, action, entity: "relaxation_track", organizationId: track.organizationId || null, metadata: { id: track.id, active: track.active, gradeIds: track.gradeIds || [], availableFrom: track.availableFrom || null, availableUntil: track.availableUntil || null } })); }
  private localDate(timezone = "Asia/Tehran") { try { return new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date()); } catch { return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tehran", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date()); } }
}
