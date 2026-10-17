import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { WatermarkControls } from '@/components/watermark/WatermarkControls';
import { useI18nStore } from '@/i18n';

describe('WatermarkControls Component', () => {
  beforeEach(() => {
    act(() => {
      useI18nStore.getState().setLanguage('zh');
    });
  });

  it('renders tab buttons properly in Chinese', () => {
    render(<WatermarkControls />);

    expect(screen.getByText('文字')).toBeInTheDocument();
    expect(screen.getByText('排布')).toBeInTheDocument();
    expect(screen.getByText('效果')).toBeInTheDocument();
    expect(screen.getByText('预设')).toBeInTheDocument();
    expect(screen.getByText('导出')).toBeInTheDocument();
  });

  it('switches between tabs on click in Chinese', () => {
    render(<WatermarkControls />);

    // Click '排布' tab
    const layoutTab = screen.getByText('排布');
    fireEvent.click(layoutTab);

    expect(screen.getByText('水印排布模式')).toBeInTheDocument();
    expect(screen.getByText('全屏防伪平铺')).toBeInTheDocument();
    expect(screen.getByText('单点定点水印')).toBeInTheDocument();
  });

  it('shows preset templates in presets tab', () => {
    render(<WatermarkControls />);

    const presetsTab = screen.getByText('预设');
    fireEvent.click(presetsTab);

    expect(screen.getByText('一键预设模版库')).toBeInTheDocument();
    expect(screen.getByText('防盗用全屏平铺')).toBeInTheDocument();
    expect(screen.getByText('证件审核专用')).toBeInTheDocument();
  });

  it('supports English internationalization properly', () => {
    act(() => {
      useI18nStore.getState().setLanguage('en');
    });

    render(<WatermarkControls />);

    expect(screen.getByText('Text')).toBeInTheDocument();
    expect(screen.getByText('Layout')).toBeInTheDocument();
    expect(screen.getByText('Style')).toBeInTheDocument();
    expect(screen.getByText('Presets')).toBeInTheDocument();
    expect(screen.getByText('Export')).toBeInTheDocument();

    const presetsTab = screen.getByText('Presets');
    fireEvent.click(presetsTab);

    expect(screen.getByText('One-Click Presets Library')).toBeInTheDocument();
    expect(screen.getByText('Confidential Tiled')).toBeInTheDocument();
  });
});
