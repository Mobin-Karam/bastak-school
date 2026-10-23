// CI fixture only. Refuse remote hosts and require explicit disposable-write opt-in.
import { randomUUID } from 'node:crypto';
const base = process.env.SMOKE_BASE_URL;
if (process.env.SMOKE_ALLOW_DISPOSABLE_WRITES !== 'true' || !base || !['localhost', '127.0.0.1'].includes(new URL(base).hostname)) {
  throw new Error('Critical smoke requires an explicitly disposable loopback stack');
}
let session;
async function browserPreflight(path, method) {
  const origin = 'https://app.sultano.ir';
  const response = await fetch(base + path, {
    method: 'OPTIONS',
    headers: {
      origin,
      'access-control-request-method': method,
      'access-control-request-headers': 'content-type,x-csrf-token,x-work-role,x-organization-id',
    },
    signal: AbortSignal.timeout(15000),
  });
  const allowedMethods = (response.headers.get('access-control-allow-methods') || '').split(',').map(value => value.trim());
  if (response.status !== 204 || response.headers.get('access-control-allow-origin') !== origin || response.headers.get('access-control-allow-credentials') !== 'true' || !allowedMethods.includes(method)) {
    throw new Error(`Browser preflight failed: ${method} ${path} (${response.status}; allow-methods=${allowedMethods.join(',')})`);
  }
}
async function call(path, { method = 'GET', body, role = 'PLATFORM_ADMIN', organizationId, expected } = {}) {
  const headers = { 'x-work-role': role };
  if (organizationId) headers['x-organization-id'] = organizationId;
  if (session) headers.cookie = session.cookie;
  if (body) { headers['content-type'] = 'application/json'; if (session) headers['x-csrf-token'] = session.csrf; }
  const response = await fetch(base + path, { method, headers, body: body && JSON.stringify(body), signal: AbortSignal.timeout(15000) });
  const payload = await response.json();
  if (expected ? response.status !== expected : !response.ok || !payload.ok) throw new Error(`Critical smoke failed: ${method} ${path} (${response.status})`);
  return { response, data: payload.data };
}
let phone = 0;
for (const method of ['POST', 'PUT', 'PATCH', 'DELETE']) await browserPreflight('/auth/login', method);
for (const char of 'e2e.platform') phone = (phone * 31 + char.charCodeAt(0)) >>> 0;
const login = await call('/auth/login', { method: 'POST', body: { phoneNumber: `091${String(phone % 100000000).padStart(8,'0')}`, password: process.env.E2E_PASSWORD || 'Moshaver-e2e-2026!' } });
const cookies = login.response.headers.getSetCookie();
if (!cookies.some(cookie => /;\s*Secure/i.test(cookie) && /;\s*HttpOnly/i.test(cookie))) throw new Error('Secure session cookie missing');
session = { cookie: cookies.map(cookie => cookie.split(';')[0]).join('; '), csrf: login.data.csrfToken };
const organizations = (await call('/organizations')).data;
const organizationId = organizations.find(org => org.name === 'E2E Organization A')?.id;
if (!organizationId) throw new Error('Disposable school fixture missing');
await call('/me/context', { organizationId });
const students = (await call('/students', { organizationId })).data;
const student = students.find(row => row.name === 'Student A');
if (!student) throw new Error('Disposable student fixture missing');
await call(`/students/${student.id}`, { organizationId });
const classroom = (await call('/classes', { method:'POST', organizationId, body:{ organizationId, code:'ci-smoke', name:'CI Smoke', schoolYear:'1405-1406', capacity:2 } })).data;
await call(`/classes/${classroom.id}/enrollments`, { method:'PUT', organizationId, body:{ studentIds:[student.id] } });
const attendance = (await call('/student/attendance/sessions', { method:'POST', organizationId, body:{ organizationId, contextType:'class', contextId:classroom.id, sessionDate:new Date().toISOString() } })).data;
const mark = { requestId:randomUUID(), expectedRevision:attendance.revision, organizationId, sessionId:attendance.id, entries:[{ studentId:student.id, status:'present' }] };
await call('/attendance/bulk-mark', { method:'POST', organizationId, body:mark });
await call('/attendance/bulk-mark', { method:'POST', organizationId, body:mark });
const detail = (await call(`/attendance/sessions/${attendance.id}`, { organizationId })).data;
if (detail.records?.filter(row => row.studentId === student.id).length !== 1) throw new Error('Attendance retry produced an invalid record count');
const room = (await call('/dormitory/rooms', { method:'POST', organizationId, body:{ organizationId, code:'ci-smoke', name:'CI Smoke', capacity:2 } })).data;
await call(`/dormitory/rooms/${room.id}/assignments`, { method:'PUT', organizationId, body:{ studentIds:[student.id] } });
const rooms = (await call('/dormitory/rooms', { organizationId })).data;
if (rooms.find(row => row.id === room.id)?.studentCount !== 1) throw new Error('Dorm placement count mismatch');
await call('/schedule', { organizationId });
let studentPhone = 0;
for (const char of 'e2e.student.a') studentPhone = (studentPhone * 31 + char.charCodeAt(0)) >>> 0;
const studentLogin = await call('/auth/login', { method:'POST', body:{ phoneNumber:`091${String(studentPhone % 100000000).padStart(8,'0')}`, password:process.env.E2E_PASSWORD || 'Moshaver-e2e-2026!' } });
session = { cookie:studentLogin.response.headers.getSetCookie().map(cookie => cookie.split(';')[0]).join('; '), csrf:studentLogin.data.csrfToken };
await call('/me/context', { role:'STUDENT', organizationId });
await call('/classes', { method:'POST', role:'STUDENT', organizationId, expected:403, body:{ organizationId, code:'denied', name:'Denied', schoolYear:'1405-1406' } });
console.log('Critical HTTPS smoke passed: browser preflight, login, context, student, classes, attendance retry, dorm, schedules and denied role');
