import { QuestionBankService } from "../src/modules/question-bank/question-bank.service";

const context = {
  id: "advisor-1",
  role: "ADVISOR",
  roles: ["ADVISOR"],
  capabilities: ["question_bank.manage"],
  membershipIds: [],
  organizationIds: ["org-1"],
} as any;

function service() {
  const transaction = jest.fn(async (work) =>
    work({
      create: (_entity: unknown, value: unknown) => value,
      save: async (_entity: unknown, values: unknown[]) => values,
    }),
  );
  const items = {
    find: jest.fn(async () => []),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    manager: { transaction },
  };
  const authz = { canAccessOrganization: jest.fn(() => true) };
  return {
    instance: new QuestionBankService(
      items as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      authz as any,
    ),
    items,
    transaction,
  };
}

describe("QuestionBankService transfers", () => {
  it("provides a bank-scoped editable template", async () => {
    const { instance } = service();
    const result = await instance.template(context, "quiz");
    expect(result).toEqual(
      expect.objectContaining({ schemaVersion: "1.0", bankType: "quiz" }),
    );
    expect(result.questions[0]).toEqual(
      expect.objectContaining({ organizationId: "org-1", correctAnswer: "۴" }),
    );
  });

  it("imports only valid questions in one transaction", async () => {
    const { instance, transaction } = service();
    const result = await instance.import(context, {
      bankType: "exam",
      questions: [
        {
          organizationId: "org-1",
          text: "۲ + ۲؟",
          options: ["۱", "۲", "۳", "۴"],
          correctAnswer: "۴",
          tags: ["نمونه"],
        },
      ],
    });
    expect(result).toEqual({ created: 1 });
    expect(transaction).toHaveBeenCalledTimes(1);
  });

  it("rejects a malformed import before opening a write transaction", async () => {
    const { instance, transaction } = service();
    await expect(
      instance.import(context, {
        bankType: "exam",
        questions: [
          {
            organizationId: "org-1",
            text: "ناقص",
            options: ["۱"],
            correctAnswer: "۱",
          },
        ],
      }),
    ).rejects.toMatchObject({
      response: expect.objectContaining({
        error: expect.objectContaining({
          message: expect.stringContaining("Row 1"),
        }),
      }),
    });
    expect(transaction).not.toHaveBeenCalled();
  });
});
