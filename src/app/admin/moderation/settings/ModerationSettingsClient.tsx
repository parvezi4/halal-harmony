'use client';

import { useEffect, useState } from 'react';
import type { ModeratorCapabilityState } from '@/lib/admin/capabilities';
import { updateModeratorPermissionConfig } from '@/app/actions/admin/permissions';
import {
  createPrivilegedUser,
  deletePrivilegedUser,
  getPrivilegedUsers,
  type PrivilegedUserRow,
} from '@/app/actions/admin/privileged-users';

interface ModerationSettingsClientProps {
  initialPermissions: ModeratorCapabilityState & { updatedAt: string };
}

export default function ModerationSettingsClient({
  initialPermissions,
}: ModerationSettingsClientProps) {
  // In MVP, these are hardcoded. In future, they would be persisted to database.
  const [moderationType, setModerationType] = useState<'PATTERN' | 'AI_NLP'>('PATTERN');
  const [workflow, setWorkflow] = useState<'PRE_MODERATION' | 'POST_MODERATION'>('PRE_MODERATION');
  const [permissions, setPermissions] = useState<ModeratorCapabilityState>({
    canModerateMessages: initialPermissions.canModerateMessages,
    canVerifyProfiles: initialPermissions.canVerifyProfiles,
    canVerifyPhotos: initialPermissions.canVerifyPhotos,
    canManageMembers: initialPermissions.canManageMembers,
    canInspectSubscriptions: initialPermissions.canInspectSubscriptions,
    canManageReports: initialPermissions.canManageReports,
    canUpdateRiskLabels: initialPermissions.canUpdateRiskLabels,
  });
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string>(initialPermissions.updatedAt);
  const [permSaveStatus, setPermSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [privilegedUsers, setPrivilegedUsers] = useState<PrivilegedUserRow[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<'ADMIN' | 'MODERATOR'>('MODERATOR');

  const loadPrivilegedUsers = async () => {
    setLoadingUsers(true);
    const result = await getPrivilegedUsers();
    if (result.success && result.data) {
      setPrivilegedUsers(result.data);
    }
    setLoadingUsers(false);
  };

  useEffect(() => {
    void loadPrivilegedUsers();
  }, []);

  const togglePermission = async (key: keyof ModeratorCapabilityState) => {
    const newPermissions = { ...permissions, [key]: !permissions[key] };
    setPermissions(newPermissions);
    setPermSaveStatus('saving');

    const result = await updateModeratorPermissionConfig(newPermissions);

    if (!result.success || !result.data) {
      setPermissions(permissions);
      setPermSaveStatus('error');
      window.setTimeout(() => setPermSaveStatus('idle'), 3000);
      return;
    }

    setPermissions({
      canModerateMessages: result.data.canModerateMessages,
      canVerifyProfiles: result.data.canVerifyProfiles,
      canVerifyPhotos: result.data.canVerifyPhotos,
      canManageMembers: result.data.canManageMembers,
      canInspectSubscriptions: result.data.canInspectSubscriptions,
      canManageReports: result.data.canManageReports,
      canUpdateRiskLabels: result.data.canUpdateRiskLabels,
    });
    setLastUpdatedAt(result.data.updatedAt);
    setPermSaveStatus('saved');
    window.setTimeout(() => setPermSaveStatus('idle'), 2000);
  };

  const formattedLastUpdated =
    lastUpdatedAt === new Date(0).toISOString()
      ? 'No persisted configuration yet'
      : new Date(lastUpdatedAt).toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });

  const handleCreatePrivilegedUser = async () => {
    const result = await createPrivilegedUser(newUserEmail.trim(), newUserPassword, newUserRole);

    if (!result.success) {
      window.alert(result.errors?.general || 'Failed to create account');
      return;
    }

    setNewUserEmail('');
    setNewUserPassword('');
    setNewUserRole('MODERATOR');
    window.alert(result.message || 'Account created');
    await loadPrivilegedUsers();
  };

  const handleDeletePrivilegedUser = async (userId: string, email: string) => {
    if (!window.confirm(`Delete privileged user ${email}?`)) {
      return;
    }

    const result = await deletePrivilegedUser(userId);
    if (!result.success) {
      window.alert(result.errors?.general || 'Failed to delete account');
      return;
    }

    window.alert(result.message || 'Account deleted');
    await loadPrivilegedUsers();
  };

  return (
    <div className="space-y-6">
      <header className="border-b border-slate-800 pb-4">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-50">Moderation Settings</h1>
        <p className="mt-1 text-sm text-slate-400">
          Configure content moderation behavior for the platform
        </p>
      </header>

      <div className="rounded-xl border border-amber-400/40 bg-amber-500/10 p-4 text-xs text-amber-100">
        <p className="font-semibold">⚠️ MVP Notice</p>
        <p className="mt-1">
          Message moderation type/workflow options below are still preview-only in this MVP.
          Moderator capability toggles are persisted to database. Core moderation behavior is still
          hardcoded in{' '}
          <code className="rounded bg-slate-950 px-1">src/lib/moderation/contentFilter.ts</code>.
        </p>
      </div>

      <section className="rounded-xl border border-slate-800 bg-slate-900/70 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-50">Privileged Users</h2>
            <p className="mt-1 text-xs text-slate-400">
              Superadmin/admin can create moderators. Only superadmin can create additional admins.
              Superadmin account is protected and cannot be deleted.
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-3 rounded-lg border border-slate-700 bg-slate-950/60 p-4 sm:grid-cols-4">
          <input
            type="email"
            value={newUserEmail}
            onChange={(e) => setNewUserEmail(e.target.value)}
            placeholder="new-user@example.com"
            className="rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 sm:col-span-2"
          />
          <input
            type="password"
            value={newUserPassword}
            onChange={(e) => setNewUserPassword(e.target.value)}
            placeholder="Temporary password"
            className="rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
          />
          <select
            value={newUserRole}
            onChange={(e) => setNewUserRole(e.target.value as 'ADMIN' | 'MODERATOR')}
            className="rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
          >
            <option value="MODERATOR">MODERATOR</option>
            <option value="ADMIN">ADMIN</option>
          </select>
        </div>

        <div className="mt-3 flex justify-end">
          <button
            onClick={handleCreatePrivilegedUser}
            className="rounded-full bg-slate-100 px-5 py-2 text-sm font-semibold text-slate-900 hover:bg-white"
          >
            Create Privileged User
          </button>
        </div>

        <div className="mt-4 overflow-x-auto rounded-lg border border-slate-800">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-800 bg-slate-900/70">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-semibold text-slate-300">Email</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-slate-300">Role</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-slate-300">Created</th>
                <th className="px-3 py-2 text-right text-xs font-semibold text-slate-300">Action</th>
              </tr>
            </thead>
            <tbody>
              {loadingUsers ? (
                <tr>
                  <td className="px-3 py-3 text-slate-400" colSpan={4}>
                    Loading users...
                  </td>
                </tr>
              ) : privilegedUsers.length === 0 ? (
                <tr>
                  <td className="px-3 py-3 text-slate-400" colSpan={4}>
                    No privileged users found.
                  </td>
                </tr>
              ) : (
                privilegedUsers.map((user) => (
                  <tr key={user.id} className="border-b border-slate-800/70">
                    <td className="px-3 py-2 text-slate-200">{user.email}</td>
                    <td className="px-3 py-2 text-slate-300">{user.role}</td>
                    <td className="px-3 py-2 text-slate-400">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {user.role === 'SUPERADMIN' ? (
                        <span className="text-xs text-amber-300">Protected</span>
                      ) : (
                        <button
                          onClick={() => handleDeletePrivilegedUser(user.id, user.email)}
                          className="rounded border border-red-600 px-2 py-1 text-xs text-red-300 hover:bg-red-950/40"
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-900/70 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-50">Moderator Permissions</h2>
            <p className="mt-1 text-xs text-slate-400">
              Configure what moderator accounts can access without admin intervention.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {permSaveStatus === 'saving' && (
              <span className="text-xs text-slate-400">Saving...</span>
            )}
            {permSaveStatus === 'saved' && (
              <span className="text-xs text-green-400">Saved</span>
            )}
            {permSaveStatus === 'error' && (
              <span className="text-xs text-red-400">Failed to save</span>
            )}
            <p className="text-xs text-slate-500">Last updated: {formattedLastUpdated}</p>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-950/60 px-4 py-3 text-sm text-slate-200">
            <span>Message moderation queue</span>
            <input
              type="checkbox"
              checked={permissions.canModerateMessages}
              disabled={permSaveStatus === 'saving'}
              onChange={() => void togglePermission('canModerateMessages')}
            />
          </label>
          <label className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-950/60 px-4 py-3 text-sm text-slate-200">
            <span>Profile verification queue</span>
            <input
              type="checkbox"
              checked={permissions.canVerifyProfiles}
              disabled={permSaveStatus === 'saving'}
              onChange={() => void togglePermission('canVerifyProfiles')}
            />
          </label>
          <label className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-950/60 px-4 py-3 text-sm text-slate-200">
            <span>Photo verification queue</span>
            <input
              type="checkbox"
              checked={permissions.canVerifyPhotos}
              disabled={permSaveStatus === 'saving'}
              onChange={() => void togglePermission('canVerifyPhotos')}
            />
          </label>
          <label className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-950/60 px-4 py-3 text-sm text-slate-200">
            <span>Members management</span>
            <input
              type="checkbox"
              checked={permissions.canManageMembers}
              disabled={permSaveStatus === 'saving'}
              onChange={() => void togglePermission('canManageMembers')}
            />
          </label>
          <label className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-950/60 px-4 py-3 text-sm text-slate-200">
            <span>Subscription inspection (view-only)</span>
            <input
              type="checkbox"
              checked={permissions.canInspectSubscriptions}
              disabled={permSaveStatus === 'saving'}
              onChange={() => void togglePermission('canInspectSubscriptions')}
            />
          </label>
          <label className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-950/60 px-4 py-3 text-sm text-slate-200">
            <span>Reports management queue</span>
            <input
              type="checkbox"
              checked={permissions.canManageReports}
              disabled={permSaveStatus === 'saving'}
              onChange={() => void togglePermission('canManageReports')}
            />
          </label>
          <label className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-950/60 px-4 py-3 text-sm text-slate-200">
            <span>Risk labels and trust notes</span>
            <input
              type="checkbox"
              checked={permissions.canUpdateRiskLabels}
              disabled={permSaveStatus === 'saving'}
              onChange={() => void togglePermission('canUpdateRiskLabels')}
            />
          </label>
        </div>
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-900/70 p-6">
        <h2 className="text-lg font-semibold text-slate-50">Moderation Type</h2>
        <p className="mt-1 text-xs text-slate-400">
          Choose the content filtering approach for message moderation
        </p>

        <div className="mt-4 space-y-3">
          <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-700 bg-slate-950/60 p-4 hover:border-accent-500">
            <input
              type="radio"
              name="moderationType"
              value="PATTERN"
              checked={moderationType === 'PATTERN'}
              onChange={(e) => setModerationType(e.target.value as 'PATTERN')}
              className="mt-1"
            />
            <div>
              <p className="font-semibold text-slate-200">Pattern Matching</p>
              <p className="mt-1 text-xs text-slate-400">
                Uses predefined patterns and keywords to detect profanity, sexual content, contact
                info sharing, and other violations. Fast and reliable but may have false positives.
              </p>
              <span className="mt-2 inline-block rounded-full bg-green-500/20 px-2 py-0.5 text-[10px] text-green-400">
                ACTIVE (MVP)
              </span>
            </div>
          </label>

          <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-700 bg-slate-950/60 p-4 hover:border-accent-500">
            <input
              type="radio"
              name="moderationType"
              value="AI_NLP"
              checked={moderationType === 'AI_NLP'}
              onChange={(e) => setModerationType(e.target.value as 'AI_NLP')}
              className="mt-1"
            />
            <div>
              <p className="font-semibold text-slate-200">AI/NLP Analysis</p>
              <p className="mt-1 text-xs text-slate-400">
                Uses machine learning and natural language processing to understand context and
                intent. More accurate but requires external API integration.
              </p>
              <span className="mt-2 inline-block rounded-full bg-slate-500/20 px-2 py-0.5 text-[10px] text-slate-400">
                INTERFACE READY (Not Implemented)
              </span>
            </div>
          </label>
        </div>
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-900/70 p-6">
        <h2 className="text-lg font-semibold text-slate-50">Moderation Workflow</h2>
        <p className="mt-1 text-xs text-slate-400">
          Determine when messages are reviewed by moderators
        </p>

        <div className="mt-4 space-y-3">
          <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-700 bg-slate-950/60 p-4 hover:border-accent-500">
            <input
              type="radio"
              name="workflow"
              value="PRE_MODERATION"
              checked={workflow === 'PRE_MODERATION'}
              onChange={(e) => setWorkflow(e.target.value as 'PRE_MODERATION')}
              className="mt-1"
            />
            <div>
              <p className="font-semibold text-slate-200">Pre-Moderation</p>
              <p className="mt-1 text-xs text-slate-400">
                Flagged messages are held in queue for admin review before delivery. Safer but may
                delay communication. Clean messages are delivered immediately.
              </p>
              <span className="mt-2 inline-block rounded-full bg-green-500/20 px-2 py-0.5 text-[10px] text-green-400">
                ACTIVE (MVP)
              </span>
            </div>
          </label>

          <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-700 bg-slate-950/60 p-4 hover:border-accent-500">
            <input
              type="radio"
              name="workflow"
              value="POST_MODERATION"
              checked={workflow === 'POST_MODERATION'}
              onChange={(e) => setWorkflow(e.target.value as 'POST_MODERATION')}
              className="mt-1"
            />
            <div>
              <p className="font-semibold text-slate-200">Post-Moderation</p>
              <p className="mt-1 text-xs text-slate-400">
                All messages are delivered immediately, flagged messages are reviewed after the
                fact. Faster user experience but potential for brief exposure to violations.
              </p>
              <span className="mt-2 inline-block rounded-full bg-slate-500/20 px-2 py-0.5 text-[10px] text-slate-400">
                INTERFACE READY (Not Active)
              </span>
            </div>
          </label>
        </div>
      </section>


    </div>
  );
}
