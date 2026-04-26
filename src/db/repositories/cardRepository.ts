import { db } from "../db";
import type { Card } from "../schema";

export const cardRepository = {
  getAll() {
    return db.cards.orderBy("createdAt").reverse().toArray();
  },

  async add(card: Omit<Card, "id">) {
    const last = await db.cards.orderBy("order").last();
    return db.cards.add({ ...card, order: (last?.order ?? -1) + 1 });
  },

  update(id: number, changes: Partial<Card>) {
    return db.cards.update(id, {
      ...changes
    });
  },

  delete(id: number) {
    return db.cards.delete(id);
  },

  clearAll() {
    return db.cards.clear();
  },

  async reorder(updates: { id: number; order: number }[]) {
    await db.transaction("rw", db.cards, async () => {
      for (const { id, order } of updates) {
        await db.cards.update(id, { order });
      }
    });
  },
};