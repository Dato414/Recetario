"use client";

import {Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader} from "@heroui/react";

type ConfirmDeleteModalProps = {
  open: boolean;
  title?: string;
  message?: string;
  name?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function ConfirmDeleteModal({
  open,
  title = "Eliminar ingrediente",
  message = "¿Seguro que querés eliminar este ingrediente?",
  name,
  confirmLabel = "Eliminar",
  cancelLabel = "Cancelar",
  onCancel,
  onConfirm,
}: ConfirmDeleteModalProps) {
  return (
    <Modal isOpen={open} onClose={onCancel} backdrop="blur">
      <ModalContent>
        {() => (
          <>
            <ModalHeader className="flex flex-col gap-1">{title}</ModalHeader>
            <ModalBody>
              <p>
                {message} {name ? <>(<b>{name}</b>)</> : null}
              </p>
            </ModalBody>
            <ModalFooter>
              <Button variant="light" onPress={onCancel}>
                {cancelLabel}
              </Button>
              <Button color="danger" onPress={onConfirm}>
                {confirmLabel}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
