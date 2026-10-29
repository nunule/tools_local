import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { Sidebar } from '@/components/layout/Sidebar';
import { DesktopDownloadModal } from '@/components/desktop/DesktopDownloadModal';
import { useWatermarkStore } from '@/store/useWatermarkStore';
import { useI18nStore } from '@/i18n';

describe('Toolbit-Style Sidebar & Desktop Download', () => {
  beforeEach(() => {
    localStorage.clear();
    act(() => {
      useI18nStore.getState().setLanguage('zh');
      useWatermarkStore.getState().setSidebarOpen(true);
      useWatermarkStore.getState().setDesktopModalOpen(false);
      useWatermarkStore.getState().setActiveTab('watermark');
    });
  });

  afterEach(() => vi.unstubAllGlobals());

  it('renders dock rail and secondary tools drawer properly', () => {
    render(<Sidebar />);

    // TOOLS header
    expect(screen.getByRole('complementary', { name: 'TOOLS' })).toBeInTheDocument();

    // Filter tools input
    expect(screen.getByPlaceholderText('过滤工具...')).toBeInTheDocument();

    // Categories
    expect(screen.getByText('图片与隐私')).toBeInTheDocument();
    expect(screen.getByText('配置')).toBeInTheDocument();
    expect(screen.getByText('计划中的工具')).toBeInTheDocument();

    // Primary tools under Image & Privacy
    expect(screen.getByText('图片水印')).toBeInTheDocument();
    expect(screen.getByText('隐私遮挡')).toBeInTheDocument();
    expect(screen.getByText('照片清理')).toBeInTheDocument();
    expect(screen.getByText('截图隐私')).toBeInTheDocument();
    expect(screen.getByText('证件副本')).toBeInTheDocument();

    // Runs locally badge
    expect(screen.getByText('纯本地运行')).toBeInTheDocument();
  });

  it('filters tool list based on search query', () => {
    render(<Sidebar />);

    const searchInput = screen.getByPlaceholderText('过滤工具...');
    fireEvent.change(searchInput, { target: { value: '水印' } });

    // Should still show watermark tool
    expect(screen.getByText('图片水印')).toBeInTheDocument();

    // Redact & exif should be filtered out
    expect(screen.queryByText('隐私遮挡')).not.toBeInTheDocument();
    expect(screen.queryByText('照片信息清理')).not.toBeInTheDocument();
  });

  it('triggers desktop modal when download button is clicked', () => {
    render(<Sidebar />);

    // Find the desktop download button in dock or banner
    const downloadBtns = screen.getAllByTitle('下载桌面版');
    expect(downloadBtns.length).toBeGreaterThan(0);

    fireEvent.click(downloadBtns[0]);
    expect(useWatermarkStore.getState().desktopModalOpen).toBe(true);
  });

  it('renders available native installers and clearly marks unpublished platforms', async () => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation(async (url: string) => url.includes('api.github.com')
      ? { ok: false, status: 404 }
      : { ok: true, status: 200, json: async () => ({ schemaVersion: 1, version: '1.0.0', releases: [] }) }));
    render(<DesktopDownloadModal isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByRole('heading', { name: '下载桌面版' })).toBeInTheDocument();
    expect(await screen.findByText('macOS · Apple Silicon')).toBeInTheDocument();
    expect(screen.getByText('macOS · Intel')).toBeInTheDocument();
    expect(screen.getByText('Windows')).toBeInTheDocument();
    expect(screen.getByText('Linux')).toBeInTheDocument();
    expect(screen.getAllByText('暂未发布')).toHaveLength(4);
    expect(screen.getByRole('link', { name: /前往 GitHub 下载/ })).toHaveAttribute('href', 'https://github.com/nunule/tools_local/releases');
    expect(screen.queryByRole('link', { name: /下载安装包/ })).not.toBeInTheDocument();
  });

  it('supports English localization seamlessly', () => {
    act(() => {
      useI18nStore.getState().setLanguage('en');
    });

    render(<Sidebar />);

    expect(screen.getByPlaceholderText('Filter tools...')).toBeInTheDocument();
    expect(screen.getByText('Image & Privacy Security')).toBeInTheDocument();
    expect(screen.getByText('Configuration')).toBeInTheDocument();
    expect(screen.getByText('Runs locally')).toBeInTheDocument();
  });

  it('moves json-config to bottom-left settings and retains json-format in tools list', () => {
    render(<Sidebar />);

    // Under tools drawer, "JSON 格式化" is present
    expect(screen.getByRole('button', { name: 'JSON 格式化' })).toBeInTheDocument();

    // "JSON 配置" is NOT in the tools drawer list
    expect(screen.queryByRole('button', { name: 'JSON 配置' })).not.toBeInTheDocument();

    // Settings buttons are present in rail and drawer footer
    const settingsButtons = screen.getAllByRole('button', { name: /偏好设置/ });
    expect(settingsButtons.length).toBeGreaterThanOrEqual(1);

    // Clicking settings button navigates to json-config without polluting recentTools
    fireEvent.click(settingsButtons[0]);
    expect(useWatermarkStore.getState().activeTab).toBe('json-config');
    expect(useWatermarkStore.getState().recentTools).not.toContain('json-config');

    // Clicking json-format tool navigates and records in recentTools
    const jsonFormatBtn = screen.getByRole('button', { name: 'JSON 格式化' });
    fireEvent.click(jsonFormatBtn);
    expect(useWatermarkStore.getState().activeTab).toBe('json-format');
    expect(useWatermarkStore.getState().recentTools[0]).toBe('json-format');
  });
});
