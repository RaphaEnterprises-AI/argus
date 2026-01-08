'use client';

import { useState, useEffect } from 'react';
import {
  Loader2,
  Plus,
  Database,
  FileJson,
  FileSpreadsheet,
  Globe,
  Variable,
  Server,
  ArrowRight,
  Layers,
  Shuffle,
  X,
  AlertCircle,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { DataSourceConfig } from './DataSourceConfig';
import { ParameterSetEditor } from './ParameterSetEditor';
import {
  useCreateParameterizedTest,
  useUpdateParameterizedTest,
  useBulkCreateParameterSets,
  useParameterSets,
  type ParameterizedTest,
  type InsertParameterizedTest,
} from '@/lib/hooks/use-parameterized';
import { useTests } from '@/lib/hooks/use-tests';
import { cn } from '@/lib/utils';

interface CreateParameterizedTestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  editingTest?: ParameterizedTest | null;
}

type DataSourceType = 'inline' | 'csv' | 'json' | 'api' | 'database' | 'spreadsheet';
type IterationMode = 'sequential' | 'parallel' | 'random';

interface ParameterSetInput {
  name: string;
  values: Record<string, any>;
  tags: string[];
  skip: boolean;
  skip_reason?: string;
  category?: string;
}

const DATA_SOURCE_OPTIONS = [
  { value: 'inline', label: 'Inline', icon: FileJson, description: 'Define parameters directly' },
  { value: 'csv', label: 'CSV', icon: FileSpreadsheet, description: 'Import from CSV file' },
  { value: 'json', label: 'JSON', icon: FileJson, description: 'Import from JSON file' },
  { value: 'spreadsheet', label: 'Spreadsheet', icon: FileSpreadsheet, description: 'Import from spreadsheet' },
  { value: 'api', label: 'API', icon: Globe, description: 'Fetch from API endpoint' },
  { value: 'database', label: 'Database', icon: Database, description: 'Query from database' },
];

const ITERATION_MODE_OPTIONS = [
  { value: 'sequential', label: 'Sequential', icon: ArrowRight, description: 'Run one at a time in order' },
  { value: 'parallel', label: 'Parallel', icon: Layers, description: 'Run multiple simultaneously' },
  { value: 'random', label: 'Random', icon: Shuffle, description: 'Randomize execution order' },
];

const PRIORITY_OPTIONS = [
  { value: 'critical', label: 'Critical', color: 'text-error' },
  { value: 'high', label: 'High', color: 'text-warning' },
  { value: 'medium', label: 'Medium', color: 'text-info' },
  { value: 'low', label: 'Low', color: 'text-muted-foreground' },
];

export function CreateParameterizedTestModal({
  open,
  onOpenChange,
  projectId,
  editingTest,
}: CreateParameterizedTestModalProps) {
  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [baseTestId, setBaseTestId] = useState<string>('');
  const [dataSourceType, setDataSourceType] = useState<DataSourceType>('inline');
  const [dataSourceConfig, setDataSourceConfig] = useState<Record<string, any>>({});
  const [parameterSchema, setParameterSchema] = useState<Record<string, any>>({});
  const [steps, setSteps] = useState<string>('');
  const [iterationMode, setIterationMode] = useState<IterationMode>('sequential');
  const [maxParallel, setMaxParallel] = useState(5);
  const [timeoutMs, setTimeoutMs] = useState(60000);
  const [stopOnFailure, setStopOnFailure] = useState(false);
  const [retryFailedIterations, setRetryFailedIterations] = useState(0);
  const [priority, setPriority] = useState<'critical' | 'high' | 'medium' | 'low'>('medium');
  const [tags, setTags] = useState('');
  const [parameterSets, setParameterSets] = useState<ParameterSetInput[]>([]);
  const [activeTab, setActiveTab] = useState<'basic' | 'data' | 'parameters' | 'advanced'>('basic');
  const [error, setError] = useState('');

  // Data fetching
  const { data: existingTests = [] } = useTests(projectId);
  const { data: existingParamSets = [] } = useParameterSets(editingTest?.id || null);

  // Mutations
  const createTest = useCreateParameterizedTest();
  const updateTest = useUpdateParameterizedTest();
  const bulkCreateParamSets = useBulkCreateParameterSets();

  // Populate form when editing
  useEffect(() => {
    if (editingTest) {
      setName(editingTest.name || '');
      setDescription(editingTest.description || '');
      setBaseTestId(editingTest.base_test_id || '');
      setDataSourceType(editingTest.data_source_type as DataSourceType);
      setDataSourceConfig(editingTest.data_source_config as Record<string, any> || {});
      setParameterSchema(editingTest.parameter_schema as Record<string, any> || {});
      setSteps(
        Array.isArray(editingTest.steps)
          ? editingTest.steps.map((s: any) => s.instruction || s.action || '').join('\n')
          : ''
      );
      setIterationMode((editingTest.iteration_mode as IterationMode) || 'sequential');
      setMaxParallel(editingTest.max_parallel || 5);
      setTimeoutMs(editingTest.timeout_per_iteration_ms || 60000);
      setStopOnFailure(editingTest.stop_on_failure || false);
      setRetryFailedIterations(editingTest.retry_failed_iterations || 0);
      setPriority(editingTest.priority || 'medium');
      setTags(Array.isArray(editingTest.tags) ? editingTest.tags.join(', ') : '');
    } else {
      resetForm();
    }
  }, [editingTest]);

  // Populate parameter sets when editing
  useEffect(() => {
    if (existingParamSets.length > 0) {
      setParameterSets(
        existingParamSets.map(ps => ({
          name: ps.name,
          values: ps.values as Record<string, any>,
          tags: ps.tags || [],
          skip: ps.skip || false,
          skip_reason: ps.skip_reason || undefined,
          category: ps.category || undefined,
        }))
      );
    }
  }, [existingParamSets]);

  const resetForm = () => {
    setName('');
    setDescription('');
    setBaseTestId('');
    setDataSourceType('inline');
    setDataSourceConfig({});
    setParameterSchema({});
    setSteps('');
    setIterationMode('sequential');
    setMaxParallel(5);
    setTimeoutMs(60000);
    setStopOnFailure(false);
    setRetryFailedIterations(0);
    setPriority('medium');
    setTags('');
    setParameterSets([]);
    setActiveTab('basic');
    setError('');
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Test name is required');
      return;
    }

    if (dataSourceType === 'inline' && parameterSets.length === 0) {
      setError('At least one parameter set is required for inline data source');
      return;
    }

    try {
      const stepsArray = steps
        .split('\n')
        .map(s => s.trim())
        .filter(s => s.length > 0)
        .map(instruction => ({ instruction }));

      const tagsArray = tags
        .split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0);

      const testData: InsertParameterizedTest = {
        project_id: projectId,
        base_test_id: baseTestId || null,
        name: name.trim(),
        description: description.trim() || null,
        tags: tagsArray,
        priority,
        data_source_type: dataSourceType,
        data_source_config: dataSourceConfig,
        parameter_schema: parameterSchema,
        steps: stepsArray,
        assertions: [],
        setup: {},
        teardown: {},
        before_each: {},
        after_each: {},
        iteration_mode: iterationMode,
        max_parallel: maxParallel,
        timeout_per_iteration_ms: timeoutMs,
        stop_on_failure: stopOnFailure,
        retry_failed_iterations: retryFailedIterations,
        is_active: true,
        created_by: null,
      };

      let savedTest: ParameterizedTest;

      if (editingTest?.id) {
        savedTest = await updateTest.mutateAsync({
          id: editingTest.id,
          ...testData,
        });
      } else {
        savedTest = await createTest.mutateAsync(testData);
      }

      // Create parameter sets for inline data source
      if (dataSourceType === 'inline' && parameterSets.length > 0 && !editingTest?.id) {
        await bulkCreateParamSets.mutateAsync({
          testId: savedTest.id,
          paramSets: parameterSets.map((ps, index) => ({
            name: ps.name || `Set ${index + 1}`,
            description: null,
            values: ps.values,
            tags: ps.tags,
            category: ps.category || null,
            skip: ps.skip,
            skip_reason: ps.skip_reason || null,
            only: false,
            order_index: index,
            expected_outcome: 'pass' as const,
            expected_error: null,
            environment_overrides: {},
            source: 'manual' as const,
            source_reference: null,
          })),
        });
      }

      handleClose();
    } catch (err) {
      console.error('Failed to save test:', err);
      setError('Failed to save test. Please try again.');
    }
  };

  const isLoading = createTest.isPending || updateTest.isPending || bulkCreateParamSets.isPending;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            {editingTest ? 'Edit Parameterized Test' : 'Create Parameterized Test'}
          </DialogTitle>
          <DialogDescription>
            Create a data-driven test that runs with multiple parameter sets.
          </DialogDescription>
        </DialogHeader>

        {/* Tab Navigation */}
        <div className="flex gap-1 border-b">
          {(['basic', 'data', 'parameters', 'advanced'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={cn(
                'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
                activeTab === tab
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          {/* Basic Tab */}
          {activeTab === 'basic' && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">
                  Test Name <span className="text-error">*</span>
                </label>
                <Input
                  id="name"
                  placeholder="Login Test with Multiple Users"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="description" className="text-sm font-medium">
                  Description
                </label>
                <Textarea
                  id="description"
                  placeholder="Tests login functionality with various user credentials..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="baseTest" className="text-sm font-medium">
                  Base Test (Optional)
                </label>
                <select
                  id="baseTest"
                  value={baseTestId}
                  onChange={(e) => setBaseTestId(e.target.value)}
                  className="w-full h-10 rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">None - Create from scratch</option>
                  {existingTests.map((test) => (
                    <option key={test.id} value={test.id}>
                      {test.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground">
                  Optionally base this on an existing test to inherit its steps
                </p>
              </div>

              <div className="space-y-2">
                <label htmlFor="steps" className="text-sm font-medium">
                  Test Steps
                </label>
                <Textarea
                  id="steps"
                  placeholder="Navigate to login page&#10;Fill username field with {{username}}&#10;Fill password field with {{password}}&#10;Click login button&#10;Verify welcome message shows {{expected_name}}"
                  value={steps}
                  onChange={(e) => setSteps(e.target.value)}
                  rows={6}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Use {'{{parameter_name}}'} syntax for placeholders that will be replaced with parameter values
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="priority" className="text-sm font-medium">
                    Priority
                  </label>
                  <select
                    id="priority"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as typeof priority)}
                    className="w-full h-10 rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    {PRIORITY_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="tags" className="text-sm font-medium">
                    Tags
                  </label>
                  <Input
                    id="tags"
                    placeholder="smoke, login, critical"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Data Source Tab */}
          {activeTab === 'data' && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Data Source Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {DATA_SOURCE_OPTIONS.map((opt) => {
                    const Icon = opt.icon;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setDataSourceType(opt.value as DataSourceType)}
                        className={cn(
                          'flex flex-col items-center gap-2 p-4 rounded-lg border transition-all',
                          dataSourceType === opt.value
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        )}
                      >
                        <Icon className={cn(
                          'h-6 w-6',
                          dataSourceType === opt.value ? 'text-primary' : 'text-muted-foreground'
                        )} />
                        <span className="text-sm font-medium">{opt.label}</span>
                        <span className="text-xs text-muted-foreground text-center">{opt.description}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <DataSourceConfig
                type={dataSourceType}
                config={dataSourceConfig}
                onChange={setDataSourceConfig}
                onParameterSetsLoaded={(sets) => setParameterSets(sets)}
              />
            </div>
          )}

          {/* Parameters Tab */}
          {activeTab === 'parameters' && (
            <div className="space-y-4 py-4">
              {dataSourceType === 'inline' ? (
                <ParameterSetEditor
                  parameterSets={parameterSets}
                  onChange={setParameterSets}
                  parameterSchema={parameterSchema}
                  onSchemaChange={setParameterSchema}
                />
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FileJson className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Parameter sets will be loaded from the configured data source.</p>
                  <p className="text-sm mt-2">
                    Configure the data source in the Data tab first.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Advanced Tab */}
          {activeTab === 'advanced' && (
            <div className="space-y-6 py-4">
              <div className="space-y-4">
                <label className="text-sm font-medium">Iteration Mode</label>
                <div className="grid grid-cols-3 gap-2">
                  {ITERATION_MODE_OPTIONS.map((opt) => {
                    const Icon = opt.icon;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setIterationMode(opt.value as IterationMode)}
                        className={cn(
                          'flex flex-col items-center gap-2 p-4 rounded-lg border transition-all',
                          iterationMode === opt.value
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        )}
                      >
                        <Icon className={cn(
                          'h-6 w-6',
                          iterationMode === opt.value ? 'text-primary' : 'text-muted-foreground'
                        )} />
                        <span className="text-sm font-medium">{opt.label}</span>
                        <span className="text-xs text-muted-foreground text-center">{opt.description}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {iterationMode === 'parallel' && (
                <div className="space-y-2">
                  <label htmlFor="maxParallel" className="text-sm font-medium">
                    Max Parallel Workers
                  </label>
                  <Input
                    id="maxParallel"
                    type="number"
                    min={1}
                    max={20}
                    value={maxParallel}
                    onChange={(e) => setMaxParallel(parseInt(e.target.value) || 5)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Maximum number of iterations to run simultaneously
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <label htmlFor="timeout" className="text-sm font-medium">
                  Timeout per Iteration (ms)
                </label>
                <Input
                  id="timeout"
                  type="number"
                  min={1000}
                  step={1000}
                  value={timeoutMs}
                  onChange={(e) => setTimeoutMs(parseInt(e.target.value) || 60000)}
                />
                <p className="text-xs text-muted-foreground">
                  Maximum time allowed for each iteration
                </p>
              </div>

              <div className="space-y-2">
                <label htmlFor="retryFailed" className="text-sm font-medium">
                  Retry Failed Iterations
                </label>
                <Input
                  id="retryFailed"
                  type="number"
                  min={0}
                  max={5}
                  value={retryFailedIterations}
                  onChange={(e) => setRetryFailedIterations(parseInt(e.target.value) || 0)}
                />
                <p className="text-xs text-muted-foreground">
                  Number of times to retry failed iterations
                </p>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="stopOnFailure"
                  checked={stopOnFailure}
                  onChange={(e) => setStopOnFailure(e.target.checked)}
                  className="h-4 w-4 rounded border-border"
                />
                <label htmlFor="stopOnFailure" className="text-sm">
                  Stop on first failure
                </label>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-error/10 border border-error/20 rounded-lg text-error text-sm">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              {editingTest ? 'Update Test' : 'Create Test'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
