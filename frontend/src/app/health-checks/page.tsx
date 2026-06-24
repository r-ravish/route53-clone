'use client';

import AppShell from '@/components/AppShell';
import Header from '@cloudscape-design/components/header';
import Container from '@cloudscape-design/components/container';
import Box from '@cloudscape-design/components/box';
import SpaceBetween from '@cloudscape-design/components/space-between';
import Icon from '@cloudscape-design/components/icon';
import ColumnLayout from '@cloudscape-design/components/column-layout';
import Table from '@cloudscape-design/components/table';
import StatusIndicator from '@cloudscape-design/components/status-indicator';

export default function HealthChecksPage() {
  return (
    <AppShell>
      <SpaceBetween size="l">
        <Header
          variant="h1"
          description="Monitor the health and performance of your application endpoints"
        >
          Health checks
        </Header>

        <Container>
          <Box textAlign="center" padding="xxl">
            <SpaceBetween size="m" alignItems="center">
              <Icon name="status-positive" size="big" />
              <Box variant="h3" color="text-body-secondary">
                Health checks — Coming soon
              </Box>
              <Box variant="p" color="text-body-secondary" fontSize="body-m">
                Health checks monitor the health and performance of your web applications,
                web servers, and other resources. You can create health checks that monitor
                the health of endpoints by IP address or domain name.
              </Box>
            </SpaceBetween>
          </Box>
        </Container>

        <Container
          header={
            <Header variant="h2" description="Example of how health checks will be displayed">
              Health check overview
            </Header>
          }
        >
          <Table
            columnDefinitions={[
              { id: 'name', header: 'Name', cell: (item: { name: string }) => item.name },
              { id: 'status', header: 'Status', cell: (item: { status: string }) => (
                <StatusIndicator type={item.status === 'Healthy' ? 'success' : 'error'}>
                  {item.status}
                </StatusIndicator>
              )},
              { id: 'type', header: 'Type', cell: (item: { type: string }) => item.type },
              { id: 'interval', header: 'Interval', cell: (item: { interval: string }) => item.interval },
            ]}
            items={[
              { name: 'web-server-primary', status: 'Healthy', type: 'HTTP', interval: '30s' },
              { name: 'api-endpoint', status: 'Healthy', type: 'HTTPS', interval: '10s' },
              { name: 'database-check', status: 'Unhealthy', type: 'TCP', interval: '30s' },
            ]}
            variant="embedded"
          />
        </Container>

        <ColumnLayout columns={2} variant="text-grid">
          <Container header={<Header variant="h3">Endpoint monitoring</Header>}>
            <Box variant="p" color="text-body-secondary">
              Monitor HTTP, HTTPS, and TCP endpoints with configurable request intervals and failure thresholds.
            </Box>
          </Container>
          <Container header={<Header variant="h3">CloudWatch alarms</Header>}>
            <Box variant="p" color="text-body-secondary">
              Integrate with CloudWatch to receive notifications when the status of a health check changes.
            </Box>
          </Container>
        </ColumnLayout>
      </SpaceBetween>
    </AppShell>
  );
}
