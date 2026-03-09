<template>
  <div class="ivviewer-layout">
    <el-backtop :right="100" :bottom="100" />
    <el-row :gutter="3">
      <!-- 侧边目录列表 -->
      <el-col :span="6" class="directory-op-panel">
        <!-- 目录列表操作区域 -->
        <div class="iv-dir-op-btn-list">
          <el-tooltip content="Refresh" placement="right">
            <el-button plain @click="refreshDirectories">
              <el-icon :size="16"><Refresh /></el-icon>
            </el-button>
          </el-tooltip>

          <el-tooltip content="Index all" placement="right">
            <el-button plain @click="handleIndexingAll">
              <el-icon :size="16"><PictureRounded /></el-icon>
            </el-button>
          </el-tooltip>
        </div>

        <!-- 目录列表 -->
        <div class="directory-list-panel">
          <el-auto-resizer>
            <el-tree-v2
              ref="dirListRef"
              :data="dirList"
              :props="propsMap"
              @node-click="handleNodeClick"
              :height="1200"
              icon="Folder"
            />
          </el-auto-resizer>
        </div>
      </el-col>

      <!-- 图片显示区域 -->
      <el-col :span="18">
        <div class="image-op-toolbar">
          <div class="image-op-toolbar-title">
            <el-icon :size="14"><ChatDotSquare /></el-icon>
            <el-text size="small" type="primary" tag="b">
              {{ currentMeta.name }}
            </el-text>
            <el-text size="small" type="info" tag="b"> 索引时间 </el-text>
            <el-text size="small" type="info" tag="i">
              {{ currentMeta.create_time }}
            </el-text>
            <el-text v-if="currentMeta.cla_name" size="small" type="info" tag="b">
              分类时间
            </el-text>
            <el-text v-if="currentMeta.cla_name" size="small" type="info" tag="i">
              {{ currentMeta.cla_time }}
            </el-text>
            <el-text v-if="currentMeta.cla_name" size="small" type="info" tag="b">
              分类名称
            </el-text>
            <el-text v-if="currentMeta.cla_name" size="small" type="info" tag="i">
              {{ currentMeta.cla_name }}
            </el-text>
          </div>
          <div class="image-op-toolbar-op">
            <div class="zoom-switch" size="small">
              <el-radio-group v-model="imgZoomRatio">
                <el-radio-button label="X1" :value="1" />
                <el-radio-button label="X2" :value="2" />
                <el-radio-button label="X3" :value="3" />
              </el-radio-group>
            </div>

            <el-tooltip placement="top">
              <el-icon :size="18" color="#909399"><Filter /></el-icon>
            </el-tooltip>

            <el-select
              class="image-filter"
              v-model="imgFilter"
              placeholder="Filter"
              style="width: 60px"
            >
              <el-option
                v-for="score in supportedScores"
                :key="score"
                :label="score"
                :value="score"
              />
            </el-select>

            <el-tooltip content="Classification" placement="top">
              <el-button type="info" circle @click="classifyDir">
                <el-icon :size="16"><Grid /></el-icon>
              </el-button>
            </el-tooltip>

            <el-tooltip content="Remove Directory" placement="top">
              <el-button type="info" circle @click="removeDir">
                <el-icon :size="16"><Delete /></el-icon>
              </el-button>
            </el-tooltip>

            <el-tooltip content="Refreash Index" placement="top">
              <el-button type="info" circle @click="refreshIndex">
                <el-icon :size="16"><Refresh /></el-icon>
              </el-button>
            </el-tooltip>
          </div>
        </div>
        <div class="img-panel">
          <div v-for="(img, index) in getImgUrls()" :key="img" class="block">
            <div>
              <el-text size="small" type="info"> {{ currentImages[index].name }} </el-text>
            </div>

            <el-image
              :src="img"
              :fit="'contain'"
              :zoom-rate="1.2"
              :max-scale="7"
              :min-scale="0.2"
              :preview-src-list="getImgUrls()"
              :initial-index="index"
              :style="imageStyle"
              :hide-on-click-modal="true"
              @show="onImgShow(index)"
              @switch="onImgSwitch"
            >
              <template #toolbar="{ actions }">
                <el-icon @click="actions('zoomOut')"><ZoomOut /></el-icon>
                <el-icon @click="actions('zoomIn', { enableTransition: false, zoomRate: 2 })"
                  ><ZoomIn
                /></el-icon>
                <el-icon @click="actions('clockwise', { rotateDeg: 180, enableTransition: false })"
                  ><RefreshRight
                /></el-icon>
                <el-icon @click="actions('anticlockwise')"><RefreshLeft /></el-icon>
                <el-icon @click="getImageInfo"><View /></el-icon>
                <div class="custom-toolbar">
                  <el-rate
                    v-model="currentImages[currentImageIndex].score"
                    size="small"
                    :max="4"
                    @change="onCurrentImgScoreChange"
                  />
                </div>
              </template>
            </el-image>
            <br />
            <el-rate
              v-model="currentImages[index].score"
              size="small"
              :max="4"
              @change="onScoreChange(index)"
            />
          </div>
        </div>
      </el-col>
    </el-row>
  </div>

  <el-dialog v-model="showIndexing" fullscreen top="40vh" width="70%" draggable>
    <div class="indexing-progress">
      <el-progress
        type="circle"
        :percentage="indexingProgress"
        :status="indexingProgress >= 100 ? 'success' : null"
      ></el-progress>
    </div>
  </el-dialog>

  <el-dialog v-model="showAllIndexing" fullscreen top="40vh" width="70%" draggable>
    <div class="all-indexing-progress">
      <div v-for="item in allIndexing" :key="item.path_id">
        <el-text size="small" type="info" tag="i">{{ item.name }}</el-text>
        <el-progress :percentage="item.progress" status="success" />
      </div>
    </div>
  </el-dialog>
</template>

<script>
// Remove axios and socket.io - now using IPC
// import axios from 'axios';
// import io from 'socket.io-client';
import { h } from 'vue';
import { ElMessage, ElMessageBox, ElNotification } from 'element-plus';

import { Refresh, RefreshLeft, RefreshRight, ZoomIn, ZoomOut } from '@element-plus/icons-vue';

import { ElLoading } from 'element-plus';

export default {
  name: 'IVViewer',

  components: {
    Refresh,
    RefreshLeft,
    RefreshRight,
    ZoomIn,
    ZoomOut,
  },

  data() {
    return {
      // serverAddr: DEFAULT_SERVER_ADDR, // No longer needed for IPC

      propsMap: {
        value: 'path_id',
        label: 'name',
        children: 'children',
      },

      supportedScores: [1, 2, 3, 4],

      dirList: [], // 目录列表
      currentPathID: '', // 当前目录path_id
      currentPathName: '', // 当前目录名称
      currentImages: [], // 当前目录的图片信息列表，{path_id: xx, name: xxx, score: 2, url: }
      currentImageIndex: 0, // 当前图片index，在点击预览、预览左右切换的时候变化

      currentMeta: {
        // 当前目录的元信息
        name: 'name',
        create_time: '1986-01-01 00:00:00',
        cla_time: '1986-01-01 00:00:00',
        cla_name: 'cla_name',
      },

      imageSize: 160,
      imgZoomRatio: 1,

      imgFilter: 1,

      showIndexing: false, // 当前是否在生成缩略图
      indexingProgress: 0, // 生成缩略图进度

      showAllIndexing: false,
      allIndexing: [],
      // socket: null // Removed - using IPC events
    };
  },

  computed: {
    imageStyle() {
      return {
        width: `${this.imageSize}px`,
        height: `${this.imageSize}px`,
      };
    },
  },

  watch: {
    imgZoomRatio(newVal) {
      this.imageSize = newVal * 160;
    },

    imgFilter(newVal) {
      console.log(`>>> filter changed to ${newVal}`);
      this.showCurrentDirImages(newVal);
    },
  },

  methods: {
    reloadDirectories() {
      const loading = ElLoading.service({ text: '加载中...' });
      this.dirList = [];
      this.loadDirectories().then((dirList) => {
        this.dirList = dirList;
        if (this.dirList.length > 0) {
          loading.close();
          const first = this.dirList[0];
          this.currentPathID = first.path_id;
          this.currentPathName = first.name;
          this.handleNodeClick({ name: this.currentPathName, path_id: this.currentPathID });
        }
      });
    },

    refreshDirectories() {
      const loading = ElLoading.service({ text: '加载中...' });
      this.dirList = [];
      const ivApi = window.ivViewer || window.electron?.iv;
      if (!ivApi || !ivApi.refreshDirectories) {
        ElMessage.error('API not available');
        loading.close();
        return;
      }

      ivApi.refreshDirectories().then(
        (dirList) => {
          loading.close();
          if (dirList.length > 0) {
            this.dirList = dirList;
            const first = this.dirList[0];
            this.currentPathID = first.path_id;
            this.currentPathName = first.name;
            this.handleNodeClick({ name: this.currentPathName, path_id: this.currentPathID });
          }
        },
        (err) => {
          loading.close();
          console.error('refresh directories failed:', err);
          ElMessage.error(err.toString());
        }
      );
    },

    handleIndexingAll() {
      const ivApi = window.ivViewer || window.electron?.iv;
      if (!ivApi || !ivApi.startIndex) {
        ElMessage.error('API not available');
        return;
      }

      this.showAllIndexing = true;
      // Call startIndex on all directories - this would need to be implemented
      // For now, just notify that we're starting all indexing
      ElMessage.info('Starting indexing of all directories...');
    },

    handleNodeClick(data) {
      console.log(`>>> handle node click ${data.name} ${data.path_id}`);
      this.currentPathID = data.path_id;
      this.currentPathName = data.name;
      this.imgFilter = 1;

      this.showCurrentDirImages(this.imgFilter);
    },

    showCurrentDirImages(score) {
      console.log(`>>> show images ${this.currentPathName} ${this.currentPathID}`);

      const ivApi = window.ivViewer || window.electron?.iv;
      if (!ivApi || !ivApi.getImages) {
        ElMessage.error('API not available');
        return;
      }

      this.loadImages(this.currentPathID, score)
        .then((images) => {
          const imgs = [];
          for (const img of images) {
            // Use the thumbnail_path returned by the backend
            imgs.push({
              path_id: img.path_id,
              name: img.name,
              score: img.score,
              url: img.thumbnail_path || `file://${img.path_id}`,
            });
          }
          this.currentImages = imgs;
        })
        .catch((err) => {
          // Handle cache not exists error
          if (err && err.err_code === 'IV_003') {
            this.doIndex(this.currentPathID);
          } else {
            console.log(err);
            ElMessage.error(JSON.stringify(err));
          }
        });
    },

    onScoreChange(index) {
      console.log(`>>> img ${index} change rate to ${this.currentImages[index].score}`);
      const ivApi = window.ivViewer || window.electron?.iv;
      if (!ivApi || !ivApi.updateScore) {
        ElMessage.error('API not available');
        return;
      }

      const pathId = this.currentImages[index].path_id;
      const newScore = this.currentImages[index].score;

      ivApi.updateScore(pathId, newScore).then(
        () => {
          ElMessage({
            message: `更新 score 成功`,
            type: 'success',
          });
        },
        (err) => {
          console.error('update score failed:', err);
          ElMessage.error(err.toString());
        }
      );
    },

    classifyDir() {
      if (this.currentPathID === '') {
        ElMessage.error('未选择目录！');
        return;
      }
      const ivApi = window.ivViewer || window.electron?.iv;
      if (!ivApi || !ivApi.isClassified) {
        ElMessage.error('API not available');
        return;
      }

      ivApi.isClassified(this.currentPathID).then(
        (isClassified) => {
          if (isClassified) {
            this.syncClassification(this.currentPathID, '');
          } else {
            ElMessageBox.prompt('输入名称前缀', '分类', {
              confirmButtonText: '确认',
              cancelButtonText: '取消',
              inputPattern: /^(?=.{4,})[a-zA-Z0-9_.-]+$/,
              inputErrorMessage: '名称格式错误，支持字符、下划线、减号、点号',
            })
              .then((cname) => {
                this.syncClassification(this.currentPathID, cname.value);
              })
              .catch(() => {
                ElMessage({
                  type: 'success',
                  message: '取消分类',
                });
              });
          }
        },
        (err) => {
          console.error('check classified failed:', err);
          ElMessage.error(err.toString());
        }
      );
    },

    // 同步方式进行分类，前端会等待后端返回结果再展示
    syncClassification(pathID, cname) {
      const ivApi = window.ivViewer || window.electron?.iv;
      if (!ivApi || !ivApi.classify) {
        ElMessage.error('API not available');
        return;
      }

      const loading = ElLoading.service({ text: '分类中...' });

      ivApi.classify(pathID, cname).then(
        (result) => {
          loading.close();
          ElMessage({
            message: `分类成功，s2:${result.s2}, s3:${result.s3}, s4:${result.s4}`,
            type: 'success',
          });
          // Get meta information and update
          ivApi.getMeta(pathID).then(
            (meta) => {
              this.currentMeta = meta;
            },
            (err) => {
              console.error('get meta failed:', err);
            }
          );
        },
        (err) => {
          loading.close();
          console.error('classification failed:', err);
          ElMessage.error(err.toString());
        }
      );
    },

    removeDir() {
      const ivApi = window.ivViewer || window.electron?.iv;
      if (!ivApi || !ivApi.removeDir) {
        ElMessage.error('API not available');
        return;
      }

      if (this.currentPathID === '') {
        ElMessage.error('未选择目录！');
        return;
      }

      ElMessageBox.confirm(`是否删除目录 '${this.currentPathName}' ？`, '删除目录', {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'warning',
      })
        .then(() => {
          const loading = ElLoading.service({ text: '加载中...' });

          ivApi.removeDir(this.currentPathID).then(
            () => {
              loading.close();
              // 成功删除后刷新列表，并定位到第一个元素
              this.loadDirectories().then((dirList) => {
                this.dirList = dirList;
                if (this.dirList.length > 0) {
                  const first = this.dirList[0];
                  this.currentPathID = first.path_id;
                  this.currentPathName = first.name;
                  this.reloadDirectories();
                }
              });
            },
            (err) => {
              loading.close();
              console.error('remove dir failed:', err);
              ElMessage.error(err.toString());
            }
          );
        })
        .catch(() => {
          ElMessage({
            type: 'info',
            message: '取消删除',
          });
        });
    },

    refreshIndex() {
      const ivApi = window.ivViewer || window.electron?.iv;
      if (!ivApi || !ivApi.removeIndex) {
        ElMessage.error('API not available');
        return;
      }

      if (this.currentPathID === '') {
        ElMessage.error('未选择目录！');
        return;
      }

      ElMessageBox.confirm(`是否刷新 '${this.currentPathName}' 缩略图缓存？`, '刷新缩略图缓存', {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'warning',
      })
        .then(() => {
          ivApi.removeIndex(this.currentPathID).then(
            () => {
              // 删除后点击一下
              this.handleNodeClick({ name: '', path_id: this.currentPathID });
            },
            (err) => {
              console.error('remove index failed:', err);
              ElMessage.error(err.toString());
            }
          );
        })
        .catch(() => {
          ElMessage({
            type: 'info',
            message: '取消删除',
          });
        });
    },

    loadDirectories() {
      return new Promise((resolve, reject) => {
        const ivApi = window.ivViewer || window.electron?.iv;
        if (!ivApi || !ivApi.getDirectories) {
          reject(new Error('API not available'));
          return;
        }

        ivApi.getDirectories().then(
          (dirList) => {
            if (dirList && dirList.length > 0) {
              resolve(dirList);
            }
          },
          (err) => {
            console.error('get directories failed:', err);
            ElMessage.error(err.toString());
            reject(err);
          }
        );
      });
    },

    loadImages(pathID, score) {
      console.log(`>>> load ${pathID}, ${score}`);

      const ivApi = window.ivViewer || window.electron?.iv;

      return new Promise((resolve, reject) => {
        if (!ivApi || !ivApi.getImages) {
          reject(new Error('API not available'));
          return;
        }

        ivApi.getImages(pathID, score).then(
          (images) => {
            if (images && images.length > 0) {
              resolve(images);
            } else {
              resolve([]);
            }
          },
          (err) => {
            console.error('get images failed:', err);
            // Check for cache not exists error (IV_003)
            if (err && err.err_code === 'IV_003') {
              reject({ err_code: err.err_code });
            } else {
              ElMessage.error(err.toString());
              reject(err);
            }
          }
        );
      });
    },

    getImageInfo() {
      const img = this.currentImages[this.currentImageIndex];
      const ivApi = window.ivViewer || window.electron?.iv;

      if (!ivApi || !ivApi.getImageInfo) {
        ElMessage.error('API not available');
        return;
      }

      ivApi.getImageInfo(img.path_id).then(
        (imgInfo) => {
          ElNotification({
            title: `${img.name}`,
            message: h(
              'i',
              { style: 'color: teal' },
              `${imgInfo.width} X ${imgInfo.height} ${imgInfo.size}MB`
            ),
            duration: 2500,
          });
        },
        (err) => {
          console.error('get image info failed:', err);
          ElMessage.error(err.toString());
        }
      );
    },

    doIndex(path_id) {
      const ivApi = window.ivViewer || window.electron?.iv;
      if (!ivApi || !ivApi.startIndex) {
        ElMessage.error('API not available');
        return;
      }

      this.showIndexing = true;
      this.indexingProgress = 0;

      // Start indexing via IPC
      ivApi.startIndex(path_id, false).then(
        () => {
          console.log('Indexing started');
        },
        (err) => {
          console.error('Start indexing failed:', err);
          this.showIndexing = false;
          ElMessage.error(err.toString());
        }
      );
    },

    onImgShow(index) {
      this.currentImageIndex = index;
      const img = this.currentImages[index];
      console.log(`>>> show img ${img.name}`);
    },

    onImgSwitch(newIndex) {
      this.currentImageIndex = newIndex;
      const img = this.currentImages[newIndex];
      console.log(`>>> switch img to ${img.name}`);
    },

    onCurrentImgScoreChange() {
      this.onScoreChange(this.currentImageIndex);
    },

    getImgUrls() {
      // Return the thumbnail URLs that are already set in currentImages
      const result = [];
      for (const img of this.currentImages) {
        result.push(img.url);
      }
      return result;
    },

    initIpcEventListeners() {
      const ivApi = window.ivViewer || window.electron?.iv;
      if (!ivApi || !ivApi.onIndexProgress || !ivApi.onAllIndexProgress) {
        console.warn('IPC event listeners not available');
        return;
      }

      // Setup index progress listener
      ivApi.onIndexProgress((data) => {
        this.indexingProgress = data.progress;
        if (this.indexingProgress === 100) {
          this.showIndexing = false;
          this.handleNodeClick({ name: this.currentPathName, path_id: this.currentPathID });
          this.indexingProgress = 0;
        }
      });

      // Setup all index progress listener
      ivApi.onAllIndexProgress((data) => {
        this.allIndexing = data.detail;
        if (data.finish === true) {
          this.showAllIndexing = false;
          this.handleNodeClick({ name: this.currentPathName, path_id: this.currentPathID });
        }
        this.indexingProgress = data.progress;
      });
    },
  },

  mounted() {
    document.title = 'Qmin IVViewer';

    // No longer need initWebSocketConnection - using IPC events
    this.initIpcEventListeners();
    this.reloadDirectories();
  },
};
</script>

<style>
.ivviewer-layout {
  height: 100%;
}

.directory-op-panel {
  background-color: #cfd3dc;
}

.el-tree {
  background-color: #cfd3dc;
}

.iv-dir-op-btn-list {
  margin: 3px 3px 3px 15px;
}

.iv-dir-op-btn-list .el-button {
  background-color: #cfd3dc;
  border: 0px;
}

.image-op-toolbar {
  height: 50px;
  margin: 3px 3px 3px 3px;
  padding-left: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: #cfd3dc;
  border-bottom-style: solid;
}

.image-op-toolbar-title {
  display: flex;
  align-items: center;
}

.image-op-toolbar-title .el-text {
  margin-left: 10px;
}

.image-op-toolbar-op {
  margin-right: 5px;
  display: flex; /* 使用 Flexbox 布局 */
  align-items: center; /* 垂直居中对齐 */
  justify-content: flex-start; /* 水平左对齐*/
  gap: 5px; /* 设置子元素之间的间距 */
}

.zoom-switch {
  display: inline;
  margin-right: 18px;
}

.image-filter {
  margin-right: 18px;
}

.img-panel .block {
  padding: 36px;
  text-align: center;
  border: solid 1px var(--el-border-color);
  display: inline-block;
  box-sizing: border-box;
  vertical-align: top;
}
.img-panel .block:last-child {
  border-right: none;
}

.indexing-progress {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  width: 100%;
}

.all-indexing-progress {
  margin: 50px 50px 50px 200px;
  padding: 20px 20px 20px 20px;
}

.el-progress--line {
  margin-bottom: 15px;
  max-width: 600px;
}
</style>
