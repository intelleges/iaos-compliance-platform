/**
 * Email Service Tests
 * Tests for SendGrid email integration and approval workflow email templates
 */

import { describe, expect, it, beforeEach, vi } from "vitest";
import {
  sendEmail,
  getReviewRequestEmailTemplate,
  getApprovalEmailTemplate,
  getRejectionEmailTemplate,
} from "./_core/email";

describe("Email Service", () => {
  describe("Email Templates", () => {
    it("should generate review request email template", () => {
      const html = getReviewRequestEmailTemplate({
        reviewerName: "John Doe",
        partnerName: "Acme Corp",
        protocolName: "FAR 52.219-1",
        touchpointTitle: "Q1 Certification",
        submittedDate: "2025-01-15",
        dashboardUrl: "https://compliance.example.com/reviewer-dashboard",
      });

      expect(html).toContain("John Doe");
      expect(html).toContain("Acme Corp");
      expect(html).toContain("FAR 52.219-1");
      expect(html).toContain("Q1 Certification");
      expect(html).toContain("2025-01-15");
      expect(html).toContain("https://compliance.example.com/reviewer-dashboard");
      expect(html).toContain("Compliance Review Required");
    });

    it("should generate approval email template", () => {
      const html = getApprovalEmailTemplate({
        partnerName: "Acme Corp",
        protocolName: "FAR 52.219-1",
        touchpointTitle: "Q1 Certification",
        reviewerName: "Jane Smith",
        approvedDate: "2025-01-20",
        notes: "All requirements met",
      });

      expect(html).toContain("Acme Corp");
      expect(html).toContain("FAR 52.219-1");
      expect(html).toContain("Q1 Certification");
      expect(html).toContain("Jane Smith");
      expect(html).toContain("2025-01-20");
      expect(html).toContain("All requirements met");
      expect(html).toContain("Submission Approved");
    });

    it("should generate approval email template without notes", () => {
      const html = getApprovalEmailTemplate({
        partnerName: "Acme Corp",
        protocolName: "FAR 52.219-1",
        touchpointTitle: "Q1 Certification",
        reviewerName: "Jane Smith",
        approvedDate: "2025-01-20",
      });

      expect(html).toContain("Acme Corp");
      expect(html).not.toContain("Reviewer Notes");
    });

    it("should generate rejection email template", () => {
      const html = getRejectionEmailTemplate({
        partnerName: "Acme Corp",
        protocolName: "FAR 52.219-1",
        touchpointTitle: "Q1 Certification",
        reviewerName: "Jane Smith",
        rejectedDate: "2025-01-20",
        notes: "Missing required documentation",
        dashboardUrl: "https://compliance.example.com/supplier",
      });

      expect(html).toContain("Acme Corp");
      expect(html).toContain("FAR 52.219-1");
      expect(html).toContain("Q1 Certification");
      expect(html).toContain("Jane Smith");
      expect(html).toContain("2025-01-20");
      expect(html).toContain("Missing required documentation");
      expect(html).toContain("https://compliance.example.com/supplier");
      expect(html).toContain("Submission Requires Revision");
    });

    it("should include HTML structure in all templates", () => {
      const reviewHtml = getReviewRequestEmailTemplate({
        reviewerName: "Test",
        partnerName: "Test",
        protocolName: "Test",
        touchpointTitle: "Test",
        submittedDate: "Test",
        dashboardUrl: "Test",
      });

      const approvalHtml = getApprovalEmailTemplate({
        partnerName: "Test",
        protocolName: "Test",
        touchpointTitle: "Test",
        reviewerName: "Test",
        approvedDate: "Test",
      });

      const rejectionHtml = getRejectionEmailTemplate({
        partnerName: "Test",
        protocolName: "Test",
        touchpointTitle: "Test",
        reviewerName: "Test",
        rejectedDate: "Test",
        notes: "Test",
        dashboardUrl: "Test",
      });

      // All templates should have proper HTML structure
      expect(reviewHtml).toContain("<!DOCTYPE html>");
      expect(reviewHtml).toContain("<html>");
      expect(reviewHtml).toContain("</html>");

      expect(approvalHtml).toContain("<!DOCTYPE html>");
      expect(approvalHtml).toContain("<html>");
      expect(approvalHtml).toContain("</html>");

      expect(rejectionHtml).toContain("<!DOCTYPE html>");
      expect(rejectionHtml).toContain("<html>");
      expect(rejectionHtml).toContain("</html>");
    });
  });

  describe("sendEmail Function", () => {
    it("should export sendEmail function", () => {
      expect(sendEmail).toBeDefined();
      expect(typeof sendEmail).toBe("function");
    });

    it("should accept valid email options", async () => {
      // This test validates the function signature
      // Actual sending is tested in integration tests
      const options = {
        to: "test@example.com",
        subject: "Test Subject",
        html: "<p>Test Content</p>",
      };

      // Function should accept these options without throwing
      expect(() => {
        sendEmail(options);
      }).not.toThrow();
    });

    it("should accept multiple recipients", async () => {
      const options = {
        to: ["test1@example.com", "test2@example.com"],
        subject: "Test Subject",
        html: "<p>Test Content</p>",
      };

      expect(() => {
        sendEmail(options);
      }).not.toThrow();
    });

    it("should accept optional cc and bcc", async () => {
      const options = {
        to: "test@example.com",
        subject: "Test Subject",
        html: "<p>Test Content</p>",
        cc: "cc@example.com",
        bcc: ["bcc1@example.com", "bcc2@example.com"],
      };

      expect(() => {
        sendEmail(options);
      }).not.toThrow();
    });

    it("should accept custom from address", async () => {
      const options = {
        to: "test@example.com",
        subject: "Test Subject",
        html: "<p>Test Content</p>",
        from: "custom@example.com",
      };

      expect(() => {
        sendEmail(options);
      }).not.toThrow();
    });
  });

  describe("Email Template Content", () => {
    it("should use branded colors in review request template", () => {
      const html = getReviewRequestEmailTemplate({
        reviewerName: "Test",
        partnerName: "Test",
        protocolName: "Test",
        touchpointTitle: "Test",
        submittedDate: "Test",
        dashboardUrl: "Test",
      });

      // Should have blue branding
      expect(html).toContain("#1e40af"); // Header background
      expect(html).toContain("#3b82f6"); // Button color
    });

    it("should use green colors in approval template", () => {
      const html = getApprovalEmailTemplate({
        partnerName: "Test",
        protocolName: "Test",
        touchpointTitle: "Test",
        reviewerName: "Test",
        approvedDate: "Test",
      });

      // Should have green branding for approval
      expect(html).toContain("#10b981"); // Header background
    });

    it("should use red colors in rejection template", () => {
      const html = getRejectionEmailTemplate({
        partnerName: "Test",
        protocolName: "Test",
        touchpointTitle: "Test",
        reviewerName: "Test",
        rejectedDate: "Test",
        notes: "Test",
        dashboardUrl: "Test",
      });

      // Should have red branding for rejection
      expect(html).toContain("#ef4444"); // Header background
    });

    it("should include call-to-action buttons", () => {
      const reviewHtml = getReviewRequestEmailTemplate({
        reviewerName: "Test",
        partnerName: "Test",
        protocolName: "Test",
        touchpointTitle: "Test",
        submittedDate: "Test",
        dashboardUrl: "https://test.com",
      });

      const rejectionHtml = getRejectionEmailTemplate({
        partnerName: "Test",
        protocolName: "Test",
        touchpointTitle: "Test",
        reviewerName: "Test",
        rejectedDate: "Test",
        notes: "Test",
        dashboardUrl: "https://test.com",
      });

      // Review request should have "Review Submission" button
      expect(reviewHtml).toContain("Review Submission");
      expect(reviewHtml).toContain('href="https://test.com"');

      // Rejection should have "Revise Submission" button
      expect(rejectionHtml).toContain("Revise Submission");
      expect(rejectionHtml).toContain('href="https://test.com"');
    });

    it("should include footer disclaimers", () => {
      const html = getReviewRequestEmailTemplate({
        reviewerName: "Test",
        partnerName: "Test",
        protocolName: "Test",
        touchpointTitle: "Test",
        submittedDate: "Test",
        dashboardUrl: "Test",
      });

      expect(html).toContain("automated notification");
      expect(html).toContain("Federal Compliance Management System");
    });
  });
});
