'use client';

import React, { useState, useEffect } from 'react';
import Modal from '@cloudscape-design/components/modal';
import FormField from '@cloudscape-design/components/form-field';
import Input from '@cloudscape-design/components/input';
import Select, { SelectProps } from '@cloudscape-design/components/select';
import Button from '@cloudscape-design/components/button';
import Alert from '@cloudscape-design/components/alert';
import Box from '@cloudscape-design/components/box';
import api from '@/lib/api';

const RECORD_TYPE_OPTIONS: SelectProps.Option[] = [
  { label: 'A — IPv4 address', value: 'A' },
  { label: 'AAAA — IPv6 address', value: 'AAAA' },
  { label: 'CNAME — Canonical name', value: 'CNAME' },
  { label: 'MX — Mail exchange', value: 'MX' },
  { label: 'TXT — Text record', value: 'TXT' },
  { label: 'NS — Name server', value: 'NS' },
  { label: 'PTR — Pointer', value: 'PTR' },
  { label: 'SRV — Service locator', value: 'SRV' },
  { label: 'CAA — Certification Authority', value: 'CAA' },
];

export interface RecordData {
  id: number;
  name: string;
  record_type: string;
  value: string;
  ttl: number;
  priority: number | null;
}

interface EditRecordModalProps {
  visible: boolean;
  zoneId: number;
  record: RecordData | null;
  onDismiss: () => void;
  onSuccess: () => void;
}

export default function EditRecordModal({
  visible,
  zoneId,
  record,
  onDismiss,
  onSuccess,
}: EditRecordModalProps) {
  const [name, setName] = useState('');
  const [recordType, setRecordType] = useState<SelectProps.Option>(RECORD_TYPE_OPTIONS[0]);
  const [value, setValue] = useState('');
  const [ttl, setTtl] = useState('300');
  const [priority, setPriority] = useState('10');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const needsPriority = recordType.value === 'MX' || recordType.value === 'SRV';

  // Populate form when record prop changes
  useEffect(() => {
    if (record) {
      setName(record.name);
      setRecordType(
        RECORD_TYPE_OPTIONS.find((o) => o.value === record.record_type) ??
          RECORD_TYPE_OPTIONS[0]
      );
      setValue(record.value);
      setTtl(String(record.ttl));
      setPriority(record.priority !== null ? String(record.priority) : '10');
      setError('');
    }
  }, [record]);

  const handleUpdate = async () => {
    if (!record) return;
    setError('');

    if (!name.trim()) { setError('Record name is required.'); return; }
    if (!value.trim()) { setError('Value is required.'); return; }

    const ttlNum = parseInt(ttl, 10);
    if (isNaN(ttlNum) || ttlNum < 1) { setError('TTL must be a positive integer.'); return; }

    if (needsPriority) {
      const prioNum = parseInt(priority, 10);
      if (isNaN(prioNum) || prioNum < 0 || prioNum > 65535) {
        setError('Priority must be between 0 and 65535.');
        return;
      }
    }

    try {
      setLoading(true);
      await api.put(`/zones/${zoneId}/records/${record.id}`, {
        name: name.trim(),
        record_type: recordType.value,
        value: value.trim(),
        ttl: ttlNum,
        ...(needsPriority ? { priority: parseInt(priority, 10) } : {}),
      });
      onSuccess();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to update record.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      onDismiss={onDismiss}
      header="Edit record"
      size="medium"
      footer={
        <Box float="right">
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button variant="link" onClick={onDismiss}>Cancel</Button>
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

        <FormField label="Record name">
          <Input value={name} onChange={({ detail }) => setName(detail.value)} />
        </FormField>

        <FormField label="Record type">
          <Select
            selectedOption={recordType}
            onChange={({ detail }) => setRecordType(detail.selectedOption)}
            options={RECORD_TYPE_OPTIONS}
          />
        </FormField>

        <FormField label="Value">
          <Input value={value} onChange={({ detail }) => setValue(detail.value)} />
        </FormField>

        <FormField label="TTL (seconds)">
          <Input
            value={ttl}
            type="number"
            onChange={({ detail }) => setTtl(detail.value)}
          />
        </FormField>

        {needsPriority && (
          <FormField label="Priority">
            <Input
              value={priority}
              type="number"
              onChange={({ detail }) => setPriority(detail.value)}
            />
          </FormField>
        )}
      </div>
    </Modal>
  );
}
