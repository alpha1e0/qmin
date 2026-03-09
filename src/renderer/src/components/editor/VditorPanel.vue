<template>
  <el-backtop :right="100" :bottom="100" />
  <div class="vditor-toolbar">
    <div class="vditor-toolbar-title">
      <el-icon :size="18" color="#A8ABB2"><HomeFilled /></el-icon>
      <el-text size="large" type="info"> {{ titlePath }} </el-text>
      <el-text size="small" type="info"> {{ this.contentLength }} </el-text>
    </div>
    <div class="vditor-toolbar-op">
      <el-button plain @click="saveCurrentDocument">
        <el-icon :size="18"><Select /></el-icon>
      </el-button>
      <el-button plain @click="handleResetCategory">
        <el-icon :size="18"><Female /></el-icon>
      </el-button>
    </div>
  </div>
  <div id="my-editor"></div>
  <el-dialog v-model="replacementVisiable" width="350" draggable>
    <template #header="{ titleId, titleClass }">
      <div class="customDialogHeader">
        <el-text type="info" size="large" :id="titleId" :class="titleClass" truncated>替换</el-text>
      </div>
    </template>
    <el-form :model="replacementForm">
      <el-form-item label="S" label-width="50px">
        <el-input
          v-model="replacementForm.source"
          autocomplete="off"
          placeholder="输入要替换的文本"
        />
      </el-form-item>
      <el-form-item label="D" label-width="50px">
        <el-input v-model="replacementForm.dst" autocomplete="off" placeholder="输入替换的内容" />
      </el-form-item>
    </el-form>
    <template #footer>
      <div class="dialog-footer">
        <el-button type="primary" @click="doReplace">确认</el-button>
        <el-button @click="cancleReplace">取消</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script>
import Vditor from 'vditor';
import 'vditor/dist/index.css';
import { ElMessage } from 'element-plus';
import { ElLoading } from 'element-plus';

// Define constants locally since importing TS from JS is problematic
const DEFAULT_SERVER_ADDR = 'http://127.0.0.1:8080';
const AUTO_SAVE_INTERVAL = 30000;

export default {
  name: 'VditorPanel',

  emits: ['vditorPanelReady', 'resetCategory'],

  props: {
    titlePath: String,
  },

  data() {
    return {
      serverAddr: DEFAULT_SERVER_ADDR, // Kept for legacy compatibility

      editorObj: '',
      currentDocId: -1,
      currentDocName: '',

      enableOutline: false, // 是否默认显示文档结构
      contentLength: 0,

      autoSaveIntervalId: null,

      replacementVisiable: false,
      replacementForm: {
        source: '',
        dst: '',
      },
    };
  },

  methods: {
    showCurrentDocument() {
      this.viewDocument(this.currentDocId);
    },

    viewDocument(docId) {
      console.log(`>>> view document ${docId}`);
      this.currentDocId = docId;

      // 为了一致性，必须先置空，避免加载当前文档失败、较慢，工作区仍然是其他文档，自动保存为其他文档
      this.editorObj.setValue('');
      this.editorObj.disabled();
      const loading = ElLoading.service({ text: '文档加载中...' });

      // Use IPC instead of axios
      const mdApi = window.mdEditor || window.electron?.md;
      if (mdApi && mdApi.getDocById) {
        mdApi.getDocById(docId).then(
          (docData) => {
            loading.close();
            this.editorObj.enable();
            this.currentDocName = docData[1];
            this.editorObj.setValue(docData[3]);
          },
          (err) => {
            this.viewNull();
            loading.close();
            console.error('get document failed:', err);
            ElMessage.error(`获取文档失败: ${err}`);
          }
        );
      } else {
        // Fallback to axios for backward compatibility
        console.warn('IPC API not available, using axios fallback');
        this.$forceUpdate();
      }
    },

    viewNull() {
      this.currentDocId = -1;
      this.currentDocName = '';
      this.editorObj.setValue('');
      this.editorObj.disabled();
    },

    saveCurrentDocument() {
      if (this.currentDocId <= 0) {
        // console.error(`>>> cannot save doc ${this.currentDocId}`);
        return;
      }
      console.log(`>>> manul save ${this.currentDocId} document`);
      this.saveDocument(this.currentDocId).then(() => {
        ElMessage({
          type: 'success',
          message: '保存成功',
          duration: 1000,
        });
      });
    },

    autoSaveDocument() {
      if (this.currentDocId <= 0) {
        // console.error(`>>> cannot auto save doc ${this.currentDocId}`);
        return;
      }
      console.log(`>>> auto save document ${this.currentDocId}`);
      this.saveDocument(this.currentDocId).then(() => {});
    },

    saveDocument(docIdToSave) {
      const currentContent = this.editorObj.getValue();
      // 如果文档内容为空则不更新
      if (!currentContent || currentContent.trim() == '') {
        console.warn('>>> escape blank doc save');
        return Promise.resolve();
      }

      const docParams = {
        content: currentContent,
      };

      // Use IPC instead of axios
      const mdApi = window.mdEditor || window.electron?.md;
      if (mdApi && mdApi.updateDoc) {
        return mdApi.updateDoc(docIdToSave, docParams).then(
          () => {},
          (err) => {
            console.error('save document failed:', err);
            ElMessage.error(`保存文档失败: ${err}`);
            throw err;
          }
        );
      } else {
        // Fallback for backward compatibility would go here
        console.warn('IPC API not available for saveDocument');
        return Promise.resolve();
      }
    },

    handleResetCategory() {
      this.$emit('resetCategory');
    },

    doReplace() {
      if (this.replacementForm.source === '') {
        ElMessage.error('替换失败，替换内容不能为空');
        this.replacementVisiable = false;
        return;
      }

      const originContent = this.editorObj.getValue();

      let replaceCounter = 0;
      const regex = new RegExp(this.replacementForm.source, 'g');
      const newContent = originContent.replace(regex, () => {
        replaceCounter++;
        return this.replacementForm.dst;
      });
      // let newContent = originContent.split(this.replacementForm.source).join(this.replacementForm.dst);
      if (replaceCounter > 0) {
        this.editorObj.setValue(newContent);
        ElMessage({
          message: `替换成功 ${replaceCounter} 处`,
          type: 'success',
        });
      } else {
        ElMessage(`未找到 ${this.replacementForm.source}`);
      }

      this.replacementVisiable = false;
      this.replacementForm.source = '';
      this.replacementForm.dst = '';
    },

    cancleReplace() {
      this.replacementForm.source = '';
      this.replacementForm.dst = '';

      this.replacementVisiable = false;
    },

    doReplaceImg() {
      const originContent = this.editorObj.getValue();

      const regex = /!\[(.*?)\]\((.*?)\)/g;
      let replaceCounter = 0;
      const htmlText = originContent.replace(regex, (match, p1, p2) => {
        replaceCounter++;
        return `<img src='${p2}' height='400' alt='${p1}'/>`;
      });

      if (replaceCounter > 0) {
        this.editorObj.setValue(htmlText);
        ElMessage({
          message: `成功替换 ${replaceCounter} 处`,
          type: 'success',
        });
      } else {
        ElMessage(`未找到可替换内容`);
      }
    },

    rawPaste() {
      navigator.clipboard
        .readText()
        .then((content) => {
          const originContent = this.editorObj.getValue();
          const newContent = originContent + content;
          this.editorObj.setValue(newContent);
        })
        .catch((err) => {
          console.log('failed to read clipboard', err);
          ElMessage.error('failed to read clipboard');
        });
    },

    createEditor() {
      this.editorObj = new Vditor('my-editor', {
        minHeight: 700,
        toolbarConfig: {
          pin: true,
        },
        cache: {
          enable: false,
        },
        outline: {
          enable: this.enableOutline,
          position: 'right',
        },
        counter: {
          enable: true,
          after: (length) => {
            this.contentLength = length;
          },
        },
        toolbar: [
          'edit-mode',
          '|',
          'headings',
          'bold',
          'italic',
          'strike',
          'link',
          '|',
          'emoji',
          'check',
          'table',
          'list',
          'ordered-list',
          'outdent',
          'indent',
          '|',
          'quote',
          'line',
          'code',
          'inline-code',
          'insert-before',
          '|',
          'undo',
          'redo',
          {
            name: 'text-replace',
            tipPosition: 's',
            tip: '文本替换',
            className: 'text-replace-btn',
            icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-layers-half" viewBox="0 0 16 16"><path d="M8.235 1.559a.5.5 0 0 0-.47 0l-7.5 4a.5.5 0 0 0 0 .882L3.188 8 .264 9.559a.5.5 0 0 0 0 .882l7.5 4a.5.5 0 0 0 .47 0l7.5-4a.5.5 0 0 0 0-.882L12.813 8l2.922-1.559a.5.5 0 0 0 0-.882l-7.5-4zM8 9.433 1.562 6 8 2.567 14.438 6 8 9.433z"/></svg>',
            click: () => {
              this.replacementVisiable = true;
            },
          },
          {
            name: 'img-replace',
            tipPosition: 's',
            tip: '图片样式替换',
            className: 'img-replace-btn',
            icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-r-circle" viewBox="0 0 16 16"><path d="M1 8a7 7 0 1 0 14 0A7 7 0 0 0 1 8Zm15 0A8 8 0 1 1 0 8a8 8 0 0 1 16 0ZM5.5 4.002h3.11c1.71 0 2.741.973 2.741 2.46 0 1.138-.667 1.94-1.495 2.24L11.5 12H9.98L8.52 8.924H6.836V12H5.5V4.002Zm1.335 1.09v2.777h1.549c.995 0 1.573-.463 1.573-1.36 0-.913-.596-1.417-1.537-1.417H6.835Z"/></svg>',
            click: () => {
              this.doReplaceImg();
            },
          },
          {
            name: 'raw-paste',
            tipPosition: 's',
            tip: '纯文本粘贴',
            className: 'raw-paste-btn',
            icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-stickies-fill" viewBox="0 0 16 16"><path d="M0 1.5V13a1 1 0 0 0 1 1V1.5a.5.5 0 0 1 .5-.5H14a1 1 0 0 0-1-1H1.5A1.5 1.5 0 0 0 0 1.5z"/><path d="M3.5 2A1.5 1.5 0 0 0 2 3.5v11A1.5 1.5 0 0 0 3.5 16h6.086a1.5 1.5 0 0 0 1.06-.44l4.915-4.914A1.5 1.5 0 0 0 16 9.586V3.5A1.5 1.5 0 0 0 14.5 2h-11zm6 8.5a1 1 0 0 1 1-1h4.396a.25.25 0 0 1 .177.427l-5.146 5.146a.25.25 0 0 1-.427-.177V10.5z"/></svg>',
            click: () => {
              this.rawPaste();
            },
          },
          {
            name: 'more',
            toolbar: ['export', 'outline', 'preview', 'help'],
          },
        ],
        upload: {
          accept: 'image/*,.mp3, .wav',
          max: 8 * 1024 * 1024,
          fieldName: 'file',
          custom: async (files, successCallback) => {
            // Custom upload handler using IPC
            const mdApi = window.mdEditor || window.electron?.md;
            if (!mdApi || !mdApi.saveImage) {
              alert('Upload API not available');
              return;
            }

            const uploadedFiles = [];
            const errFiles = [];

            for (const file of files) {
              try {
                const [imageId, imageName] = await mdApi.saveImage(file.path);
                // Create a data URL for the image
                const dataUrl = `file://${file.path}`;
                uploadedFiles.push({
                  path_id: imageId,
                  name: imageName,
                  url: dataUrl,
                });
              } catch (err) {
                console.error('Upload failed:', err);
                errFiles.push({
                  name: file.name,
                  msg: err.toString(),
                });
              }
            }

            successCallback(uploadedFiles);
          },
        },
        after: () => {
          this.editorObj.setValue('');
          this.$emit('vditorPanelReady'); // 加载完成后发送消息给父组件
          console.log('>>> vditor ready');
          this.autoSaveIntervalId = setInterval(this.autoSaveDocument, AUTO_SAVE_INTERVAL);
        },
      });
    },

    handleKeyDown(event) {
      if (event.ctrlKey && event.key == 's') {
        this.saveCurrentDocument();
      }
    },
  },

  mounted() {
    // Editor will be created immediately now
    // No need to wait for server address (IPC doesn't need it)
    this.createEditor();

    document.addEventListener('keydown', this.handleKeyDown);
  },

  unmounted() {
    document.removeEventListener('keydown', this.handleKeyDown);
    if (this.autoSaveIntervalId != null) {
      clearInterval(this.autoSaveIntervalId);
    }
  },
};
</script>

<style>
.vditor-toolbar {
  height: 30px;
  margin: 3px 3px 10px 3px;
  padding-left: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.vditor-toolbar-title {
  display: flex;
  align-items: center;
}

.vditor-toolbar-title .el-text {
  margin-left: 10px;
}

.vditor-toolbar-op {
  margin-right: 5px;
}

.customDialogHeader {
  margin: 3px 8px 10px 10px;
  max-width: 200px;
}
</style>
