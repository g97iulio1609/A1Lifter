import autocannon, { type Result as AutocannonResult } from 'autocannon'
import { once } from 'node:events'

interface Scenario {
  name: string
  path: string
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: string
  headers?: Record<string, string>
}

interface Phase {
  label: string
  connections: number
  duration: number
}

const BASE_URL = process.env.LOAD_TEST_BASE_URL ?? 'http://localhost:3000'
const BASE_CONNECTIONS = Number(process.env.LOAD_TEST_CONNECTIONS ?? 50)
const BASE_DURATION = Number(process.env.LOAD_TEST_DURATION ?? 30)

const DEFAULT_HEADERS: Record<string, string> = {}

if (process.env.LOAD_TEST_COOKIE) {
  DEFAULT_HEADERS.cookie = process.env.LOAD_TEST_COOKIE
}

if (process.env.LOAD_TEST_AUTHORIZATION) {
  DEFAULT_HEADERS.authorization = process.env.LOAD_TEST_AUTHORIZATION
}

function parseCustomScenarios(): Scenario[] | null {
  const raw = process.env.LOAD_TEST_SCENARIOS
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw) as Scenario[]
    return parsed
      .filter((scenario) => typeof scenario?.name === 'string' && typeof scenario?.path === 'string')
      .map((scenario) => ({
        ...scenario,
        method: (scenario.method ?? 'GET').toUpperCase() as Scenario['method'],
      }))
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to parse LOAD_TEST_SCENARIOS JSON. Falling back to defaults.', error)
    return null
  }
}

const DEFAULT_SCENARIOS: Scenario[] = [
  { name: 'Landing page', path: '/' },
  { name: 'Live leaderboard', path: '/live' },
  { name: 'Health check', path: '/api/health' },
  { name: 'Readiness check', path: '/api/ready' },
  { name: 'Dashboard stats API', path: '/api/dashboard/stats' },
]

const SCENARIOS = parseCustomScenarios() ?? DEFAULT_SCENARIOS

const PHASES: Phase[] = [
  { label: 'baseline', connections: BASE_CONNECTIONS, duration: BASE_DURATION },
  {
    label: 'stress',
    connections: Math.max(Math.floor(BASE_CONNECTIONS * 1.5), BASE_CONNECTIONS + 25),
    duration: Math.max(20, Math.floor(BASE_DURATION * 0.75)),
  },
]

function formatUrl(path: string): string {
  return new URL(path, BASE_URL).toString()
}

function printHeader(title: string) {
  // eslint-disable-next-line no-console
  console.log(`\n===== ${title} =====`)
}

function printResult(phase: Phase, result: AutocannonResult) {
  const rps = result.requests.average.toFixed(2)
  const latency = result.latency.average.toFixed(2)
  const errors = result.errors
  const timeouts = result.timeouts
  const non2xx = result.non2xx

  // eslint-disable-next-line no-console
  console.log(
    JSON.stringify(
      {
        phase: phase.label,
        connections: phase.connections,
        duration: `${phase.duration}s`,
        requestsPerSecond: rps,
        latencyMs: latency,
        errors,
        timeouts,
        non2xx,
      },
      null,
      2
    )
  )
}

async function runScenario(scenario: Scenario) {
  printHeader(`Scenario: ${scenario.name}`)
  for (const phase of PHASES) {
    const instance = autocannon({
      url: formatUrl(scenario.path),
      method: scenario.method ?? 'GET',
      headers: {
        ...DEFAULT_HEADERS,
        ...scenario.headers,
      },
      connections: phase.connections,
      duration: phase.duration,
      body: scenario.body,
      // Note: warmup not supported in current autocannon types
      timeout: 30,
    })

    const results = await once(instance, 'done')
    const result = results[0] as AutocannonResult
    printResult(phase, result)
  }
}

async function main() {
  printHeader('A1Lifter Load Testing Runner')
  // eslint-disable-next-line no-console
  console.log(
    JSON.stringify(
      {
        baseUrl: BASE_URL,
        phases: PHASES,
        scenarioCount: SCENARIOS.length,
      },
      null,
      2
    )
  )

  for (const scenario of SCENARIOS) {
    await runScenario(scenario)
  }

  printHeader('Load testing completed')
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('Load testing failed', error)
  process.exitCode = 1
})
