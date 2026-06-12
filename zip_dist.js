import AdmZip from 'adm-zip';
import path from 'path';

try {
  const zip = new AdmZip();
  // Add the dist directory contents (index.html, assets, etc.)
  zip.addLocalFolder('dist');
  zip.writeZip('dist_compiled_by_ai.zip');
  console.log('✨ dist 目录已成功压缩为 dist_compiled_by_ai.zip ✨');
} catch (error) {
  console.error('❌ 压缩失败:', error);
  process.exit(1);
}
