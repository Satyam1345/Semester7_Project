const mongoose = require('mongoose');

const mongoUri = 'mongodb://Satyam:Satyam_mongo@cluster0-shard-00-00.wsysz.mongodb.net:27017,cluster0-shard-00-01.wsysz.mongodb.net:27017,cluster0-shard-00-02.wsysz.mongodb.net:27017/AxonDocs?ssl=true&replicaSet=atlas-618k48-shard-0&authSource=admin&retryWrites=true&w=majority&appName=AxonDocs';

const documentSchema = new mongoose.Schema({
  originalName: String,
  storedName: String,
  size: Number,
  mimeType: String,
  publicUrl: String,
  pages: Number,
}, { _id: false, timestamps: true });

const analysisSchema = new mongoose.Schema({
  extracted_sections: Array,
  subsection_analysis: Array,
  meta: Object,
  durationMs: Number,
}, { _id: false, timestamps: true });

const collectionSchema = new mongoose.Schema({
  collectionId: String,
  userId: String,
  name: String,
  persona: String,
  jobToBeDone: String,
  documents: [documentSchema],
  analysis: analysisSchema,
  status: String,
  lastRunAt: Date,
}, { timestamps: true });

const Collection = mongoose.model('Collection', collectionSchema);

async function run() {
  try {
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    const collections = await Collection.find().sort({ createdAt: -1 }).limit(1).lean();
    if (collections.length === 0) {
      console.log('No collections found');
    } else {
      const col = collections[0];
      console.log('Latest Collection:', col.name, col.collectionId);
      console.log('Analysis present:', !!col.analysis);
      if (col.analysis) {
        console.log('extracted_sections type:', Array.isArray(col.analysis.extracted_sections) ? 'Array' : typeof col.analysis.extracted_sections);
        console.log('extracted_sections length:', col.analysis.extracted_sections ? col.analysis.extracted_sections.length : 0);
        if (col.analysis.extracted_sections && col.analysis.extracted_sections.length > 0) {
            console.log('First section keys:', Object.keys(col.analysis.extracted_sections[0]));
            console.log('First section sample:', JSON.stringify(col.analysis.extracted_sections[0], null, 2));
        }
      }
    }
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

run();
