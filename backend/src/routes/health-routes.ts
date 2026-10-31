import { Router, Request, Response } from 'express';
import { isNeo4jActive } from '../database/neo4j-connection.js';
import { inMemoryGraph } from '../graph/in-memory-graph.js';
import { vectorStore } from '../vector/vector-store.js';

const router = Router();

router.get('/health', async (req: Request, res: Response) => {
  const neo4jStatus = isNeo4jActive() ? 'connected' : 'offline (in-memory fallback active)';
  const graphStats = inMemoryGraph.getStats();
  const vectorStats = vectorStore.getStats();

  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      neo4j: {
        status: neo4jStatus,
        is_connected: isNeo4jActive(),
      },
      graph_engine: {
        nodes_count: graphStats.nodesCount,
        edges_count: graphStats.edgesCount,
        patients_count: graphStats.patientCount,
      },
      vector_store: {
        total_notes_indexed: vectorStats.totalIndexed,
        patients_indexed: vectorStats.uniquePatients,
      },
    },
  });
});

export default router;
