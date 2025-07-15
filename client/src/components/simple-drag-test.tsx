import { useDrag, useDrop } from "react-dnd";
import { Button } from "@/components/ui/button";

const DragItem = ({ id, text }: { id: string; text: string }) => {
  const [{ isDragging }, drag] = useDrag({
    type: "test-item",
    item: { id, text },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  return (
    <div
      ref={drag}
      className={`p-4 bg-blue-100 border border-blue-300 rounded cursor-move ${
        isDragging ? "opacity-50" : ""
      }`}
    >
      {text} {isDragging && "(dragging)"}
    </div>
  );
};

const DropZone = ({ onDrop }: { onDrop: (item: any) => void }) => {
  const [{ isOver }, drop] = useDrop({
    accept: "test-item",
    drop: (item) => {
      console.log("Dropped item:", item);
      onDrop(item);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  return (
    <div
      ref={drop}
      className={`p-8 border-2 border-dashed rounded-lg ${
        isOver ? "border-green-500 bg-green-50" : "border-gray-300"
      }`}
    >
      Drop items here {isOver && "(hovering)"}
    </div>
  );
};

export default function SimpleDragTest() {
  const handleDrop = (item: any) => {
    console.log("Item dropped:", item);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Drag and Drop Test</h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <h4 className="font-medium">Drag Items</h4>
          <DragItem id="1" text="Item 1" />
          <DragItem id="2" text="Item 2" />
          <DragItem id="3" text="Item 3" />
        </div>
        <div className="space-y-2">
          <h4 className="font-medium">Drop Zone</h4>
          <DropZone onDrop={handleDrop} />
        </div>
      </div>
    </div>
  );
}