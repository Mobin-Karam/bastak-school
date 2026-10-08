"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RelaxationService = void 0;
const node_crypto_1 = require("node:crypto");
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const api_exception_1 = require("../../common/exceptions/api.exception");
const relaxation_track_entity_1 = require("../../database/entities/relaxation-track.entity");
const student_daily_relaxation_entity_1 = require("../../database/entities/student-daily-relaxation.entity");
const student_entity_1 = require("../../database/entities/student.entity");
const organization_membership_entity_1 = require("../../database/entities/organization-membership.entity");
const audit_log_entity_1 = require("../../database/entities/audit-log.entity");
let RelaxationService = class RelaxationService {
    tracks;
    selections;
    students;
    memberships;
    audit;
    constructor(tracks, selections, students, memberships, audit) {
        this.tracks = tracks;
        this.selections = selections;
        this.students = students;
        this.memberships = memberships;
        this.audit = audit;
    }
    listManaged() { return this.tracks.find({ order: { active: "DESC", updatedAt: "DESC" } }); }
    async create(actor, input) { const saved = await this.tracks.save(this.tracks.create(this.clean(input))); await this.record(actor, "relaxation.track_created", saved); return saved; }
    async update(actor, id, input) { const row = await this.track(id); Object.assign(row, this.clean(input)); const saved = await this.tracks.save(row); await this.record(actor, "relaxation.track_updated", saved); return saved; }
    async audience(id) {
        const track = await this.track(id);
        const members = track.organizationId
            ? await this.memberships.find({ where: { organization: { id: track.organizationId }, status: organization_membership_entity_1.MembershipStatus.ACTIVE }, relations: { user: true } })
            : [];
        const userIds = members.map((member) => member.user.id);
        const students = track.organizationId
            ? (userIds.length ? await this.students.find({ where: { user: { id: (0, typeorm_2.In)(userIds) } } }) : [])
            : await this.students.find();
        const eligible = students.filter((student) => !track.gradeIds?.length || Boolean(student.gradeId && track.gradeIds.includes(student.gradeId)));
        const byGrade = new Map();
        for (const student of eligible)
            if (student.gradeId)
                byGrade.set(student.gradeId, (byGrade.get(student.gradeId) || 0) + 1);
        return { trackId: track.id, eligibleStudents: eligible.length, byGrade: [...byGrade.entries()].map(([grade, count]) => ({ grade, count })).sort((a, b) => a.grade - b.grade) };
    }
    async today(userId) {
        const student = await this.student(userId);
        const date = this.localDate(student.user?.timezone);
        const organizationIds = await this.organizationIds(student.user.id);
        const tracks = (await this.tracks.find({ where: { active: true }, order: { title: "ASC" } })).filter((track) => this.availableFor(track, student, date, organizationIds));
        if (!tracks.length)
            return { date, selectedBy: null, selected: null, tracks: [] };
        let selection = await this.selections.findOne({ where: { student: { id: student.id }, date }, relations: { track: true } });
        if (!selection || !selection.track.active) {
            const digest = (0, node_crypto_1.createHash)("sha256").update(`${student.id}:${date}`).digest();
            const selected = tracks[digest.readUInt32BE(0) % tracks.length];
            selection ||= this.selections.create({ student, date });
            Object.assign(selection, { track: selected, selectedBy: "AUTO" });
            selection = await this.selections.save(selection);
            selection.track = selected;
        }
        return { date, selectedBy: selection.selectedBy, selected: selection.track, tracks };
    }
    async select(userId, trackId) {
        const student = await this.student(userId);
        const track = await this.tracks.findOne({ where: { id: trackId, active: true } });
        if (!track || !this.availableFor(track, student, this.localDate(student.user?.timezone), await this.organizationIds(student.user.id)))
            throw new api_exception_1.ApiException(404, "RELAXATION_TRACK_NOT_FOUND", "موسیقی فعال پیدا نشد.");
        const date = this.localDate(student.user?.timezone);
        let selection = await this.selections.findOne({ where: { student: { id: student.id }, date } });
        selection ||= this.selections.create({ student, date });
        Object.assign(selection, { track, selectedBy: "STUDENT" });
        await this.selections.save(selection);
        return this.today(userId);
    }
    async student(userId) { const row = await this.students.findOne({ where: { user: { id: userId } }, relations: { user: true } }); if (!row)
        throw new api_exception_1.ApiException(404, "STUDENT_NOT_FOUND", "پرونده دانش‌آموز پیدا نشد."); return row; }
    async track(id) { const row = await this.tracks.findOneBy({ id }); if (!row)
        throw new api_exception_1.ApiException(404, "RELAXATION_TRACK_NOT_FOUND", "موسیقی پیدا نشد."); return row; }
    clean(input) { const url = new URL(input.url); if (url.protocol !== "https:")
        throw new api_exception_1.ApiException(400, "RELAXATION_URL_INVALID", "پیوند موسیقی باید HTTPS باشد."); if (input.availableFrom && input.availableUntil && input.availableFrom > input.availableUntil)
        throw new api_exception_1.ApiException(422, "RELAXATION_SCHEDULE_INVALID", "بازه انتشار معتبر نیست."); return { title: input.title.trim(), artist: input.artist?.trim() || "", url: url.toString(), active: input.active ?? true, organizationId: input.organizationId || null, gradeIds: input.gradeIds?.length ? [...new Set(input.gradeIds)] : null, availableFrom: input.availableFrom || null, availableUntil: input.availableUntil || null }; }
    availableFor(track, student, date, organizationIds) { return (!track.organizationId || organizationIds.includes(track.organizationId)) && (!track.availableFrom || track.availableFrom <= date) && (!track.availableUntil || track.availableUntil >= date) && (!track.gradeIds?.length || Boolean(student.gradeId && track.gradeIds.includes(student.gradeId))); }
    async organizationIds(userId) { return (await this.memberships.find({ where: { user: { id: userId }, status: organization_membership_entity_1.MembershipStatus.ACTIVE }, relations: { organization: true } })).map((membership) => membership.organization.id); }
    async record(actor, action, track) { await this.audit.save(this.audit.create({ user: { id: actor.id }, action, entity: "relaxation_track", organizationId: track.organizationId || null, metadata: { id: track.id, active: track.active, gradeIds: track.gradeIds || [], availableFrom: track.availableFrom || null, availableUntil: track.availableUntil || null } })); }
    localDate(timezone = "Asia/Tehran") { try {
        return new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
    }
    catch {
        return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tehran", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
    } }
};
exports.RelaxationService = RelaxationService;
exports.RelaxationService = RelaxationService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(relaxation_track_entity_1.RelaxationTrack)),
    __param(1, (0, typeorm_1.InjectRepository)(student_daily_relaxation_entity_1.StudentDailyRelaxation)),
    __param(2, (0, typeorm_1.InjectRepository)(student_entity_1.Student)),
    __param(3, (0, typeorm_1.InjectRepository)(organization_membership_entity_1.OrganizationMembership)),
    __param(4, (0, typeorm_1.InjectRepository)(audit_log_entity_1.AuditLog)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], RelaxationService);
//# sourceMappingURL=relaxation.service.js.map