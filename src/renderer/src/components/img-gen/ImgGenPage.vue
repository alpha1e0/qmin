<template>
  <div class="img-gen-container">
    <!-- Sidebar -->
    <el-aside width="300px" class="sidebar">
      <el-card shadow="never">
        <template #header>
          <span>模型配置</span>
        </template>

        <el-form label-width="80px" label-position="left">
          <el-form-item label="模型">
            <el-select v-model="selectedConfig" @change="handleConfigChange">
              <el-option
                v-for="config in configs"
                :key="config"
                :label="config.replace('.json', '')"
                :value="config"
              />
            </el-select>
          </el-form-item>

          <el-divider>生成设置</el-divider>

          <el-form-item label="数量">
            <el-slider v-model="params.count" :min="1" :max="4" show-input />
          </el-form-item>

          <el-form-item label="大小">
            <el-select v-model="params.size">
              <el-option label="256x256" value="256x256" />
              <el-option label="512x512" value="512x512" />
              <el-option label="768x768" value="768x768" />
              <el-option label="1024x1024" value="1024x1024" />
            </el-select>
          </el-form-item>

          <el-form-item label="比例">
            <el-select v-model="params.ratio" clearable>
              <el-option label="1:1" value="1:1" />
              <el-option label="9:16" value="9:16" />
              <el-option label="3:4" value="3:4" />
              <el-option label="16:9" value="16:9" />
              <el-option label="4:3" value="4:3" />
            </el-select>
          </el-form-item>

          <el-form-item label="质量">
            <el-select v-model="params.quality" clearable>
              <el-option label="standard" value="standard" />
              <el-option label="hd" value="hd" />
            </el-select>
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
          placeholder="请输入图片描述，例如：一只可爱的橘猫在阳光下睡觉，卡通风格"
        />

        <el-divider>参考图片</el-divider>

        <el-upload
          v-model:file-list="refImageList"
          :auto-upload="false"
          :on-change="handleRefImageChange"
          :limit="4"
          list-type="picture-card"
          accept="image/png,image/jpeg,image/jpg"
        >
          <el-icon><Plus /></el-icon>
        </el-upload>

        <template v-if="refImages.length > 0">
          <el-divider>参考图片预览</el-divider>
          <el-row :gutter="16">
            <el-col
              v-for="(img, index) in refImages"
              :key="index"
              :span="6"
            >
              <el-image :src="img.url" fit="cover" style="width: 100%; height: 150px" />
            </el-col>
          </el-row>
        </template>
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
import { ref, onMounted } from 'vue';
import { Plus } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import type { UploadFile } from 'element-plus';
import { ImageGenParams } from '@/main/core/models';

// State
const configs = ref<string[]>([]);
const selectedConfig = ref<string>('');
const prompt = ref('');
const params = ref<ImageGenParams>({
  count: 1,
  size: '512x512',
  ratio: '',
  quality: '',
});
const refImageList = ref<UploadFile[]>([]);
const refImages = ref<Array<{ url: string; file: File }>>([]);
const resultImages = ref<Array<{ url: string; path: string }>>([]);
const generating = ref(false);
const error = ref('');

// Methods
const loadConfigs = async () => {
  try {
    const result = await window.api.img.listLlmConfigs();
    // Filter out qwen configs
    configs.value = result.filter((c) => !c.includes('qwen'));
    if (configs.value.length > 0) {
      selectedConfig.value = configs.value[0];
    }
  } catch (err) {
    ElMessage.error('加载配置失败');
  }
};

const handleConfigChange = () => {
  console.log('Config changed:', selectedConfig.value);
};

const handleRefImageChange = (file: UploadFile) => {
  if (file.raw) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const url = e.target?.result as string;
      const existingIndex = refImages.value.findIndex((img) => img.url === url);
      if (existingIndex === -1) {
        refImages.value.push({ url, file: file.raw! });
      }
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
    // Convert ref images to buffers
    const refImageBuffers: Buffer[] = [];
    for (const img of refImages.value) {
      const arrayBuffer = await img.file.arrayBuffer();
      refImageBuffers.push(Buffer.from(arrayBuffer));
    }

    const request = {
      prompt: prompt.value,
      refImages: refImageBuffers,
      params: params.value,
    };

    const result = await window.api.img.generate(request);

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

onMounted(() => {
  loadConfigs();
});
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
