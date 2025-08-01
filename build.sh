#!/bin/bash

# Bob 智谱翻译插件构建脚本
# 用于将源代码打包成 .bobplugin 文件

set -e

echo "开始构建 Bob 智谱翻译插件..."

# 定义变量
PLUGIN_NAME="zhihu-glm-nothink"
VERSION="1.0.1"
SOURCE_DIR="src"
BUILD_DIR="build"
DIST_DIR="dist"
PLUGIN_FILE="${PLUGIN_NAME}-${VERSION}.bobplugin"

# 清理之前的构建
echo "清理构建目录..."
rm -rf "$BUILD_DIR"
rm -rf "$DIST_DIR"

# 创建构建目录
echo "创建构建目录..."
mkdir -p "$BUILD_DIR"
mkdir -p "$DIST_DIR"

# 复制源文件到构建目录
echo "复制源文件..."
cp "$SOURCE_DIR/info.json" "$BUILD_DIR/"
cp "$SOURCE_DIR/main.js" "$BUILD_DIR/"
cp "$SOURCE_DIR/lang.js" "$BUILD_DIR/"
cp "$SOURCE_DIR/icon.svg" "$BUILD_DIR/"

# 验证必要文件存在
echo "验证文件完整性..."
required_files=("info.json" "main.js" "lang.js" "icon.svg")
for file in "${required_files[@]}"; do
    if [ ! -f "$BUILD_DIR/$file" ]; then
        echo "错误: 缺少必要文件 $file"
        exit 1
    fi
done

# 创建插件包 (实际上是一个 zip 文件)
echo "打包插件..."
cd "$BUILD_DIR"
zip -r "../$DIST_DIR/$PLUGIN_FILE" .
cd ..

# 计算 SHA256
echo "计算文件哈希..."
if command -v shasum >/dev/null 2>&1; then
    SHA256=$(shasum -a 256 "$DIST_DIR/$PLUGIN_FILE" | cut -d' ' -f1)
elif command -v sha256sum >/dev/null 2>&1; then
    SHA256=$(sha256sum "$DIST_DIR/$PLUGIN_FILE" | cut -d' ' -f1)
else
    echo "警告: 无法计算 SHA256，请手动计算"
    SHA256="请手动计算"
fi

echo "构建完成!"
echo "插件文件: $DIST_DIR/$PLUGIN_FILE"
echo "SHA256: $SHA256"
echo ""
echo "安装说明:"
echo "1. 双击 $PLUGIN_FILE 文件安装插件"
echo "2. 在 Bob 偏好设置中配置智谱 AI 的 API Key"
echo "3. 在服务列表中启用智谱翻译(无思考)插件"
echo ""
echo "请更新 appcast.json 中的 SHA256 值: $SHA256"