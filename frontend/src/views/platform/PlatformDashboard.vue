<!-- ARL-Next/frontend/src/views/platform/PlatformDashboard.vue -->
<template>
  <div class="platform-list">
    <!-- 顶部工具栏：平台抓取功能集中在此 -->
    <div class="platform-toolbar">
      <div class="toolbar-left">
        <span class="toolbar-title">漏洞平台管理</span>
      </div>
      <div class="toolbar-right">
        <a-space>
          <a-button
            type="primary"
            :loading="fetchAllLoading"
            @click="handleFetchAll"
          >
            <template #icon><ReloadOutlined /></template>
            抓取全部平台
          </a-button>
          <a-dropdown>
            <a-button :loading="fetchOneLoading">
              单平台抓取 <DownOutlined />
            </a-button>
            <template #overlay>
              <a-menu @click="handleFetchOne">
                <a-menu-item
                  v-for="p in platforms"
                  :key="p.name"
                >
                  {{ p.display_name || p.name }}
                </a-menu-item>
              </a-menu>
            </template>
          </a-dropdown>
        </a-space>
      </div>
    </div>

    <!-- 平台卡片列表 -->
    <a-row :gutter="16">
      <a-col
        v-for="p in platforms"
        :key="p.name"
        :xs="24" :sm="12" :md="8" :lg="6"
      >
        <a-card class="platform-card">
          <template #title>
            <PlatformTag :platform="p.name" />
            <span style="margin-left: 8px">
              {{ p.display_name || p.name }}
            </span>
          </template>
          <template #extra>
            <a-tag color="green">启用</a-tag>
          </template>

          <div class="platform-info">
            <div class="info-row">
              <span class="label">速率限制：</span>
              <span class="value">{{ p.rate_limit || '-' }}</span>
            </div>
            <div class="info-row">
              <span class="label">默认延迟：</span>
              <span class="value">
                {{ p.default_delay || '-' }} s
              </span>
            </div>
            <div class="info-row">
              <span class="label">需登录：</span>
              <span class="value">
                {{ p.requires_login ? '是' : '否' }}
              </span>
            </div>
          </div>

          <template #actions>
            <a-button
              type="link"
              size="small"
              @click="handleFetch(p.name)"
            >
              抓取项目
            </a-button>
          </template>
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { message } from 'ant-design-vue'
import {
  ReloadOutlined,
  DownOutlined,
} from '@ant-design/icons-vue'
import PlatformTag from '@/components/platform/PlatformTag.vue'
import { usePlatformStore } from '@/stores/platform'

const store = usePlatformStore()
const { platforms } = storeToRefs(store)
const { loadPlatforms, triggerFetch } = store

const fetchAllLoading = ref(false)
const fetchOneLoading = ref(false)

onMounted(() => {
  loadPlatforms()
})

// 抓取全部平台
async function handleFetchAll() {
  fetchAllLoading.value = true
  try {
    await triggerFetch({})
    message.success('已触发全平台抓取')
  } catch (e) {
    message.error(e.message)
  } finally {
    fetchAllLoading.value = false
  }
}

// 单平台抓取（下拉菜单）
async function handleFetchOne({ key }) {
  fetchOneLoading.value = true
  try {
    await triggerFetch({ platform: key })
    message.success(`已触发 ${key} 抓取`)
  } catch (e) {
    message.error(e.message)
  } finally {
    fetchOneLoading.value = false
  }
}

// 卡片上的单平台抓取按钮
async function handleFetch(name) {
  try {
    await triggerFetch({ platform: name })
    message.success(`已触发 ${name} 抓取`)
  } catch (e) {
    message.error(e.message)
  }
}
</script>

<style scoped>
.platform-list {
  padding: 16px;
}
.platform-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.toolbar-title {
  font-size: 16px;
  font-weight: 600;
  color: #262626;
}
.platform-card {
  margin-bottom: 16px;
}
.platform-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.info-row {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
}
.info-row .label {
  color: #8c8c8c;
}
.info-row .value {
  color: #262626;
  font-weight: 500;
}
</style>