import { RelaxationService } from "../src/modules/relaxation/relaxation.service";

describe("RelaxationService", () => {
  const student = { id: "student-1", user: { id: "user-1" } };
  const trackA = { id: "track-a", title: "آرامش اول", artist: "", url: "https://example.com/a.mp3", active: true };
  const trackB = { id: "track-b", title: "آرامش دوم", artist: "", url: "https://example.com/b.mp3", active: true };

  function setup() {
    let selection: any = null;
    const tracks = {
      find: jest.fn(async () => [trackA, trackB]),
      findOne: jest.fn(async ({ where }: any) => [trackA, trackB].find((track) => track.id === where.id && track.active === where.active) || null),
      findOneBy: jest.fn(async ({ id }: any) => [trackA, trackB].find((track) => track.id === id) || null), create: jest.fn((value) => value), save: jest.fn(async (value) => value),
    };
    const selections = {
      findOne: jest.fn(async () => selection),
      create: jest.fn((value) => ({ id: "selection-1", ...value })),
      save: jest.fn(async (value) => { selection = value; return value; }),
    };
    const students = { findOne: jest.fn(async () => student), find: jest.fn(async () => [student]) };
    const memberships = { find: jest.fn(async () => []) };
    const audit = { create: jest.fn((value) => value), save: jest.fn(async (value) => value) };
    return { service: new RelaxationService(tracks as any, selections as any, students as any, memberships as any, audit as any), tracks, selections, students, memberships, current: () => selection };
  }

  it("creates a stable automatic choice and lets the student replace it", async () => {
    const { service, selections, current } = setup();
    const first = await service.today("user-1");
    expect(first.selectedBy).toBe("AUTO");
    expect(first.tracks).toHaveLength(2);
    await service.today("user-1");
    expect(selections.save).toHaveBeenCalledTimes(1);

    const manual = await service.select("user-1", trackB.id);
    expect(manual).toMatchObject({ selectedBy: "STUDENT", selected: { id: trackB.id } });
    expect(current().date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("rejects inactive or unknown manual choices", async () => {
    const { service } = setup();
    await expect(service.select("user-1", "missing")).rejects.toMatchObject({ response: { error: { code: "RELAXATION_TRACK_NOT_FOUND" } } });
  });

  it("does not expose a grade-targeted track outside its eligibility", async () => {
    const { service, tracks } = setup();
    tracks.find.mockResolvedValue([{ ...trackA, gradeIds: [12] } as any]);
    await expect(service.today("user-1")).resolves.toMatchObject({ tracks: [] });
  });

  it("returns a bounded audience summary for a targeted track", async () => {
    const { service, tracks, students, memberships } = setup() as any;
    tracks.findOneBy.mockResolvedValue({ ...trackA, organizationId: "org-1", gradeIds: [10] });
    memberships.find.mockResolvedValue([{ user: { id: "user-1" } }]);
    students.find.mockResolvedValue([{ ...student, gradeId: 10 }, { id: "student-2", gradeId: 11 }]);
    await expect(service.audience(trackA.id)).resolves.toEqual({ trackId: trackA.id, eligibleStudents: 1, byGrade: [{ grade: 10, count: 1 }] });
  });
});
