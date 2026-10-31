import {
  Patient,
  Doctor,
  Encounter,
  Admission,
  Condition,
  Medication,
  Prescription,
  LabTest,
  LabResult,
  ClinicalNote,
  GraphNode,
  GraphRelationship,
} from '../schemas/types.js';

export class InMemoryGraphEngine {
  private nodes: Map<string, GraphNode> = new Map();
  private relationships: Map<string, GraphRelationship> = new Map();

  // Auxiliary index by patientId
  private patientNodes: Map<string, Set<string>> = new Map();
  private patientEdges: Map<string, Set<string>> = new Map();

  constructor() {
    this.clear();
  }

  public clear(): void {
    this.nodes.clear();
    this.relationships.clear();
    this.patientNodes.clear();
    this.patientEdges.clear();
  }

  public addNode(id: string, label: string, properties: Record<string, any>, patientId?: string): void {
    this.nodes.set(id, { id, label, properties });

    if (patientId) {
      if (!this.patientNodes.has(patientId)) {
        this.patientNodes.set(patientId, new Set());
      }
      this.patientNodes.get(patientId)!.add(id);
    }
  }

  public addRelationship(
    id: string,
    source: string,
    target: string,
    type: string,
    properties: Record<string, any> = {},
    patientId?: string
  ): void {
    this.relationships.set(id, { id, source, target, type, properties });

    if (patientId) {
      if (!this.patientEdges.has(patientId)) {
        this.patientEdges.set(patientId, new Set());
      }
      this.patientEdges.get(patientId)!.add(id);
    }
  }

  public getNode(id: string): GraphNode | undefined {
    return this.nodes.get(id);
  }

  public getRelationship(id: string): GraphRelationship | undefined {
    return this.relationships.get(id);
  }

  public getStats(): { nodesCount: number; edgesCount: number; patientCount: number } {
    let patientCount = 0;
    for (const node of this.nodes.values()) {
      if (node.label === 'Patient') patientCount++;
    }
    return {
      nodesCount: this.nodes.size,
      edgesCount: this.relationships.size,
      patientCount,
    };
  }

  /**
   * Retrieves the complete connected sub-graph for a given patient.
   * Strictly enforces patient-level scoping.
   */
  public getPatientSubGraph(patientId: string): { nodes: GraphNode[]; relationships: GraphRelationship[] } {
    const nodeIds = this.patientNodes.get(patientId) || new Set();
    const edgeIds = this.patientEdges.get(patientId) || new Set();

    const resultNodes: GraphNode[] = [];
    const resultEdges: GraphRelationship[] = [];

    // Ensure patient node itself is included
    const patientNode = this.nodes.get(patientId);
    if (patientNode) {
      resultNodes.push(patientNode);
    }

    for (const nId of nodeIds) {
      const node = this.nodes.get(nId);
      if (node && node.id !== patientId) {
        resultNodes.push(node);
      }
    }

    for (const eId of edgeIds) {
      const edge = this.relationships.get(eId);
      if (edge) {
        resultEdges.push(edge);
      }
    }

    return { nodes: resultNodes, relationships: resultEdges };
  }

  /**
   * Retrieves all encounters for a patient, sorted chronologically.
   */
  public getPatientEncounters(patientId: string): Encounter[] {
    const encounters: Encounter[] = [];
    for (const node of this.nodes.values()) {
      if (node.label === 'Encounter' && node.properties.patientId === patientId) {
        encounters.push(node.properties as Encounter);
      }
    }
    return encounters.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  /**
   * Retrieves all admissions for a patient, sorted chronologically.
   */
  public getPatientAdmissions(patientId: string): Admission[] {
    const admissions: Admission[] = [];
    for (const node of this.nodes.values()) {
      if (node.label === 'Admission' && node.properties.patientId === patientId) {
        admissions.push(node.properties as Admission);
      }
    }
    return admissions.sort((a, b) => new Date(a.admissionDate).getTime() - new Date(b.admissionDate).getTime());
  }

  /**
   * Retrieves medications prescribed across admissions or encounters for a patient.
   */
  public getPatientMedications(patientId: string): Array<{ prescription: Prescription; medication: Medication }> {
    const result: Array<{ prescription: Prescription; medication: Medication }> = [];
    for (const edge of this.relationships.values()) {
      if (edge.type === 'PRESCRIBES') {
        const rxNode = this.nodes.get(edge.source);
        const medNode = this.nodes.get(edge.target);

        if (rxNode && medNode && rxNode.properties.patientId === patientId) {
          result.push({
            prescription: rxNode.properties as Prescription,
            medication: medNode.properties as Medication,
          });
        }
      }
    }
    return result;
  }

  /**
   * Retrieves all laboratory results for a patient over time.
   */
  public getPatientLabResults(patientId: string, testId?: string): Array<{ result: LabResult; test: LabTest }> {
    const results: Array<{ result: LabResult; test: LabTest }> = [];

    for (const edge of this.relationships.values()) {
      if (edge.type === 'OF_TEST') {
        const resNode = this.nodes.get(edge.source);
        const testNode = this.nodes.get(edge.target);

        if (resNode && testNode && resNode.properties.patientId === patientId) {
          if (!testId || resNode.properties.testId === testId) {
            results.push({
              result: resNode.properties as LabResult,
              test: testNode.properties as LabTest,
            });
          }
        }
      }
    }

    return results.sort((a, b) => new Date(a.result.date).getTime() - new Date(b.result.date).getTime());
  }

  /**
   * Retrieves all conditions documented for a patient.
   */
  public getPatientConditions(patientId: string): Condition[] {
    const conditions: Condition[] = [];
    for (const node of this.nodes.values()) {
      if (node.label === 'Condition' && node.properties.patientId === patientId) {
        conditions.push(node.properties as Condition);
      }
    }
    return conditions;
  }

  /**
   * Retrieves all clinical notes for a patient.
   */
  public getPatientClinicalNotes(patientId: string): ClinicalNote[] {
    const notes: ClinicalNote[] = [];
    for (const node of this.nodes.values()) {
      if (node.label === 'ClinicalNote' && node.properties.patientId === patientId) {
        notes.push(node.properties as ClinicalNote);
      }
    }
    return notes.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  /**
   * Controlled parameterized Graph Search by query terms across patient's sub-graph.
   */
  public searchGraph(patientId: string, query: string): {
    nodes: GraphNode[];
    relationships: GraphRelationship[];
    matchedEntities: Array<{ category: string; description: string; source_records: string[] }>;
  } {
    const tokens = query.toLowerCase().split(/\s+/).filter((t) => t.length > 2);
    const subGraph = this.getPatientSubGraph(patientId);

    const matchedNodes = new Set<string>();
    const matchedEdges = new Set<string>();
    const matchedEntities: Array<{ category: string; description: string; source_records: string[] }> = [];

    // Search nodes
    for (const node of subGraph.nodes) {
      const propText = (node.label + ' ' + JSON.stringify(node.properties)).toLowerCase();
      const hits = tokens.filter((t) => {
        if (propText.includes(t)) return true;
        if (t.endsWith('s') && t.length > 3 && propText.includes(t.slice(0, -1))) return true;
        return false;
      });

      if (hits.length > 0 || tokens.length === 0) {
        matchedNodes.add(node.id);

        let desc = '';
        let cat = node.label;
        let sourceRecords: string[] = [];

        if (node.label === 'Medication') {
          desc = `Medication: ${node.properties.name} (${node.properties.category})`;
        } else if (node.label === 'Prescription') {
          desc = `Prescription: ${node.properties.action} ${node.properties.dosage} (${node.properties.frequency}) - Reason: ${node.properties.reason}`;
          if (node.properties.sourceRecordId) sourceRecords.push(node.properties.sourceRecordId);
        } else if (node.label === 'Condition') {
          desc = `Condition: ${node.properties.name} (Status: ${node.properties.status})`;
        } else if (node.label === 'LabResult') {
          desc = `Lab Result: ${node.properties.testId} = ${node.properties.value} ${node.properties.unit} (${node.properties.flag})`;
          if (node.properties.sourceRecordId) sourceRecords.push(node.properties.sourceRecordId);
        } else if (node.label === 'Admission') {
          desc = `Admission: ${node.properties.id} on ${node.properties.admissionDate.split('T')[0]} - Reason: ${node.properties.reason}`;
          if (node.properties.dischargeSummaryId) sourceRecords.push(node.properties.dischargeSummaryId);
        } else if (node.label === 'ClinicalNote') {
          desc = `Clinical Note: ${node.properties.title} (${node.properties.noteType})`;
          if (node.properties.sourceRecordId) sourceRecords.push(node.properties.sourceRecordId);
        }

        if (desc) {
          matchedEntities.push({
            category: cat,
            description: desc,
            source_records: sourceRecords,
          });
        }
      }
    }

    // Include connecting edges between matched nodes
    for (const edge of subGraph.relationships) {
      if (matchedNodes.has(edge.source) || matchedNodes.has(edge.target)) {
        matchedEdges.add(edge.id);
        matchedNodes.add(edge.source);
        matchedNodes.add(edge.target);
      }
    }

    const finalNodes = subGraph.nodes.filter((n) => matchedNodes.has(n.id));
    const finalEdges = subGraph.relationships.filter((e) => matchedEdges.has(e.id));

    return {
      nodes: finalNodes,
      relationships: finalEdges,
      matchedEntities,
    };
  }
}

export const inMemoryGraph = new InMemoryGraphEngine();
