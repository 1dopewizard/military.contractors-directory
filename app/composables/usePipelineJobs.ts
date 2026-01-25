/**
 * @file usePipelineJobs.ts
 * @description Composable for pipeline job management with API polling
 * 
 * Uses API polling for real-time
 * log streaming and job status updates.
 * 
 * @usage
 * ```ts
 * const { 
 *   currentJob, 
 *   recentJobs, 
 *   scripts,
 *   isLoading,
 *   runScript,
 *   refresh
 * } = usePipelineJobs()
 * ```
 * @dependencies API-backed (libSQL/Drizzle)
 */

/**
 * Script parameter definition
 */
export interface ScriptParam {
  name: string
  flag: string
  type: 'string' | 'number' | 'boolean'
  required?: boolean
  default?: string | number | boolean
  description?: string
}

/**
 * Pipeline script metadata
 */
export interface PipelineScriptMeta {
  name: string
  description: string
  estimatedTime: string
  params?: ScriptParam[]
  supportsDryRun?: boolean
  category: string
  isPipeline: boolean
}

/**
 * Pipeline job record
 */
export interface PipelineJob {
  id: string
  script: string
  status: 'idle' | 'running' | 'completed' | 'failed' | 'cancelled'
  startedAt: string
  completedAt?: string | null
  logs: string[]
  exitCode?: number | null
  error?: string | null
  dryRun: boolean
  args?: Record<string, unknown>
}

/**
 * Options for running a pipeline script
 */
export interface RunScriptOptions {
  dryRun?: boolean
  args?: Record<string, string | number | boolean>
}

/**
 * Return type for usePipelineJobs composable
 */
export interface UsePipelineJobsReturn {
  /** Current running job (if any) */
  currentJob: Ref<PipelineJob | null>
  /** Recent job history */
  recentJobs: Ref<PipelineJob[]>
  /** Available scripts metadata */
  scripts: Ref<Record<string, PipelineScriptMeta>>
  /** Whether data is loading */
  isLoading: Ref<boolean>
  /** Whether polling is active */
  isSubscribed: Ref<boolean>
  /** Error message if any */
  error: Ref<string | null>
  /** Run a pipeline script */
  runScript: (scriptName: string, options?: RunScriptOptions) => Promise<PipelineJob | null>
  /** Refresh status data */
  refresh: () => Promise<void>
  /** Subscribe to a specific job's updates (starts polling) */
  subscribeToJob: (jobId: string) => void
  /** Unsubscribe from job updates (stops polling) */
  unsubscribeFromJob: () => void
}

export function usePipelineJobs(): UsePipelineJobsReturn {
  const logger = useLogger('usePipelineJobs')

  // State
  const currentJob = ref<PipelineJob | null>(null)
  const recentJobs = ref<PipelineJob[]>([])
  const scripts = ref<Record<string, PipelineScriptMeta>>({})
  const isLoading = ref(false)
  const isSubscribed = ref(false)
  const error = ref<string | null>(null)

  // Polling state
  let pollInterval: ReturnType<typeof setInterval> | null = null
  let subscribedJobId: string | null = null

  /**
   * Fetch initial status from API
   */
  const refresh = async (): Promise<void> => {
    isLoading.value = true
    error.value = null

    try {
      const data = await $fetch<{
        currentJob: PipelineJob | null
        recentJobs: PipelineJob[]
        scripts: Record<string, PipelineScriptMeta>
      }>('/api/admin/pipeline/status')

      currentJob.value = data.currentJob
      recentJobs.value = data.recentJobs
      scripts.value = data.scripts

      logger.debug(
        {
          hasCurrentJob: !!data.currentJob,
          recentJobsCount: data.recentJobs.length,
          scriptsCount: Object.keys(data.scripts).length,
        },
        'Pipeline status refreshed'
      )

      // Auto-subscribe to running job if there is one
      if (data.currentJob?.status === 'running' && data.currentJob.id) {
        subscribeToJob(data.currentJob.id)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch pipeline status'
      error.value = message
      logger.error({ error: message }, 'Failed to refresh pipeline status')
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Poll for job updates
   */
  const pollJobStatus = async (jobId: string): Promise<void> => {
    try {
      const data = await $fetch<{
        currentJob: PipelineJob | null
        recentJobs: PipelineJob[]
        scripts: Record<string, PipelineScriptMeta>
      }>('/api/admin/pipeline/status')

      // Find the job we're tracking
      const job = data.currentJob?.id === jobId 
        ? data.currentJob 
        : data.recentJobs.find(j => j.id === jobId)

      if (job) {
        currentJob.value = job

        logger.debug(
          { 
            jobId, 
            status: job.status, 
            logsCount: (job.logs ?? []).length 
          },
          'Job update received'
        )

        // If job finished, unsubscribe and refresh recent jobs
        if (job.status !== 'running') {
          logger.info({ jobId, status: job.status }, 'Job completed, unsubscribing')
          unsubscribeFromJob()
          // Refresh to get updated recent jobs list
          refresh()
        }
      }
    } catch (err) {
      logger.error({ jobId, error: err }, 'Poll error')
    }
  }

  /**
   * Subscribe to real-time updates for a specific job (via polling)
   */
  const subscribeToJob = (jobId: string): void => {
    // Don't resubscribe to the same job
    if (subscribedJobId === jobId && isSubscribed.value) {
      return
    }

    // Unsubscribe from previous job if any
    unsubscribeFromJob()

    subscribedJobId = jobId
    logger.info({ jobId }, 'Subscribing to job updates (polling)')

    // Start polling every 2 seconds
    pollInterval = setInterval(() => {
      pollJobStatus(jobId)
    }, 2000)

    isSubscribed.value = true
  }

  /**
   * Unsubscribe from job updates
   */
  const unsubscribeFromJob = (): void => {
    if (pollInterval) {
      clearInterval(pollInterval)
      pollInterval = null
    }
    subscribedJobId = null
    isSubscribed.value = false
  }

  /**
   * Run a pipeline script
   */
  const runScript = async (
    scriptName: string,
    options: RunScriptOptions = {}
  ): Promise<PipelineJob | null> => {
    isLoading.value = true
    error.value = null

    try {
      logger.info({ scriptName, ...options }, 'Running pipeline script')

      const response = await $fetch<{ success: boolean; job: PipelineJob | null }>(
        '/api/admin/pipeline/run',
        {
          method: 'POST',
          body: {
            script: scriptName,
            dryRun: options.dryRun ?? false,
            args: options.args,
          },
        }
      )

      if (response.success && response.job) {
        currentJob.value = response.job

        // Subscribe to the new job for real-time updates
        if (response.job.id) {
          subscribeToJob(response.job.id)
        }

        logger.info({ jobId: response.job.id, scriptName }, 'Script started successfully')
        return response.job
      }

      return null
    } catch (err: unknown) {
      const fetchErr = err as { data?: { message?: string }; message?: string }
      const message = fetchErr.data?.message || fetchErr.message || 'Failed to run script'
      error.value = message
      logger.error({ scriptName, error: message }, 'Failed to run script')
      throw new Error(message)
    } finally {
      isLoading.value = false
    }
  }

  // Cleanup on unmount
  onUnmounted(() => {
    unsubscribeFromJob()
  })

  return {
    currentJob,
    recentJobs,
    scripts,
    isLoading,
    isSubscribed,
    error,
    runScript,
    refresh,
    subscribeToJob,
    unsubscribeFromJob,
  }
}
