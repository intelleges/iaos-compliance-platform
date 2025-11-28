/**
 * Communications Service Integration Tests
 * 
 * Validates SendGrid and Twilio API credentials
 */

import { describe, expect, it } from "vitest";
import { verifySendGridConfig } from "./services/sendgrid";
import { verifyTwilioConfig } from "./services/twilio";

describe("SendGrid Integration", () => {
  it("should have valid SendGrid configuration", async () => {
    const result = await verifySendGridConfig();
    
    expect(result.configured).toBe(true);
    
    if (result.configured) {
      expect(result.valid).toBe(true);
      if (!result.valid) {
        console.error("SendGrid validation error:", result.error);
      }
    }
  });
});

describe("Twilio Integration", () => {
  it("should have valid Twilio configuration", async () => {
    const result = await verifyTwilioConfig();
    
    expect(result.configured).toBe(true);
    
    if (result.configured) {
      expect(result.valid).toBe(true);
      if (!result.valid) {
        console.error("Twilio validation error:", result.error);
      }
      
      // Log capabilities
      console.log("Twilio capabilities:", {
        whatsappEnabled: result.whatsappEnabled,
        smsEnabled: result.smsEnabled,
      });
    }
  });
});
