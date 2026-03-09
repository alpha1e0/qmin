<template>
  <component :is="currentComponent" @navigate="handleNavigate" />
</template>

<script>
import Homepage from './homepage/Homepage.vue';
import MdEditor from './editor/MdEditor.vue';
import IVViewer from './image-view/IVViewer.vue';
import RoleplayChat from './roleplay/RoleplayChat.vue';
import ImgGenPage from './img-gen/ImgGenPage.vue';
import QwenImgGenPage from './img-gen/QwenImgGenPage.vue';
import HistoryViewer from './img-gen/HistoryViewer.vue';

export default {
  name: 'MainComponent',

  components: {
    Homepage,
    MdEditor,
    IVViewer,
    RoleplayChat,
    ImgGenPage,
    QwenImgGenPage,
    HistoryViewer,
  },

  data() {
    return {
      currentComponent: 'Homepage',
    };
  },

  methods: {
    /**
     * 切换到首页
     */
    switchToHomepage() {
      this.currentComponent = 'Homepage';
    },

    /**
     * 切换到 Markdown 编辑器
     */
    switchToMDEditor() {
      this.currentComponent = 'MdEditor';
    },

    /**
     * 切换到图片查看器
     */
    switchToIVViewer() {
      this.currentComponent = 'IVViewer';
    },

    /**
     * 切换到AI角色扮演
     */
    switchToRoleplay() {
      this.currentComponent = 'RoleplayChat';
    },

    /**
     * 切换到AI生图
     */
    switchToImgGen() {
      this.currentComponent = 'ImgGenPage';
    },

    /**
     * 切换到Qwen生图
     */
    switchToImgGenQwen() {
      this.currentComponent = 'QwenImgGenPage';
    },

    /**
     * 切换到历史记录查看
     */
    switchToImgGenHistory() {
      this.currentComponent = 'HistoryViewer';
    },

    /**
     * 处理来自子组件的导航请求
     * @param {string} target - 目标组件名称
     * @param {object} params - 导航参数
     */
    handleNavigate(target, params) {
      console.log('导航到:', target, params);
      switch (target) {
        case 'homepage':
          this.switchToHomepage();
          break;
        case 'mdeditor':
          this.switchToMDEditor();
          break;
        case 'ivviewer':
          this.switchToIVViewer();
          break;
        case 'roleplay':
          this.switchToRoleplay();
          break;
        case 'imggen':
          this.switchToImgGen();
          break;
        case 'imggen-qwen':
          this.switchToImgGenQwen();
          break;
        case 'imggen-history':
          this.switchToImgGenHistory();
          break;
        case 'ai-assistant':
          // TODO: 实现 AI 助手导航
          console.log('导航到 AI 助手:', params);
          break;
        default:
          console.warn('未知的导航目标:', target);
      }
    },

    /**
     * 处理键盘快捷键
     */
    handleKeyDown(event) {
      if (event.ctrlKey && event.altKey) {
        if (event.key == 'h') {
          this.switchToHomepage();
        }
        if (event.key == 'e') {
          this.switchToMDEditor();
        }
        if (event.key == 'i') {
          this.switchToIVViewer();
        }
        if (event.key == 'r') {
          this.switchToRoleplay();
        }
        if (event.key == 'g') {
          this.switchToImgGen();
        }
      }
    },
  },

  mounted() {
    window.electron.ipcRendererOn('switch-to-homepage', this.switchToHomepage);
    window.electron.ipcRendererOn('switch-to-mdeditor', this.switchToMDEditor);
    window.electron.ipcRendererOn('switch-to-ivviewer', this.switchToIVViewer);
    window.electron.ipcRendererOn('switch-to-roleplay', this.switchToRoleplay);
    window.electron.ipcRendererOn('switch-to-imggen', this.switchToImgGen);

    document.addEventListener('keydown', this.handleKeyDown);
  },

  unmounted() {
    window.electron.ipcRendererOff('switch-to-homepage', this.switchToHomepage);
    window.electron.ipcRendererOff('switch-to-mdeditor', this.switchToMDEditor);
    window.electron.ipcRendererOff('switch-to-ivviewer', this.switchToIVViewer);
    window.electron.ipcRendererOff('switch-to-roleplay', this.switchToRoleplay);
    window.electron.ipcRendererOff('switch-to-imggen', this.switchToImgGen);

    document.removeEventListener('keydown', this.handleKeyDown);
  },
};
</script>
