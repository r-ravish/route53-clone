'use client';

import AppShell from '@/components/AppShell';
import Header from '@cloudscape-design/components/header';
import Container from '@cloudscape-design/components/container';
import Box from '@cloudscape-design/components/box';
import SpaceBetween from '@cloudscape-design/components/space-between';
import Icon from '@cloudscape-design/components/icon';
import ColumnLayout from '@cloudscape-design/components/column-layout';

export default function DashboardPage() {
  return (
    <AppShell>
      <SpaceBetween size="l">
        <Header
          variant="h1"
          description="Overview of your Route 53 resources and recent activity"
        >
          Dashboard
        </Header>

        <ColumnLayout columns={3} variant="text-grid">
          <Container
            header={<Header variant="h3">Hosted zones</Header>}
          >
            <Box variant="p" color="text-body-secondary">
              <Icon name="folder" />{' '}
              View and manage all your DNS hosted zones. Create public or private zones for your domains.
            </Box>
          </Container>

          <Container
            header={<Header variant="h3">DNS records</Header>}
          >
            <Box variant="p" color="text-body-secondary">
              <Icon name="file" />{' '}
              Configure A, AAAA, CNAME, MX, TXT, and other DNS record types for your zones.
            </Box>
          </Container>

          <Container
            header={<Header variant="h3">Health checks</Header>}
          >
            <Box variant="p" color="text-body-secondary">
              <Icon name="status-positive" />{' '}
              Monitor the health and performance of your application endpoints.
            </Box>
          </Container>
        </ColumnLayout>

        <Container
          header={
            <Header
              variant="h2"
              description="Quick access to common tasks"
            >
              Getting started
            </Header>
          }
        >
          <ColumnLayout columns={2}>
            <div>
              <Box variant="h4" margin={{ bottom: 'xs' }}>Create a hosted zone</Box>
              <Box variant="p" color="text-body-secondary">
                Start by creating a hosted zone for your domain. A hosted zone is a container for DNS records that define how to route traffic for a domain.
              </Box>
            </div>
            <div>
              <Box variant="h4" margin={{ bottom: 'xs' }}>Add DNS records</Box>
              <Box variant="p" color="text-body-secondary">
                After creating a hosted zone, add DNS records to route traffic. Route 53 supports A, AAAA, CNAME, MX, TXT, NS, PTR, SRV, and CAA records.
              </Box>
            </div>
          </ColumnLayout>
        </Container>

        <Container
          header={
            <Header variant="h2">Recent activity</Header>
          }
        >
          <Box
            textAlign="center"
            padding="l"
            color="text-body-secondary"
          >
            <SpaceBetween size="s">
              <Icon name="status-info" size="big" />
              <Box variant="p">No recent activity to display.</Box>
            </SpaceBetween>
          </Box>
        </Container>
      </SpaceBetween>
    </AppShell>
  );
}
