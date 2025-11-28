import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { partnerQuestionnaires } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

(async () => {
  const conn = await mysql.createConnection(process.env.DATABASE_URL!);
  const db = drizzle(conn);
  
  await db.update(partnerQuestionnaires)
    .set({ status: 6 })
    .where(eq(partnerQuestionnaires.accessCode, 'DDSETM9RNAHB'));
  
  console.log('Updated assignment status to 6 (INVITED)');
  await conn.end();
})();
