'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AppShell from '@/components/AppShell';
import Container from '@cloudscape-design/components/container';
import Header from '@cloudscape-design/components/header';
import FormField from '@cloudscape-design/components/form-field';
import Input from '@cloudscape-design/components/input';
import Textarea from '@cloudscape-design/components/textarea';
import Select, { SelectProps } from '@cloudscape-design/components/select';
import Button from '@cloudscape-design/components/button';
import SpaceBetween from '@cloudscape-design/components/space-between';
import Alert from '@cloudscape-design/components/alert';
import Link from '@cloudscape-design/components/link';
import Box from '@cloudscape-design/components/box';
import Toggle from '@cloudscape-design/components/toggle';
import ExpandableSection from '@cloudscape-design/components/expandable-section';
import ColumnLayout from '@cloudscape-design/components/column-layout';
import api from '@/lib/api';
import { useNotifications } from '@/components/Notifications';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const RECORD_TYPE_OPTIONS: SelectProps.Option[] = [
  { label: 'A — Routes traffic to an IPv4 address and some AWS resources', value: 'A' },
  { label: 'AAAA — Routes traffic to an IPv6 address and some AWS resources', value: 'AAAA' },
  { label: 'CNAME — Routes traffic to another domain name', value: 'CNAME' },
  { label: 'MX — Specifies mail servers', value: 'MX' },
  { label: 'TXT — Used to verify email senders and for other purposes', value: 'TXT' },
  { label: 'NS — Delegates a subdomain to a set of name servers', value: 'NS' },
  { label: 'PTR — Maps an IP address to a domain name', value: 'PTR' },
  { label: 'SRV — Specifies a host and port for specific services', value: 'SRV' },
  { label: 'CAA — Restricts CAs that can create SSL/TLS certificates', value: 'CAA' },
];

const ROUTING_POLICY_OPTIONS: SelectProps.Option[] = [
  { label: 'Simple routing', value: 'simple' },
  { label: 'Weighted', value: 'weighted' },
  { label: 'Latency', value: 'latency' },
  { label: 'Failover', value: 'failover' },
  { label: 'Geolocation', value: 'geolocation' },
  { label: 'Multivalue answer', value: 'multivalue' },
];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface HostedZone {
  id: number;
  domain_name: string;
  zone_type: string;
  comment: string | null;
  record_count: number;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function CreateRecordPage() {
  const params = useParams();
  const router = useRouter();
  const zoneId = Number(params.id);
  const { notify } = useNotifications();

  const [zone, setZone] = useState<HostedZone | null>(null);
  const [zoneLoading, setZoneLoading] = useState(true);

  // Form state
  const [name, setName] = useState('');
  const [recordType, setRecordType] = useState<SelectProps.Option>(RECORD_TYPE_OPTIONS[0]);
  const [alias, setAlias] = useState(false);
  const [value, setValue] = useState('');
  const [ttl, setTtl] = useState('300');
  const [priority, setPriority] = useState('');
  const [routingPolicy] = useState<SelectProps.Option>(ROUTING_POLICY_OPTIONS[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const needsPriority = recordType.value === 'MX' || recordType.value === 'SRV';

  // Fetch zone info
  useEffect(() => {
    const fetchZone = async () => {
      try {
        setZoneLoading(true);
        const data = await api.get<HostedZone>(`/zones/${zoneId}`);
        setZone(data);
      } catch {
        setZone(null);
      } finally {
        setZoneLoading(false);
      }
    };
    if (zoneId) fetchZone();
  }, [zoneId]);

  const getValuePlaceholder = (): string => {
    switch (recordType.value) {
      case 'A': return '192.0.2.235';
      case 'AAAA': return '2001:0db8::1';
      case 'CNAME': return 'target.example.com';
      case 'MX': return '10 mail.example.com';
      case 'TXT': return '"v=spf1 include:example.com ~all"';
      case 'NS': return 'ns1.example.com';
      case 'SRV': return '0 5060 sipserver.example.com';
      case 'CAA': return '0 issue "letsencrypt.org"';
      default: return '';
    }
  };

  const handleCreate = async () => {
    setError('');
    if (!value.trim()) {
      setError('Value is required.');
      return;
    }

    try {
      setLoading(true);
      const recordName = name.trim()
        ? `${name.trim()}.${zone?.domain_name}`
        : zone?.domain_name || '';

      await api.post(`/zones/${zoneId}/records`, {
        name: recordName,
        record_type: recordType.value,
        value: value.trim(),
        ttl: parseInt(ttl, 10) || 300,
        ...(needsPriority && priority.trim() ? { priority: parseInt(priority, 10) } : {}),
      });
      notify({ type: 'success', content: 'Record created successfully.' });
      router.push(`/hosted-zones/${zoneId}`);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to create record.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (zoneLoading || !zone) {
    return (
      <AppShell>
        <Box textAlign="center" padding="xxl">
          {zoneLoading ? 'Loading...' : 'Zone not found'}
        </Box>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <SpaceBetween size="l">
        {/* Record creation method expandable */}
        <ExpandableSection
          variant="container"
          headerText="Record creation method"
          defaultExpanded={false}
        >
          <ColumnLayout columns={2}>
            <div>
              <Box fontWeight="bold">Quick create (recommended for expert users)</Box>
              <Box color="text-body-secondary" fontSize="body-s">
                Choose this method if you are confident in the process of creating records and know which options you need.
              </Box>
            </div>
            <div>
              <Box fontWeight="bold">Wizard (recommended for new users)</Box>
              <Box color="text-body-secondary" fontSize="body-s">
                Choose this method if you need more explanations as you create your record.
              </Box>
            </div>
          </ColumnLayout>
        </ExpandableSection>

        {/* Page header */}
        <Header variant="h1" info={<Link variant="info">Info</Link>}>
          Create record
        </Header>

        {error && (
          <Alert type="error" dismissible onDismiss={() => setError('')}>
            {error}
          </Alert>
        )}

        {/* Quick create record card */}
        <Container
          header={
            <Header
              variant="h2"
              actions={<Link variant="primary">Switch to wizard</Link>}
            >
              Quick create record
            </Header>
          }
        >
          {/* Record 1 section */}
          <ExpandableSection
            headerText="Record 1"
            defaultExpanded={true}
            headerActions={<Button disabled>Delete</Button>}
          >
            <SpaceBetween size="l">
              {/* Row 1: Record name + Record type */}
              <ColumnLayout columns={2}>
                <FormField
                  label={
                    <span><strong>Record name</strong> <Link variant="info">Info</Link></span>
                  }
                  constraintText={`Keep blank to create a record for the root domain.`}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ flex: 1 }}>
                      <Input
                        value={name}
                        onChange={({ detail }) => setName(detail.value)}
                        placeholder="subdomain"
                        autoFocus
                      />
                    </div>
                    <Box color="text-body-secondary" fontSize="body-s">
                      {zone.domain_name}
                    </Box>
                  </div>
                </FormField>

                <FormField
                  label={
                    <span><strong>Record type</strong> <Link variant="info">Info</Link></span>
                  }
                >
                  <Select
                    selectedOption={recordType}
                    onChange={({ detail }) => setRecordType(detail.selectedOption)}
                    options={RECORD_TYPE_OPTIONS}
                  />
                </FormField>
              </ColumnLayout>

              {/* Alias toggle */}
              <Toggle
                checked={alias}
                onChange={({ detail }) => setAlias(detail.checked)}
              >
                Alias
              </Toggle>

              {/* Value */}
              <FormField
                label={
                  <span><strong>Value</strong> <Link variant="info">Info</Link></span>
                }
                constraintText="Enter multiple values on separate lines."
              >
                <Textarea
                  value={value}
                  onChange={({ detail }) => setValue(detail.value)}
                  placeholder={getValuePlaceholder()}
                  rows={4}
                />
              </FormField>

              {/* Row 3: TTL + Routing policy */}
              <ColumnLayout columns={2}>
                <FormField
                  label={
                    <span><strong>TTL (seconds)</strong> <Link variant="info">Info</Link></span>
                  }
                  constraintText="Recommended values: 60 to 172800 (two days)."
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ flex: 1 }}>
                      <Input
                        value={ttl}
                        type="number"
                        onChange={({ detail }) => setTtl(detail.value)}
                        placeholder="300"
                      />
                    </div>
                    <SpaceBetween direction="horizontal" size="xxs">
                      <Button variant="normal" onClick={() => setTtl('60')}>1m</Button>
                      <Button variant="normal" onClick={() => setTtl('3600')}>1h</Button>
                      <Button variant="normal" onClick={() => setTtl('86400')}>1d</Button>
                    </SpaceBetween>
                  </div>
                </FormField>

                <FormField
                  label={
                    <span><strong>Routing policy</strong> <Link variant="info">Info</Link></span>
                  }
                >
                  <Select
                    selectedOption={routingPolicy}
                    onChange={() => {}}
                    options={ROUTING_POLICY_OPTIONS}
                  />
                </FormField>
              </ColumnLayout>

              {/* Priority (shown for MX and SRV) */}
              {needsPriority && (
                <FormField
                  label={
                    <span><strong>Priority</strong> <Link variant="info">Info</Link></span>
                  }
                  constraintText="Lower values have higher priority. Range: 0–65535."
                >
                  <div style={{ maxWidth: '200px' }}>
                    <Input
                      value={priority}
                      type="number"
                      onChange={({ detail }) => setPriority(detail.value)}
                      placeholder="10"
                    />
                  </div>
                </FormField>
              )}
            </SpaceBetween>
          </ExpandableSection>

          {/* Add another record button */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
            <Button disabled>Add another record</Button>
          </div>
        </Container>

        {/* Bottom action bar */}
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '12px',
          paddingTop: '8px',
          borderTop: '1px solid #e9ebed',
        }}>
          <Button variant="link" onClick={() => router.push(`/hosted-zones/${zoneId}`)}>
            Cancel
          </Button>
          <Button variant="primary" loading={loading} onClick={handleCreate}>
            Create records
          </Button>
        </div>
      </SpaceBetween>
    </AppShell>
  );
}
