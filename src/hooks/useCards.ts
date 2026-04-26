// src/features/cards/hooks/useCards.ts
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db/db";
import { cardRepository } from "../db/repositories/cardRepository";

export function useCards() {
  const cards = useLiveQuery(
    () => db.cards.orderBy("order").toArray(),
    [],
    []
  );

  return {
    cards,
    addCard: cardRepository.add,
    updateCard: cardRepository.update,
    deleteCard: cardRepository.delete,
    reorderCards: cardRepository.reorder,
    clearAll: cardRepository.clearAll,
  };
}