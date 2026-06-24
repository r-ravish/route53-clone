'use client';

import React, { useState } from 'react';
import Modal from '@cloudscape-design/components/modal';
import FormField from '@cloudscape-design/components/form-field';
import Input from '@cloudscape-design/components/input';
import Select, { SelectProps } from '@cloudscape-design/components/select';
import Textarea from '@cloudscape-design/components/textarea';
import Button from '@cloudscape-design/components/button';
import Alert from '@cloudscape-design/components/alert';
import Box from '@cloudscape-design/components/box';
import api from '@/lib/api';

const ZONE_TYPE_OPTIONS: SelectProps.Option[] = [
  { label: 'Public hosted zone', value: 'Public' },
  { label: 'Private hosted zone', value: 'Private' },
];

interface CreateZoneModalProps {
  visible: boolean;
  onDismiss: () => void;
  onSuccess: () => void;
}

export default function CreateZoneModal({
  visible,
  onDismiss,
  onSuccess,
}: CreateZoneModalProps) {
  const [domainName, setDomainName] = useState('');
  const [comment, setComment] = useState('');
  const [zoneType, setZoneType] = useState<SelectProps.Option>(ZONE_TYPE_OPTIONS[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const resetForm = () => {
    setDomainName('');
    setComment('');
    setZoneType(ZONE_TYPE_OPTIONS[0]);
    setError('');
  };

  const handleCreate = async () => {
    setError('');

    if (!domainName.trim()) {
      setError('Domain name is required.');
      return;
    }

    try {
      setLoading(true);
      await api.post('/zones', {
        domain_name: domainName.trim(),
        zone_type: zoneType.value,
        comment: comment.trim() || null,
      });
      resetForm();
      onSuccess();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to create hosted zone.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    resetForm();
    onDismiss();
  };

  return (
    <Modal
      visible={visible}
      onDismiss={handleDismiss}
      header="Create hosted zone"
      footer={
        <Box float="right">
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button variant="link" onClick={handleDismiss}>
              Cancel
            </Button>
            <Button variant="primary" loading={loading} onClick={handleCreate}>
              Create hosted zone
            </Button>
          </div>
        </Box>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {error && (
          <Alert type="error" dismissible onDismiss={() => setError('')}>
            {error}
          </Alert>
        )}

        <FormField
          label="Domain name"
          description="The name of the domain. For example, example.com"
        >
          <Input
            value={domainName}
            onChange={({ detail }) => setDomainName(detail.value)}
            placeholder="example.com"
            autoFocus
          />
        </FormField>

        <FormField label="Comment" description="An optional comment about this zone">
          <Textarea
            value={comment}
            onChange={({ detail }) => setComment(detail.value)}
            placeholder="Optional description"
          />
        </FormField>

        <FormField label="Type" description="Select the zone type">
          <Select
            selectedOption={zoneType}
            onChange={({ detail }) => setZoneType(detail.selectedOption)}
            options={ZONE_TYPE_OPTIONS}
          />
        </FormField>
      </div>
    </Modal>
  );
}
