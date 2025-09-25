// components/addIngredent.tsx
"use client";
import { useId } from "react";
import {
  Button, Input, Select, SelectItem,
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure,
} from "@heroui/react";
import { FcCancel } from "react-icons/fc";

export type Unit = "gr" | "ml" | "u";

type Props = {
  id: string;
  name: string;
  amount: number | "";
  unit: Unit;
  onChange: (id: string, field: "name" | "amount" | "unit", value: string) => void;
  onDelete: (id: string) => void;
  showHeader?: boolean;
};

export default function NewIngredent({
  id, name, amount, unit, onChange, onDelete, showHeader = false,
}: Props) {
  const uid = useId();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const confirmDelete = () => {
    onDelete(id);
    onClose();
  };

  return (
    <>
      <div className="w-full grid grid-cols-12 gap-3 items-center">
        <Input
          label="Ingrediente"
          type="text"
          variant="bordered"
          className="col-span-5"
          value={name}
          onChange={(e) => onChange(id, "name", e.target.value)}
          classNames={{ inputWrapper: "h-14" }}
        />
        <Input
          label="Cantidad"
          type="number"
          inputMode="decimal"
          min={0}
          step="any"
          variant="bordered"
          className="col-span-3"
          value={amount === "" ? "" : String(amount)}
          onChange={(e) => onChange(id, "amount", e.target.value)}
          classNames={{ inputWrapper: "h-14" }}
        />
        <Select
          label="Unidad"
          variant="bordered"
          className="col-span-3"
          selectedKeys={new Set([unit])}
          onSelectionChange={(keys) => {
            const val = Array.from(keys)[0] as Unit;
            onChange(id, "unit", val);
          }}
          classNames={{ trigger: "h-14" }}
          aria-labelledby={`unidad-${uid}`}
        >
          <SelectItem key="gr">gr</SelectItem>
          <SelectItem key="ml">ml</SelectItem>
          <SelectItem key="u">u</SelectItem>
        </Select>
        <div className="col-span-1 flex items-center justify-end">
          <Button
            isIconOnly
            size="sm"
            variant="light"
            color="danger"
            aria-label="Eliminar ingrediente"
            onPress={onOpen}
          >
            <FcCancel size={26} />
          </Button>
        </div>
      </div>
      <Modal backdrop="blur" isOpen={isOpen} onClose={onClose}>
        <ModalContent>
          {(close) => (
            <>
              <ModalHeader className="flex flex-col gap-1">Eliminar ingrediente</ModalHeader>
              <ModalBody>
                <p>
                  ¿Seguro que querés eliminar{" "}
                  <span className="font-semibold">{name?.trim() || "este ingrediente"}</span>?
                </p>
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={close}>Cancelar</Button>
                <Button color="danger" onPress={confirmDelete}>Eliminar</Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}


export function isRowComplete(row: { name: string; amount: number | ""; unit: Unit }) {
  return row.name.trim().length > 0 && row.amount !== "";
}
