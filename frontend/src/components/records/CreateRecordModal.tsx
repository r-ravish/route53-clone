'use client';

import React, { useState } from 'react';
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

interface CreateRecordModalProps {
  visible: boolean;
  zoneId: number;
  zoneDomain: string;
  onDismiss: () => void;
  onSuccess: () => void;
}

export default function CreateRecordModal({
  visible,
  zoneId,
  zoneDomain,
  onDismiss,
  onSuccess,
}: CreateRecordModalProps) {
  const [name, setName] = useState('');
  const [recordType, setRecordType] = useState<SelectProps.Option>(RECORD_TYPE_OPTIONS[0]);
  const [value, setValue] = useState('');
  const [ttl, setTtl] = useState('300');
  const [priority, setPriority] = useState('10');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const needsPriority = recordType.value === 'MX' || recordType.value === 'SRV';

  const resetForm = () => {
    setName('');
    setRecordType(RECORD_TYPE_OPTIONS[0]);
    setValue('');
    setTtl('300');
    setPriority('10');
    setError('');
  };

  const getValuePlaceholder = (): string => {
    switch (recordType.value) {
      case 'A': return '192.0.2.1';
      case 'AAAA': return '2001:0db8::1';
      case 'CNAME': return 'target.example.com';
      case 'MX': return 'mail.example.com';
      case 'TXT': return '"v=spf1 include:example.com ~all"';
      case 'NS': return 'ns1.example.com';
      case 'SRV': return '0 5060 sipserver.example.com';
      case 'CAA': return '0 issue "letsencrypt.org"';
      default: return '';
    }
  };

  const getValueDescription = (): string => {
    switch (recordType.value) {
      case 'A': return 'Enter an IPv4 address';
      case 'AAAA': return 'Enter an IPv6 address';
      case 'CNAME': return 'Enter the canonical name (target domain)';
      case 'MX': return 'Enter the mail server hostname';
      case 'TXT': return 'Enter the text value';
      case 'NS': return 'Enter the name server hostname';
      case 'SRV': return 'Enter weight, port, and target (e.g. 0 5060 server.example.com)';
      case 'CAA': return 'Enter flag, tag, and value';
      default: return '';
    }
  };

  const validate = (): string | null => {
    if (!name.trim()) return 'Record name is required.';
    if (!value.trim()) return 'Value is required.';

    const ttlNum = parseInt(ttl, 10);
    if (isNaN(ttlNum) || ttlNum < 1) return 'TTL must be a positive integer.';

    if (needsPriority) {
      const prioNum = parseInt(priority, 10);
      if (isNaN(prioNum) || prioNum < 0 || prioNum > 65535) {
        return 'Priority must be between 0 and 65535.';
      }
    }

    // Type-specific validation
    if (recordType.value === 'A') {
      const ipv4 = /^(\d{1,3}\.){3}\d{1,3}$/;
      if (!ipv4.test(value.trim())) return 'Enter a valid IPv4 address (e.g. 192.0.2.1).';
    }

    return null;
  };

  const handleCreate = async () => {
    setError('');
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setLoading(true);
      await api.post(`/zones/${zoneId}/records`, {
        name: name.trim(),
        record_type: recordType.value,
        value: value.trim(),
        ttl: parseInt(ttl, 10),
        ...(needsPriority ? { priority: parseInt(priority, 10) } : {}),
      });
      resetForm();
      onSuccess();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to create record.';
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
      header={`Create record in ${zoneDomain}`}
      size="medium"
      footer={
        <Box float="right">
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button variant="link" onClick={handleDismiss}>Cancel</Button>
            <Button variant="primary" loading={loading} onClick={handleCreate}>
              Create record
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

        <FormField label="Record name" description={`Subdomain or FQDN within ${zoneDomain}`}>
          <Input
            value={name}
            onChange={({ detail }) => setName(detail.value)}
            placeholder={`www.${zoneDomain}`}
            autoFocus
          />
        </FormField>

        <FormField label="Record type">
          <Select
            selectedOption={recordType}
            onChange={({ detail }) => setRecordType(detail.selectedOption)}
            options={RECORD_TYPE_OPTIONS}
          />
        </FormField>

        <FormField label="Value" description={getValueDescription()}>
          <Input
            value={value}
            onChange={({ detail }) => setValue(detail.value)}
            placeholder={getValuePlaceholder()}
          />
        </FormField>

        <FormField label="TTL (seconds)" description="Time to live for cached responses">
          <Input
            value={ttl}
            type="number"
            onChange={({ detail }) => setTtl(detail.value)}
            placeholder="300"
          />
        </FormField>

        {needsPriority && (
          <FormField
            label="Priority"
            description={`Required for ${recordType.value} records. Lower values = higher priority.`}
          >
            <Input
              value={priority}
              type="number"
              onChange={({ detail }) => setPriority(detail.value)}
              placeholder="10"
            />
          </FormField>
        )}
      </div>
    </Modal>
  );
}
