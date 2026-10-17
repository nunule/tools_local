import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
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

  it('renders dock rail and secondary tools drawer properly', () => {
    render(<Sidebar />);

    // TOOLS header
    expect(screen.getByText('TOOLS')).toBeInTheDocument();

    // Filter tools input
    expect(screen.getByPlaceholderText('过滤工具...')).toBeInTheDocument();

    // Categories
    expect(screen.getByText('图片与隐私安全')).toBeInTheDocument();
    expect(screen.getByText('配置与开发工具')).toBeInTheDocument();
    expect(screen.getByText('即将推出 (第二批)')).toBeInTheDocument();

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

  it('renders DesktopDownloadModal with all platform installers', () => {
    const handleClose = vi.fn();
    render(<DesktopDownloadModal isOpen={true} onClose={handleClose} />);

    expect(screen.getByText('下载 tools local 桌面客户端')).toBeInTheDocument();
    expect(screen.getByText('PWA 桌面原生应用 (推荐 · 一键即用)')).toBeInTheDocument();
    expect(screen.getByText('macOS 客户端')).toBeInTheDocument();
    expect(screen.getByText('Windows 客户端')).toBeInTheDocument();
    expect(screen.getByText('Linux 客户端')).toBeInTheDocument();
    expect(screen.getByText('单文件全离线运行包 (Standalone HTML)')).toBeInTheDocument();
  });

  it('supports English localization seamlessly', () => {
    act(() => {
      useI18nStore.getState().setLanguage('en');
    });

    render(<Sidebar />);

    expect(screen.getByPlaceholderText('Filter tools...')).toBeInTheDocument();
    expect(screen.getByText('Image & Privacy Security')).toBeInTheDocument();
    expect(screen.getByText('Configuration & Dev')).toBeInTheDocument();
    expect(screen.getByText('Runs locally')).toBeInTheDocument();
  });
});
