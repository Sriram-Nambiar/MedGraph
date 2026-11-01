import neo4j, { Driver, Session } from 'neo4j-driver';
import dotenv from 'dotenv';

dotenv.config();

const NEO4J_URI = process.env.NEO4J_URI || 'neo4j+s://b708ea32.databases.neo4j.io';
const NEO4J_USER = process.env.NEO4J_USER || process.env.NEO4J_USERNAME || 'b708ea32';
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD || 'IrC6SwejubhgkaDbkBzpXfOypE0TXB0gnZnCInhWm2c';
const NEO4J_DATABASE = process.env.NEO4J_DATABASE || 'b708ea32';

let driver: Driver | null = null;
let isConnected = false;

export function getNeo4jDriver(): Driver | null {
  if (!driver) {
    try {
      driver = neo4j.driver(NEO4J_URI, neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD), {
        maxConnectionLifetime: 3 * 60 * 60 * 1000, // 3 hours
        maxConnectionPoolSize: 50,
        connectionTimeout: 10000,
        connectionAcquisitionTimeout: 20000,
        logging: {
          level: 'warn',
          logger: (level, message) => console.log(`[Neo4j ${level}] ${message}`),
        },
      });
    } catch (err: any) {
      console.warn(`[Neo4j] Failed to construct driver: ${err.message}`);
      driver = null;
    }
  }
  return driver;
}

export async function testNeo4jConnection(): Promise<boolean> {
  const drv = getNeo4jDriver();
  if (!drv) {
    isConnected = false;
    return false;
  }

  try {
    const serverInfo = await drv.getServerInfo();
    console.log(`[Neo4j] Connected successfully to ${serverInfo.address} (${serverInfo.agent})`);
    isConnected = true;
    return true;
  } catch (err: any) {
    console.warn(`[Neo4j] Database offline or unreachable at ${NEO4J_URI}. Error: ${err.message}`);
    isConnected = false;
    return false;
  }
}

export function isNeo4jActive(): boolean {
  return isConnected;
}

export function getNeo4jSession(): Session | null {
  const drv = getNeo4jDriver();
  if (!drv || !isConnected) return null;
  if (NEO4J_DATABASE && NEO4J_DATABASE !== 'default') {
    return drv.session({ database: NEO4J_DATABASE });
  }
  return drv.session();
}

export async function closeNeo4jDriver(): Promise<void> {
  if (driver) {
    await driver.close();
    driver = null;
    isConnected = false;
    console.log('[Neo4j] Driver connection closed.');
  }
}
