import React, { useEffect, useState } from 'react';
import {
  Building2,
  Plus,
  Settings,
  Shield,
  Users,
} from 'lucide-react';
import { apiRequest } from '../services/api.ts';
import { LearningModuleSummary } from '../types/index.ts';

interface AdminOverview {
  stats: {
    totalSchools: number;
    activeSchools: number;
    totalTeachers: number;
    totalPupils: number;
    totalClasses: number;
    totalModules: number;
    totalExercises: number;
    totalResults: number;
  };
  recentAuditLogs: Array<{
    id: string;
    action: string;
    entity: string;
    details: string;
    createdAt: string;
    user: { fullName: string; role: string } | null;
    school: { name: string } | null;
  }>;
  recentResults: Array<{
    id: string;
    awardedMarks: number;
    totalMarks: number;
    percentage: number;
    gradedAt: string;
    pupil: { fullName: string; school: { name: string } | null };
    attempt: { attemptType: string; exercise: { title: string } | null };
  }>;
}

interface SchoolRow {
  id: string;
  name: string;
  code: string;
  province: string;
  district: string;
  isActive: boolean;
  _count: { users: number; classes: number };
}

interface UserRow {
  id: string;
  email: string;
  username: string;
  fullName: string;
  role: 'ADMIN' | 'TEACHER' | 'PUPIL';
  isActive: boolean;
  schoolId: string | null;
  school: { id: string; name: string; code: string } | null;
}

interface ClassRow {
  id: string;
  name: string;
  gradeLevel: string;
  academicYear: string;
  schoolId: string;
  school: { id: string; name: string; code: string };
  teacherAssignments: Array<{ teacher: { id: string; fullName: string } }>;
  _count: { memberships: number; exercises: number };
}

interface SystemSettingRow {
  key: string;
  value: string;
  description: string;
}

export const AdminDashboard: React.FC = () => {
  const [tab, setTab] = useState<'overview' | 'schools' | 'users' | 'classes' | 'modules' | 'audit'>('overview');
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [schools, setSchools] = useState<SchoolRow[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [modules, setModules] = useState<LearningModuleSummary[]>([]);
  const [settings, setSettings] = useState<SystemSettingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');

  // Forms
  const [schoolName, setSchoolName] = useState('');
  const [schoolCode, setSchoolCode] = useState('');
  const [schoolProvince, setSchoolProvince] = useState('Lusaka');
  const [schoolDistrict, setSchoolDistrict] = useState('Lusaka');

  const [newUserFullName, setNewUserFullName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserUsername, setNewUserUsername] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('School@2026!');
  const [newUserRole, setNewUserRole] = useState<'TEACHER' | 'PUPIL' | 'ADMIN'>('PUPIL');
  const [newUserSchoolId, setNewUserSchoolId] = useState('');
  const [newUserClassId, setNewUserClassId] = useState('');

  const [className, setClassName] = useState('');
  const [classGrade, setClassGrade] = useState('Grade 8');
  const [classSchoolId, setClassSchoolId] = useState('');

  const [assignClassId, setAssignClassId] = useState('');
  const [assignTeacherId, setAssignTeacherId] = useState('');

  const loadAll = async () => {
    setLoading(true);
    try {
      const [ov, sc, us, cl, md, st] = await Promise.all([
        apiRequest<AdminOverview>('/api/admin/overview'),
        apiRequest<{ schools: SchoolRow[] }>('/api/admin/schools'),
        apiRequest<{ users: UserRow[] }>('/api/admin/users'),
        apiRequest<{ classes: ClassRow[] }>('/api/admin/classes'),
        apiRequest<{ modules: LearningModuleSummary[] }>('/api/learning/modules'),
        apiRequest<{ settings: SystemSettingRow[] }>('/api/admin/settings'),
      ]);
      setOverview(ov);
      setSchools(sc.schools);
      setUsers(us.users);
      setClasses(cl.classes);
      setModules(md.modules);
      setSettings(st.settings);

      if (sc.schools.length > 0) {
        if (!newUserSchoolId) setNewUserSchoolId(sc.schools[0].id);
        if (!classSchoolId) setClassSchoolId(sc.schools[0].id);
      }
      if (cl.classes.length > 0 && !assignClassId) {
        setAssignClassId(cl.classes[0].id);
      }
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load admin records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleCreateSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFeedback('');
    try {
      await apiRequest('/api/admin/schools', {
        method: 'POST',
        body: JSON.stringify({
          name: schoolName,
          code: schoolCode,
          province: schoolProvince,
          district: schoolDistrict,
        }),
      });
      setSchoolName('');
      setSchoolCode('');
      setFeedback('School registered successfully.');
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create school.');
    }
  };

  const toggleSchoolActive = async (school: SchoolRow) => {
    try {
      await apiRequest(`/api/admin/schools/${school.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: !school.isActive }),
      });
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update school.');
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFeedback('');
    try {
      await apiRequest('/api/admin/users', {
        method: 'POST',
        body: JSON.stringify({
          fullName: newUserFullName,
          email: newUserEmail,
          username: newUserUsername,
          password: newUserPassword,
          role: newUserRole,
          schoolId: newUserSchoolId || null,
          classId: newUserClassId || null,
        }),
      });
      setNewUserFullName('');
      setNewUserEmail('');
      setNewUserUsername('');
      setFeedback(`${newUserRole} account created successfully.`);
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create user.');
    }
  };

  const toggleUserActive = async (u: UserRow) => {
    try {
      await apiRequest(`/api/admin/users/${u.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: !u.isActive }),
      });
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user.');
    }
  };

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFeedback('');
    try {
      await apiRequest('/api/admin/classes', {
        method: 'POST',
        body: JSON.stringify({
          name: className,
          gradeLevel: classGrade,
          schoolId: classSchoolId,
        }),
      });
      setClassName('');
      setFeedback('Class created successfully.');
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create class.');
    }
  };

  const handleAssignTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFeedback('');
    try {
      await apiRequest('/api/admin/classes/assign-teacher', {
        method: 'POST',
        body: JSON.stringify({ classId: assignClassId, teacherId: assignTeacherId }),
      });
      setFeedback('Teacher assigned to class.');
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign teacher.');
    }
  };

  const toggleModule = async (id: string) => {
    try {
      await apiRequest(`/api/admin/modules/${id}/toggle`, { method: 'PATCH' });
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update module.');
    }
  };

  const saveSetting = async (key: string, value: string) => {
    try {
      await apiRequest('/api/admin/settings', {
        method: 'PUT',
        body: JSON.stringify({ key, value }),
      });
      setFeedback(`Setting "${key}" saved.`);
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update setting.');
    }
  };

  if (loading || !overview) {
    return <div className="h-64 rounded-xl bg-slate-200/70 dark:bg-slate-800 animate-pulse" />;
  }

  const teachers = users.filter((u) => u.role === 'TEACHER');

  return (
    <div className="space-y-6">
      {/* Segmented Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-1 rounded-lg bg-slate-200/70 p-1 dark:bg-slate-900">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'schools', label: 'Schools' },
            { id: 'users', label: 'Teachers & Pupils' },
            { id: 'classes', label: 'Classes' },
            { id: 'modules', label: 'Modules & Settings' },
            { id: 'audit', label: 'Audit Logs' },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id as typeof tab)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                tab === item.id
                  ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-300'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {feedback && (
        <div className="rounded-lg border border-teal-200 bg-teal-50 px-4 py-2.5 text-sm text-teal-900 dark:border-teal-900 dark:bg-teal-950/50 dark:text-teal-200">
          {feedback}
        </div>
      )}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200">
          {error}
        </div>
      )}

      {tab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Registered Schools', value: overview.stats.totalSchools, sub: `${overview.stats.activeSchools} active` },
              { label: 'Teachers', value: overview.stats.totalTeachers, sub: 'Assigned across classes' },
              { label: 'Pupils', value: overview.stats.totalPupils, sub: `${overview.stats.totalClasses} classes` },
              { label: 'Graded Assessments', value: overview.stats.totalResults, sub: `${overview.stats.totalModules} modules` },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
              >
                <p className="text-xs text-slate-500">{stat.label}</p>
                <p className="mt-2 font-mono text-2xl font-bold tabular-nums text-slate-900 dark:text-white">
                  {stat.value}
                </p>
                <p className="mt-1 text-xs text-slate-500">{stat.sub}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <section className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <h3 className="font-display text-base font-semibold text-slate-900 dark:text-white">
                Recent Platform Assessment Results
              </h3>
              {overview.recentResults.length === 0 ? (
                <p className="mt-4 text-sm text-slate-500">No assessment results recorded yet.</p>
              ) : (
                <div className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
                  {overview.recentResults.map((r) => (
                    <div key={r.id} className="py-2.5 flex justify-between text-xs">
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">{r.pupil.fullName}</p>
                        <p className="text-slate-500">
                          {r.pupil.school?.name || 'School'} · {r.attempt.exercise?.title || r.attempt.attemptType}
                        </p>
                      </div>
                      <span className="font-mono tabular-nums font-semibold">
                        {r.awardedMarks}/{r.totalMarks} ({r.percentage}%)
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <h3 className="font-display text-base font-semibold text-slate-900 dark:text-white">
                Recent Privileged &amp; System Activity
              </h3>
              <div className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
                {overview.recentAuditLogs.slice(0, 8).map((log) => (
                  <div key={log.id} className="py-2.5 text-xs flex justify-between gap-2">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">
                        {log.action} · {log.entity}
                      </p>
                      <p className="text-slate-500">{log.details}</p>
                    </div>
                    <span className="font-mono text-slate-400 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      )}

      {tab === 'schools' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form
            onSubmit={handleCreateSchool}
            className="lg:col-span-4 rounded-xl border border-slate-200 bg-white p-6 space-y-4 dark:border-slate-800 dark:bg-slate-900 self-start"
          >
            <h3 className="font-display text-base font-semibold flex items-center gap-2">
              <Building2 className="h-4 w-4 text-blue-700 dark:text-teal-400" />
              Register New School
            </h3>
            <input
              type="text"
              required
              value={schoolName}
              onChange={(e) => setSchoolName(e.target.value)}
              placeholder="School Name (e.g., Kitwe Boys Secondary)"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
            />
            <input
              type="text"
              required
              value={schoolCode}
              onChange={(e) => setSchoolCode(e.target.value)}
              placeholder="School Code (e.g., KBSS-03)"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                required
                value={schoolProvince}
                onChange={(e) => setSchoolProvince(e.target.value)}
                placeholder="Province"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
              />
              <input
                type="text"
                required
                value={schoolDistrict}
                onChange={(e) => setSchoolDistrict(e.target.value)}
                placeholder="District"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
              />
            </div>
            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[#0F2744] px-4 py-2 text-sm font-semibold text-white hover:bg-[#193B66] dark:bg-teal-600"
            >
              <Plus className="h-4 w-4" /> Register School
            </button>
          </form>

          <div className="lg:col-span-8 rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 overflow-x-auto">
            <h3 className="font-display text-base font-semibold mb-4">Registered Schools</h3>
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs text-slate-500 dark:border-slate-800">
                  <th className="py-2 pr-3">School</th>
                  <th className="py-2 pr-3">Code</th>
                  <th className="py-2 pr-3">Location</th>
                  <th className="py-2 pr-3 text-right">Users</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {schools.map((s) => (
                  <tr key={s.id}>
                    <td className="py-3 pr-3 font-medium">{s.name}</td>
                    <td className="py-3 pr-3 font-mono text-xs">{s.code}</td>
                    <td className="py-3 pr-3 text-xs text-slate-500">{s.district}, {s.province}</td>
                    <td className="py-3 pr-3 text-right font-mono tabular-nums">{s._count.users}</td>
                    <td className="py-3 pr-3 text-xs">{s.isActive ? 'Active' : 'Deactivated'}</td>
                    <td className="py-3 text-right">
                      <button
                        type="button"
                        onClick={() => toggleSchoolActive(s)}
                        className="text-xs font-medium text-blue-700 hover:underline dark:text-teal-400"
                      >
                        {s.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'users' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form
            onSubmit={handleCreateUser}
            className="lg:col-span-4 rounded-xl border border-slate-200 bg-white p-6 space-y-3 dark:border-slate-800 dark:bg-slate-900 self-start"
          >
            <h3 className="font-display text-base font-semibold flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-700 dark:text-teal-400" />
              Register Teacher or Pupil
            </h3>
            <input
              type="text"
              required
              value={newUserFullName}
              onChange={(e) => setNewUserFullName(e.target.value)}
              placeholder="Full Name"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
            />
            <input
              type="email"
              required
              value={newUserEmail}
              onChange={(e) => setNewUserEmail(e.target.value)}
              placeholder="Email Address"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
            />
            <input
              type="text"
              required
              value={newUserUsername}
              onChange={(e) => setNewUserUsername(e.target.value)}
              placeholder="Username"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
            />
            <input
              type="password"
              required
              value={newUserPassword}
              onChange={(e) => setNewUserPassword(e.target.value)}
              placeholder="Temporary Password"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
            />
            <select
              value={newUserRole}
              onChange={(e) => setNewUserRole(e.target.value as 'TEACHER' | 'PUPIL' | 'ADMIN')}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
            >
              <option value="PUPIL">Pupil</option>
              <option value="TEACHER">Teacher</option>
              <option value="ADMIN">Administrator</option>
            </select>
            <select
              value={newUserSchoolId}
              onChange={(e) => setNewUserSchoolId(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
            >
              {schools.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <select
              value={newUserClassId}
              onChange={(e) => setNewUserClassId(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
            >
              <option value="">Optional: Assign to Class</option>
              {classes
                .filter((c) => !newUserSchoolId || c.schoolId === newUserSchoolId)
                .map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
            </select>
            <button
              type="submit"
              className="w-full rounded-lg bg-[#0F2744] px-4 py-2 text-sm font-semibold text-white hover:bg-[#193B66] dark:bg-teal-600"
            >
              Create Account
            </button>
          </form>

          <div className="lg:col-span-8 rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 overflow-x-auto">
            <h3 className="font-display text-base font-semibold mb-4">Platform User Accounts</h3>
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs text-slate-500 dark:border-slate-800">
                  <th className="py-2 pr-3">Name</th>
                  <th className="py-2 pr-3">Role</th>
                  <th className="py-2 pr-3">School</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2 text-right">Access</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {users.map((u) => (
                  <tr key={u.id}>
                    <td className="py-2.5 pr-3">
                      <p className="font-medium">{u.fullName}</p>
                      <p className="text-xs text-slate-500">{u.email}</p>
                    </td>
                    <td className="py-2.5 pr-3 text-xs font-medium">{u.role}</td>
                    <td className="py-2.5 pr-3 text-xs text-slate-500">{u.school?.name || 'Global'}</td>
                    <td className="py-2.5 pr-3 text-xs">{u.isActive ? 'Active' : 'Suspended'}</td>
                    <td className="py-2.5 text-right">
                      <button
                        type="button"
                        onClick={() => toggleUserActive(u)}
                        className="text-xs font-medium text-blue-700 hover:underline dark:text-teal-400"
                      >
                        {u.isActive ? 'Suspend' : 'Restore'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'classes' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 space-y-6">
            <form
              onSubmit={handleCreateClass}
              className="rounded-xl border border-slate-200 bg-white p-6 space-y-3 dark:border-slate-800 dark:bg-slate-900"
            >
              <h3 className="font-display text-base font-semibold">Create Class</h3>
              <input
                type="text"
                required
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                placeholder="Class Name (e.g., Grade 8B ICT)"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
              />
              <input
                type="text"
                required
                value={classGrade}
                onChange={(e) => setClassGrade(e.target.value)}
                placeholder="Grade Level"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
              />
              <select
                value={classSchoolId}
                onChange={(e) => setClassSchoolId(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
              >
                {schools.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              <button
                type="submit"
                className="w-full rounded-lg bg-[#0F2744] px-4 py-2 text-sm font-semibold text-white dark:bg-teal-600"
              >
                Create Class
              </button>
            </form>

            <form
              onSubmit={handleAssignTeacher}
              className="rounded-xl border border-slate-200 bg-white p-6 space-y-3 dark:border-slate-800 dark:bg-slate-900"
            >
              <h3 className="font-display text-base font-semibold">Assign Teacher to Class</h3>
              <select
                value={assignClassId}
                onChange={(e) => setAssignClassId(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>{c.name} ({c.school.code})</option>
                ))}
              </select>
              <select
                value={assignTeacherId}
                onChange={(e) => setAssignTeacherId(e.target.value)}
                required
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
              >
                <option value="">Select Teacher...</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>{t.fullName} ({t.school?.code})</option>
                ))}
              </select>
              <button
                type="submit"
                className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 dark:border-slate-700 dark:text-white dark:hover:bg-slate-800"
              >
                Assign Teacher
              </button>
            </form>
          </div>

          <div className="lg:col-span-8 rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 overflow-x-auto">
            <h3 className="font-display text-base font-semibold mb-4">Active Classes</h3>
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs text-slate-500 dark:border-slate-800">
                  <th className="py-2 pr-3">Class</th>
                  <th className="py-2 pr-3">School</th>
                  <th className="py-2 pr-3">Teachers</th>
                  <th className="py-2 text-right">Pupils</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {classes.map((c) => (
                  <tr key={c.id}>
                    <td className="py-3 pr-3 font-medium">
                      {c.name} · <span className="text-xs text-slate-500">{c.gradeLevel}</span>
                    </td>
                    <td className="py-3 pr-3 text-xs text-slate-500">{c.school.name}</td>
                    <td className="py-3 pr-3 text-xs">
                      {c.teacherAssignments.map((ta) => ta.teacher.fullName).join(', ') || 'Unassigned'}
                    </td>
                    <td className="py-3 text-right font-mono tabular-nums">{c._count.memberships}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'modules' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <h3 className="font-display text-base font-semibold mb-4">Curriculum Modules</h3>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {modules.map((m) => (
                <div key={m.id} className="py-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">
                      Module {m.number}: {m.title}
                    </p>
                    <p className="text-xs text-slate-500">{m.category}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleModule(m.id)}
                    className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-medium hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                  >
                    {m.isPublished ? 'Published (Hide)' : 'Hidden (Publish)'}
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <h3 className="font-display text-base font-semibold mb-4 flex items-center gap-2">
              <Settings className="h-4 w-4 text-blue-700 dark:text-teal-400" />
              System Configuration
            </h3>
            <div className="space-y-4">
              {settings.map((s) => (
                <div key={s.key} className="border-b border-slate-100 pb-3 dark:border-slate-800">
                  <p className="text-xs font-mono font-semibold text-slate-700 dark:text-slate-300">
                    {s.key}
                  </p>
                  <p className="text-xs text-slate-500 mb-2">{s.description}</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      defaultValue={s.value}
                      onBlur={(e) => {
                        if (e.target.value !== s.value) saveSetting(s.key, e.target.value);
                      }}
                      className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-950"
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {tab === 'audit' && (
        <section className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 overflow-x-auto">
          <h3 className="font-display text-base font-semibold mb-4 flex items-center gap-2">
            <Shield className="h-4 w-4 text-blue-700 dark:text-teal-400" />
            Security &amp; Administration Audit Logs
          </h3>
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 dark:border-slate-800">
                <th className="py-2 pr-3">Timestamp</th>
                <th className="py-2 pr-3">Actor</th>
                <th className="py-2 pr-3">Action</th>
                <th className="py-2 pr-3">Entity</th>
                <th className="py-2">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {overview.recentAuditLogs.map((log) => (
                <tr key={log.id}>
                  <td className="py-2.5 pr-3 font-mono tabular-nums text-slate-500">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="py-2.5 pr-3">
                    {log.user ? `${log.user.fullName} (${log.user.role})` : 'System'}
                  </td>
                  <td className="py-2.5 pr-3 font-mono font-semibold">{log.action}</td>
                  <td className="py-2.5 pr-3">{log.entity}</td>
                  <td className="py-2.5 text-slate-600 dark:text-slate-300">{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
};
