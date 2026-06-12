import fs from 'fs';
import path from 'path';

function copyDir(src, dest) {
  if (fs.existsSync(dest)) {
    fs.rmSync(dest, { recursive: true, force: true });
  }
  fs.mkdirSync(dest, { recursive: true });
  
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (let entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

try {
  console.log('正在执行打包 & 拷贝中...');
  copyDir('dist', '手机扫码访问专用文件夹');
  console.log('✨ 部署文件夹制作成功！');
  console.log('已生成名为: "手机扫码访问专用文件夹" 的普通文件夹。');
} catch (error) {
  console.error('拷贝失败:', error);
}
