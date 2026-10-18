import React from 'react';
import { afterEach, beforeEach, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { Sidebar } from '@/components/layout/Sidebar';
import { useWatermarkStore } from '@/store/useWatermarkStore';
import { useI18nStore } from '@/i18n';

beforeEach(() => {
  useI18nStore.getState().setLanguage('zh');
  useWatermarkStore.setState({ activeTab: 'watermark', sidebarOpen: true, recentTools: ['watermark'], favoriteTools: [] });
});
afterEach(cleanup);

it('filters tools by keywords and opens the result with Enter', () => {
  render(<Sidebar />);
  const search = screen.getByRole('textbox', { name: '过滤工具...' });
  fireEvent.change(search, { target: { value: 'GPS' } });
  const navigator = screen.getByRole('navigation', { name: '全部工具' });
  expect(within(navigator).getByRole('button', { name: '照片清理' })).toBeInTheDocument();
  expect(within(navigator).queryByRole('button', { name: '图片水印' })).not.toBeInTheDocument();
  fireEvent.keyDown(search, { key: 'Enter' });
  expect(useWatermarkStore.getState().activeTab).toBe('exif');
});

it('saves tools persistently and shows actual recent tools in order', () => {
  render(<Sidebar />);
  fireEvent.click(screen.getByRole('button', { name: '收藏 隐私遮挡' }));
  fireEvent.click(screen.getByRole('button', { name: '常用收藏' }));
  const saved = screen.getByRole('navigation', { name: '常用收藏' });
  expect(within(saved).getByRole('button', { name: '隐私遮挡' })).toBeInTheDocument();
  expect(within(saved).queryByRole('button', { name: '图片水印' })).not.toBeInTheDocument();
  fireEvent.click(within(saved).getByRole('button', { name: '隐私遮挡' }));
  fireEvent.click(screen.getByRole('button', { name: '最近使用' }));
  const recent = screen.getByRole('navigation', { name: '最近使用' });
  expect(within(recent).getAllByRole('button').filter((button) => button.hasAttribute('aria-current'))[0]).toHaveTextContent('隐私遮挡');
  expect(useWatermarkStore.getState().recentTools).toEqual(['redact', 'watermark']);
  const persisted = JSON.parse(localStorage.getItem('tools-local-watermark-storage')!);
  expect(persisted.state.favoriteTools).toEqual(['redact']);
  expect(persisted.state.recentTools).toEqual(['redact', 'watermark']);
});

it('keeps the download entry reachable when collapsed and reopens search with Cmd+K', () => {
  render(<Sidebar />);
  fireEvent.click(screen.getByRole('button', { name: '折叠侧边栏' }));
  expect(screen.getAllByRole('button', { name: '下载桌面版' })).toHaveLength(1);
  fireEvent.keyDown(window, { key: 'k', metaKey: true });
  expect(screen.getByRole('textbox')).toHaveFocus();
});
