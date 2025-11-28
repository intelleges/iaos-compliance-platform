/**
 * Partner Batch Load Database Operations
 * 
 * Handles batch insert/update of partner records with re-load behavior per INT.DOC.64 Section 7.3:
 * - Same PARTNER_INTERNAL_ID + different data → UPDATE
 * - Same PARTNER_INTERNAL_ID + same data → SKIP
 * - New PARTNER_INTERNAL_ID → CREATE
 * - Deactivated partner + new load → REACTIVATE
 */

import { eq, and } from 'drizzle-orm';
import { getDb } from './db';
import { partners } from '../drizzle/schema';
import type { ParsedPartner } from './services/partner-batch-parser';

export interface BatchLoadResult {
  created: number;
  updated: number;
  skipped: number;
  reactivated: number;
  errors: Array<{
    rowNumber: number;
    partnerInternalId: string;
    error: string;
  }>;
}

/**
 * Load partners in batch with intelligent re-load behavior
 */
export async function loadPartnerBatch(
  parsedPartners: ParsedPartner[],
  enterpriseId: number
): Promise<BatchLoadResult> {
  const db = await getDb();
  if (!db) {
    throw new Error('Database not available');
  }

  const result: BatchLoadResult = {
    created: 0,
    updated: 0,
    skipped: 0,
    reactivated: 0,
    errors: [],
  };

  for (const partner of parsedPartners) {
    try {
      // Check if partner exists with this internal ID
      const existing = await db
        .select()
        .from(partners)
        .where(
          and(
            eq(partners.enterpriseId, enterpriseId),
            eq(partners.internalId, partner.partnerInternalId)
          )
        )
        .limit(1);

      if (existing.length === 0) {
        // NEW PARTNER - CREATE
        await db.insert(partners).values({
          enterpriseId,
          internalId: partner.partnerInternalId,
          name: partner.partnerName,
          dunsNumber: partner.partnerDuns || null,
          
          // Primary contact
          firstName: partner.pocFirstName,
          lastName: partner.pocLastName,
          title: partner.pocTitle || null,
          phone: partner.pocPhone || null,
          email: partner.pocEmail,
          
          // Address
          address1: partner.addressOne || null,
          address2: partner.addressTwo || null,
          city: partner.city || null,
          state: partner.state || null,
          zipcode: partner.zipcode || null,
          countryCode: partner.country || null,
          fax: partner.contactFax || null,
          province: partner.province || null,
          
          // Metadata
          active: true,
        });
        
        result.created++;
      } else {
        const existingPartner = existing[0];
        
        // Check if partner was deactivated
        if (!existingPartner!.active) {
          // REACTIVATE
          await db
            .update(partners)
            .set({
              active: true,
              name: partner.partnerName,
              dunsNumber: partner.partnerDuns || null,
              firstName: partner.pocFirstName,
              lastName: partner.pocLastName,
              title: partner.pocTitle || null,
              phone: partner.pocPhone || null,
              email: partner.pocEmail,
              address1: partner.addressOne || null,
              address2: partner.addressTwo || null,
              city: partner.city || null,
              state: partner.state || null,
              zipcode: partner.zipcode || null,
              countryCode: partner.country || null,
              fax: partner.contactFax || null,
              province: partner.province || null,
            })
            .where(eq(partners.id, existingPartner!.id));
          
          result.reactivated++;
        } else {
          // Check if data has changed
          const hasChanges = 
            existingPartner!.name !== partner.partnerName ||
            existingPartner!.dunsNumber !== (partner.partnerDuns || null) ||
            existingPartner!.firstName !== partner.pocFirstName ||
            existingPartner!.lastName !== partner.pocLastName ||
            existingPartner!.title !== (partner.pocTitle || null) ||
            existingPartner!.phone !== (partner.pocPhone || null) ||
            existingPartner!.email !== partner.pocEmail ||
            existingPartner!.address1 !== (partner.addressOne || null) ||
            existingPartner!.address2 !== (partner.addressTwo || null) ||
            existingPartner!.city !== (partner.city || null) ||
            existingPartner!.state !== (partner.state || null) ||
            existingPartner!.zipcode !== (partner.zipcode || null) ||
            existingPartner!.countryCode !== (partner.country || null) ||
            existingPartner!.fax !== (partner.contactFax || null) ||
            existingPartner!.province !== (partner.province || null);

          if (hasChanges) {
            // UPDATE
            await db
              .update(partners)
              .set({
                name: partner.partnerName,
                dunsNumber: partner.partnerDuns || null,
                firstName: partner.pocFirstName,
                lastName: partner.pocLastName,
                title: partner.pocTitle || null,
                phone: partner.pocPhone || null,
                email: partner.pocEmail,
                address1: partner.addressOne || null,
                address2: partner.addressTwo || null,
                city: partner.city || null,
                state: partner.state || null,
                zipcode: partner.zipcode || null,
                countryCode: partner.country || null,
                fax: partner.contactFax || null,
                province: partner.province || null,
              })
              .where(eq(partners.id, existingPartner!.id));
            
            result.updated++;
          } else {
            // SKIP (no changes)
            result.skipped++;
          }
        }
      }
    } catch (error) {
      result.errors.push({
        rowNumber: partner.rowNumber,
        partnerInternalId: partner.partnerInternalId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return result;
}

/**
 * Get existing partner by internal ID
 */
export async function getPartnerByInternalId(
  enterpriseId: number,
  internalId: string
) {
  const db = await getDb();
  if (!db) {
    throw new Error('Database not available');
  }

  const result = await db
    .select()
    .from(partners)
    .where(
      and(
        eq(partners.enterpriseId, enterpriseId),
        eq(partners.internalId, internalId)
      )
    )
    .limit(1);

  return result.length > 0 ? result[0] : null;
}
