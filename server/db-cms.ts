import { eq, and } from "drizzle-orm";
import { cmsContent } from "../drizzle/schema";
import { getDb } from "./db";

/**
 * Get CMS content by language code
 * Returns a key-value map of all CMS content for the specified language
 * Falls back to English ('en') if content not found in requested language
 */
export async function getCMSContent(languageCode: string = 'en', enterpriseId?: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[CMS] Database not available");
    return {};
  }

  try {
    // Build query conditions
    const conditions = [
      eq(cmsContent.languageCode, languageCode),
      eq(cmsContent.isActive, true),
    ];

    // Add enterprise filter if provided, otherwise get global content (enterpriseId IS NULL)
    if (enterpriseId) {
      conditions.push(eq(cmsContent.enterpriseId, enterpriseId));
    }

    // Fetch CMS content
    const content = await db
      .select()
      .from(cmsContent)
      .where(and(...conditions));

    // Convert to key-value map
    const contentMap: Record<string, string> = {};
    for (const item of content) {
      contentMap[item.key] = item.text;
    }

    // If no content found for requested language and it's not English, fallback to English
    if (Object.keys(contentMap).length === 0 && languageCode !== 'en') {
      console.log(`[CMS] No content found for language '${languageCode}', falling back to English`);
      return getCMSContent('en', enterpriseId);
    }

    return contentMap;
  } catch (error) {
    console.error("[CMS] Error fetching CMS content:", error);
    return {};
  }
}

/**
 * Get a single CMS value by key
 */
export async function getCMSValue(
  key: string,
  languageCode: string = 'en',
  enterpriseId?: number
): Promise<string | null> {
  const db = await getDb();
  if (!db) {
    console.warn("[CMS] Database not available");
    return null;
  }

  try {
    const conditions = [
      eq(cmsContent.key, key),
      eq(cmsContent.languageCode, languageCode),
      eq(cmsContent.isActive, true),
    ];

    if (enterpriseId) {
      conditions.push(eq(cmsContent.enterpriseId, enterpriseId));
    }

    const result = await db
      .select()
      .from(cmsContent)
      .where(and(...conditions))
      .limit(1);

    if (result.length > 0) {
      return result[0].text;
    }

    // Fallback to English if not found
    if (languageCode !== 'en') {
      return getCMSValue(key, 'en', enterpriseId);
    }

    return null;
  } catch (error) {
    console.error(`[CMS] Error fetching CMS value for key '${key}':`, error);
    return null;
  }
}

/**
 * Get CMS content for a specific page
 */
export async function getCMSContentByPage(
  page: string,
  languageCode: string = 'en',
  enterpriseId?: number
) {
  const db = await getDb();
  if (!db) {
    console.warn("[CMS] Database not available");
    return {};
  }

  try {
    const conditions = [
      eq(cmsContent.page, page),
      eq(cmsContent.languageCode, languageCode),
      eq(cmsContent.isActive, true),
    ];

    if (enterpriseId) {
      conditions.push(eq(cmsContent.enterpriseId, enterpriseId));
    }

    const content = await db
      .select()
      .from(cmsContent)
      .where(and(...conditions));

    const contentMap: Record<string, string> = {};
    for (const item of content) {
      contentMap[item.key] = item.text;
    }

    return contentMap;
  } catch (error) {
    console.error(`[CMS] Error fetching CMS content for page '${page}':`, error);
    return {};
  }
}
