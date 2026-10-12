import type { EntityManager } from "typeorm";

// better-sqlite3 shares one query runner per connection. Every attendance writer
// uses this queue to prevent overlapping requests nesting each other's transaction.
const writers = new WeakMap<object, Promise<void>>();

export function attendanceTransaction<T>(
  manager: EntityManager,
  work: (transaction: EntityManager) => Promise<T>,
): Promise<T> {
  const previous = writers.get(manager.connection) ?? Promise.resolve();
  const current = previous.then(() => manager.transaction(work));
  writers.set(
    manager.connection,
    current.then(
      () => undefined,
      () => undefined,
    ),
  );
  return current;
}
