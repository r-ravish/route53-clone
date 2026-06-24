'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/AppShell';
import Container from '@cloudscape-design/components/container';
import Header from '@cloudscape-design/components/header';
import FormField from '@cloudscape-design/components/form-field';
import Input from '@cloudscape-design/components/input';
import Textarea from '@cloudscape-design/components/textarea';
import Button from '@cloudscape-design/components/button';
import SpaceBetween from '@cloudscape-design/components/space-between';
import Alert from '@cloudscape-design/components/alert';
import Link from '@cloudscape-design/components/link';
import Box from '@cloudscape-design/components/box';
import api from '@/lib/api';
import { useNotifications } from '@/components/Notifications';

export default function CreateHostedZonePage() {
  const router = useRouter();
  const { notify } = useNotifications();

  const [domainName, setDomainName] = useState('');
  const [comment, setComment] = useState('');
  const [zoneType, setZoneType] = useState<'Public' | 'Private'>('Public');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async () => {
    setError('');
    if (!domainName.trim()) {
      setError('Domain name is required.');
      return;
    }

    try {
      setLoading(true);
      const result = await api.post<{ id: number }>('/zones', {
        domain_name: domainName.trim(),
        zone_type: zoneType,
        comment: comment.trim() || null,
      });
      notify({
        type: 'success',
        content: `${domainName.trim()} was successfully created.\nNow you can create records in the hosted zone to specify how you want Route 53 to route traffic for your domain.`,
      });
      router.push(`/hosted-zones/${result.id}`);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to create hosted zone.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell>
      <SpaceBetween size="l">
        {/* Page header */}
        <Header
          variant="h1"
          info={<Link variant="info">Info</Link>}
        >
          Create hosted zone
        </Header>

        {error && (
          <Alert type="error" dismissible onDismiss={() => setError('')}>
            {error}
          </Alert>
        )}

        {/* Hosted zone configuration card */}
        <Container
          header={
            <Header
              variant="h2"
              description="A hosted zone is a container that holds information about how you want to route traffic for a domain, such as example.com, and its subdomains."
            >
              Hosted zone configuration
            </Header>
          }
        >
          <SpaceBetween size="l">
            {/* Domain name */}
            <FormField
              label={
                <span>
                  <strong>Domain name</strong>{' '}
                  <Link variant="info">Info</Link>
                </span>
              }
              description="This is the name of the domain that you want to route traffic for."
              constraintText={
                <>Valid characters: a-z, 0-9, ! &quot; # $ % &amp; &apos; ( ) * + , - / : ; &lt; = &gt; ? @ [ \ ] ^ _ &#96; {'{'} | {'}'} . ~</>
              }
            >
              <Input
                value={domainName}
                onChange={({ detail }) => setDomainName(detail.value)}
                placeholder="example.com"
                autoFocus
              />
            </FormField>

            {/* Description */}
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

            {/* Type */}
            <FormField
              label={
                <span>
                  <strong>Type</strong>{' '}
                  <Link variant="info">Info</Link>
                </span>
              }
              description="The type indicates whether you want to route traffic on the Internet or in an Amazon VPC."
            >
              <div style={{ display: 'flex', gap: '16px' }}>
                {/* Public hosted zone tile */}
                <div
                  onClick={() => setZoneType('Public')}
                  style={{
                    flex: 1,
                    border: zoneType === 'Public' ? '2px solid #0972d3' : '1px solid #d1d5db',
                    borderRadius: '8px',
                    padding: '16px',
                    cursor: 'pointer',
                    backgroundColor: zoneType === 'Public' ? '#f0f8ff' : '#fff',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <div style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      border: zoneType === 'Public' ? '5px solid #0972d3' : '2px solid #7d8998',
                      boxSizing: 'border-box',
                    }} />
                    <strong>Public hosted zone</strong>
                  </div>
                  <div style={{ fontSize: '13px', color: '#5f6b7a', marginLeft: '26px' }}>
                    A public hosted zone determines how traffic is routed on the internet.
                  </div>
                </div>

                {/* Private hosted zone tile */}
                <div
                  onClick={() => setZoneType('Private')}
                  style={{
                    flex: 1,
                    border: zoneType === 'Private' ? '2px solid #0972d3' : '1px solid #d1d5db',
                    borderRadius: '8px',
                    padding: '16px',
                    cursor: 'pointer',
                    backgroundColor: zoneType === 'Private' ? '#f0f8ff' : '#fff',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <div style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      border: zoneType === 'Private' ? '5px solid #0972d3' : '2px solid #7d8998',
                      boxSizing: 'border-box',
                    }} />
                    <strong>Private hosted zone</strong>
                  </div>
                  <div style={{ fontSize: '13px', color: '#5f6b7a', marginLeft: '26px' }}>
                    A private hosted zone determines how traffic is routed within an Amazon VPC.
                  </div>
                </div>
              </div>
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
          <Button variant="link" onClick={() => router.push('/hosted-zones')}>
            Cancel
          </Button>
          <Button variant="primary" loading={loading} onClick={handleCreate}>
            Create hosted zone
          </Button>
        </div>
      </SpaceBetween>
    </AppShell>
  );
}
