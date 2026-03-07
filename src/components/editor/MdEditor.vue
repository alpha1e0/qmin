<template>
  <div class="mdeditor-layout">
    <el-row :gutter="3">
      <!-- 分类列 -->
      <el-col :span="3" class="category-op-panel">
        <!-- 分类列操作按钮区域 -->
        <div class="c-icon-btn-list">
          <el-button plain @click="showCategoryCreateDialog">
            <el-icon :size="16" color="#409efc"><Plus /></el-icon>
          </el-button>
          <el-button plain @click="deleteCurrentCategory">
            <el-icon :size="16"><Delete /></el-icon>
          </el-button>
          <el-button plain @click="showCategoryModifyDialog">
            <el-icon :size="16"><Edit /></el-icon>
          </el-button>
          <el-button plain ref="refreshCategoryBtn" @click="refreshCategory">
            <el-icon :size="16"><Refresh /></el-icon>
          </el-button>
        </div>

        <!-- 分类列表 -->
        <div class="category-list-panel">
          <li
            v-for="(c, idx) in categoryList"
            :key="idx"
            @click="clickCategory(idx)"
            :class="{ 'c-font-bold': currentCategory === idx }"
          >
            <el-icon :size="16"><Notebook /></el-icon
            ><el-text class="list-content" truncated> {{ c[1] }} </el-text>
          </li>
        </div>
      </el-col>

      <!-- 文档列表 -->
      <el-col :span="4" class="doc-op-panel">
        <div class="d-icon-btn-list">
          <el-button plain @click="showDocCreateDialog">
            <el-icon :size="16" color="#409efc"><Plus /></el-icon>
          </el-button>
          <el-button plain @click="deleteCurrentDoc">
            <el-icon :size="16"><Delete /></el-icon>
          </el-button>
          <el-button plain>
            <el-icon :size="16" @click="showDocModifyDialog"><Edit /></el-icon>
          </el-button>
        </div>

        <div class="doc-list-panel">
          <el-card v-for="(doc, idx) in docList" :key="idx">
            <template #header>
              <div
                class="doc-card-title"
                @click="clickDoc(idx)"
                :class="{ 'd-font-bold': currentDoc === idx }"
              >
                <el-text size="large" truncated>{{ doc[1] }}</el-text>
              </div>
            </template>
            <p class="doc-card-summary">{{ doc[2] }}</p>
            <template #footer>
              <div class="doc-card-footer">
                {{ doc[4] }}
              </div>
            </template>
          </el-card>
        </div>
      </el-col>

      <!-- 文档内容 -->
      <el-col :span="17" class="doc-content-panel">
        <div class="editor-content">
          <VditorPanel
            ref="vditorPanel"
            :title-path="titlePath"
            @vditor-panel-ready="handleVditorPanelReady"
            @reset-category="currentSpace = 0"
          >
          </VditorPanel>
        </div>
      </el-col>
    </el-row>

    <!-- 分类创建、更新对话框 -->
    <el-dialog v-model="categoryCreateOrModifyDialogVisible" width="390">
      <template #header="{ titleId, titleClass }">
        <div class="customDialogHeader">
          <el-text type="info" size="large" :id="titleId" :class="titleClass" truncated>{{
            categoryCreateOrModifyTitle
          }}</el-text>
        </div>
      </template>
      <el-form :model="categoryForm">
        <el-form-item label="名称" label-width="50px">
          <el-input v-model="categoryForm.name" autocomplete="off" placeholder="请输入分类名称" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="createOrModifyCategory">确认</el-button>
          <el-button @click="cancleCreateOrModifyCategory">取消</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 文档创建更新对话框 -->
    <el-dialog v-model="docCreateOrModifyDialogVisible" width="390">
      <template #header="{ titleId, titleClass }">
        <div class="customDialogHeader">
          <el-text type="info" size="large" :id="titleId" :class="titleClass" truncated>{{
            docCreateOrModifyTitle
          }}</el-text>
        </div>
      </template>
      <el-form :model="docForm">
        <el-form-item label="名称" label-width="50px">
          <el-input v-model="docForm.name" autocomplete="off" placeholder="请输入文档名称" />
        </el-form-item>
        <el-form-item label="摘要" label-width="50px">
          <el-input
            v-model="docForm.summary"
            autocomplete="off"
            :rows="3"
            type="textarea"
            placeholder="请输入文档摘要"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="createOrModifyDoc">确认</el-button>
          <el-button @click="cancleCreateOrModifyDoc">取消</el-button>
        </div>
      </template>
    </el-dialog>

    <el-dialog
      v-model="hkeyDialogVisible"
      @opened="onHkeyDialogOpen"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      :show-close="false"
      title="***"
      width="300"
      center
    >
      <el-form :model="hkeyForm" @keydown.ctrl="switchToHCategory">
        <el-form-item label="HKEY" label-width="50px">
          <el-input
            v-model="hkeyForm.key"
            ref="hkeyInput"
            type="password"
            autocomplete="off"
            show-password
            placeholder="Please input hkey"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="cancleSwitchToHCategory">取消</el-button>
          <el-button type="primary" @click="switchToHCategory"> 确认(C) </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script>
// Remove axios - now using IPC
// const axios = require('axios').default;

import VditorPanel from './VditorPanel.vue';
import { ElMessage, ElMessageBox } from 'element-plus';

// Define constants locally since importing TS from JS is problematic
const LOCK_CHECK_INTERVAL = 10000;
const LOCK_CHECK_TIMEOUT = 60000;

function findIdxById(theList, theId) {
  for (let i = 0; i < theList.length; i++) {
    if (theList[i][0] == theId) {
      return i;
    }
  }
  return 0;
}

export default {
  name: 'MdEditor',

  components: {
    VditorPanel,
  },

  data() {
    return {
      currentSpace: 0,

      currentCategory: 0, // 这里保存的是categoryList列表的当前索引，而不是category_id
      currentDoc: 0, // 这里保存的是docList列表的当前索引，而不是doc_id
      categoryList: [], // 保存当前的分类列表[[category_id, 分类名称]...]
      docList: [], // 保存当前分类的文档列表 [[doc_id, 文档名称, 文档摘要]...]

      categoryCreateOrModifyDialogVisible: false,
      docCreateOrModifyDialogVisible: false,
      hkeyDialogVisible: false,

      yesNoMsg: '是否确认',

      categoryForm: {
        name: '',
      },

      docForm: {
        name: '',
        summary: '',
      },

      hkeyForm: {
        key: '',
      },

      categoryCreateOrModifyTitle: '新建分类', // 新建或更新分类对话框的标题
      categoryCreateOrModify: 0, // 0:新建分类，1:更新分类

      docCreateOrModifyTitle: '新建文档', // 新建或更新文档对话框的标题
      docCreateOrModify: 0, // 0:新建文档，1:更新文档

      lockCheckIntervalId: null,

      titlePath: '',
    };
  },

  watch: {
    currentSpace(newVal, oldVal) {
      console.log(`>>> space changed from ${oldVal} to ${newVal}`);
      if (newVal > 0 && oldVal == 0) {
        this.hkeyDialogVisible = true;
      } else {
        this.refreshCategory();
      }
    },
  },

  methods: {
    loadCategoryList() {
      return new Promise((resolve) => {
        // Use IPC instead of axios
        const mdApi = window.mdEditor || window.electron?.md;
        if (!mdApi || !mdApi.getCategoryList) {
          ElMessage.error('API not available');
          return;
        }

        mdApi.getCategoryList(this.currentSpace).then(
          (data) => {
            this.categoryList = data;
            // 刷新后默认选中第一个分类
            if (this.categoryList.length > 0) {
              resolve();
            } else {
              console.warn('>>> no category');
              this.currentCategory = 0;
              this.docList = [];
              this.currentDoc = 0;
              this.$refs.vditorPanel?.viewNull();
              this.setCurrentTitle();
            }
          },
          (err) => {
            console.error('get category list failed:', err);
            ElMessage.error(err.toString());
          }
        );
      });
    },

    loadDocList(c_idx) {
      return new Promise((resolve) => {
        this.currentCategory = c_idx;

        const cid = this.categoryList[c_idx][0];
        const mdApi = window.mdEditor || window.electron?.md;
        if (!mdApi || !mdApi.getDocList) {
          ElMessage.error('API not available');
          return;
        }

        mdApi.getDocList(cid).then(
          (data) => {
            this.docList = data;
            // 刷新后默认选中第一个文档
            if (this.docList.length > 0) {
              resolve();
            } else {
              console.warn(`>>> no doc in ${c_idx}`);
              this.currentDoc = 0;
              this.$refs.vditorPanel?.viewNull();
              this.setCurrentTitle();
            }
          },
          (err) => {
            console.error('get doc list failed:', err);
            ElMessage.error(err.toString());
          }
        );
      });
    },

    refreshCategory() {
      this.currentCategory = 0;
      this.currentDoc = 0;

      this.loadCategoryList().then(() => {
        this.clickCategory(0);
      });
    },

    clickCategory(c_idx) {
      this.currentDoc = 0;

      this.loadDocList(c_idx).then(() => {
        this.clickDoc(this.currentDoc);
      });
    },

    clickDoc(d_idx) {
      this.currentDoc = d_idx;

      const did = this.docList[d_idx][0];
      this.$refs.vditorPanel.viewDocument(did);
      this.setCurrentTitle();
    },

    createOrModifyCategory() {
      if (this.categoryCreateOrModify == 0) {
        this.createCategory();
      } else if (this.categoryCreateOrModify == 1) {
        this.modifyCategory();
      }
    },

    cancleCreateOrModifyCategory() {
      this.categoryCreateOrModifyDialogVisible = false;
      this.categoryForm.name = '';
    },

    createCategory() {
      const mdApi = window.mdEditor || window.electron?.md;
      if (!mdApi || !mdApi.createCategory) {
        ElMessage.error('API not available');
        return;
      }

      mdApi.createCategory(this.categoryForm.name, this.currentSpace).then(
        (id) => {
          this.categoryCreateOrModifyDialogVisible = false;
          this.categoryForm.name = '';

          this.loadCategoryList().then(() => {
            this.clickCategory(findIdxById(this.categoryList, id));
          });
        },
        (err) => {
          console.error('create category failed:', err);
          ElMessage.error(err.toString());
        }
      );
      this.categoryForm.name = '';
    },

    modifyCategory() {
      const mdApi = window.mdEditor || window.electron?.md;
      if (!mdApi || !mdApi.updateCategory) {
        ElMessage.error('API not available');
        return;
      }

      const categoryId = this.categoryList[this.currentCategory][0];
      mdApi.updateCategory(categoryId, { name: this.categoryForm.name }).then(
        () => {
          this.categoryCreateOrModifyDialogVisible = false;
          this.categoryForm.name = '';

          this.loadCategoryList().then(() => {
            this.clickCategory(this.currentCategory);
          });
        },
        (err) => {
          console.error('update category failed:', err);
          ElMessage.error(err.toString());
        }
      );
      this.categoryCreateOrModifyDialogVisible = false;
      this.categoryForm.name = '';
    },

    deleteCurrentCategory() {
      if (this.categoryList.length < 1) {
        ElMessage.error('当前没有分类可删除');
        return;
      }
      const cid = this.categoryList[this.currentCategory][0];
      const cname = this.categoryList[this.currentCategory][1];
      const mdApi = window.mdEditor || window.electron?.md;

      if (!mdApi || !mdApi.deleteCategory) {
        ElMessage.error('API not available');
        return;
      }

      ElMessageBox.confirm(`是否删除分类 '${cname}'`, 'Warning', {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'warning',
      })
        .then(() => {
          mdApi.deleteCategory(cid).then(
            () => {
              ElMessage({
                message: `删除分类 '${cname}' 成功`,
                type: 'success',
              });
              this.refreshCategory();
            },
            (err) => {
              console.error('delete category failed:', err);
              ElMessage.error(err.toString());
            }
          );
        })
        .catch(() => {
          ElMessage({
            message: `取消删除`,
            type: 'info',
          });
        });
    },

    createOrModifyDoc() {
      if (this.docCreateOrModify == 0) {
        this.createDoc();
      } else if (this.docCreateOrModify == 1) {
        this.modifyDoc();
      }
    },

    cancleCreateOrModifyDoc() {
      this.docCreateOrModifyDialogVisible = false;
      this.docForm.name = '';
      this.docForm.summary = '';
    },

    createDoc() {
      if (!this.docForm.name) {
        ElMessage.error('文档名称为空');
        this.docCreateOrModifyDialogVisible = false;
        return;
      }

      const mdApi = window.mdEditor || window.electron?.md;
      if (!mdApi || !mdApi.createDoc) {
        ElMessage.error('API not available');
        return;
      }

      mdApi
        .createDoc(
          this.categoryList[this.currentCategory][0],
          this.docForm.name,
          this.docForm.summary
        )
        .then(
          (id) => {
            this.loadDocList(this.currentCategory).then(() => {
              this.currentDoc = findIdxById(this.docList, id);
              this.clickDoc(this.currentDoc);
            });
          },
          (err) => {
            console.error('create doc failed:', err);
            ElMessage.error(err.toString());
          }
        );
      this.docCreateOrModifyDialogVisible = false;
      this.docForm.name = '';
      this.docForm.summary = '';
    },

    modifyDoc() {
      if (!this.docForm.name) {
        ElMessage('文档名称为空');
        this.docCreateOrModifyDialogVisible = false;
        return;
      }

      const docId = this.docList[this.currentDoc][0];
      const mdApi = window.mdEditor || window.electron?.md;

      if (!mdApi || !mdApi.updateDoc) {
        ElMessage.error('API not available');
        return;
      }

      mdApi
        .updateDoc(docId, {
          title: this.docForm.name,
          summary: this.docForm.summary,
        })
        .then(
          () => {
            this.loadDocList(this.currentCategory).then(() => {
              this.clickDoc(this.currentDoc);
            });
          },
          (err) => {
            console.error('update doc failed:', err);
            ElMessage.error(err.toString());
          }
        );
      this.docCreateOrModifyDialogVisible = false;
      this.docForm.name = '';
      this.docForm.summary = '';
    },

    deleteCurrentDoc() {
      if (this.docList.length == 0) {
        ElMessage.error('当前没有可删除的文档');
        return;
      }

      const did = this.docList[this.currentDoc][0];
      const dname = this.docList[this.currentDoc][1];
      const mdApi = window.mdEditor || window.electron?.md;

      if (!mdApi || !mdApi.deleteDoc) {
        ElMessage.error('API not available');
        return;
      }

      ElMessageBox.confirm(`是否删除文档 '${dname}'`, 'Warning', {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'warning',
      })
        .then(() => {
          mdApi.deleteDoc(did).then(
            () => {
              ElMessage({
                message: `删除文档 '${dname}' 成功`,
                type: 'success',
              });
              this.currentDoc = 0;
              this.loadDocList(this.currentCategory).then(() => {
                this.clickDoc(this.currentDoc);
              });
            },
            (err) => {
              console.error('delete doc failed:', err);
              ElMessage.error(err.toString());
            }
          );
        })
        .catch(() => {
          ElMessage({
            message: `取消删除`,
            type: 'info',
          });
        });
    },

    switchToHCategory() {
      const mdApi = window.mdEditor || window.electron?.md;

      if (!mdApi || !mdApi.verifyHkey) {
        ElMessage.error('API not available');
        return;
      }

      mdApi.verifyHkey(this.hkeyForm.key).then(
        (isValid) => {
          if (isValid) {
            this.hkeyForm.key = '';
            this.hkeyDialogVisible = false;
            this.refreshCategory();
          }
        },
        (err) => {
          this.hkeyForm.key = '';
          this.currentSpace = 0;
          this.hkeyDialogVisible = false;
          console.error('verify hkey failed:', err);
          ElMessage.error(err.toString());
        }
      );
    },

    cancleSwitchToHCategory() {
      this.currentSpace = 0;
      this.hkeyDialogVisible = false;
    },

    showCategoryCreateDialog() {
      this.categoryCreateOrModifyTitle = '新建分类';
      this.categoryCreateOrModify = 0;

      this.categoryCreateOrModifyDialogVisible = true;
    },

    showCategoryModifyDialog() {
      if (this.categoryList.length < 1) {
        ElMessage.error('当前无分类，无法修改！');
        return;
      }
      this.categoryCreateOrModifyTitle = '修改分类';
      this.categoryCreateOrModify = 1;

      const categoryName = this.categoryList[this.currentCategory][1];
      if (categoryName == null) {
        ElMessage.error(`分类 '${this.currentCategory}' 不存在`);
        return;
      }

      this.categoryForm.name = categoryName;

      this.categoryCreateOrModifyDialogVisible = true;
    },

    showDocCreateDialog() {
      const categoryName = this.categoryList[this.currentCategory][1];
      if (categoryName == null) {
        ElMessage.error(`文档 '${this.currentCategory}' 不存在`);
        return;
      }

      this.docCreateOrModifyTitle = `在分类 '${categoryName}' 新建文档`;
      this.docCreateOrModify = 0;

      this.docCreateOrModifyDialogVisible = true;
    },

    showDocModifyDialog() {
      if (this.categoryList.length < 1) {
        ElMessage.error('当前无分类，无法修改！');
        return;
      }
      if (this.docList.length < 1) {
        ElMessage.error('当前分类无文档，无法修改！');
        return;
      }

      const categoryName = this.categoryList[this.currentCategory][1];
      if (categoryName == null) {
        ElMessage.error(`分类 '${this.currentCategory}' 不存在`);
        return;
      }

      const docName = this.docList[this.currentDoc][1];
      if (docName == null) {
        ElMessage.error(`文档 '${this.doc}' 不存在`);
        return;
      }
      const docSummary = this.docList[this.currentDoc][2];

      this.docForm.name = docName;
      this.docForm.summary = docSummary;

      this.docCreateOrModifyTitle = `修改 ${docName} 文档`;
      this.docCreateOrModify = 1;

      this.docCreateOrModifyDialogVisible = true;
    },

    onHkeyDialogOpen() {
      console.log('>>> hkey dialog open');
      this.$nextTick(() => {
        console.log('>>> focus hkey input');
        this.$refs.hkeyInput.focus();
      });
    },

    onHkeyDialogClose() {
      this.currentSpace = 0;
      this.hkeyDialogVisible = false;
    },

    setCurrentTitle() {
      let titlePath = `/ ${this.currentSpace}`;
      if (this.categoryList.length > 0) {
        let titleTmp = this.categoryList[this.currentCategory][1];
        titleTmp = titleTmp.length > 8 ? titleTmp.substring(0, 8) + '...' : titleTmp;
        titlePath = titlePath + ` / ${titleTmp}`;
      }

      if (this.docList.length > 0) {
        let titleTmp = this.docList[this.currentDoc][1];
        titleTmp = titleTmp.length > 8 ? titleTmp.substring(0, 8) + '...' : titleTmp;
        titlePath = titlePath + ` / ${titleTmp}`;
      }
      this.titlePath = titlePath;
    },

    handleVditorPanelReady() {
      this.refreshCategory();
    },

    lockCheck() {
      // console.info(">>> lock check");
      if (this.currentSpace > 0) {
        const currentTime = Date.now();
        const lastOpTime = localStorage.getItem('qminLastOpTime');
        if (currentTime - lastOpTime > LOCK_CHECK_TIMEOUT) {
          console.warn(`>>> space ${this.currentDoc} timeout`);
          this.currentSpace = 0;
        }
      }
    },

    handleKeyDown(event) {
      if (this.currentSpace > 0) {
        localStorage.setItem('qminLastOpTime', Date.now());
      }

      if (event.ctrlKey && event.altKey) {
        const space = parseInt(event.key, 10);
        if (space >= 0 && space <= 9) {
          this.currentSpace = space; // currentSpace注册了监视器，当变化的时候会进行响应
        }
      }

      if (event.ctrlKey && event.key == 'q') {
        this.currentSpace = 0;
      }
    },

    handleMouseClick() {
      if (this.currentSpace > 0) {
        localStorage.setItem('qminLastOpTime', Date.now());
      }
    },
  },

  mounted() {
    document.title = 'Qmin MDEditor';

    // No longer need to fetch server address - using IPC

    localStorage.setItem('qminLastOpTime', Date.now()); // 初始化计时器

    document.addEventListener('keydown', this.handleKeyDown);
    document.addEventListener('click', this.handleMouseClick);

    this.lockCheckIntervalId = setInterval(this.lockCheck, LOCK_CHECK_INTERVAL);
  },

  unmounted() {
    document.removeEventListener('keydown', this.handleKeyDown);
    document.removeEventListener('click', this.handleMouseClick);
    if (this.lockCheckIntervalId != null) {
      clearInterval(this.lockCheckIntervalId);
    }
  },
};
</script>

<style>
.mdeditor-layout {
  height: 100%;
}

.el-row {
  margin-bottom: 20px;
  height: 100%;
}

.el-row:last-child {
  margin-bottom: 0;
}

.el-col {
  border-radius: 1px;
  height: 100%;
  box-sizing: border-box;
}

.grid-content {
  border-radius: 4px;
  min-height: 36px;
}

.category-op-panel {
  background-color: #cfd3dc;
}

.doc-op-panel {
  background-color: #fafafa;
}

.el-button {
  padding: 6px;
}

.c-icon-btn-list {
  margin: 3px 5px 3px 5px;
}

.c-icon-btn-list .el-button {
  background-color: #cfd3dc;
  border: 0px;
}

.d-icon-btn-list {
  margin: 3px 5px 3px 5px;
}

.d-icon-btn-list .el-button {
  background-color: #f8f8f8;
  border: 0px;
}

.category-list-panel {
  margin: 2px;
  padding: 4px 4px 6px 8px;
}

.category-list-panel li {
  list-style-type: none;
  margin: 5px 3px 7px 5px;
  color: #303133;
  display: flex;
  align-items: center;
  cursor: pointer;
}

.doc-list-panel {
  margin: 2px;
  padding: 6px 4px 6px 8px;
}

.el-card {
  margin-bottom: 10px;
}

.el-card .el-card__header {
  padding: 8px 3px 6px 12px;
  font-size: 18px;
  cursor: pointer;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.el-card .el-card__body {
  padding: 8px 12px 6px 12px;
  font-size: 13px;
  font-style: italic;
  cursor: default;
}

.el-card .el-card__footer {
  padding: 7px 12px 6px 12px;
  font-size: 12px;
  color: #a8abb2;
  cursor: default;
}

.doc-card-summary {
  padding: 0px 5px 0px 5px;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  line-clamp: 3;
  -webkit-line-clamp: 3;
  overflow: hidden;
  text-overflow: ellipsis;
}

.doc-content-panel {
  padding: 10px;
}

.list-content {
  padding: 0px 3px 0px 8px;
}

.c-font-bold {
  font-weight: 550;
}

.d-font-bold {
  font-weight: 550;
}

.editor-content {
  margin: 10px;
}

.el-icon {
  margin-top: 0px;
}

.el-form-item__label {
  color: #606266;
}

.el-form {
  margin-right: 15px;
}

.customDialogHeader {
  margin: 3px 8px 10px 10px;
  max-width: 200px;
}
</style>
