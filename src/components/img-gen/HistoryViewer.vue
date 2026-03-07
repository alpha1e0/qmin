<template>
  <div class="history-viewer">
    <el-card shadow="never">
      <template #header>
        <div class="header">
          <span>生成历史</span>
          <el-button @click="loadHistory" :loading="loading">
            <el-icon><Refresh /></el-icon> 刷新
          </el-button>
        </div>
      </template>

      <el-table :data="historyList" stripe style="width: 100%">
        <el-table-column prop="id" label="ID" width="180" />
        <el-table-column prop="timestamp" label="时间" width="180" />
        <el-table-column prop="prompt" label="提示词" show-overflow-tooltip />
        <el-table-column prop="refCount" label="参考图" width="80" />
        <el-table-column prop="resultCount" label="结果数" width="80" />
        <el-table-column prop="llmConfig" label="模型配置" width="150" />
        <el-table-column label="操作" width="200">
          <template #default="scope">
            <el-button size="small" @click="handleViewDetail(scope.row)">查看</el-button>
            <el-button size="small" type="danger" @click="handleDelete(scope.row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="detailDialogVisible" title="历史记录详情" width="80%">
      <el-descriptions v-if="currentRecord" :column="2" border>
        <el-descriptions-item label="ID">{{ currentRecord.id }}</el-descriptions-item>
        <el-descriptions-item label="时间">{{ currentRecord.timestamp }}</el-descriptions-item>
        <el-descriptions-item label="模型配置" :span="2">
          {{ currentRecord.llmConfig }}
        </el-descriptions-item>
        <el-descriptions-item label="提示词" :span="2">
          {{ currentRecord.prompt }}
        </el-descriptions-item>
        <el-descriptions-item label="生成参数" :span="2">
          <pre>{{ JSON.stringify(currentRecord.params, null, 2) }}</pre>
        </el-descriptions-item>
      </el-descriptions>

      <template v-if="currentRecord && currentRecord.refImages.length > 0">
        <h4>参考图片 ({{ currentRecord.refImages.length }})</h4>
        <el-row :gutter="16">
          <el-col
            v-for="(img, index) in currentRecord.refImages"
            :key="index"
            :span="8"
            style="margin-bottom: 16px"
          >
            <el-image
              :src="`file://${img}`"
              fit="contain"
              style="width: 100%; height: 200px"
            />
          </el-col>
        </el-row>
      </template>

      <template v-if="currentRecord && currentRecord.resultImages.length > 0">
        <h4>生成结果 ({{ currentRecord.resultImages.length }})</h4>
        <el-row :gutter="16">
          <el-col
            v-for="(img, index) in currentRecord.resultImages"
            :key="index"
            :span="8"
            style="margin-bottom: 16px"
          >
            <el-card>
              <el-image
                :src="`file://${img}`"
                fit="contain"
                style="width: 100%; height: 200px"
              />
              <template #footer>
                <el-button size="small" @click="handleDownloadImage(img)">下载</el-button>
              </template>
            </el-card>
          </el-col>
        </el-row>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Refresh } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { HistoryListItem, ImageGenRecord } from '@/core/models';

// State
const historyList = ref<HistoryListItem[]>([]);
const currentRecord = ref<ImageGenRecord | null>(null);
const detailDialogVisible = ref(false);
const loading = ref(false);

// Methods
const loadHistory = async () => {
  loading.value = true;
  try {
    const result = await window.api.img.listHistory();
    historyList.value = result;
  } catch (err) {
    ElMessage.error('加载历史记录失败');
  } finally {
    loading.value = false;
  }
};

const handleViewDetail = async (item: HistoryListItem) => {
  try {
    const record = await window.api.img.getHistory(item.id);
    if (record) {
      currentRecord.value = record;
      detailDialogVisible.value = true;
    } else {
      ElMessage.error('记录不存在');
    }
  } catch (err) {
    ElMessage.error('加载记录详情失败');
  }
};

const handleDelete = async (item: HistoryListItem) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除记录 ${item.id} 吗？此操作不可恢复。`,
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    );

    await window.api.img.deleteHistory(item.id);
    ElMessage.success('删除成功');
    await loadHistory();
  } catch (err) {
    if (err !== 'cancel') {
      ElMessage.error('删除失败');
    }
  }
};

const handleDownloadImage = (imgPath: string) => {
  // TODO: Implement download
  ElMessage.info('下载功能待实现');
};

onMounted(() => {
  loadHistory();
});
</script>

<style scoped>
.history-viewer {
  padding: 16px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

pre {
  background: #f5f7fa;
  padding: 8px;
  border-radius: 4px;
  font-size: 12px;
  max-height: 200px;
  overflow-y: auto;
}
</style>
