import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, act, cleanup } from '@testing-library/react';
import { JsonFormatterView } from '@/components/json/JsonFormatterView';
import { Sidebar } from '@/components/layout/Sidebar';
import { useWatermarkStore } from '@/store/useWatermarkStore';
import { useI18nStore } from '@/i18n';

describe('JsonFormatterView Component', () => {
  beforeEach(() => {
    localStorage.clear();
    act(() => {
      useI18nStore.getState().setLanguage('zh');
      useWatermarkStore.getState().setActiveTab('json-format');
      useWatermarkStore.getState().setSidebarOpen(true);
    });

    // Mock clipboard
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('renders JSON formatter toolbar, dual view panes, and telemetry footer', () => {
    render(<JsonFormatterView />);

    // Title & tool actions
    expect(screen.getByText('JSON 格式化与修复')).toBeInTheDocument();
    expect(screen.getByText('2 空格美化')).toBeInTheDocument();
    expect(screen.getByText('4 空格美化')).toBeInTheDocument();
    expect(screen.getByText('Tab 制表符')).toBeInTheDocument();
    expect(screen.getByText('极速压缩')).toBeInTheDocument();
    expect(screen.getByText('智能容错修复')).toBeInTheDocument();

    // Footer telemetry
    expect(screen.getByText(/语法正确/)).toBeInTheDocument();
    expect(screen.getAllByText(/BigInt/).length).toBeGreaterThan(0);
  });

  it('toggles between split view and single window view', () => {
    render(<JsonFormatterView />);

    const singleBtn = screen.getByRole('button', { name: '单窗全屏' });
    fireEvent.click(singleBtn);

    // Split headers should no longer be rendered
    expect(screen.queryByText('原始 JSON / JSONC 输入')).not.toBeInTheDocument();

    const splitBtn = screen.getByRole('button', { name: '双栏对照' });
    fireEvent.click(splitBtn);
    expect(screen.getByText('原始 JSON / JSONC 输入')).toBeInTheDocument();
  });

  it('copies formatted JSON to clipboard', () => {
    render(<JsonFormatterView />);

    const copyBtn = screen.getByRole('button', { name: /复制/ });
    fireEvent.click(copyBtn);
    expect(navigator.clipboard.writeText).toHaveBeenCalled();
  });

  it('clears editor content and updates telemetry', () => {
    render(<JsonFormatterView />);

    const clearBtn = screen.getByRole('button', { name: '清空内容' });
    fireEvent.click(clearBtn);

    expect(screen.getAllByText(/0 字符/).length).toBeGreaterThan(0);
  });

  it('executes minify and safe repair actions cleanly', () => {
    render(<JsonFormatterView />);

    // Minify
    const minifyBtn = screen.getByRole('button', { name: '极速压缩' });
    fireEvent.click(minifyBtn);

    // Compression ratio should be calculated and displayed
    expect(screen.getByText(/压缩率/)).toBeInTheDocument();

    // Safe repair
    const repairBtn = screen.getByRole('button', { name: '智能容错修复' });
    fireEvent.click(repairBtn);
    expect(screen.getByText(/语法正确/)).toBeInTheDocument();
  });

  it('navigates to json-format from Sidebar', () => {
    render(<Sidebar />);

    const toolButton = screen.getByRole('button', { name: 'JSON 格式化' });
    expect(toolButton).toBeInTheDocument();

    fireEvent.click(toolButton);
    expect(useWatermarkStore.getState().activeTab).toBe('json-format');
  });

  it('supports English localization in JsonFormatterView', () => {
    act(() => {
      useI18nStore.getState().setLanguage('en');
    });

    render(<JsonFormatterView />);

    expect(screen.getByText('JSON Formatter & Repair')).toBeInTheDocument();
    expect(screen.getAllByText('2 Spaces').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('4 Spaces')).toBeInTheDocument();
    expect(screen.getByText('Minify')).toBeInTheDocument();
    expect(screen.getByText('Safe Repair')).toBeInTheDocument();
    expect(screen.getByText(/Valid JSON/)).toBeInTheDocument();
  });
});
