'use client';

import AppShell from '@/components/AppShell';
import Header from '@cloudscape-design/components/header';
import Container from '@cloudscape-design/components/container';
import Box from '@cloudscape-design/components/box';
import SpaceBetween from '@cloudscape-design/components/space-between';
import Icon from '@cloudscape-design/components/icon';
import ColumnLayout from '@cloudscape-design/components/column-layout';

export default function TrafficPoliciesPage() {
  return (
    <AppShell>
      <SpaceBetween size="l">
        <Header
          variant="h1"
          description="Create traffic policies to route DNS traffic based on rules you define"
        >
          Traffic policies
        </Header>

        <Container>
          <Box textAlign="center" padding="xxl">
            <SpaceBetween size="m" alignItems="center">
              <Icon name="settings" size="big" />
              <Box variant="h3" color="text-body-secondary">
                Traffic policies — Coming soon
              </Box>
              <Box variant="p" color="text-body-secondary" fontSize="body-m">
                Traffic policies let you create complex routing configurations using a visual editor.
                You can route traffic based on multiple criteria such as endpoint health, geographic location,
                and latency.
              </Box>
            </SpaceBetween>
          </Box>
        </Container>

        <ColumnLayout columns={3} variant="text-grid">
          <Container header={<Header variant="h3">Weighted routing</Header>}>
            <Box variant="p" color="text-body-secondary">
              Route traffic to multiple resources in proportions that you specify.
            </Box>
          </Container>
          <Container header={<Header variant="h3">Geolocation routing</Header>}>
            <Box variant="p" color="text-body-secondary">
              Route traffic based on the geographic location of your users.
            </Box>
          </Container>
          <Container header={<Header variant="h3">Failover routing</Header>}>
            <Box variant="p" color="text-body-secondary">
              Route traffic to a backup resource when the primary is unhealthy.
            </Box>
          </Container>
        </ColumnLayout>
      </SpaceBetween>
    </AppShell>
  );
}
