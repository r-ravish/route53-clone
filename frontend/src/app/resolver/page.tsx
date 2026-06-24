'use client';

import AppShell from '@/components/AppShell';
import Header from '@cloudscape-design/components/header';
import Container from '@cloudscape-design/components/container';
import Box from '@cloudscape-design/components/box';
import SpaceBetween from '@cloudscape-design/components/space-between';
import Icon from '@cloudscape-design/components/icon';
import ColumnLayout from '@cloudscape-design/components/column-layout';

export default function ResolverPage() {
  return (
    <AppShell>
      <SpaceBetween size="l">
        <Header
          variant="h1"
          description="Configure DNS resolution for hybrid cloud environments"
        >
          Resolver
        </Header>

        <Container>
          <Box textAlign="center" padding="xxl">
            <SpaceBetween size="m" alignItems="center">
              <Icon name="share" size="big" />
              <Box variant="h3" color="text-body-secondary">
                Route 53 Resolver — Coming soon
              </Box>
              <Box variant="p" color="text-body-secondary" fontSize="body-m">
                Route 53 Resolver enables DNS resolution between your VPC and your on-premises network.
                You can configure inbound and outbound endpoints to forward DNS queries between environments.
              </Box>
            </SpaceBetween>
          </Box>
        </Container>

        <ColumnLayout columns={3} variant="text-grid">
          <Container header={<Header variant="h3">Inbound endpoints</Header>}>
            <Box variant="p" color="text-body-secondary">
              Allow DNS queries from your on-premises network to resolve AWS-hosted domains.
            </Box>
          </Container>
          <Container header={<Header variant="h3">Outbound endpoints</Header>}>
            <Box variant="p" color="text-body-secondary">
              Forward DNS queries from your VPC to resolvers on your on-premises network.
            </Box>
          </Container>
          <Container header={<Header variant="h3">Resolver rules</Header>}>
            <Box variant="p" color="text-body-secondary">
              Define which DNS queries are forwarded to your network and which are resolved by Route 53.
            </Box>
          </Container>
        </ColumnLayout>
      </SpaceBetween>
    </AppShell>
  );
}
