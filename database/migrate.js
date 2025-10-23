// Migration script to create model knowledge tables
import { sql } from '../src/lib/database';
import fs from 'fs';
import path from 'path';

async function runMigration() {
  try {
    console.log('🚀 Running model knowledge schema migration...');
    
    // Read the schema file
    const schemaPath = path.join(__dirname, 'model-knowledge-schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Split by semicolons and execute each statement
    const statements = schema
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    for (const statement of statements) {
      if (statement.includes('DO $$')) {
        // Handle DO blocks specially
        const fullBlock = statement + (statement.includes('END $$') ? '' : '; END $$');
        console.log('Executing DO block...');
        await sql.unsafe(fullBlock);
      } else if (statement.trim()) {
        console.log(`Executing: ${statement.substring(0, 50)}...`);
        await sql.unsafe(statement);
      }
    }
    
    console.log('✅ Migration completed successfully!');
    
    // Test the tables
    const result = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name IN ('model_performance', 'content_patterns', 'feedback_analysis')
    `;
    
    console.log('📊 Created tables:', result.map(r => r.table_name));
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    process.exit(0);
  }
}

runMigration();
