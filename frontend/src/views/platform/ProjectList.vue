<!-- ARL-Next/frontend/src/views/platform/ProjectList.vue -->
<template>
  <div class="project-dashboard">
    <div class="toolbar">
      <a-space>
        <a-select
          v-model:value="filter.platform"
          placeholder="选择平台"
          style="width: 160px"
          allow-clear
          @change="handleFilterChange"
        >
          <a-select-option
            v-for="p in platforms"
            :key="p.name"
            :value="p.name"
          >
            {{ p.display_name || p.name }}
          </a-select-option>
        </a-select>

        <a-select
          v-model:value="filter.status"
          placeholder="项目状态"
          style="width: 140px"
          allow-clear
          @change="handleFilterChange"
        >
          <a-select-option value="active">活跃</a-select-option>
          <a-select-option value="expired">已过期</a-select-option>
        </a-select>

        <a-input-search
          v-model:value="filter.project_name"
          placeholder="搜索项目名称"
          style="width: 240px"
          @search="handleFilterChange"
        />
      </a-space>
    </div>

    <a-table
      :dataSource="projects"
      :columns="columns"
      :loading="loading"
      :pagination="false"
      :rowKey="(record) => record.fingerprint"
      class="modern-project-table"
      :scroll="{ x: 'max-content' }"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'project_name'">
          <a class="project-name-link" @click="handleDetail(record)">
            {{ record.project_name }}
          </a>
        </template>

        <template v-else-if="column.key === 'platform'">
          <PlatformTag :platform="record.platform" />
        </template>

        <template v-else-if="column.key === 'status'">
          <a-tag :color="record.status === 'active' ? 'success' : 'default'">
            {{ record.status === 'active' ? '活跃' : '已过期' }}
          </a-tag>
        </template>

        <template v-else-if="column.key === 'asset_count'">
          {{ record.asset_count || 0 }}
        </template>

        <template v-else-if="column.key === 'vuln_count'">
          {{ record.vuln_count || 0 }}
        </template>

        <template v-else-if="column.key === 'updated_at'">
          {{ record.updated_at || record.fetched_at || '-' }}
        </template>

        <template v-else-if="column.key === 'action'">
          <a-space>
            <a-button type="link" size="small" @click="handleDetail(record)">详情</a-button>
            <a-button type="link" size="small" @click="handleScan(record)">扫描</a-button>
            <a-button type="link" size="small" @click="handleCreateEnterpriseRecon(record)">企业测绘</a-button>
            <a-button type="link" size="small" @click="handleSubmit(record)">提交</a-button>
          </a-space>
        </template>
      </template>
    </a-table>

    <a-empty v-if="!loading && projects.length === 0" />

    <div class="pagination">
      <a-pagination
        v-model:current="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="projectTotal"
        :show-size-changer="true"
        :show-total="(t) => `共 ${t} 个`"
        @change="loadProjects"
        @showSizeChange="loadProjects"
      />
    </div>

    <!-- 扫描配置弹窗 -->
    <a-modal
      v-model:open="scanModal.visible"
      title="扫描配置"
      @ok="handleScanConfirm"
    >
      <a-form :model="scanModal.form" layout="vertical">
        <a-form-item label="扫描策略">
          <a-radio-group v-model:value="scanModal.form.profile">
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
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { message, Modal } from 'ant-design-vue'
import PlatformTag from '@/components/platform/PlatformTag.vue'
import {
  getPlatforms,
  getProjects,
  scanProject,
  submitProjectVulns,
} from '@/api/platform'

const router = useRouter()

// ★ 组件本地状态，不使用 Pinia 存储项目数据
const platforms = ref([])
const projects = ref([])
const projectTotal = ref(0)
const loading = ref(false)

const filter = reactive({
  platform: undefined,
  status: undefined,
  project_name: '',
})

const pagination = reactive({
  page: 1,
  pageSize: 20,
})

const scanModal = reactive({
  visible: false,
  fingerprint: '',
  form: {
    profile: 'quick',
  },
})

const columns = [
  { title: '项目名称', dataIndex: 'project_name', key: 'project_name', width: 220, ellipsis: true },
  { title: '所属平台', dataIndex: 'platform', key: 'platform', width: 120 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 100 },
  { title: '资产数', dataIndex: 'asset_count', key: 'asset_count', width: 100 },
  { title: '漏洞数', dataIndex: 'vuln_count', key: 'vuln_count', width: 100 },
  { title: '更新时间', dataIndex: 'updated_at', key: 'updated_at', width: 180 },
  { title: '操作', key: 'action', width: 260, fixed: 'right' },
]

onMounted(async () => {
  await loadPlatforms()
  await loadProjects()
})

// 加载平台列表
async function loadPlatforms() {
  try {
    const res = await getPlatforms()
    // 兼容多种返回结构
    if (Array.isArray(res)) {
      platforms.value = res
    } else if (res && Array.isArray(res.items)) {
      platforms.value = res.items
    } else if (res && Array.isArray(res.data)) {
      platforms.value = res.data
    } else {
      platforms.value = []
    }
  } catch (e) {
    console.error('加载平台列表失败:', e)
  }
}

// ★ 每次重新查询项目列表
async function loadProjects() {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      size: pagination.pageSize,
    }
    if (filter.platform) params.platform = filter.platform
    if (filter.status) params.status = filter.status
    if (filter.project_name) params.project_name = filter.project_name

    const res = await getProjects(params)
    projects.value = (res && res.items) || []
    projectTotal.value = (res && res.total) || 0
  } catch (e) {
    console.error('加载项目列表失败:', e)
    message.error('加载项目列表失败')
    projects.value = []
    projectTotal.value = 0
  } finally {
    loading.value = false
  }
}

function handleFilterChange() {
  pagination.page = 1
  loadProjects()
}

function handleDetail(project) {
  router.push(`/platform/projects/${project.fingerprint}`)
}

function handleScan(project) {
  scanModal.fingerprint = project.fingerprint
  scanModal.form.profile = 'quick'
  scanModal.visible = true
}

async function handleScanConfirm() {
  try {
    await scanProject(scanModal.fingerprint, scanModal.form)
    message.success('扫描任务已下发')
    scanModal.visible = false
  } catch (e) {
    message.error(e.message || '扫描下发失败')
  }
}

/**
 * ★ 跳转到任务管理 -> 企业测绘 Tab -> 自动打开新建弹窗并预填目标
 */
function handleCreateEnterpriseRecon(project) {
  router.push({
    path: '/taskList',
    query: {
      tab: 'enterprise',
      action: 'create_enterprise',
      target: project.project_name,
      source_project_id: project._id,
    },
  })
}

function handleSubmit(project) {
  Modal.confirm({
    title: '确认提交漏洞',
    content: `将项目「${project.project_name}」的所有未提交漏洞提交到 ${project.platform} 平台？`,
    async onOk() {
      try {
        const result = await submitProjectVulns(project.fingerprint)
        message.success(
          `提交完成：成功 ${result?.success || 0}，失败 ${result?.failed || 0}`
        )
      } catch (e) {
        message.error(e.message || '提交失败')
      }
    },
  })
}
</script>

<style scoped>
.project-dashboard {
  padding: 16px;
}
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.pagination {
  margin-top: 24px;
  text-align: right;
}
.project-name-link {
  font-weight: 500;
  color: #1890ff;
  cursor: pointer;
}
.project-name-link:hover {
  text-decoration: underline;
}
.modern-project-table {
  background: #fff;
  border-radius: 8px;
  padding: 8px;
}
</style>