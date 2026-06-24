'use client';

import AppShell from '@/components/AppShell';
import Header from '@cloudscape-design/components/header';
import Container from '@cloudscape-design/components/container';
import Box from '@cloudscape-design/components/box';
import SpaceBetween from '@cloudscape-design/components/space-between';
import Icon from '@cloudscape-design/components/icon';
import ColumnLayout from '@cloudscape-design/components/column-layout';

export default function ProfilesPage() {
  return (
    <AppShell>
      <SpaceBetween size="l">
        <Header
          variant="h1"
          description="Manage configuration profiles for Route 53 resources"
        >
          Profiles
        </Header>

        <Container>
          <Box textAlign="center" padding="xxl">
            <SpaceBetween size="m" alignItems="center">
              <Icon name="user-profile" size="big" />
              <Box variant="h3" color="text-body-secondary">
                Route 53 Profiles — Coming soon
              </Box>
              <Box variant="p" color="text-body-secondary" fontSize="body-m">
                Route 53 Profiles let you create and manage reusable configurations
                that can be applied across multiple hosted zones and resources.
                Share DNS configurations across your organization with ease.
              </Box>
            </SpaceBetween>
          </Box>
        </Container>

        <ColumnLayout columns={3} variant="text-grid">
          <Container header={<Header variant="h3">Configuration templates</Header>}>
            <Box variant="p" color="text-body-secondary">
              Create reusable templates with predefined DNS settings, health check configurations, and routing policies.
            </Box>
          </Container>
          <Container header={<Header variant="h3">Shared profiles</Header>}>
            <Box variant="p" color="text-body-secondary">
              Share DNS configuration profiles across multiple AWS accounts and organizational units.
            </Box>
          </Container>
          <Container header={<Header variant="h3">Version management</Header>}>
            <Box variant="p" color="text-body-secondary">
              Track and manage different versions of your configuration profiles with rollback capabilities.
            </Box>
          </Container>
        </ColumnLayout>
      </SpaceBetween>
    </AppShell>
  );
}
