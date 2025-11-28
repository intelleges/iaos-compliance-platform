/**
 * Communication Router
 * 
 * tRPC procedures for buyer-initiated supplier contact
 * CRITICAL: Enables buyers to immediately contact suppliers when POs are blocked
 */

import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { sendComplianceReminder } from "../services/sendgrid";
import { sendUrgentComplianceWhatsApp, sendComplianceReminderSMS, sendUrgentContact } from "../services/twilio";

export const communicationRouter = router({
  /**
   * Send email reminder to supplier
   * Use case: Automated reminders or buyer-initiated email
   */
  sendEmailReminder: protectedProcedure
    .input(
      z.object({
        partnerId: z.number(),
        supplierEmail: z.string().email(),
        supplierName: z.string(),
        companyName: z.string(),
        deadline: z.date(),
        missingDocuments: z.array(z.string()),
        accessCodeUrl: z.string().url(),
        urgency: z.enum(["normal", "urgent", "critical"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const result = await sendComplianceReminder({
        supplierEmail: input.supplierEmail,
        supplierName: input.supplierName,
        buyerName: ctx.user.name || "Compliance Team",
        buyerEmail: ctx.user.email || "compliance@company.com",
        companyName: input.companyName,
        deadline: input.deadline,
        missingDocuments: input.missingDocuments,
        accessCodeUrl: input.accessCodeUrl,
        urgency: input.urgency,
      });

      // TODO: Log communication in database
      // await logCommunication({
      //   partnerId: input.partnerId,
      //   userId: ctx.user.id,
      //   channel: 'email',
      //   success: result.success,
      //   ...
      // });

      return result;
    }),

  /**
   * Send WhatsApp message to supplier
   * CRITICAL: Used when PO is blocked and buyer needs immediate response
   */
  sendWhatsAppMessage: protectedProcedure
    .input(
      z.object({
        partnerId: z.number(),
        supplierPhone: z.string(),
        supplierName: z.string(),
        companyName: z.string(),
        missingDocuments: z.array(z.string()),
        accessCodeUrl: z.string().url(),
        poNumber: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const result = await sendUrgentComplianceWhatsApp({
        supplierPhone: input.supplierPhone,
        supplierName: input.supplierName,
        buyerName: ctx.user.name || "Buyer",
        buyerPhone: ctx.user.phone || "",
        companyName: input.companyName,
        missingDocuments: input.missingDocuments,
        accessCodeUrl: input.accessCodeUrl,
        poNumber: input.poNumber,
      });

      // TODO: Log communication in database

      return result;
    }),

  /**
   * Send SMS message to supplier (fallback)
   */
  sendSMSMessage: protectedProcedure
    .input(
      z.object({
        partnerId: z.number(),
        supplierPhone: z.string(),
        supplierName: z.string(),
        companyName: z.string(),
        deadline: z.date(),
        accessCodeUrl: z.string().url(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const result = await sendComplianceReminderSMS({
        supplierPhone: input.supplierPhone,
        supplierName: input.supplierName,
        companyName: input.companyName,
        deadline: input.deadline,
        accessCodeUrl: input.accessCodeUrl,
      });

      // TODO: Log communication in database

      return result;
    }),

  /**
   * Contact supplier via best available channel
   * CRITICAL: One-click contact for urgent PO blocking scenarios
   * 
   * Workflow:
   * 1. Buyer clicks "Contact Supplier Now" on partner row
   * 2. System tries WhatsApp first (98% open rate, instant)
   * 3. Falls back to SMS if WhatsApp fails
   * 4. Sends email as backup
   * 5. Returns which channel(s) succeeded
   */
  contactSupplierUrgent: protectedProcedure
    .input(
      z.object({
        partnerId: z.number(),
        supplierName: z.string(),
        supplierEmail: z.string().email(),
        supplierPhone: z.string().optional(),
        companyName: z.string(),
        missingDocuments: z.array(z.string()),
        accessCodeUrl: z.string().url(),
        poNumber: z.string().optional(),
        deadline: z.date(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const results: {
        email?: { success: boolean; error?: string };
        whatsapp?: { success: boolean; channel?: string; error?: string };
        sms?: { success: boolean; error?: string };
      } = {};

      // Try WhatsApp/SMS first if phone number provided (faster response)
      if (input.supplierPhone) {
        const whatsappResult = await sendUrgentContact({
          supplierPhone: input.supplierPhone,
          supplierName: input.supplierName,
          buyerName: ctx.user.name || "Buyer",
          buyerPhone: ctx.user.phone || "",
          companyName: input.companyName,
          message: `🚨 URGENT: ${ctx.user.name} from ${input.companyName} needs your compliance documents${input.poNumber ? ` to issue PO ${input.poNumber}` : ''}. Missing: ${input.missingDocuments.join(', ')}. Complete here: ${input.accessCodeUrl}. Need help? Call ${ctx.user.phone || 'your buyer'}.`,
          tryWhatsAppFirst: true,
        });

        results.whatsapp = whatsappResult;
      }

      // Always send email as backup/confirmation
      const emailResult = await sendComplianceReminder({
        supplierEmail: input.supplierEmail,
        supplierName: input.supplierName,
        buyerName: ctx.user.name || "Compliance Team",
        buyerEmail: ctx.user.email || "compliance@company.com",
        buyerPhone: ctx.user.phone || undefined,
        companyName: input.companyName,
        deadline: input.deadline,
        missingDocuments: input.missingDocuments,
        accessCodeUrl: input.accessCodeUrl,
        urgency: "critical",
      });

      results.email = emailResult;

      // TODO: Log all communications in database

      return {
        success: results.whatsapp?.success || results.email?.success || false,
        channels: results,
        primaryChannel: results.whatsapp?.success ? results.whatsapp.channel : 'email',
      };
    }),
});
