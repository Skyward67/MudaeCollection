import { useState } from "react";
import {
  DndContext,
  closestCenter,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  rectSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useCards } from "../hooks/useCards";
import type { Card } from "../db/schema";

type FullCard = Card & { id: number };

function CardContent({
  card,
  onDelete,
}: {
  card: FullCard;
  onDelete: (id: number) => void;
}) {
  return (
    <>
      {card.image && (
        <img
          src={card.image}
          alt={card.name}
          className="w-full h-40 object-cover rounded-lg mb-3"
        />
      )}
      <h2 className="font-bold">{card.name}</h2>
      <p>{card.serie}</p>
      <p className="text-sm opacity-70">{card.value}</p>
      <button
        className="mt-3 rounded bg-black px-3 py-1 text-white cursor-pointer"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={() => onDelete(card.id)}
      >
        Delete
      </button>
    </>
  );
}

function SortableCard({
  card,
  onDelete,
}: {
  card: FullCard;
  onDelete: (id: number) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: card.id });

  return (
    <article
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`rounded-xl border p-4 shadow-sm cursor-grab active:cursor-grabbing select-none transition-opacity ${
        isDragging ? "opacity-0" : ""
      }`}
      {...attributes}
      {...listeners}
    >
      <CardContent card={card} onDelete={onDelete} />
    </article>
  );
}

export function CardGrid() {
  const { cards, deleteCard, reorderCards } = useCards();
  const [activeCard, setActiveCard] = useState<FullCard | null>(null);

  const validCards = (cards ?? []).filter(c => c.id !== undefined) as FullCard[];

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  function handleDragStart(event: DragStartEvent) {
    setActiveCard(validCards.find((c) => c.id === event.active.id) ?? null);
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveCard(null);
    if (!over || active.id === over.id) return;

    const oldIndex = validCards.findIndex((c) => c.id === active.id);
    const newIndex = validCards.findIndex((c) => c.id === over.id);
    const reordered = arrayMove(validCards, oldIndex, newIndex);

    await reorderCards(reordered.map((c, i) => ({ id: c.id, order: i })));
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={validCards.map((c) => c.id)} strategy={rectSortingStrategy}>
        <div className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-4">
          {validCards.map((card) => (
            <SortableCard key={card.id} card={card} onDelete={deleteCard} />
          ))}
        </div>
      </SortableContext>

      <DragOverlay dropAnimation={{ duration: 180, easing: "ease" }}>
        {activeCard ? (
          <article className="rounded-xl border p-4 shadow-2xl cursor-grabbing select-none bg-white rotate-1 scale-105">
            <CardContent card={activeCard} onDelete={deleteCard} />
          </article>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
