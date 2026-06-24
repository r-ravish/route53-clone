'use client';

import React, { useState } from 'react';
import Modal from '@cloudscape-design/components/modal';
import Button from '@cloudscape-design/components/button';
import Alert from '@cloudscape-design/components/alert';
import Box from '@cloudscape-design/components/box';
import api from '@/lib/api';

interface DeleteRecordModalProps {
  visible: boolean;
  zoneId: number;
  record: { id: number; name: string; record_type: string } | null;
  onDismiss: () => void;
  onSuccess: () => void;
}

export default function DeleteRecordModal({
  visible,
  zoneId,
  record,
  onDismiss,
  onSuccess,
}: DeleteRecordModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDelete = async () => {
    if (!record) return;
    setError('');

    try {
      setLoading(true);
      await api.delete(`/zones/${zoneId}/records/${record.id}`);
      onSuccess();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to delete record.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      onDismiss={onDismiss}
      header="Delete record"
      footer={
        <Box float="right">
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button variant="link" onClick={onDismiss}>Cancel</Button>
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
          Are you sure you want to delete the <strong>{record?.record_type}</strong> record{' '}
          <strong>{record?.name}</strong>? This action cannot be undone.
        </Box>
        <Alert type="warning">
          Deleting this record may affect DNS resolution for your domain.
        </Alert>
      </div>
    </Modal>
  );
}
