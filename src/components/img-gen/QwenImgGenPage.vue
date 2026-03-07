<template>
  <div class="img-gen-container">
    <!-- Sidebar -->
    <el-aside width="300px" class="sidebar">
      <el-card shadow="never">
        <template #header>
          <span>Qwen 模型配置</span>
        </template>

        <el-alert
          type="info"
          :closable="false"
          style="margin-bottom: 16px"
        >
          Qwen 会根据是否有参考图自动切换模型（文生图 / 图生图）
        </el-alert>

        <el-form label-width="80px" label-position="left">
          <el-divider>生成设置</el-divider>

          <el-form-item label="数量">
            <el-slider v-model="params.batch_size" :min="1" :max="4" show-input />
          </el-form-item>

          <el-form-item label="大小">
            <el-select v-model="params.image_size">
              <el-option label="1328x1328" value="1328x1328" />
              <el-option label="1664x928" value="1664x928" />
              <el-option label="928x1664" value="928x1664" />
              <el-option label="1472x1140" value="1472x1140" />
              <el-option label="1140x1472" value="1140x1472" />
              <el-option label="1584x1056" value="1584x1056" />
              <el-option label="1056x1584" value="1056x1584" />
            </el-select>
          </el-form-item>

          <el-form-item label="步数">
            <el-slider v-model="params.num_inference_steps" :min="10" :max="50" show-input />
          </el-form-item>
        </el-form>
      </el-card>

      <el-button
        type="primary"
        size="large"
        :loading="generating"
        :disabled="!prompt"
        @click="handleGenerate"
        style="width: 100%; margin-top: 16px"
      >
        {{ generating ? '生成中...' : '生成图片' }}
      </el-button>
    </el-aside>

    <!-- Main Content -->
    <el-main class="main-content">
      <el-card shadow="never">
        <template #header>
          <span>提示词</span>
        </template>

        <el-input
          v-model="prompt"
          type="textarea"
          :rows="6"
          placeholder="请输入图片描述，例如：背景改为大海边，风格为卡通风格"
        />

        <el-divider>参考图片 (可选)</el-divider>

        <el-upload
          v-model:file-list="refImageList"
          :auto-upload="false"
          :on-change="handleRefImageChange"
          :limit="1"
          list-type="picture-card"
          accept="image/png,image/jpeg,image/jpg"
        >
          <el-icon><Plus /></el-icon>
          <template #tip>
            <div class="el-upload__tip">
              Qwen 只支持1张参考图片，上传后自动切换到图生图模式
            </div>
          </template>
        </el-upload>

        <template v-if="refImages.length > 0">
          <el-divider>参考图片预览</el-divider>
          <el-row :gutter="16">
            <el-col :span="12">
              <el-image :src="refImages[0].url" fit="contain" style="width: 100%; height: 300px" />
            </el-col>
          </el-row>
          <el-alert
            type="success"
            :closable="false"
            style="margin-top: 16px"
          >
            当前模式：图生图 (使用 qwen-image-edit 模型)
          </el-alert>
        </template>

        <el-alert
          v-else
          type="info"
          :closable="false"
          style="margin-top: 16px"
        >
          当前模式：文生图 (使用 qwen-image 模型)
        </el-alert>
      </el-card>

      <el-card v-if="resultImages.length > 0" shadow="never" style="margin-top: 16px">
        <template #header>
          <span>生成结果 ({{ resultImages.length }})</span>
        </template>

        <el-row :gutter="16">
          <el-col
            v-for="(img, index) in resultImages"
            :key="index"
            :span="12"
            style="margin-bottom: 16px"
          >
            <el-card shadow="hover">
              <el-image :src="img.url" fit="contain" style="width: 100%; height: 300px" />
              <template #footer>
                <el-button size="small" @click="handleDownload(img)">下载</el-button>
                <el-button size="small" @click="handleViewHistory">查看历史</el-button>
              </template>
            </el-card>
          </el-col>
        </el-row>
      </el-card>

      <el-alert
        v-if="error"
        type="error"
        :title="error"
        :closable="false"
        style="margin-top: 16px"
      />
    </el-main>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Plus } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import type { UploadFile } from 'element-plus';
import { QwenImageGenParams } from '@/core/models';

// State
const prompt = ref('');
const params = ref<QwenImageGenParams>({
  image_size: '928x1664',
  batch_size: 1,
  num_inference_steps: 20,
});
const refImageList = ref<UploadFile[]>([]);
const refImages = ref<Array<{ url: string; file: File }>>([]);
const resultImages = ref<Array<{ url: string; path: string }>>([]);
const generating = ref(false);
const error = ref('');

// Methods
const handleRefImageChange = (file: UploadFile) => {
  if (file.raw) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const url = e.target?.result as string;
      // Replace existing image since Qwen only supports 1
      refImages.value = [{ url, file: file.raw! }];
    };
    reader.readAsDataURL(file.raw);
  }
};

const handleGenerate = async () => {
  if (!prompt.value) {
    ElMessage.warning('请输入提示词');
    return;
  }

  generating.value = true;
  error.value = '';
  resultImages.value = [];

  try {
    // Convert ref image to buffer if exists
    let refImageBuffer: Buffer | undefined;
    if (refImages.value.length > 0) {
      const arrayBuffer = await refImages.value[0].file.arrayBuffer();
      refImageBuffer = Buffer.from(arrayBuffer);
    }

    const request = {
      prompt: prompt.value,
      refImage: refImageBuffer,
      params: params.value,
    };

    const result = await window.api.img.generateQwen(request);

    if (result.success && result.resultImages) {
      // Convert file paths to URLs
      resultImages.value = result.resultImages.map((path) => ({
        url: `file://${path}`,
        path,
      }));
      ElMessage.success(`成功生成 ${resultImages.value.length} 张图片`);
    } else {
      error.value = result.error || '生成失败';
      ElMessage.error(error.value);
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : String(err);
    ElMessage.error(error.value);
  } finally {
    generating.value = false;
  }
};

const handleDownload = (img: { url: string; path: string }) => {
  // TODO: Implement download
  ElMessage.info('下载功能待实现');
};

const handleViewHistory = () => {
  // TODO: Navigate to history page
  ElMessage.info('历史记录页面待实现');
};
</script>

<style scoped>
.img-gen-container {
  display: flex;
  height: calc(100vh - 60px);
}

.sidebar {
  padding: 16px;
  border-right: 1px solid #e4e7ed;
  overflow-y: auto;
}

.main-content {
  padding: 16px;
  overflow-y: auto;
}
</style>
