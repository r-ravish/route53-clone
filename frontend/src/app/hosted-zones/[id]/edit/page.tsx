'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AppShell from '@/components/AppShell';
import Container from '@cloudscape-design/components/container';
import Header from '@cloudscape-design/components/header';
import FormField from '@cloudscape-design/components/form-field';
import Textarea from '@cloudscape-design/components/textarea';
import Button from '@cloudscape-design/components/button';
import SpaceBetween from '@cloudscape-design/components/space-between';
import Alert from '@cloudscape-design/components/alert';
import Link from '@cloudscape-design/components/link';
import Box from '@cloudscape-design/components/box';
import api from '@/lib/api';
import { useNotifications } from '@/components/Notifications';

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

export default function EditHostedZonePage() {
  const params = useParams();
  const router = useRouter();
  const zoneId = Number(params.id);
  const { notify } = useNotifications();

  const [zone, setZone] = useState<HostedZone | null>(null);
  const [zoneLoading, setZoneLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch zone info
  useEffect(() => {
    const fetchZone = async () => {
      try {
        setZoneLoading(true);
        const data = await api.get<HostedZone>(`/zones/${zoneId}`);
        setZone(data);
        setComment(data.comment || '');
      } catch {
        setZone(null);
      } finally {
        setZoneLoading(false);
      }
    };
    if (zoneId) fetchZone();
  }, [zoneId]);

  const handleSave = async () => {
    if (!zone) return;
    setError('');

    try {
      setLoading(true);
      await api.put(`/zones/${zone.id}`, {
        domain_name: zone.domain_name,
        zone_type: zone.zone_type,
        comment: comment.trim() || null,
      });
      notify({
        type: 'success',
        content: `${zone.domain_name} was successfully updated.\nHosted zone details were successfully updated.`,
      });
      router.push(`/hosted-zones/${zoneId}`);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to update hosted zone.';
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
        {/* Page header */}
        <Header variant="h1" info={<Link variant="info">Info</Link>}>
          Edit {zone.domain_name}
        </Header>

        {error ? (
          <Alert type="error" dismissible onDismiss={() => setError('')}>
            {error}
          </Alert>
        ) : null}

        {/* Edit hosted zone card */}
        <Container
          header={
            <Header
              variant="h2"
              description="A hosted zone is a container that holds information about how you want to route traffic for a domain, such as example.com, and its subdomains."
            >
              Edit hosted zone
            </Header>
          }
        >
          <SpaceBetween size="l">
            {/* Domain name (read-only) */}
            <div>
              <Box variant="awsui-key-label"><strong>Domain name</strong></Box>
              <div>{zone.domain_name}</div>
            </div>

            {/* Hosted zone ID (read-only) */}
            <div>
              <Box variant="awsui-key-label"><strong>Hosted zone ID</strong></Box>
              <div>Z0438733EJ4926FTGYOK</div>
            </div>

            {/* Record count (read-only) */}
            <div>
              <Box variant="awsui-key-label"><strong>Record count</strong></Box>
              <div>{zone.record_count}</div>
            </div>

            {/* Type (read-only) */}
            <div>
              <Box variant="awsui-key-label"><strong>Type</strong></Box>
              <div>{zone.zone_type} hosted zone</div>
            </div>

            {/* Description (editable) */}
            <FormField
              label={
                <span>
                  <strong>Description — optional</strong>{' '}
                  <Link variant="info">Info</Link>
                </span>
              }
              description="This value lets you distinguish hosted zones that have the same name."
              constraintText={`The description can have up to 256 characters. ${comment.length}/256`}
            >
              <Textarea
                value={comment}
                onChange={({ detail }) => {
                  if (detail.value.length <= 256) setComment(detail.value);
                }}
                placeholder="The hosted zone is used for..."
                rows={3}
              />
            </FormField>
          </SpaceBetween>
        </Container>

        {/* Tags card */}
        <Container
          header={
            <Header
              variant="h2"
              info={<Link variant="info">Info</Link>}
              description="Apply tags to hosted zones to help organize and identify them."
            >
              Tags
            </Header>
          }
        >
          <SpaceBetween size="s">
            <Box color="text-body-secondary">No tags associated with the resource.</Box>
            <div>
              <Button>Add tag</Button>
            </div>
            <Box color="text-body-secondary" fontSize="body-s">
              You can add up to 50 more tags.
            </Box>
          </SpaceBetween>
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
          <Button variant="primary" loading={loading} onClick={handleSave}>
            Save changes
          </Button>
        </div>
      </SpaceBetween>
    </AppShell>
  );
}
