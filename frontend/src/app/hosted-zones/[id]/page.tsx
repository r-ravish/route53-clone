'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AppShell from '@/components/AppShell';
import Table, { TableProps } from '@cloudscape-design/components/table';
import Header from '@cloudscape-design/components/header';
import Button from '@cloudscape-design/components/button';
import TextFilter from '@cloudscape-design/components/text-filter';
import Pagination from '@cloudscape-design/components/pagination';
import Box from '@cloudscape-design/components/box';
import Select, { SelectProps } from '@cloudscape-design/components/select';
import SpaceBetween from '@cloudscape-design/components/space-between';
import Spinner from '@cloudscape-design/components/spinner';
import Tabs from '@cloudscape-design/components/tabs';
import Container from '@cloudscape-design/components/container';
import ColumnLayout from '@cloudscape-design/components/column-layout';
import Link from '@cloudscape-design/components/link';
import ExpandableSection from '@cloudscape-design/components/expandable-section';
import Input from '@cloudscape-design/components/input';
import FormField from '@cloudscape-design/components/form-field';
import Textarea from '@cloudscape-design/components/textarea';
import Alert from '@cloudscape-design/components/alert';
import api from '@/lib/api';
import DeleteRecordModal from '@/components/records/DeleteRecordModal';
import { useNotifications } from '@/components/Notifications';

const EDIT_RECORD_TYPE_OPTIONS: SelectProps.Option[] = [
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

interface RecordItem {
  id: number;
  hosted_zone_id: number;
  name: string;
  record_type: string;
  value: string;
  ttl: number;
  priority: number | null;
  created_at: string;
  updated_at: string;
}

interface PaginatedRecords {
  items: RecordItem[];
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

const TYPE_FILTER_OPTIONS: SelectProps.Options = [
  { label: 'All types', value: '' },
  { label: 'A', value: 'A' },
  { label: 'AAAA', value: 'AAAA' },
  { label: 'CNAME', value: 'CNAME' },
  { label: 'MX', value: 'MX' },
  { label: 'TXT', value: 'TXT' },
  { label: 'NS', value: 'NS' },
  { label: 'PTR', value: 'PTR' },
  { label: 'SRV', value: 'SRV' },
  { label: 'CAA', value: 'CAA' },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ZoneDetailPage() {
  const params = useParams();
  const router = useRouter();
  const zoneId = Number(params.id);
  const { notify } = useNotifications();

  // Zone info
  const [zone, setZone] = useState<HostedZone | null>(null);
  const [zoneLoading, setZoneLoading] = useState(true);

  // Records data
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);

  // Controls
  const [currentPage, setCurrentPage] = useState(1);
  const [filterText, setFilterText] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<SelectProps.Option>(TYPE_FILTER_OPTIONS[0] as SelectProps.Option);
  const [pageSize, setPageSize] = useState<SelectProps.Option>(PAGE_SIZE_OPTIONS[0]);
  const [selectedItems, setSelectedItems] = useState<RecordItem[]>([]);

  // Modals & Side panel
  const [deleteRecord, setDeleteRecord] = useState<{ id: number; name: string; record_type: string } | null>(null);
  const [detailRecord, setDetailRecord] = useState<RecordItem | null>(null);
  const [panelMode, setPanelMode] = useState<'details' | 'edit'>('details');

  // Edit form state for side panel
  const [editName, setEditName] = useState('');
  const [editType, setEditType] = useState<SelectProps.Option>(EDIT_RECORD_TYPE_OPTIONS[0]);
  const [editValue, setEditValue] = useState('');
  const [editTtl, setEditTtl] = useState('300');
  const [editPriority, setEditPriority] = useState('10');
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');

  // Open side panel when selecting a single record
  const handleSelectionChange = (items: RecordItem[]) => {
    setSelectedItems(items);
    if (items.length === 1) {
      setDetailRecord(items[0]);
      setPanelMode('details');
    } else {
      setDetailRecord(null);
    }
  };

  // Populate edit form from detail record
  const startEditing = () => {
    if (!detailRecord) return;
    setEditName(detailRecord.name);
    setEditType(EDIT_RECORD_TYPE_OPTIONS.find(o => o.value === detailRecord.record_type) ?? EDIT_RECORD_TYPE_OPTIONS[0]);
    setEditValue(detailRecord.value);
    setEditTtl(String(detailRecord.ttl));
    setEditPriority(detailRecord.priority !== null ? String(detailRecord.priority) : '10');
    setEditError('');
    setPanelMode('edit');
  };

  const handleSaveEdit = async () => {
    if (!detailRecord) return;
    setEditError('');
    if (!editName.trim()) { setEditError('Record name is required.'); return; }
    if (!editValue.trim()) { setEditError('Value is required.'); return; }
    const ttlNum = parseInt(editTtl, 10);
    if (isNaN(ttlNum) || ttlNum < 1) { setEditError('TTL must be a positive integer.'); return; }
    const needsPriority = editType.value === 'MX' || editType.value === 'SRV';
    if (needsPriority) {
      const prioNum = parseInt(editPriority, 10);
      if (isNaN(prioNum) || prioNum < 0 || prioNum > 65535) { setEditError('Priority must be between 0 and 65535.'); return; }
    }
    try {
      setEditLoading(true);
      await api.put(`/zones/${zoneId}/records/${detailRecord.id}`, {
        name: editName.trim(),
        record_type: editType.value,
        value: editValue.trim(),
        ttl: ttlNum,
        ...(needsPriority ? { priority: parseInt(editPriority, 10) } : {}),
      });
      notify({ type: 'success', content: 'Record updated successfully.' });
      setPanelMode('details');
      setDetailRecord(null);
      setSelectedItems([]);
      fetchRecords();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update record.';
      setEditError(message);
    } finally {
      setEditLoading(false);
    }
  };

  // -----------------------------------------------------------------------
  // Fetch zone info
  // -----------------------------------------------------------------------

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

  // -----------------------------------------------------------------------
  // Debounce search
  // -----------------------------------------------------------------------

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(filterText);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [filterText]);

  // Reset page on type filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [typeFilter]);

  // -----------------------------------------------------------------------
  // Fetch records
  // -----------------------------------------------------------------------

  const fetchRecords = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: String(pageSize.value || '10'),
      });
      if (debouncedSearch.trim()) {
        params.set('search', debouncedSearch.trim());
      }
      if (typeFilter.value) {
        params.set('type', typeFilter.value);
      }
      const data = await api.get<PaginatedRecords>(
        `/zones/${zoneId}/records?${params.toString()}`
      );
      setRecords(data.items);
      setTotalPages(data.pages);
      setTotalItems(data.total);
    } catch {
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [zoneId, currentPage, debouncedSearch, typeFilter, pageSize]);

  useEffect(() => {
    if (zoneId) fetchRecords();
  }, [fetchRecords, zoneId]);

  // -----------------------------------------------------------------------
  // Delete zone handler
  // -----------------------------------------------------------------------

  const handleDeleteZone = async () => {
    if (!zone) return;
    try {
      await api.delete(`/zones/${zoneId}`);
      notify({ type: 'success', content: `Hosted zone ${zone.domain_name} was successfully deleted.` });
      router.push('/hosted-zones');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete zone.';
      notify({ type: 'error', content: message });
    }
  };

  // -----------------------------------------------------------------------
  // Column definitions matching real AWS
  // -----------------------------------------------------------------------

  const columnDefinitions: TableProps.ColumnDefinition<RecordItem>[] = [
    {
      id: 'name',
      header: 'Record name',
      cell: (item) => item.name,
      sortingField: 'name',
      width: 180,
    },
    {
      id: 'record_type',
      header: 'Type',
      cell: (item) => item.record_type,
      width: 80,
    },
    {
      id: 'routing_policy',
      header: 'Routing policy',
      cell: () => 'Simple',
      width: 100,
    },
    {
      id: 'differentiator',
      header: 'Differentiator',
      cell: () => '-',
      width: 100,
    },
    {
      id: 'alias',
      header: 'Alias',
      cell: () => 'No',
      width: 60,
    },
    {
      id: 'value',
      header: 'Value/Route traffic to',
      cell: (item) => (
        <span style={{ fontSize: '13px', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
          {item.value}
        </span>
      ),
      width: 220,
    },
    {
      id: 'ttl',
      header: 'TTL (seconds)',
      cell: (item) => item.ttl,
      width: 100,
    },
    {
      id: 'health_check',
      header: 'Health check',
      cell: () => '-',
      width: 100,
    },
    {
      id: 'evaluate',
      header: 'Evaluate target health',
      cell: () => '-',
      width: 100,
    },
    {
      id: 'record_id',
      header: 'Record ID',
      cell: () => '-',
      width: 100,
    },
  ];

  // -----------------------------------------------------------------------
  // Loading / error states
  // -----------------------------------------------------------------------

  if (zoneLoading) {
    return (
      <AppShell>
        <Box textAlign="center" padding="xxl">
          <Spinner size="large" />
        </Box>
      </AppShell>
    );
  }

  if (!zone) {
    return (
      <AppShell>
        <Box textAlign="center" padding="xxl">
          <SpaceBetween size="m">
            <Box variant="h3" color="text-body-secondary">
              Hosted zone not found
            </Box>
            <Button onClick={() => router.push('/hosted-zones')}>
              Back to hosted zones
            </Button>
          </SpaceBetween>
        </Box>
      </AppShell>
    );
  }

  // Generate static name servers based on zone ID
  const nameServers = [
    `ns-${500 + zoneId}.awsdns-${60 + zoneId}.org`,
    `ns-${1900 + zoneId}.awsdns-${50 + zoneId}.co.uk`,
    `ns-${600 + zoneId}.awsdns-${10 + zoneId}.net`,
    `ns-${350 + zoneId}.awsdns-${40 + zoneId}.com`,
  ];

  // -----------------------------------------------------------------------
  // Records table (used inside the Records tab)
  // -----------------------------------------------------------------------

  const recordsTable = (
    <Table
      columnDefinitions={columnDefinitions}
      items={records}
      loading={loading}
      loadingText="Loading records..."
      trackBy="id"
      selectionType="multi"
      selectedItems={selectedItems}
      onSelectionChange={({ detail }) => handleSelectionChange(detail.selectedItems)}
      resizableColumns={true}
      empty={
        <Box textAlign="center" color="text-body-secondary" padding="xxl">
          <SpaceBetween size="m">
            <Box variant="h3" color="text-body-secondary">
              No records
            </Box>
            <Box variant="p">
              No DNS records found for this hosted zone.
            </Box>
            <Button variant="primary" onClick={() => router.push(`/hosted-zones/${zoneId}/create-record`)}>
              Create record
            </Button>
          </SpaceBetween>
        </Box>
      }
      header={
        <Header
          counter={`(${totalItems})`}
          info={<Link variant="info">Info</Link>}
          description={
            <span>
              Automatic mode is the current search behavior optimized for best filter results.{' '}
              <Link href="#">To change modes go to settings.</Link>
            </span>
          }
          actions={
            <SpaceBetween direction="horizontal" size="xs">
              <Button
                iconName="refresh"
                ariaLabel="Refresh"
                onClick={fetchRecords}
              />
              <Button
                disabled={selectedItems.length === 0}
                onClick={() => {
                  if (selectedItems.length > 0) {
                    setDeleteRecord({
                      id: selectedItems[0].id,
                      name: selectedItems[0].name,
                      record_type: selectedItems[0].record_type,
                    });
                  }
                }}
              >
                Delete record
              </Button>
              <Button disabled>Import zone file</Button>
              <Button
                variant="primary"
                onClick={() => router.push(`/hosted-zones/${zoneId}/create-record`)}
              >
                Create record
              </Button>
            </SpaceBetween>
          }
        >
          Records
        </Header>
      }
      filter={
        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <TextFilter
              filteringText={filterText}
              onChange={({ detail }) => setFilterText(detail.filteringText)}
              filteringPlaceholder="Filter records by property or value"
            />
          </div>
          <div style={{ width: '140px' }}>
            <Select
              selectedOption={typeFilter}
              onChange={({ detail }) => setTypeFilter(detail.selectedOption)}
              options={TYPE_FILTER_OPTIONS}
              placeholder="Type"
            />
          </div>
          <Select
            selectedOption={{ label: 'Routing policy', value: '' }}
            onChange={() => {}}
            options={[{ label: 'All routing policies', value: '' }]}
            placeholder="Routing p…"
            disabled
          />
          <Select
            selectedOption={{ label: 'Alias', value: '' }}
            onChange={() => {}}
            options={[{ label: 'All', value: '' }]}
            placeholder="Alias"
            disabled
          />
        </div>
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
  );

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  const needsEditPriority = editType.value === 'MX' || editType.value === 'SRV';

  return (
    <AppShell>
      <div style={{ display: 'flex', gap: '16px', minHeight: '100%' }}>
        {/* Main content area */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <SpaceBetween size="l">
            {/* Zone header: badge + domain + action buttons */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{
                  backgroundColor: '#0972d3',
                  color: '#fff',
                  fontSize: '12px',
                  fontWeight: 700,
                  padding: '2px 10px',
                  borderRadius: '4px',
                }}>
                  {zone.zone_type}
                </span>
                <span style={{ fontSize: '20px', fontWeight: 700 }}>{zone.domain_name}</span>
                <Link variant="info">Info</Link>
              </div>
              <SpaceBetween direction="horizontal" size="xs">
                <Button onClick={handleDeleteZone}>Delete zone</Button>
                <Button disabled>Test record</Button>
                <Button disabled>Configure query logging</Button>
              </SpaceBetween>
            </div>

            {/* Hosted zone details expandable */}
            <ExpandableSection
              variant="container"
              headerText="Hosted zone details"
              headerActions={<Button onClick={() => router.push(`/hosted-zones/${zoneId}/edit`)}>Edit hosted zone</Button>}
            >
              <ColumnLayout columns={3} variant="text-grid">
                <SpaceBetween size="s">
                  <div>
                    <Box variant="awsui-key-label">Hosted zone name</Box>
                    <div>{zone.domain_name}</div>
                  </div>
                  <div>
                    <Box variant="awsui-key-label">Hosted zone ID</Box>
                    <div>Z09942001Y54BG8DY2HB2</div>
                  </div>
                  <div>
                    <Box variant="awsui-key-label">Description</Box>
                    <div>{zone.comment || '-'}</div>
                  </div>
                </SpaceBetween>
                <SpaceBetween size="s">
                  <div>
                    <Box variant="awsui-key-label">Query log</Box>
                    <div>-</div>
                  </div>
                  <div>
                    <Box variant="awsui-key-label">Type</Box>
                    <div>{zone.zone_type} hosted zone</div>
                  </div>
                  <div>
                    <Box variant="awsui-key-label">Record count</Box>
                    <div>{zone.record_count}</div>
                  </div>
                </SpaceBetween>
                <SpaceBetween size="s">
                  <div>
                    <Box variant="awsui-key-label">Name servers</Box>
                    <div>
                      {nameServers.map((ns, i) => (
                        <div key={i}>{ns}</div>
                      ))}
                    </div>
                  </div>
                </SpaceBetween>
              </ColumnLayout>
            </ExpandableSection>

            {/* Tabs */}
            <Tabs
              tabs={[
                {
                  label: `Records (${totalItems})`,
                  id: 'records',
                  content: recordsTable,
                },
                {
                  label: 'Accelerated recovery',
                  id: 'accelerated-recovery',
                  content: (
                    <Box padding="xxl" textAlign="center" color="text-body-secondary">
                      Accelerated recovery is not configured for this hosted zone.
                    </Box>
                  ),
                },
                {
                  label: 'DNSSEC signing',
                  id: 'dnssec',
                  content: (
                    <Box padding="xxl" textAlign="center" color="text-body-secondary">
                      DNSSEC signing is not enabled for this hosted zone.
                    </Box>
                  ),
                },
                {
                  label: 'Hosted zone tags (0)',
                  id: 'tags',
                  content: (
                    <Box padding="xxl" textAlign="center" color="text-body-secondary">
                      No tags associated with this hosted zone.
                    </Box>
                  ),
                },
              ]}
            />
          </SpaceBetween>
        </div>

        {/* Right-side Record Details Panel (like real AWS) */}
        {detailRecord && (
          <div style={{
            width: '320px',
            minWidth: '320px',
            borderLeft: '1px solid #e9ebed',
            backgroundColor: '#ffffff',
            padding: '0',
            overflowY: 'auto',
            position: 'sticky',
            top: 0,
            alignSelf: 'flex-start',
            maxHeight: 'calc(100vh - 120px)',
          }}>
            {/* Panel header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              borderBottom: '1px solid #e9ebed',
              fontWeight: 700,
              fontSize: '16px',
            }}>
              <span>Record details</span>
              <div style={{ display: 'flex', gap: '4px' }}>
                <button
                  onClick={() => { setDetailRecord(null); setSelectedItems([]); setPanelMode('details'); }}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '18px',
                    color: '#545b64',
                    padding: '4px 8px',
                    borderRadius: '4px',
                  }}
                  title="Close panel"
                >
                  ✕
                </button>
              </div>
            </div>

            {panelMode === 'details' ? (
              /* --- Details View --- */
              <div style={{ padding: '16px' }}>
                {/* Edit record button */}
                <div style={{ marginBottom: '20px' }}>
                  <Button variant="primary" onClick={startEditing}>Edit record</Button>
                </div>

                <SpaceBetween size="m">
                  <div>
                    <Box variant="awsui-key-label">Record name</Box>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="2" y="2" width="12" height="12" rx="2" stroke="#0972d3" strokeWidth="1.5" fill="none"/>
                        <path d="M5 8L7 10L11 6" stroke="#0972d3" strokeWidth="1.5" fill="none"/>
                      </svg>
                      <span>{detailRecord.name}</span>
                    </div>
                  </div>

                  <div>
                    <Box variant="awsui-key-label">Record type</Box>
                    <div style={{ marginTop: '4px' }}>{detailRecord.record_type}</div>
                  </div>

                  <div>
                    <Box variant="awsui-key-label">Value</Box>
                    <div style={{ marginTop: '4px' }}>
                      {detailRecord.value.split('\n').map((v, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect x="2" y="2" width="12" height="12" rx="2" stroke="#0972d3" strokeWidth="1.5" fill="none"/>
                            <path d="M5 8L7 10L11 6" stroke="#0972d3" strokeWidth="1.5" fill="none"/>
                          </svg>
                          <span style={{ wordBreak: 'break-all' }}>{v}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Box variant="awsui-key-label">Alias</Box>
                    <div style={{ marginTop: '4px' }}>No</div>
                  </div>

                  <div>
                    <Box variant="awsui-key-label">TTL (seconds)</Box>
                    <div style={{ marginTop: '4px' }}>{detailRecord.ttl}</div>
                  </div>

                  <div>
                    <Box variant="awsui-key-label">Routing policy</Box>
                    <div style={{ marginTop: '4px' }}>Simple</div>
                  </div>

                  {detailRecord.priority !== null && (
                    <div>
                      <Box variant="awsui-key-label">Priority</Box>
                      <div style={{ marginTop: '4px' }}>{detailRecord.priority}</div>
                    </div>
                  )}
                </SpaceBetween>
              </div>
            ) : (
              /* --- Edit View --- */
              <div style={{ padding: '16px' }}>
                <SpaceBetween size="m">
                  {editError && (
                    <Alert type="error" dismissible onDismiss={() => setEditError('')}>
                      {editError}
                    </Alert>
                  )}

                  <FormField label="Record name">
                    <Input value={editName} onChange={({ detail }) => setEditName(detail.value)} />
                  </FormField>

                  <FormField label="Record type">
                    <Select
                      selectedOption={editType}
                      onChange={({ detail }) => setEditType(detail.selectedOption)}
                      options={EDIT_RECORD_TYPE_OPTIONS}
                    />
                  </FormField>

                  <FormField label="Value">
                    <Textarea
                      value={editValue}
                      onChange={({ detail }) => setEditValue(detail.value)}
                      rows={3}
                    />
                  </FormField>

                  <FormField label="TTL (seconds)">
                    <Input
                      value={editTtl}
                      type="number"
                      onChange={({ detail }) => setEditTtl(detail.value)}
                    />
                  </FormField>

                  {needsEditPriority && (
                    <FormField label="Priority">
                      <Input
                        value={editPriority}
                        type="number"
                        onChange={({ detail }) => setEditPriority(detail.value)}
                      />
                    </FormField>
                  )}

                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', paddingTop: '8px', borderTop: '1px solid #e9ebed' }}>
                    <Button variant="link" onClick={() => setPanelMode('details')}>Cancel</Button>
                    <Button variant="primary" loading={editLoading} onClick={handleSaveEdit}>Save</Button>
                  </div>
                </SpaceBetween>
              </div>
            )}
          </div>
        )}
      </div>

      <DeleteRecordModal
        visible={deleteRecord !== null}
        zoneId={zoneId}
        record={deleteRecord}
        onDismiss={() => setDeleteRecord(null)}
        onSuccess={() => {
          setDeleteRecord(null);
          setSelectedItems([]);
          notify({ type: 'success', content: 'Record deleted successfully.' });
          fetchRecords();
        }}
      />
    </AppShell>
  );
}
