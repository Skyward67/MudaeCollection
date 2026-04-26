import Dexie, { type Table } from "dexie";
import type { Card, Collection } from "./schema";

class CardCollectionDB extends Dexie {
  cards!: Table<Card, number>;
  collections!: Table<Collection, number>;

  constructor() {
    super("cardCollectionDB");

    this.version(1).stores({
      cards: "++id, name, image, serie, value",
      collections: "++id, name",
    });

    this.version(2).stores({
      cards: "++id, name, image, serie, value, order",
      collections: "++id, name",
    }).upgrade(async (tx) => {
      const cards = await tx.table("cards").orderBy("id").toArray();
      await Promise.all(
        cards.map((card, i) => tx.table("cards").update(card.id, { order: i }))
      );
    });
  }
}

export const db = new CardCollectionDB();