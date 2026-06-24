'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/AppShell';
import Table, { TableProps } from '@cloudscape-design/components/table';
import Header from '@cloudscape-design/components/header';
import Button from '@cloudscape-design/components/button';
import TextFilter from '@cloudscape-design/components/text-filter';
import Pagination from '@cloudscape-design/components/pagination';
import Box from '@cloudscape-design/components/box';
import Link from '@cloudscape-design/components/link';
import SpaceBetween from '@cloudscape-design/components/space-between';
import Badge from '@cloudscape-design/components/badge';
import Select, { SelectProps } from '@cloudscape-design/components/select';
import api from '@/lib/api';
import DeleteZoneModal from '@/components/zones/DeleteZoneModal';
import { useNotifications } from '@/components/Notifications';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface HostedZone {
  id: number;
  user_id: number;
  domain_name: string;
  zone_type: string;
  comment: string | null;
  record_count: number;
  created_at: string;
  updated_at: string;
}

interface PaginatedZones {
  items: HostedZone[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PAGE_SIZE_OPTIONS: SelectProps.Option[] = [
  { label: '10 items', value: '10' },
  { label: '25 items', value: '25' },
  { label: '50 items', value: '50' },
  { label: '100 items', value: '100' },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function HostedZonesPage() {
  const router = useRouter();
  const { notify } = useNotifications();

  // Data state
  const [zones, setZones] = useState<HostedZone[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);

  // Table control state
  const [currentPage, setCurrentPage] = useState(1);
  const [filterText, setFilterText] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [pageSize, setPageSize] = useState<SelectProps.Option>(PAGE_SIZE_OPTIONS[0]);
  const [selectedItems, setSelectedItems] = useState<HostedZone[]>([]);

  // Modal state
  const [deleteZone, setDeleteZone] = useState<{ id: number; domain_name: string } | null>(null);

  // -----------------------------------------------------------------------
  // Debounce search input → backend query
  // -----------------------------------------------------------------------

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(filterText);
      setCurrentPage(1); // reset to page 1 on new search
    }, 300);
    return () => clearTimeout(timer);
  }, [filterText]);

  // -----------------------------------------------------------------------
  // Fetch zones (driven by debouncedSearch + currentPage)
  // -----------------------------------------------------------------------

  const fetchZones = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: String(pageSize.value || '10'),
      });
      if (debouncedSearch.trim()) {
        params.set('search', debouncedSearch.trim());
      }
      const data = await api.get<PaginatedZones>(`/zones?${params.toString()}`);
      setZones(data.items);
      setTotalPages(data.pages);
      setTotalItems(data.total);
    } catch {
      setZones([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, debouncedSearch, pageSize]);

  useEffect(() => {
    fetchZones();
  }, [fetchZones]);

  // -----------------------------------------------------------------------
  // Column definitions (inside component to access router)
  // -----------------------------------------------------------------------

  const columnDefinitions: TableProps.ColumnDefinition<HostedZone>[] = [
    {
      id: 'domain_name',
      header: 'Hosted zone name',
      cell: (item) => (
        <Link
          href={`/hosted-zones/${item.id}`}
          onFollow={(e) => {
            e.preventDefault();
            router.push(`/hosted-zones/${item.id}`);
          }}
        >
          {item.domain_name}
        </Link>
      ),
      sortingField: 'domain_name',
      width: 280,
    },
    {
      id: 'zone_type',
      header: 'Type',
      cell: (item) => (
        <Badge color={item.zone_type === 'Public' ? 'blue' : 'grey'}>
          {item.zone_type}
        </Badge>
      ),
      width: 120,
    },
    {
      id: 'created_by',
      header: 'Created by',
      cell: () => '—',
      width: 150,
    },
    {
      id: 'record_count',
      header: 'Record count',
      cell: (item) => item.record_count,
      width: 120,
    },
    {
      id: 'description',
      header: 'Description',
      cell: (item) => item.comment || '—',
    },
    {
      id: 'hosted_zone_id',
      header: 'Hosted zone ID',
      cell: (item) => `Z0${item.id}ABCDEF`,
      width: 150,
    },
  ];

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  return (
    <AppShell>
      <Table
        columnDefinitions={columnDefinitions}
        items={zones}
        loading={loading}
        loadingText="Loading hosted zones..."
        trackBy="id"
        selectionType="multi"
        selectedItems={selectedItems}
        onSelectionChange={({ detail }) =>
          setSelectedItems(detail.selectedItems)
        }
        variant="full-page"
        stickyHeader
        resizableColumns={true}
        empty={
          <Box textAlign="center" color="text-body-secondary" padding="xxl">
            <SpaceBetween size="m">
              <Box variant="h3" color="text-body-secondary">
                No hosted zones
              </Box>
              <Box variant="p">
                There are no hosted zones created for this account.
              </Box>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <Button variant="primary" onClick={() => router.push('/hosted-zones/create')}>
                  Create hosted zone
                </Button>
              </div>
            </SpaceBetween>
          </Box>
        }
        header={
          <Header
            variant="h1"
            description={
              <span>
                Automatic mode is the current search behavior optimized for best filter results. <Link href="#">To change modes go to settings.</Link>
              </span>
            }
            counter={`(${totalItems})`}
            actions={
              <SpaceBetween direction="horizontal" size="xs">
                <Button
                  iconName="refresh"
                  ariaLabel="Refresh"
                  onClick={fetchZones}
                />
                <Button
                  disabled={selectedItems.length !== 1}
                  onClick={() => {
                    if (selectedItems.length === 1) {
                      router.push(`/hosted-zones/${selectedItems[0].id}`);
                    }
                  }}
                >
                  View details
                </Button>
                <Button
                  disabled={selectedItems.length !== 1}
                  onClick={() => {
                    if (selectedItems.length === 1) {
                      router.push(`/hosted-zones/${selectedItems[0].id}/edit`);
                    }
                  }}
                >
                  Edit
                </Button>
                <Button
                  disabled={selectedItems.length !== 1}
                  onClick={() => {
                    if (selectedItems.length === 1) {
                      setDeleteZone({
                        id: selectedItems[0].id,
                        domain_name: selectedItems[0].domain_name,
                      });
                    }
                  }}
                >
                  Delete
                </Button>
                <Button
                  variant="primary"
                  onClick={() => router.push('/hosted-zones/create')}
                >
                  Create hosted zone
                </Button>
              </SpaceBetween>
            }
          >
            Hosted zones
          </Header>
        }
        filter={
          <TextFilter
            filteringText={filterText}
            onChange={({ detail }) => setFilterText(detail.filteringText)}
            filteringPlaceholder="Filter records by property or value"
          />
        }
        pagination={
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Pagination
              currentPageIndex={currentPage}
              pagesCount={totalPages}
              onChange={({ detail }) => setCurrentPage(detail.currentPageIndex)}
            />
            <Button variant="icon" iconName="settings" ariaLabel="Settings" />
          </div>
        }
      />

      {/* Delete modal */}
      <DeleteZoneModal
        visible={deleteZone !== null}
        zone={deleteZone}
        onDismiss={() => setDeleteZone(null)}
        onSuccess={() => {
          setDeleteZone(null);
          setSelectedItems([]);
          notify({ type: 'success', content: `Hosted zone ${deleteZone?.domain_name} was successfully deleted.` });
          fetchZones();
        }}
      />
    </AppShell>
  );
}
