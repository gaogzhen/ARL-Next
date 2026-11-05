
// ARL-Next/frontend/src/api/icp.js
/**
 * ICP / 企业测绘 (OSINT) 相关 API 封装
 * 复用 @/utils/request 通用请求
 */

import request from '@/utils/request'

const BASE = '/icp'


// ═══════════════════════════════════════════════════════════
// 天眼查配置校验
// ═══════════════════════════════════════════════════════════

/**
 * 校验天眼查配置是否有效（是否配置了 ID / Token）
 * @returns {Promise} { code, data: { valid: Boolean, message: String } }
 */
export function checkTycConfig() {
  return request({
    url: `${BASE}/tyc_check`,
    method: 'get',
  })
}


// ═══════════════════════════════════════════════════════════
// 公司搜索（用于新建企业测绘任务时，根据公司名获取候选 gid）
// ═══════════════════════════════════════════════════════════

/**
 * 根据公司名称搜索天眼查公司列表
 * @param {String} keyword - 公司名称关键词
 * @returns {Promise} { code, data: [{ name, gid }] }
 */
export function searchCompany(keyword) {
  return request({
    url: `${BASE}/tyc_search_company`,
    method: 'get',
    params: { keyword },
  })
}


// ═══════════════════════════════════════════════════════════
// 企业测绘任务
// ═══════════════════════════════════════════════════════════

/**
 * 获取企业测绘任务列表（分页）
 * @param {Object} params - { page, size, name, target, status, end_time__gte, end_time__lte }
 */
export function getIcpTasks(params) {
  return request({
    url: `${BASE}/task`,
    method: 'get',
    params,
  })
}

/**
 * 创建天眼查企业测绘任务
 * @param {Object} data - { name, gid, depth, invest_ratio, query_type, enable_icp }
 */
export function createTycTask(data) {
  return request({
    url: `${BASE}/tyc_task`,
    method: 'post',
    data,
  })
}

/**
 * 停止企业测绘任务
 * @param {String} taskId
 */
export function stopIcpTask(taskId) {
  return request({
    url: `${BASE}/stop/${taskId}`,
    method: 'get',
  })
}

/**
 * 重启企业测绘任务
 * @param {String} taskId
 */
export function restartIcpTask(taskId) {
  return request({
    url: `${BASE}/restart/${taskId}`,
    method: 'get',
  })
}

/**
 * 删除企业测绘任务（支持批量）
 * @param {Object} data - { task_ids: [String] }
 */
export function deleteIcpTasks(data) {
  return request({
    url: `${BASE}/delete/`,
    method: 'post',
    data,
  })
}

/**
 * 批量重启企业测绘任务
 * @param {Object} data - { task_ids: [String] }
 */
export function batchRestartIcpTasks(data) {
  return request({
    url: `${BASE}/restart/`,
    method: 'post',
    data,
  })
}

/**
 * 导出企业测绘任务 Excel
 * @param {String} taskId
 */
export function exportIcpTask(taskId) {
  return request({
    url: `${BASE}/export/${taskId}`,
    method: 'get',
    responseType: 'blob',
  })
}

/**
 * 批量导出企业测绘任务 Excel
 * @param {Object} data - { task_id: [String] }
 */
export function batchExportIcpTasks(data) {
  return request({
    url: `${BASE}/batch_export`,
    method: 'post',
    data,
    responseType: 'blob',
  })
}