'use client';

import React, { useState, useEffect } from 'react';
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

export interface ZoneData {
  id: number;
  domain_name: string;
  zone_type: string;
  comment: string | null;
}

interface EditZoneModalProps {
  visible: boolean;
  zone: ZoneData | null;
  onDismiss: () => void;
  onSuccess: () => void;
}

export default function EditZoneModal({
  visible,
  zone,
  onDismiss,
  onSuccess,
}: EditZoneModalProps) {
  const [domainName, setDomainName] = useState('');
  const [comment, setComment] = useState('');
  const [zoneType, setZoneType] = useState<SelectProps.Option>(ZONE_TYPE_OPTIONS[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Populate form when zone prop changes
  useEffect(() => {
    if (zone) {
      setDomainName(zone.domain_name);
      setComment(zone.comment ?? '');
      setZoneType(
        ZONE_TYPE_OPTIONS.find((o) => o.value === zone.zone_type) ??
          ZONE_TYPE_OPTIONS[0]
      );
      setError('');
    }
  }, [zone]);

  const handleUpdate = async () => {
    if (!zone) return;
    setError('');

    if (!domainName.trim()) {
      setError('Domain name is required.');
      return;
    }

    try {
      setLoading(true);
      await api.put(`/zones/${zone.id}`, {
        domain_name: domainName.trim(),
        zone_type: zoneType.value,
        comment: comment.trim() || null,
      });
      onSuccess();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to update hosted zone.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      onDismiss={onDismiss}
      header="Edit hosted zone"
      footer={
        <Box float="right">
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button variant="link" onClick={onDismiss}>
              Cancel
            </Button>
            <Button variant="primary" loading={loading} onClick={handleUpdate}>
              Save changes
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

        <FormField label="Domain name">
          <Input
            value={domainName}
            onChange={({ detail }) => setDomainName(detail.value)}
            placeholder="example.com"
          />
        </FormField>

        <FormField label="Comment">
          <Textarea
            value={comment}
            onChange={({ detail }) => setComment(detail.value)}
            placeholder="Optional description"
          />
        </FormField>

        <FormField label="Type">
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
