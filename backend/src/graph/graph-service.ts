import { inMemoryGraph } from './in-memory-graph.js';
import { getNeo4jSession, isNeo4jActive } from '../database/neo4j-connection.js';
import {
  Patient,
  Admission,
  Encounter,
  Prescription,
  Medication,
  Condition,
  LabResult,
  LabTest,
  ClinicalNote,
  GraphNode,
  GraphRelationship,
  GraphSearchResult,
} from '../schemas/types.js';

export class GraphService {
  /**
   * Retrieves the full patient subgraph.
   * Parameterized and patient-scoped.
   */
  public async getPatientGraph(patientId: string): Promise<{ nodes: GraphNode[]; relationships: GraphRelationship[] }> {
    if (isNeo4jActive()) {
      const session = getNeo4jSession();
      if (session) {
        try {
          const cypher = `
            MATCH (p:Patient {id: $patientId})
            OPTIONAL MATCH (p)-[r1:HAS_ADMISSION]->(a:Admission)
            OPTIONAL MATCH (p)-[r2:HAS_ENCOUNTER]->(e:Encounter)
            OPTIONAL MATCH (e)-[r3:HAS_PRESCRIPTION]->(rx:Prescription)-[r4:PRESCRIBES]->(m:Medication)
            OPTIONAL MATCH (p)-[r5:HAS_CONDITION]->(c:Condition)
            OPTIONAL MATCH (e)-[r6:HAS_LAB_RESULT]->(lr:LabResult)-[r7:OF_TEST]->(lt:LabTest)
            OPTIONAL MATCH (e)-[r8:HAS_NOTE]->(cn:ClinicalNote)
            OPTIONAL MATCH (e)-[r9:ATTENDED_BY]->(d:Doctor)
            RETURN p, a, e, rx, m, c, lr, lt, cn, d, r1, r2, r3, r4, r5, r6, r7, r8, r9
          `;

          const result = await session.run(cypher, { patientId });
          const nodesMap = new Map<string, GraphNode>();
          const relsMap = new Map<string, GraphRelationship>();

          for (const record of result.records) {
            for (const key of ['p', 'a', 'e', 'rx', 'm', 'c', 'lr', 'lt', 'cn', 'd']) {
              const node = record.get(key);
              if (node && !nodesMap.has(node.properties.id)) {
                nodesMap.set(node.properties.id, {
                  id: node.properties.id,
                  label: node.labels[0],
                  properties: node.properties,
                });
              }
            }
            for (const key of ['r1', 'r2', 'r3', 'r4', 'r5', 'r6', 'r7', 'r8', 'r9']) {
              const rel = record.get(key);
              if (rel && !relsMap.has(rel.identity.toString())) {
                relsMap.set(rel.identity.toString(), {
                  id: rel.identity.toString(),
                  source: rel.start.toString(),
                  target: rel.end.toString(),
                  type: rel.type,
                  properties: rel.properties,
                });
              }
            }
          }

          if (nodesMap.size > 0) {
            return {
              nodes: Array.from(nodesMap.values()),
              relationships: Array.from(relsMap.values()),
            };
          }
        } catch (err: any) {
          console.warn(`[GraphService] Neo4j query error: ${err.message}. Falling back to in-memory store.`);
        } finally {
          await session.close();
        }
      }
    }

    return inMemoryGraph.getPatientSubGraph(patientId);
  }

  /**
   * Controlled graph search across patient entities.
   */
  public async searchPatientGraph(patientId: string, query: string): Promise<GraphSearchResult> {
    const searchRes = inMemoryGraph.searchGraph(patientId, query);

    const summary = `Found ${searchRes.nodes.length} connected entities and ${searchRes.relationships.length} relationships for patient ${patientId} matching "${query}".`;

    return {
      patient_id: patientId,
      query,
      nodes: searchRes.nodes,
      relationships: searchRes.relationships,
      summary,
      findings: searchRes.matchedEntities,
    };
  }

  public async getPatientEncounters(patientId: string): Promise<Encounter[]> {
    return inMemoryGraph.getPatientEncounters(patientId);
  }

  public async getPatientAdmissions(patientId: string): Promise<Admission[]> {
    return inMemoryGraph.getPatientAdmissions(patientId);
  }

  public async getPatientMedications(patientId: string): Promise<Array<{ prescription: Prescription; medication: Medication }>> {
    return inMemoryGraph.getPatientMedications(patientId);
  }

  public async getPatientLabResults(patientId: string, testId?: string): Promise<Array<{ result: LabResult; test: LabTest }>> {
    return inMemoryGraph.getPatientLabResults(patientId, testId);
  }

  public async getPatientConditions(patientId: string): Promise<Condition[]> {
    return inMemoryGraph.getPatientConditions(patientId);
  }

  public async getPatientClinicalNotes(patientId: string): Promise<ClinicalNote[]> {
    return inMemoryGraph.getPatientClinicalNotes(patientId);
  }
}

export const graphService = new GraphService();
