import React, { useState, useCallback, useMemo, useEffect } from 'react';
import type { FormConfig } from '../components/layout/Form';
import { FormEngineProvider, type FormEngineContext } from './FormEngineContext';
import { DynamicRenderer } from './DynamicRenderer';

export interface FormEngineProps {
  schema: FormConfig;
  onSubmit: (formData: Record<string, unknown>) => void;
  onDataChange?: (formData: Record<string, unknown>) => void;
  onPageChange?: (pageIndex: number, totalPages: number) => void;
  currentPage?: number; // For controlled component
  displayMode?: 'multipage' | 'singlepage';
  formContext?: Record<string, unknown>;
  initialData?: Record<string, unknown>;
}

export function FormEngine({
  schema,
  onSubmit,
  onDataChange,
  onPageChange,
  currentPage: controlledCurrentPage,
  displayMode,
  formContext = {},
  initialData = {},
}: FormEngineProps) {
  const [formData, setFormData] = useState<Record<string, unknown>>(initialData);
  const [internalCurrentPageIndex, setInternalCurrentPageIndex] = useState(0);

  const pageComponents = useMemo(() => {
    if (schema?.type === 'form' && Array.isArray(schema.children)) {
      return schema.children.filter((child) => child.type === 'page');
    }
    return [];
  }, [schema]);

  const totalPages = pageComponents.length;
  const isMultiPage = (displayMode ?? schema?.display) === 'multipage' && totalPages > 1;

  // Determine if the component is controlled or not for page navigation
  const isPageControlled = controlledCurrentPage !== undefined;
  const currentPageIndex = isPageControlled ? controlledCurrentPage : internalCurrentPageIndex;

  // Effect to call onPageChange when page changes
  useEffect(() => {
    if (isMultiPage) {
      onPageChange?.(currentPageIndex, totalPages);
    }
  }, [currentPageIndex, totalPages, isMultiPage, onPageChange]);

  const handleDataChange = useCallback(
    (fieldName: string, value: unknown) => {
      const newData = { ...formData, [fieldName]: value };
      setFormData(newData);
      onDataChange?.(newData);
    },
    [formData, onDataChange]
  );

  const handleNavigate = (newIndex: number) => {
    if (newIndex >= 0 && newIndex < totalPages) {
      if (isPageControlled) {
        // If controlled, just notify the parent. Parent is responsible for updating the prop.
        onPageChange?.(newIndex, totalPages);
      } else {
        // If uncontrolled, update internal state
        setInternalCurrentPageIndex(newIndex);
      }
    }
  };

  const handleNextPage = useCallback(() => {
    // TODO: Add validation logic before navigating
    handleNavigate(currentPageIndex + 1);
  }, [currentPageIndex, totalPages, isPageControlled, onPageChange]);

  const handlePrevPage = useCallback(() => {
    handleNavigate(currentPageIndex - 1);
  }, [currentPageIndex, isPageControlled, onPageChange]);

  const handleFinalSubmit = useCallback(
    (submittedData: Record<string, unknown>) => {
      onSubmit(submittedData);
    },
    [onSubmit]
  );

  const formEngineContextValue: FormEngineContext = {
    formData,
    onDataChange: handleDataChange,
    formContext,
    formMode: 'edit',
    onSubmit: handleFinalSubmit,
    isMultiPage,
    currentPageIndex: isMultiPage ? currentPageIndex : undefined,
    totalPages: isMultiPage ? totalPages : undefined,
    onNavigateNext: isMultiPage ? handleNextPage : undefined,
    onNavigatePrev: isMultiPage ? handlePrevPage : undefined,
  };

  return (
    <FormEngineProvider value={formEngineContextValue}>
      <DynamicRenderer config={schema} context={formEngineContextValue} />
    </FormEngineProvider>
  );
}
