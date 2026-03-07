<template>
  <el-dialog v-model="visible" title="场景编辑器" width="80%" @close="handleClose">
    <div class="scenario-editor-container">
      <!-- Sidebar: Scenario List -->
      <div class="scenario-sidebar">
        <div class="scenario-list">
          <div
            v-for="scenario in scenarios"
            :key="scenario"
            :class="['scenario-item', { active: selectedScenario === scenario }]"
            @click="selectScenario(scenario)"
          >
            {{ scenario }}
          </div>
        </div>
        <el-button @click="showCreateDialog = true">+ 新建场景</el-button>
      </div>

      <!-- Editor Panel -->
      <div class="editor-panel">
        <div v-if="selectedScenario">
          <el-radio-group v-model="editMode">
            <el-radio-button label="json">JSON编辑</el-radio-button>
            <el-radio-button label="prompt">系统提示词</el-radio-button>
          </el-radio-group>

          <!-- JSON Editor -->
          <div v-if="editMode === 'json'" class="json-editor">
            <el-input
              v-model="jsonContent"
              type="textarea"
              :rows="25"
              placeholder="场景JSON定义"
            />
          </div>

          <!-- System Prompt Editor -->
          <div v-else class="prompt-editor">
            <el-input
              v-model="promptContent"
              type="textarea"
              :rows="25"
              placeholder="系统提示词（Markdown格式）"
            />
          </div>

          <div class="editor-actions">
            <el-button @click="saveScenario" type="primary">保存</el-button>
          </div>
        </div>

        <div v-else class="empty-state">
          <el-empty description="选择或创建场景" />
        </div>
      </div>
    </div>

    <!-- Create Scenario Dialog -->
    <el-dialog v-model="showCreateDialog" title="新建场景" width="500px">
      <el-form label-width="100px">
        <el-form-item label="场景名称">
          <el-input v-model="newScenarioName" placeholder="输入场景名称" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="createScenario">创建</el-button>
      </template>
    </el-dialog>

    <template #footer>
      <el-button @click="handleClose">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script>
export default {
  name: 'RoleplayScenarioEditor',
  emits: ['close', 'scenarioUpdated'],
  data() {
    return {
      visible: true,
      scenarios: [],
      selectedScenario: '',
      editMode: 'json',
      jsonContent: '',
      promptContent: '',
      showCreateDialog: false,
      newScenarioName: '',
      currentScenario: null,
    };
  },
  async mounted() {
    await this.loadScenarios();
  },
  methods: {
    async loadScenarios() {
      try {
        this.scenarios = await window.electron.invoke('qmin:rp:list-scenarios');
      } catch (err) {
        this.$message.error('加载场景列表失败');
      }
    },
    async selectScenario(name) {
      this.selectedScenario = name;
      try {
        const scenario = await window.electron.invoke('qmin:rp:get-scenario', name);
        this.currentScenario = scenario;
        this.jsonContent = JSON.stringify(scenario, null, 2);
        this.promptContent = scenario.system_prompt || '';
      } catch (err) {
        this.$message.error('加载场景失败');
      }
    },
    async saveScenario() {
      try {
        if (this.editMode === 'json') {
          const data = JSON.parse(this.jsonContent);
          await window.electron.invoke('qmin:rp:update-scenario', this.selectedScenario, data);
        } else {
          const data = { ...this.currentScenario, system_prompt: this.promptContent };
          await window.electron.invoke('qmin:rp:update-scenario', this.selectedScenario, data);
        }
        this.$message.success('保存成功');
        this.$emit('scenarioUpdated');
      } catch (err) {
        this.$message.error('保存失败：' + (err?.message || err));
      }
    },
    async createScenario() {
      if (!this.newScenarioName.trim()) {
        this.$message.warning('请输入场景名称');
        return;
      }

      const template = {
        assistant_name: '角色名',
        user_name: '用户',
        system_prompt: '你是擅长角色扮演、聊天的AI助手...',
        start: [],
      };

      try {
        await window.electron.invoke('qmin:rp:create-scenario', this.newScenarioName, template);
        this.showCreateDialog = false;
        this.newScenarioName = '';
        await this.loadScenarios();
        await this.selectScenario(this.newScenarioName);
        this.$message.success('场景创建成功');
        this.$emit('scenarioUpdated');
      } catch (err) {
        this.$message.error('创建场景失败：' + (err?.message || err));
      }
    },
    handleClose() {
      this.visible = false;
      this.$emit('close');
    },
  },
};
</script>

<style scoped>
.scenario-editor-container {
  display: flex;
  height: 70vh;
}

.scenario-sidebar {
  width: 200px;
  border-right: 1px solid #ddd;
  padding: 15px;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.scenario-list {
  flex: 1;
  overflow-y: auto;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.scenario-item {
  padding: 10px;
  cursor: pointer;
  border-bottom: 1px solid #eee;
}

.scenario-item:hover {
  background: #f5f5f5;
}

.scenario-item.active {
  background: #e3f2fd;
  font-weight: 600;
}

.editor-panel {
  flex: 1;
  padding: 15px;
  display: flex;
  flex-direction: column;
}

.json-editor,
.prompt-editor {
  flex: 1;
  margin-top: 15px;
}

.editor-actions {
  margin-top: 15px;
  text-align: right;
}

.empty-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
