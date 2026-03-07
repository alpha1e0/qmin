<template>
  <div class="roleplay-chat-container">
    <!-- Sidebar -->
    <div class="sidebar">
      <!-- LLM Config Selection -->
      <div class="sidebar-section">
        <div class="section-title">LLM模型</div>
        <el-select v-model="selectedLlmConfig" placeholder="选择模型" @change="handleLlmChange">
          <el-option v-for="config in llmConfigs" :key="config" :label="config" :value="config" />
        </el-select>
      </div>

      <!-- Scenario Selection -->
      <div class="sidebar-section">
        <div class="section-title">
          场景
          <el-button size="small" @click="showScenarioEditor = true">编辑</el-button>
        </div>
        <el-select v-model="selectedScenario" placeholder="选择场景" @change="handleScenarioChange">
          <el-option v-for="scenario in scenarios" :key="scenario" :label="scenario" :value="scenario" />
        </el-select>
      </div>

      <!-- History Selection -->
      <div class="sidebar-section" v-if="selectedScenario">
        <div class="section-title">
          对话历史
          <el-button size="small" type="primary" @click="showNewHistoryDialog = true">+ 新建</el-button>
        </div>
        <el-select v-model="selectedHistory" placeholder="选择历史" @change="handleHistoryChange">
          <el-option v-for="history in histories" :key="history" :label="history.replace('.json', '')" :value="history" />
        </el-select>
      </div>
    </div>

    <!-- Main Content -->
    <div class="main-content" v-if="selectedScenario && selectedHistory">
      <el-tabs v-model="activeTab">
        <!-- Chat Tab -->
        <el-tab-pane label="对话" name="chat">
          <div class="chat-container">
            <!-- Messages Display -->
            <div class="messages-container" ref="messagesContainer">
              <div
                v-for="(msg, idx) in messages"
                :key="idx"
                :class="['message', msg.role === 'user' ? 'user-message' : 'assistant-message']"
                v-show="msg.role !== 'system'"
              >
                <div class="message-content">{{ msg.content }}</div>
              </div>
            </div>

            <!-- Input Area -->
            <div class="input-container">
              <el-input
                v-model="userInput"
                type="textarea"
                :rows="4"
                placeholder="输入消息..."
                @keydown.ctrl.enter.exact="sendMessage"
              />
              <div class="input-actions">
                <el-button @click="popMessage" :disabled="messages.length === 0">回退</el-button>
                <el-button @click="regenerate" :disabled="messages.length === 0">重新生成</el-button>
                <el-button type="primary" @click="sendMessage" :loading="isChatting">发送 (Ctrl+Enter)</el-button>
              </div>
            </div>
          </div>
        </el-tab-pane>

        <!-- Edit Tab -->
        <el-tab-pane label="编辑对话" name="edit">
          <el-input
            v-model="editContent"
            type="textarea"
            :rows="20"
            placeholder="编辑对话历史（格式：role|name\\ncontent）"
          />
          <el-button @click="saveEditedMessages" style="margin-top: 10px">保存修改</el-button>
        </el-tab-pane>

        <!-- JSON Tab -->
        <el-tab-pane label="原始数据" name="json">
          <pre>{{ JSON.stringify(currentHistory, null, 2) }}</pre>
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- Placeholder -->
    <div class="placeholder" v-else>
      <el-empty description="请选择场景和对话历史" />
    </div>

    <!-- New History Dialog -->
    <el-dialog v-model="showNewHistoryDialog" title="新建对话历史" width="400px">
      <el-input v-model="newHistoryName" placeholder="输入对话历史名称" />
      <template #footer>
        <el-button @click="showNewHistoryDialog = false">取消</el-button>
        <el-button type="primary" @click="createHistory">创建</el-button>
      </template>
    </el-dialog>

    <!-- Scenario Editor -->
    <RoleplayScenarioEditor v-if="showScenarioEditor" @close="showScenarioEditor = false" @scenarioUpdated="handleScenarioUpdated" />
  </div>
</template>

<script>
import { RoleplayScenarioEditor } from './RoleplayScenarioEditor.vue';

export default {
  name: 'RoleplayChat',
  components: { RoleplayScenarioEditor },
  data() {
    return {
      selectedLlmConfig: '',
      llmConfigs: [],
      selectedScenario: '',
      scenarios: [],
      selectedHistory: '',
      histories: [],
      messages: [],
      activeTab: 'chat',
      userInput: '',
      editContent: '',
      isChatting: false,
      showNewHistoryDialog: false,
      newHistoryName: '',
      showScenarioEditor: false,
      currentHistory: null,
    };
  },
  async mounted() {
    await this.loadLlmConfigs();
    await this.loadScenarios();

    // Listen for chat streaming events
    window.electron.ipcRendererOn('qmin:rp:chat-chunk', this.onChatChunk);
    window.electron.ipcRendererOn('qmin:rp:chat-complete', this.onChatComplete);
    window.electron.ipcRendererOn('qmin:rp:chat-error', this.onChatError);
  },
  unmounted() {
    window.electron.ipcRendererOff('qmin:rp:chat-chunk', this.onChatChunk);
    window.electron.ipcRendererOff('qmin:rp:chat-complete', this.onChatComplete);
    window.electron.ipcRendererOff('qmin:rp:chat-error', this.onChatError);
  },
  methods: {
    async loadLlmConfigs() {
      try {
        this.llmConfigs = await window.electron.invoke('qmin:rp:list-llm-configs');
        if (this.llmConfigs.length > 0 && !this.selectedLlmConfig) {
          this.selectedLlmConfig = this.llmConfigs[0];
        }
      } catch (err) {
        this.$message.error('加载LLM配置失败');
      }
    },
    async loadScenarios() {
      try {
        this.scenarios = await window.electron.invoke('qmin:rp:list-scenarios');
      } catch (err) {
        this.$message.error('加载场景失败');
      }
    },
    async handleLlmChange() {
      // Reinitialize chat with new LLM config
      if (this.selectedScenario && this.selectedHistory) {
        await this.initChat();
      }
    },
    async handleScenarioChange() {
      // Load histories for selected scenario
      try {
        this.histories = await window.electron.invoke('qmin:rp:list-histories', this.selectedScenario);
        this.selectedHistory = '';
        this.messages = [];
      } catch (err) {
        this.$message.error('加载对话历史失败');
      }
    },
    async handleHistoryChange() {
      await this.initChat();
    },
    async initChat() {
      try {
        await window.electron.invoke('qmin:rp:init-chat', this.selectedScenario, this.selectedHistory, this.selectedLlmConfig);
        const msgs = await window.electron.invoke('qmin:rp:get-messages', this.selectedScenario, this.selectedHistory);
        this.messages = msgs || [];
        this.currentHistory = await window.electron.invoke('qmin:rp:get-history', this.selectedScenario, this.selectedHistory);
        this.updateEditContent();
        this.scrollToBottom();
      } catch (err) {
        this.$message.error('初始化对话失败');
      }
    },
    async sendMessage() {
      if (!this.userInput.trim()) return;

      const message = this.userInput;
      this.userInput = '';
      this.isChatting = true;

      // Add user message to display
      this.messages.push({
        role: 'user',
        content: `${this.currentHistory?.user_name || '用户'}: ${message}`,
      });

      try {
        await window.electron.invoke('qmin:rp:chat-message', this.selectedScenario, this.selectedHistory, message);
      } catch (err) {
        this.isChatting = false;
        this.$message.error('发送消息失败');
      }
    },
    async regenerate() {
      this.isChatting = true;
      try {
        await window.electron.invoke('qmin:rp:regenerate', this.selectedScenario, this.selectedHistory);
      } catch (err) {
        this.isChatting = false;
        this.$message.error('重新生成失败');
      }
    },
    async popMessage() {
      try {
        const result = await window.electron.invoke('qmin:rp:pop-message', this.selectedScenario, this.selectedHistory);
        if (result.popped) {
          const msgs = await window.electron.invoke('qmin:rp:get-messages', this.selectedScenario, this.selectedHistory);
          this.messages = msgs || [];
          this.updateEditContent();
        }
      } catch (err) {
        this.$message.error('回退失败');
      }
    },
    async createHistory() {
      if (!this.newHistoryName.trim()) {
        this.$message.warning('请输入对话历史名称');
        return;
      }

      try {
        const scenario = await window.electron.invoke('qmin:rp:get-scenario', this.selectedScenario);
        const historyData = {
          assistant_name: scenario.assistant_name,
          user_name: scenario.user_name,
          system_prompt: scenario.system_prompt,
          messages: [...scenario.start],
        };

        await window.electron.invoke('qmin:rp:create-history', this.selectedScenario, this.newHistoryName, historyData);
        this.showNewHistoryDialog = false;
        this.newHistoryName = '';
        await this.handleScenarioChange();
        this.$message.success('对话历史创建成功');
      } catch (err) {
        this.$message.error('创建对话历史失败');
      }
    },
    onChatChunk(_event, { chunk }) {
      // Append chunk to last assistant message or create new one
      const lastMsg = this.messages[this.messages.length - 1];
      if (lastMsg && lastMsg.role === 'assistant') {
        lastMsg.content += chunk;
      } else {
        this.messages.push({
          role: 'assistant',
          content: chunk,
        });
      }
      this.scrollToBottom();
    },
    onChatComplete(_event, { messages }) {
      this.messages = messages;
      this.isChatting = false;
      this.updateEditContent();
      this.currentHistory = { ...this.currentHistory, messages };
      this.scrollToBottom();
    },
    onChatError(_event, { error }) {
      this.isChatting = false;
      this.$message.error(error || '聊天出错');
    },
    updateEditContent() {
      this.editContent = this.messages
        .map((msg) => `${msg.role}|${msg.name || ''}\n${msg.content}`)
        .join('\n---\n');
    },
    async saveEditedMessages() {
      try {
        const lines = this.editContent.split('\n---\n');
        const messages = lines.map((line) => {
          const [firstLine, ...contentParts] = line.split('\n');
          const [role, name] = firstLine.split('|');
          return {
            role,
            name: name?.trim(),
            content: contentParts.join('\n'),
          };
        });

        const historyData = { ...this.currentHistory, messages };
        await window.electron.invoke('qmin:rp:save-history', this.selectedScenario, this.selectedHistory, historyData);
        this.messages = messages;
        this.$message.success('保存成功');
      } catch (err) {
        this.$message.error('保存失败');
      }
    },
    handleScenarioUpdated() {
      this.showScenarioEditor = false;
      this.loadScenarios();
    },
    scrollToBottom() {
      this.$nextTick(() => {
        const container = this.$refs.messagesContainer;
        if (container) {
          container.scrollTop = container.scrollHeight;
        }
      });
    },
  },
};
</script>

<style scoped>
.roleplay-chat-container {
  display: flex;
  height: 100vh;
}

.sidebar {
  width: 250px;
  background: #f5f5f5;
  padding: 20px;
  border-right: 1px solid #ddd;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.section-title {
  font-weight: 600;
  margin-bottom: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.main-content {
  flex: 1;
  padding: 20px;
}

.chat-container {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 100px);
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background: #fafafa;
  border-radius: 8px;
  margin-bottom: 20px;
}

.message {
  margin-bottom: 15px;
  padding: 10px 15px;
  border-radius: 8px;
  max-width: 80%;
}

.user-message {
  background: #e3f2fd;
  margin-left: auto;
}

.assistant-message {
  background: #f1f8e9;
}

.message-content {
  white-space: pre-wrap;
  word-break: break-word;
}

.input-container {
  border-top: 1px solid #ddd;
  padding-top: 15px;
}

.input-actions {
  display: flex;
  gap: 10px;
  margin-top: 10px;
  justify-content: flex-end;
}

.placeholder {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
