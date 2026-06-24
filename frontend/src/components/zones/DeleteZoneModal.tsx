'use client';

import React, { useState } from 'react';
import Modal from '@cloudscape-design/components/modal';
import Button from '@cloudscape-design/components/button';
import Alert from '@cloudscape-design/components/alert';
import Box from '@cloudscape-design/components/box';
import api from '@/lib/api';

interface DeleteZoneModalProps {
  visible: boolean;
  zone: { id: number; domain_name: string } | null;
  onDismiss: () => void;
  onSuccess: () => void;
}

export default function DeleteZoneModal({
  visible,
  zone,
  onDismiss,
  onSuccess,
}: DeleteZoneModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDelete = async () => {
    if (!zone) return;
    setError('');

    try {
      setLoading(true);
      await api.delete(`/zones/${zone.id}`);
      onSuccess();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to delete hosted zone.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      onDismiss={onDismiss}
      header="Delete hosted zone"
      footer={
        <Box float="right">
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button variant="link" onClick={onDismiss}>
              Cancel
            </Button>
            <Button variant="primary" loading={loading} onClick={handleDelete}>
              Delete
            </Button>
          </div>
        </Box>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {error && (
          <Alert type="error" dismissible onDismiss={() => setError('')}>
            {error}
          </Alert>
        )}
        <Box variant="p">
          Are you sure you want to delete the hosted zone{' '}
          <strong>{zone?.domain_name}</strong>? This action will permanently
          delete the zone and all of its DNS records.
        </Box>
        <Alert type="warning">This action cannot be undone.</Alert>
      </div>
    </Modal>
  );
}
