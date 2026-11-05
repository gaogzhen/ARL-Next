<!-- ARL-Next/frontend/src/views/platform/ProjectDetail.vue -->
<template>
  <div class="arl-task-page">
    <!-- 1. 吸顶英雄卡片 -->
    <div class="arl-task-hero-card">
      <div class="task-hero-unified-bar">
        <div class="task-hero-left">
          <div class="task-hero-title">
            <span class="title-text">{{ project.project_name || project.project_id }}</span>
          </div>
          <div class="hero-tags">
            <PlatformTag :platform="project.platform" />
            <a-tag :color="project.status === 'active' ? 'success' : 'default'" class="task-status-tag">
              {{ project.status === 'active' ? '活跃' : project.status }}
            </a-tag>
          </div>
        </div>

        <div class="task-hero-right">
          <a-button size="small" @click="router.back()">
            <template #icon><rollback-outlined /></template>
            返回
          </a-button>
          <a-divider type="vertical" style="height: 18px; margin: 0 4px;" />
          <a-button size="small" @click="handleScan">
            <template #icon><thunderbolt-outlined /></template>
            下发扫描
          </a-button>
          <a-button type="primary" size="small" class="primary-action-btn" @click="handleSubmit">
            <template #icon><cloud-upload-outlined /></template>
            提交漏洞
          </a-button>
        </div>
      </div>

      <!-- 中层：项目概览指标卡 (仅在概览Tab时展示) -->
      <div class="task-metric-cards-row" v-show="activeTab === 'overview'">
        <div class="metric-stat-card">
          <div class="stat-card-inner">
            <div class="stat-icon-box all"><appstore-outlined /></div>
            <div class="stat-info">
              <div class="stat-label">关联资产</div>
              <div class="stat-value">{{ project.asset_count || 0 }}</div>
            </div>
          </div>
        </div>

        <div class="metric-stat-card">
          <div class="stat-card-inner">
            <div class="stat-icon-box error"><safety-certificate-outlined /></div>
            <div class="stat-info">
              <div class="stat-label">发现漏洞</div>
              <div class="stat-value error">{{ project.vuln_count || 0 }}</div>
            </div>
          </div>
        </div>

        <div class="metric-stat-card">
          <div class="stat-card-inner">
            <div class="stat-icon-box done"><clock-circle-outlined /></div>
            <div class="stat-info">
              <div class="stat-label">上次扫描</div>
              <div class="stat-value done" style="font-size: 14px;">
                {{ formatTime(project.last_scan_at) || '未扫描' }}
              </div>
            </div>
          </div>
        </div>

        <div class="metric-stat-card">
          <div class="stat-card-inner">
            <div class="stat-icon-box running"><sync-outlined /></div>
            <div class="stat-info">
              <div class="stat-label">最近更新</div>
              <div class="stat-value running" style="font-size: 14px;">
                {{ formatTime(project.updated_at) }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 2. 主内容区域 -->
    <div class="arl-table-card">
      <a-tabs v-model:activeKey="activeTab" class="arl-detail-tabs">
        
        <a-tab-pane key="overview" tab="概览">
          <div class="detail-overview-panel">
            <div class="detail-section">
              <div class="section-title">
                <span class="section-indicator"></span> 基础信息
              </div>
              <a-descriptions bordered :column="2" size="small" class="arl-descriptions">
                <a-descriptions-item label="项目 ID">{{ project.project_id }}</a-descriptions-item>
                <a-descriptions-item label="来源平台">
                  <PlatformTag :platform="project.platform" />
                </a-descriptions-item>
                <a-descriptions-item label="创建时间">{{ formatTime(project.created_at) }}</a-descriptions-item>
                <a-descriptions-item label="抓取时间">{{ formatTime(project.fetched_at) }}</a-descriptions-item>
                <a-descriptions-item label="指纹 (Fingerprint)" :span="2">
                  <span class="task-id-text">{{ project.fingerprint || '-' }}</span>
                </a-descriptions-item>
              </a-descriptions>
            </div>

            <div class="detail-section">
              <div class="section-title">
                <span class="section-indicator"></span> 测试范围
              </div>
              <div v-if="project.scope && project.scope.length > 0" class="scope-tags-container">
                <a-tag v-for="(item, index) in project.scope" :key="index" class="scope-tag">
                  {{ item }}
                </a-tag>
              </div>
              <a-empty v-else description="暂无测试范围" :image="simpleImage" />
            </div>
          </div>
        </a-tab-pane>

        <a-tab-pane key="targets" tab="目标列表">
          <a-table
            :columns="targetColumns"
            :data-source="targets"
            :loading="loading.targets"
            row-key="_id"
            size="small"
            :pagination="false"
            class="modern-task-table"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'target'">
                <span class="task-target-text">{{ record.target }}</span>
              </template>
              <template v-else-if="column.key === 'target_type'">
                <a-tag color="blue">{{ record.target_type }}</a-tag>
              </template>
              <template v-else-if="column.key === 'scanned'">
                <a-tag :color="record.scanned ? 'success' : 'default'" class="task-status-tag">
                  <check-circle-outlined v-if="record.scanned" />
                  <clock-circle-outlined v-else />
                  <span>{{ record.scanned ? '已扫描' : '待扫描' }}</span>
                </a-tag>
              </template>
              <template v-else-if="column.key === 'created_at'">
                {{ formatTime(record.created_at) }}
              </template>
            </template>
          </a-table>
        </a-tab-pane>

        <a-tab-pane key="vulns" tab="漏洞列表">
          <a-table
            :columns="vulnColumns"
            :data-source="project.vulns || []"
            row-key="_id"
            size="small"
            :pagination="false"
            class="modern-task-table"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'target_url'">
                <span class="task-target-text">{{ record.target_url }}</span>
              </template>
              <template v-else-if="column.key === 'severity'">
                <SeverityTag :severity="record.severity" />
              </template>
              <template v-else-if="column.key === 'submit_status'">
                <a-tag :color="submitStatusColor(record.submit_status)" class="task-status-tag">
                  {{ record.submit_status || '待提交' }}
                </a-tag>
              </template>
              <template v-else-if="column.key === 'action'">
                <div class="task-action-cell">
                  <a-button
                    type="link"
                    size="small"
                    class="primary-table-btn"
                    :disabled="record.submit_status === 'submitted'"
                    @click="handleSubmitVuln(record)"
                  >
                    提交
                  </a-button>
                </div>
              </template>
            </template>
          </a-table>
        </a-tab-pane>
      </a-tabs>
    </div>

    <!-- 3. 扫描配置弹窗 -->
    <a-modal
      v-model:open="scanModal.visible"
      title="扫描配置"
      @ok="handleScanConfirm"
      width="480px"
      wrapClassName="arl-theme-modal"
      rootClassName="arl-theme-modal"
      okText="下 发"
      cancelText="取 消"
    >
      <a-form :model="scanModal.form" layout="vertical">
        <a-form-item label="扫描策略">
          <a-radio-group v-model:value="scanModal.form.profile" class="arl-radio-group">
            <a-radio value="quick">快速侦察</a-radio>
            <a-radio value="full">深度扫描</a-radio>
            <a-radio value="incremental">增量复扫</a-radio>
          </a-radio-group>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup>
defineOptions({ name: 'ProjectDetail' });

import { ref, reactive, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import { message, Empty } from 'ant-design-vue';
import {
  ThunderboltOutlined,
  CloudUploadOutlined,
  RollbackOutlined,
  AppstoreOutlined,
  SafetyCertificateOutlined,
  ClockCircleOutlined,
  SyncOutlined,
  CheckCircleOutlined
} from '@ant-design/icons-vue';
import dayjs from 'dayjs';
import PlatformTag from '@/components/platform/PlatformTag.vue';
import SeverityTag from '@/components/platform/SeverityTag.vue';
import { usePlatformStore } from '@/stores/platform'; // 确保你的 store 中有相关 actions

const simpleImage = Empty.PRESENTED_IMAGE_SIMPLE;
const route = useRoute();
const router = useRouter();
const store = usePlatformStore();

// 从 store 解构详情数据、目标列表与 loading 状态
const { projectDetail, targets, loading } = storeToRefs(store);
const {
  loadProjectDetail,
  loadTargets,
  triggerScan,
  submitAllProjectVulns,
  submitSingleVuln,
} = store;

const activeTab = ref('overview');
const fingerprint = route.params.fingerprint || route.params.id;

const project = computed(() => projectDetail.value || {});

const scanModal = reactive({
  visible: false,
  form: { profile: 'quick' },
});

const targetColumns = [
  { title: '目标', dataIndex: 'target', key: 'target', ellipsis: true },
  { title: '类型', key: 'target_type', width: 100 },
  { title: '状态', key: 'scanned', width: 120 },
  { title: '创建时间', key: 'created_at', width: 180 },
];

const vulnColumns = [
  { title: '目标 URL', dataIndex: 'target_url', key: 'target_url', ellipsis: true },
  { title: '模板 ID', dataIndex: 'template_id', key: 'template_id', width: 180 },
  { title: '等级', key: 'severity', width: 100 },
  { title: '提交状态', key: 'submit_status', width: 120 },
  { title: '操作', key: 'action', width: 100, fixed: 'right' },
];

onMounted(async () => {
  if (fingerprint) {
    await loadProjectDetail(fingerprint);
    await loadTargets({ project_fingerprint: fingerprint });
  }
});

function handleScan() {
  scanModal.form.profile = 'quick';
  scanModal.visible = true;
}

async function handleScanConfirm() {
  try {
    await triggerScan(fingerprint, scanModal.form);
    message.success('扫描任务已下发');
    scanModal.visible = false;
  } catch (e) {
    message.error(e.message);
  }
}

async function handleSubmit() {
  try {
    const result = await submitAllProjectVulns(fingerprint);
    message.success(`提交完成：成功 ${result.success || 0}，失败 ${result.failed || 0}`);
    await loadProjectDetail(fingerprint);
  } catch (e) {
    message.error(e.message);
  }
}

async function handleSubmitVuln(vuln) {
  try {
    await submitSingleVuln(vuln._id);
    message.success('提交成功');
    await loadProjectDetail(fingerprint);
  } catch (e) {
    message.error(e.message);
  }
}

function formatTime(t) {
  if (!t) return '-';
  return dayjs(t).format('YYYY-MM-DD HH:mm:ss');
}

function submitStatusColor(status) {
  return {
    submitted: 'success',
    failed: 'error',
    pending: 'warning',
  }[status] || 'default';
}
</script>

<style scoped>
/* 此处样式与 ProjectList 中的 ARL 样式保持一致，可直接复用 */
.arl-task-page { background-color: var(--arl-bg-layout); padding: 16px 20px; min-height: calc(100vh - 64px); }
.arl-task-hero-card { position: sticky; top: 0; z-index: 20; background: var(--arl-bg-white); border: 1px solid var(--arl-border-color); border-radius: 8px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04); padding: 12px 18px; margin-bottom: 12px; }
.task-hero-unified-bar { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; padding-bottom: 10px; border-bottom: 1px solid var(--arl-border-color); }
.task-hero-left { display: flex; align-items: center; gap: 16px; }
.task-hero-title .title-text { font-size: 16px; font-weight: 600; color: var(--arl-text-color); }
.hero-tags { display: flex; align-items: center; gap: 6px; }
.task-hero-right { display: flex; align-items: center; gap: 10px; }
.primary-action-btn { box-shadow: 0 2px 4px rgba(24, 144, 255, 0.2); }
.task-metric-cards-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; padding: 10px 0 2px 0; }
.metric-stat-card { background: var(--arl-bg-light); border: 1px solid var(--arl-border-color); border-radius: 6px; padding: 8px 12px; transition: all 0.2s ease; }
.metric-stat-card:hover { background: var(--arl-bg-white); border-color: var(--arl-theme-color); box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05); transform: translateY(-1px); }
.stat-card-inner { display: flex; align-items: center; gap: 10px; }
.stat-icon-box { width: 32px; height: 32px; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 15px; flex-shrink: 0; }
.stat-icon-box.all { background: rgba(24, 144, 255, 0.1); color: var(--arl-theme-color); }
.stat-icon-box.running { background: rgba(82, 196, 26, 0.12); color: #52c41a; }
.stat-icon-box.done { background: rgba(0, 188, 212, 0.12); color: #00bcd4; }
.stat-icon-box.error { background: rgba(255, 77, 79, 0.1); color: #ff4d4f; }
.stat-info { min-width: 0; flex: 1; }
.stat-label { font-size: 12px; color: var(--arl-text-secondary); }
.stat-value { font-size: 17px; font-weight: 600; color: var(--arl-text-color); margin-top: 2px; }
.stat-value.running { color: #52c41a; }
.stat-value.done { color: var(--arl-theme-color); }
.stat-value.error { color: #ff4d4f; }
.arl-table-card { background: var(--arl-bg-white); border: 1px solid var(--arl-border-color); border-radius: 8px; padding: 0 16px 16px 16px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03); }
:deep(.arl-detail-tabs .ant-tabs-nav) { margin-bottom: 16px; padding-top: 8px; }
.detail-overview-panel { display: flex; flex-direction: column; gap: 24px; }
.detail-section .section-title { font-size: 14px; font-weight: 600; color: var(--arl-text-color); display: flex; align-items: center; gap: 6px; margin-bottom: 12px; }
.section-indicator { width: 3px; height: 14px; background: var(--arl-theme-color); border-radius: 2px; display: inline-block; }
:deep(.arl-descriptions .ant-descriptions-item-label) { background: var(--arl-bg-light); color: var(--arl-text-secondary); font-size: 13px; }
:deep(.arl-descriptions .ant-descriptions-item-content) { font-size: 13px; color: var(--arl-text-color); }
.task-id-text { font-family: monospace; font-size: 12px; color: var(--arl-text-secondary); }
.scope-tags-container { display: flex; flex-wrap: wrap; gap: 8px; }
.scope-tag { font-family: monospace; font-size: 12px; padding: 4px 10px; border-radius: 4px; background: var(--arl-bg-light); border: 1px solid var(--arl-border-color); color: var(--arl-text-color); }
.task-target-text { max-width: 400px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: inline-block; font-family: monospace, sans-serif; color: var(--arl-text-color); }
.task-status-tag { display: inline-flex; align-items: center; gap: 4px; font-size: 12px; padding: 1px 8px; border-radius: 4px; margin-right: 0; }
.task-action-cell { display: flex; align-items: center; gap: 4px; }
.primary-table-btn { padding: 0 4px; font-weight: 500; }
.arl-radio-group { display: flex; flex-direction: column; gap: 12px; }
</style>