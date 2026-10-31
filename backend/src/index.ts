import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import healthRoutes from './routes/health-routes.js';
import patientRoutes from './routes/patient-routes.js';
import graphRoutes from './routes/graph-routes.js';
import vectorRoutes from './routes/vector-routes.js';
import admissionRoutes from './routes/admission-routes.js';
import { seedKnowledgeGraph } from './ingestion/seed.js';
import { vectorStore } from './vector/vector-store.js';
import { graphService } from './graph/graph-service.js';
import { closeNeo4jDriver } from './database/neo4j-connection.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json());

// Routes
app.use('/api', healthRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/graph', graphRoutes);
app.use('/api/vector', vectorRoutes);
app.use('/api/admissions', admissionRoutes);

// Root greeting
app.get('/', (req, res) => {
  res.json({
    name: 'MedGraph API',
    description: 'Agentic Clinical Investigation Platform - GraphRAG Backend',
    version: '1.0.0',
    documentation: '/api/health',
  });
});

// Server Initialization
export async function startServer() {
  console.log('[MedGraph Server] Booting up...');

  // 1. Ingest/Seed synthetic dataset
  try {
    const seedResult = await seedKnowledgeGraph();
    console.log('[MedGraph Server] Knowledge graph initialized:', seedResult);

    // 2. Pre-index clinical notes in vector store
    const notes = await graphService.getPatientClinicalNotes('P001');
    const allNotes = [
      ...notes,
      ...(await graphService.getPatientClinicalNotes('P002')),
      ...(await graphService.getPatientClinicalNotes('P003')),
      ...(await graphService.getPatientClinicalNotes('P004')),
      ...(await graphService.getPatientClinicalNotes('P005')),
    ];
    await vectorStore.indexClinicalNotes(allNotes);
    console.log(`[MedGraph Server] Vector store pre-warmed with ${allNotes.length} notes.`);
  } catch (err: any) {
    console.error(`[MedGraph Server] Seeding error: ${err.message}`);
  }

  const server = app.listen(PORT, () => {
    console.log(`[MedGraph Server] Running at http://localhost:${PORT}`);
  });

  // Graceful shutdown
  const shutdown = async () => {
    console.log('[MedGraph Server] Shutting down gracefully...');
    await closeNeo4jDriver();
    server.close(() => {
      console.log('[MedGraph Server] Closed remaining connections.');
      process.exit(0);
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  return { app, server };
}

// Start if invoked directly
if (process.argv[1]?.endsWith('index.ts') || process.argv[1]?.endsWith('index.js')) {
  startServer();
}

export default app;
