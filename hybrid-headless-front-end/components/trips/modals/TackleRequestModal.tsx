'use client';

import React from 'react';
import { Modal, Title, Alert, Text, Group, Button, Textarea, CopyButton } from '@mantine/core';
import { IconInfoCircle, IconCopy } from '@tabler/icons-react';
import type { Trip } from '../../../types/api';

interface TackleRequestModalProps {
  opened: boolean;
  onClose: () => void;
  tackleRequestText: string;
  onTextChange: (text: string) => void;
  trip: Trip;
}

export function TackleRequestModal({ opened, onClose, tackleRequestText, onTextChange, trip }: TackleRequestModalProps) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Title order={4}>
          Tackle Manager Request
        </Title>
      }
      size="lg"
    >
      <Alert
        icon={<IconInfoCircle size={16} />}
        color="teal"
        title="Tackle Request"
        mb="md"
      >
        This message summarizes the gear needed for your trip. Send it to the tackle manager to request equipment.
      </Alert>

      <Text fw={500} mb="xs">Required Gear:</Text>
      <Text mb="md" style={{ whiteSpace: 'pre-line' }}>
        {trip.acf.event_gear_required ?
          typeof trip.acf.event_gear_required === 'string' ?
            trip.acf.event_gear_required
              .replace(/<br\s*\/?>/gi, '\n\n')
              .replace(/<\/p>\s*<p>/gi, '\n\n')
              .replace(/<\/?p>/gi, '\n\n')
              .replace(/\n{3,}/g, '\n\n') :
            String(trip.acf.event_gear_required) :
          'None specified'}
      </Text>

      <Textarea
        value={tackleRequestText}
        onChange={(e) => onTextChange(e.currentTarget.value)}
        minRows={10}
        autosize
        mb="md"
        styles={{
          input: {
            whiteSpace: 'pre-line'
          }
        }}
      />

      <Group justify="space-between" mt="md">
        <Button onClick={onClose}>
          Close
        </Button>
        <CopyButton value={tackleRequestText} timeout={2000}>
          {({ copied, copy }) => (
            <Button
              color={copied ? 'teal' : 'blue'}
              onClick={copy}
              leftSection={<IconCopy size={16} />}
            >
              {copied ? 'Copied to clipboard' : 'Copy to clipboard'}
            </Button>
          )}
        </CopyButton>
      </Group>
    </Modal>
  );
}
