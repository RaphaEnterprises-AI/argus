'use client';

import { useState, useCallback } from 'react';
import {
  Plus,
  Trash2,
  GripVertical,
  Tag,
  SkipForward,
  Upload,
  Download,
  Copy,
  ChevronDown,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/data-table';
import { cn } from '@/lib/utils';

interface ParameterSetInput {
  name: string;
  values: Record<string, any>;
  tags: string[];
  skip: boolean;
  skip_reason?: string;
  category?: string;
}

interface ParameterSetEditorProps {
  parameterSets: ParameterSetInput[];
  onChange: (sets: ParameterSetInput[]) => void;
  parameterSchema: Record<string, any>;
  onSchemaChange: (schema: Record<string, any>) => void;
}

interface ParameterField {
  name: string;
  type: 'string' | 'number' | 'boolean';
  required: boolean;
}

export function ParameterSetEditor({
  parameterSets,
  onChange,
  parameterSchema,
  onSchemaChange,
}: ParameterSetEditorProps) {
  const [expandedSets, setExpandedSets] = useState<Set<number>>(new Set([0]));
  const [jsonEditorMode, setJsonEditorMode] = useState(false);
  const [jsonInput, setJsonInput] = useState('');
  const [jsonError, setJsonError] = useState('');
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldType, setNewFieldType] = useState<'string' | 'number' | 'boolean'>('string');

  // Get parameter fields from schema
  const parameterFields: ParameterField[] = Object.entries(parameterSchema).map(([name, config]: [string, any]) => ({
    name,
    type: config.type || 'string',
    required: config.required || false,
  }));

  // Add a new parameter set
  const addParameterSet = () => {
    const newSet: ParameterSetInput = {
      name: `Set ${parameterSets.length + 1}`,
      values: parameterFields.reduce((acc, field) => {
        acc[field.name] = field.type === 'number' ? 0 : field.type === 'boolean' ? false : '';
        return acc;
      }, {} as Record<string, any>),
      tags: [],
      skip: false,
    };
    onChange([...parameterSets, newSet]);
    setExpandedSets(new Set([...expandedSets, parameterSets.length]));
  };

  // Remove a parameter set
  const removeParameterSet = (index: number) => {
    const newSets = parameterSets.filter((_, i) => i !== index);
    onChange(newSets);
    const newExpanded = new Set(expandedSets);
    newExpanded.delete(index);
    setExpandedSets(newExpanded);
  };

  // Update a parameter set
  const updateParameterSet = (index: number, updates: Partial<ParameterSetInput>) => {
    const newSets = [...parameterSets];
    newSets[index] = { ...newSets[index], ...updates };
    onChange(newSets);
  };

  // Update a value in a parameter set
  const updateValue = (setIndex: number, fieldName: string, value: any) => {
    const newSets = [...parameterSets];
    newSets[setIndex] = {
      ...newSets[setIndex],
      values: {
        ...newSets[setIndex].values,
        [fieldName]: value,
      },
    };
    onChange(newSets);
  };

  // Toggle expanded state
  const toggleExpanded = (index: number) => {
    const newExpanded = new Set(expandedSets);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedSets(newExpanded);
  };

  // Add a new parameter field
  const addParameterField = () => {
    if (!newFieldName.trim()) return;

    const newSchema = {
      ...parameterSchema,
      [newFieldName.trim()]: {
        type: newFieldType,
        required: false,
      },
    };
    onSchemaChange(newSchema);

    // Add the new field to all existing parameter sets
    const newSets = parameterSets.map(set => ({
      ...set,
      values: {
        ...set.values,
        [newFieldName.trim()]: newFieldType === 'number' ? 0 : newFieldType === 'boolean' ? false : '',
      },
    }));
    onChange(newSets);

    setNewFieldName('');
  };

  // Remove a parameter field
  const removeParameterField = (fieldName: string) => {
    const newSchema = { ...parameterSchema };
    delete newSchema[fieldName];
    onSchemaChange(newSchema);

    // Remove the field from all parameter sets
    const newSets = parameterSets.map(set => {
      const newValues = { ...set.values };
      delete newValues[fieldName];
      return { ...set, values: newValues };
    });
    onChange(newSets);
  };

  // Duplicate a parameter set
  const duplicateParameterSet = (index: number) => {
    const original = parameterSets[index];
    const newSet: ParameterSetInput = {
      ...original,
      name: `${original.name} (Copy)`,
      tags: [...original.tags],
      values: { ...original.values },
    };
    onChange([...parameterSets, newSet]);
    setExpandedSets(new Set([...expandedSets, parameterSets.length]));
  };

  // Import from JSON
  const handleJsonImport = () => {
    setJsonError('');
    try {
      const data = JSON.parse(jsonInput);

      if (!Array.isArray(data)) {
        throw new Error('JSON must be an array of objects');
      }

      const importedSets: ParameterSetInput[] = data.map((item, index) => ({
        name: item.name || `Imported Set ${index + 1}`,
        values: typeof item === 'object' ? (item.values || item) : {},
        tags: item.tags || [],
        skip: item.skip || false,
        skip_reason: item.skip_reason,
        category: item.category,
      }));

      // Detect schema from first item
      if (importedSets.length > 0) {
        const detectedSchema: Record<string, any> = {};
        Object.entries(importedSets[0].values).forEach(([key, value]) => {
          detectedSchema[key] = {
            type: typeof value === 'number' ? 'number' : typeof value === 'boolean' ? 'boolean' : 'string',
            required: false,
          };
        });
        onSchemaChange({ ...parameterSchema, ...detectedSchema });
      }

      onChange([...parameterSets, ...importedSets]);
      setJsonInput('');
      setJsonEditorMode(false);
    } catch (err) {
      setJsonError(err instanceof Error ? err.message : 'Invalid JSON');
    }
  };

  // Export to JSON
  const handleJsonExport = () => {
    const exportData = parameterSets.map(set => ({
      name: set.name,
      values: set.values,
      tags: set.tags,
      skip: set.skip,
      skip_reason: set.skip_reason,
      category: set.category,
    }));
    const json = JSON.stringify(exportData, null, 2);
    navigator.clipboard.writeText(json);
  };

  // Move parameter set
  const moveParameterSet = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= parameterSets.length) return;
    const newSets = [...parameterSets];
    const [removed] = newSets.splice(fromIndex, 1);
    newSets.splice(toIndex, 0, removed);
    onChange(newSets);
  };

  return (
    <div className="space-y-4">
      {/* Parameter Schema */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium">Parameter Fields</h4>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setJsonEditorMode(!jsonEditorMode)}
            >
              {jsonEditorMode ? 'Table View' : 'JSON Import'}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleJsonExport}
              disabled={parameterSets.length === 0}
            >
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
          </div>
        </div>

        {!jsonEditorMode && (
          <>
            {/* Field List */}
            <div className="flex flex-wrap gap-2">
              {parameterFields.map((field) => (
                <div
                  key={field.name}
                  className="flex items-center gap-1 px-2 py-1 bg-muted rounded text-sm"
                >
                  <span className="font-mono">{field.name}</span>
                  <span className="text-xs text-muted-foreground">({field.type})</span>
                  <button
                    type="button"
                    onClick={() => removeParameterField(field.name)}
                    className="ml-1 text-muted-foreground hover:text-error"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add Field */}
            <div className="flex items-center gap-2">
              <Input
                placeholder="Field name"
                value={newFieldName}
                onChange={(e) => setNewFieldName(e.target.value)}
                className="flex-1 h-8"
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addParameterField())}
              />
              <select
                value={newFieldType}
                onChange={(e) => setNewFieldType(e.target.value as typeof newFieldType)}
                className="h-8 rounded-md border bg-background px-2 text-sm"
              >
                <option value="string">String</option>
                <option value="number">Number</option>
                <option value="boolean">Boolean</option>
              </select>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addParameterField}
                disabled={!newFieldName.trim()}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </>
        )}

        {/* JSON Editor */}
        {jsonEditorMode && (
          <div className="space-y-2">
            <Textarea
              placeholder={`[
  {"username": "admin", "password": "admin123", "expected_name": "Admin User"},
  {"username": "user1", "password": "pass123", "expected_name": "Test User"}
]`}
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              rows={8}
              className="font-mono text-sm"
            />
            {jsonError && (
              <div className="flex items-center gap-2 text-sm text-error">
                <AlertCircle className="h-4 w-4" />
                {jsonError}
              </div>
            )}
            <Button
              type="button"
              onClick={handleJsonImport}
              disabled={!jsonInput.trim()}
              size="sm"
            >
              <Upload className="h-4 w-4 mr-1" />
              Import JSON
            </Button>
          </div>
        )}
      </div>

      {/* Parameter Sets */}
      {!jsonEditorMode && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">
              Parameter Sets ({parameterSets.length})
            </h4>
            <Button type="button" variant="outline" size="sm" onClick={addParameterSet}>
              <Plus className="h-4 w-4 mr-1" />
              Add Set
            </Button>
          </div>

          {parameterSets.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg">
              <p>No parameter sets defined yet.</p>
              <p className="text-sm mt-1">Add parameter fields above, then create sets.</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={addParameterSet}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add First Set
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {parameterSets.map((set, index) => (
                <div
                  key={index}
                  className={cn(
                    'border rounded-lg overflow-hidden',
                    set.skip && 'opacity-60'
                  )}
                >
                  {/* Set Header */}
                  <div
                    className="flex items-center gap-2 px-3 py-2 bg-muted/50 cursor-pointer"
                    onClick={() => toggleExpanded(index)}
                  >
                    <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                    <button type="button" className="p-1">
                      {expandedSets.has(index) ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>
                    <Input
                      value={set.name}
                      onChange={(e) => {
                        e.stopPropagation();
                        updateParameterSet(index, { name: e.target.value });
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="flex-1 h-7 text-sm"
                    />
                    {set.skip && (
                      <Badge variant="warning">Skipped</Badge>
                    )}
                    {set.category && (
                      <Badge variant="outline">{set.category}</Badge>
                    )}
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          duplicateParameterSet(index);
                        }}
                        title="Duplicate"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          updateParameterSet(index, { skip: !set.skip });
                        }}
                        title={set.skip ? 'Enable' : 'Skip'}
                      >
                        <SkipForward className={cn('h-3.5 w-3.5', set.skip && 'text-warning')} />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-error"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeParameterSet(index);
                        }}
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* Set Content */}
                  {expandedSets.has(index) && (
                    <div className="p-3 space-y-3">
                      {/* Values */}
                      <div className="grid grid-cols-2 gap-3">
                        {parameterFields.map((field) => (
                          <div key={field.name} className="space-y-1">
                            <label className="text-xs font-medium text-muted-foreground">
                              {field.name}
                            </label>
                            {field.type === 'boolean' ? (
                              <select
                                value={String(set.values[field.name] || false)}
                                onChange={(e) => updateValue(index, field.name, e.target.value === 'true')}
                                className="w-full h-8 rounded-md border bg-background px-2 text-sm"
                              >
                                <option value="true">true</option>
                                <option value="false">false</option>
                              </select>
                            ) : (
                              <Input
                                type={field.type === 'number' ? 'number' : 'text'}
                                value={set.values[field.name] ?? ''}
                                onChange={(e) => updateValue(
                                  index,
                                  field.name,
                                  field.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value
                                )}
                                className="h-8 text-sm"
                              />
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Tags & Category */}
                      <div className="flex items-center gap-3">
                        <div className="flex-1 space-y-1">
                          <label className="text-xs font-medium text-muted-foreground">Tags</label>
                          <Input
                            placeholder="e.g., smoke, happy_path"
                            value={set.tags.join(', ')}
                            onChange={(e) => updateParameterSet(index, {
                              tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean),
                            })}
                            className="h-8 text-sm"
                          />
                        </div>
                        <div className="w-32 space-y-1">
                          <label className="text-xs font-medium text-muted-foreground">Category</label>
                          <select
                            value={set.category || ''}
                            onChange={(e) => updateParameterSet(index, { category: e.target.value || undefined })}
                            className="w-full h-8 rounded-md border bg-background px-2 text-sm"
                          >
                            <option value="">None</option>
                            <option value="happy_path">Happy Path</option>
                            <option value="edge_case">Edge Case</option>
                            <option value="negative">Negative</option>
                            <option value="performance">Performance</option>
                          </select>
                        </div>
                      </div>

                      {/* Skip Reason */}
                      {set.skip && (
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-muted-foreground">Skip Reason</label>
                          <Input
                            placeholder="Why is this set skipped?"
                            value={set.skip_reason || ''}
                            onChange={(e) => updateParameterSet(index, { skip_reason: e.target.value })}
                            className="h-8 text-sm"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
