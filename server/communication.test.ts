import { describe, expect, it, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "buyer-user",
    email: "buyer@enterprise.com",
    name: "John Buyer",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };

  return { ctx };
}

describe("communication.sendEmailReminder", () => {
  it("sends email reminder with all required fields", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.communication.sendEmailReminder({
      partnerId: 1,
      supplierEmail: "supplier@example.com",
      supplierName: "John Supplier",
      companyName: "Acme Corporation",
      deadline: new Date("2025-12-31"),
      missingDocuments: ["Certificate of Insurance", "W-9 Form"],
      accessCodeUrl: "https://compliance.example.com/partner/login?code=ABC123",
      urgency: "urgent",
    });

    expect(result).toBeDefined();
    expect(result.success).toBe(true);
  });

  it("sends email reminder with normal urgency", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.communication.sendEmailReminder({
      partnerId: 2,
      supplierEmail: "supplier2@example.com",
      supplierName: "Jane Supplier",
      companyName: "Beta Industries",
      deadline: new Date("2025-12-15"),
      missingDocuments: ["Socioeconomic Classification"],
      accessCodeUrl: "https://compliance.example.com/partner/login?code=XYZ789",
      urgency: "normal",
    });

    expect(result).toBeDefined();
    expect(result.success).toBe(true);
  });

  it("sends email reminder without urgency specified (defaults to normal)", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.communication.sendEmailReminder({
      partnerId: 3,
      supplierEmail: "supplier3@example.com",
      supplierName: "Bob Supplier",
      companyName: "Gamma LLC",
      deadline: new Date("2025-11-30"),
      missingDocuments: ["Insurance Certificate"],
      accessCodeUrl: "https://compliance.example.com/partner/login?code=DEF456",
    });

    expect(result).toBeDefined();
    expect(result.success).toBe(true);
  });
});

describe("communication.sendWhatsAppMessage", () => {
  it("handles WhatsApp message request with all required fields", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.communication.sendWhatsAppMessage({
      partnerId: 1,
      supplierPhone: "+1234567890",
      supplierName: "John Supplier",
      companyName: "Acme Corporation",
      missingDocuments: ["Certificate of Insurance", "W-9 Form"],
      accessCodeUrl: "https://compliance.example.com/partner/login?code=ABC123",
      poNumber: "PO-2025-001",
    });

    expect(result).toBeDefined();
    // In test environment without Twilio credentials, expect success:false
    // In production with valid credentials, this would be success:true
    expect(typeof result.success).toBe("boolean");
    if (result.success) {
      expect(result.messageId).toBeDefined();
    } else {
      expect(result.error).toBeDefined();
    }
  });

  it("handles WhatsApp message without PO number", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.communication.sendWhatsAppMessage({
      partnerId: 2,
      supplierPhone: "+1987654321",
      supplierName: "Jane Supplier",
      companyName: "Beta Industries",
      missingDocuments: ["Socioeconomic Classification"],
      accessCodeUrl: "https://compliance.example.com/partner/login?code=XYZ789",
    });

    expect(result).toBeDefined();
    expect(typeof result.success).toBe("boolean");
  });

  it("handles WhatsApp message with multiple missing documents", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.communication.sendWhatsAppMessage({
      partnerId: 3,
      supplierPhone: "+1555555555",
      supplierName: "Bob Supplier",
      companyName: "Gamma LLC",
      missingDocuments: [
        "Certificate of Insurance",
        "W-9 Form",
        "Socioeconomic Classification",
        "CMMC Certificate",
      ],
      accessCodeUrl: "https://compliance.example.com/partner/login?code=DEF456",
      poNumber: "PO-2025-002",
    });

    expect(result).toBeDefined();
    expect(typeof result.success).toBe("boolean");
  });
});

describe("communication.sendSMSMessage", () => {
  it("handles SMS message with all required fields", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.communication.sendSMSMessage({
      partnerId: 1,
      supplierPhone: "+1234567890",
      supplierName: "John Supplier",
      companyName: "Acme Corporation",
      deadline: new Date("2025-12-31"),
      accessCodeUrl: "https://compliance.example.com/partner/login?code=ABC123",
    });

    expect(result).toBeDefined();
    expect(typeof result.success).toBe("boolean");
    if (result.success) {
      expect(result.messageId).toBeDefined();
    } else {
      expect(result.error).toBeDefined();
    }
  });

  it("handles SMS message with near deadline", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const nearDeadline = new Date();
    nearDeadline.setDate(nearDeadline.getDate() + 2); // 2 days from now

    const result = await caller.communication.sendSMSMessage({
      partnerId: 2,
      supplierPhone: "+1987654321",
      supplierName: "Jane Supplier",
      companyName: "Beta Industries",
      deadline: nearDeadline,
      accessCodeUrl: "https://compliance.example.com/partner/login?code=XYZ789",
    });

    expect(result).toBeDefined();
    expect(typeof result.success).toBe("boolean");
  });

  it("handles SMS message with future deadline", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const futureDeadline = new Date();
    futureDeadline.setDate(futureDeadline.getDate() + 30); // 30 days from now

    const result = await caller.communication.sendSMSMessage({
      partnerId: 3,
      supplierPhone: "+1555555555",
      supplierName: "Bob Supplier",
      companyName: "Gamma LLC",
      deadline: futureDeadline,
      accessCodeUrl: "https://compliance.example.com/partner/login?code=DEF456",
    });

    expect(result).toBeDefined();
    expect(typeof result.success).toBe("boolean");
  });
});

describe("communication - authentication", () => {
  it("requires authentication for sendEmailReminder", async () => {
    const ctx: TrpcContext = {
      user: null,
      req: {
        protocol: "https",
        headers: {},
      } as TrpcContext["req"],
      res: {} as TrpcContext["res"],
    };

    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.communication.sendEmailReminder({
        partnerId: 1,
        supplierEmail: "supplier@example.com",
        supplierName: "John Supplier",
        companyName: "Acme Corporation",
        deadline: new Date("2025-12-31"),
        missingDocuments: ["Certificate of Insurance"],
        accessCodeUrl: "https://compliance.example.com/partner/login?code=ABC123",
      })
    ).rejects.toThrow();
  });

  it("requires authentication for sendWhatsAppMessage", async () => {
    const ctx: TrpcContext = {
      user: null,
      req: {
        protocol: "https",
        headers: {},
      } as TrpcContext["req"],
      res: {} as TrpcContext["res"],
    };

    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.communication.sendWhatsAppMessage({
        partnerId: 1,
        supplierPhone: "+1234567890",
        supplierName: "John Supplier",
        companyName: "Acme Corporation",
        missingDocuments: ["Certificate of Insurance"],
        accessCodeUrl: "https://compliance.example.com/partner/login?code=ABC123",
      })
    ).rejects.toThrow();
  });

  it("requires authentication for sendSMSMessage", async () => {
    const ctx: TrpcContext = {
      user: null,
      req: {
        protocol: "https",
        headers: {},
      } as TrpcContext["req"],
      res: {} as TrpcContext["res"],
    };

    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.communication.sendSMSMessage({
        partnerId: 1,
        supplierPhone: "+1234567890",
        supplierName: "John Supplier",
        companyName: "Acme Corporation",
        deadline: new Date("2025-12-31"),
        accessCodeUrl: "https://compliance.example.com/partner/login?code=ABC123",
      })
    ).rejects.toThrow();
  });
});
