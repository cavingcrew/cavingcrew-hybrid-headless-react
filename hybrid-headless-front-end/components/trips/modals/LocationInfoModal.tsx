"use client";

import {
  Alert,
  Button,
  CopyButton,
  Group,
  Modal,
  Text,
  Textarea,
  Title,
} from "@mantine/core";
import { IconCopy, IconInfoCircle } from "@tabler/icons-react";
import React from "react";
import type { Trip } from "../../../types/api";

interface LocationInfoModalProps {
  opened: boolean;
  onClose: () => void;
  locationInfoText: string;
  onTextChange: (text: string) => void;
  trip: Trip;
}

export function LocationInfoModal({
  opened,
  onClose,
  locationInfoText,
  onTextChange,
  trip,
}: LocationInfoModalProps) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={<Title order={4}>Location Info Message</Title>}
      size="lg"
    >
      <Alert
        icon={<IconInfoCircle size={16} />}
        color="blue"
        title="Group Message"
        mb="md"
      >
        This message provides participants with essential location and gear information. You can share it with the group before the trip.
      </Alert>

      <Textarea
        value={locationInfoText}
        onChange={(e) => onTextChange(e.currentTarget.value)}
        minRows={10}
        autosize
        mb="md"
        styles={{
          input: {
            whiteSpace: "pre-line",
          },
        }}
      />

      <Group justify="space-between" mt="md">
        <Button onClick={onClose}>Close</Button>
        <CopyButton value={locationInfoText} timeout={2000}>
          {({ copied, copy }) => (
            <Button
              color={copied ? "teal" : "blue"}
              onClick={copy}
              leftSection={<IconCopy size={16} />}
            >
              {copied ? "Copied to clipboard" : "Copy to clipboard"}
            </Button>
          )}
        </CopyButton>
      </Group>
    </Modal>
  );
}
