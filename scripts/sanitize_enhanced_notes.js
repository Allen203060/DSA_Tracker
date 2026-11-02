import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { cleanMarkdownNotes } from '../server/src/utils/cleanMarkdown.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env from atlas-credentials.env or server/.env
dotenv.config({ path: path.join(__dirname, '../server/.env') });

const questionSchema = new mongoose.Schema({
  title: String,
  notes: String,
  enhancedNotes: String
}, { strict: false });

const Question = mongoose.model('Question', questionSchema);

async function sanitizeDatabase(uri, label) {
  console.log(`\n=================================================`);
  console.log(`🔄 Connecting to ${label}...`);
  console.log(`URI: ${uri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@')}`);
  
  try {
    const conn = await mongoose.createConnection(uri).asPromise();
    const DBQuestion = conn.model('Question', questionSchema);

    const questions = await DBQuestion.find({});
    console.log(`Found ${questions.length} total questions.`);

    let updatedCount = 0;
    for (const q of questions) {
      if (!q.enhancedNotes) continue;

      const needsCleaning = q.enhancedNotes.includes('\\n') || 
                            q.enhancedNotes.includes('\\u') || 
                            q.enhancedNotes.includes('\\r') ||
                            q.enhancedNotes.startsWith('\\');

      if (needsCleaning) {
        const cleaned = cleanMarkdownNotes(q.enhancedNotes);
        if (cleaned !== q.enhancedNotes) {
          await DBQuestion.updateOne({ _id: q._id }, { $set: { enhancedNotes: cleaned } });
          updatedCount++;
          console.log(`  ✅ Sanitized: "${q.title}"`);
        }
      }
    }

    console.log(`🎉 Finished ${label}: Cleaned & updated ${updatedCount} question(s).`);
    await conn.close();
  } catch (err) {
    console.error(`❌ Error migrating ${label}:`, err.message);
  }
}

async function run() {
  // 1. Atlas Production Database
  const atlasUri = "mongodb+srv://allenmanoj2006_db_user:daS7p7l2eVOpRu4l@revalgo.0qzuw2m.mongodb.net/revalgo";
  await sanitizeDatabase(atlasUri, 'MongoDB Atlas (Production)');

  // 2. Local Development MongoDB
  const localUri = process.env.MONGO_URI || "mongodb://localhost:27017/dsa_tracker";
  await sanitizeDatabase(localUri, 'Local MongoDB');

  console.log(`\n✨ All database sanitizations completed!`);
  process.exit(0);
}

run();
