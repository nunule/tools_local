import { BrandIcon } from '@/components/brand/BrandIcon';

export function AboutPrivacyView() {
  return (
    <div className="flex-1 h-full overflow-y-auto p-6 md:p-10 bg-muted/20">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <BrandIcon className="h-14 w-14" />
          <div>
            <h1 className="text-2xl font-semibold text-foreground tracking-tight">tools local</h1>
            <p className="text-sm text-muted-foreground mt-1">图片水印</p>
          </div>
        </div>

        <section className="rounded-xl bg-card border border-border p-6 space-y-4">
          <h2 className="text-sm font-semibold text-foreground">使用方法</h2>
          <ol className="list-decimal pl-5 space-y-3 text-sm text-muted-foreground leading-relaxed">
            <li>选择图片，或将图片拖入画布。支持一次添加多张图片。</li>
            <li>在右侧设置水印文字、位置和样式，也可以直接选择预设。</li>
            <li>选择导出格式，保存当前图片或将全部图片打包下载。</li>
          </ol>
        </section>

        <section className="rounded-xl bg-card border border-border p-6 space-y-4">
          <h2 className="text-sm font-semibold text-foreground">文件与设置</h2>
          <dl className="space-y-4 text-sm leading-relaxed">
            <div className="space-y-1">
              <dt className="font-medium text-foreground">图片</dt>
              <dd className="text-muted-foreground">图片在当前页面中处理，不会上传。刷新或关闭页面后，需要重新添加。</dd>
            </div>
            <div className="space-y-1">
              <dt className="font-medium text-foreground">设置</dt>
              <dd className="text-muted-foreground">水印参数和界面偏好保存在当前浏览器。可通过 JSON 配置导入或导出水印参数。</dd>
            </div>
            <div className="space-y-1">
              <dt className="font-medium text-foreground">导出</dt>
              <dd className="text-muted-foreground">支持 PNG、JPEG、WebP，以及多张图片的 ZIP 打包。</dd>
            </div>
          </dl>
        </section>
      </div>
    </div>
  );
}
