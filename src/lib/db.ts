import { prisma } from './prisma';

/**
 * Execute raw SQL queries using Prisma
 * @param options - Query options containing the SQL query and values
 * @returns Query results
 */
export async function query<T = unknown>({ query, values = [] }: { query: string; values?: unknown[] }): Promise<T[]> {
  try {
    // Use Prisma's $queryRawUnsafe for parameterized queries
    const result = (await prisma.$queryRawUnsafe(query, ...values)) as T[];
    return result;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

/**
 * Export prisma client for direct usage
 */
export { prisma };
