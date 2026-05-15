// =============================================================
//
// ██╗  ██╗███████╗██╗  ██╗██╗ █████╗
// ██║  ██║██╔════╝██║ ██╔╝██║██╔══██╗
// ███████║█████╗  █████╔╝ ██║███████║
// ██╔══██║██╔══╝  ██╔═██╗ ██║██╔══██║
// ██║  ██║███████╗██║  ██╗██║██║  ██║
// ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚═╝╚═╝  ╚═╝
//
// File        : index.tsx
// Project     : Arteka_Label_Vision_Front
// Author      : Nicolas Dumetz
//
// Created     : Friday May 15 2026
//
// =============================================================

import { useCallback, useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { Users } from "~/api";
import { ConfirmModal } from "~/components/ConfirmModal";
import { SearchInput } from "~/components/SearchInput";
import { getApiErrorMessage } from "~/helpers/api";
import { useListQueryParams } from "~/hooks/useListQueryParams";
import type { User, UserRole } from "~/types/models";

type UserFilters = {
  role: UserRole | "";
  is_active: boolean | "";
};

const USER_ROLES: UserRole[] = ["user", "admin"];

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  const {
    search,
    filters,
    cursor,
    backendParams,
    setSearch,
    setFilter,
    setCursor,
  } = useListQueryParams<UserFilters>({
    searchMode: "contains",
    initialFilters: {
      role: "",
      is_active: "",
    },
    limit: 50,
  });

  const [userModal, setUserModal] = useState<{ isOpen: boolean; user: User | null }>({
    isOpen: false,
    user: null,
  });
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; user: User | null }>({
    isOpen: false,
    user: null,
  });
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    role: "user" as UserRole,
    is_active: true,
  });

  useEffect(() => {
    let isActive = true;
    const requestId = requestIdRef.current + 1;
    const isNextPage = Boolean(cursor);
    requestIdRef.current = requestId;

    async function fetchUsers() {
      if (isNextPage) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
        setErrorMessage(null);
      }

      try {
        const response = await Users.list(backendParams);

        if (!isActive || requestIdRef.current !== requestId) return;

        setUsers((currentUsers) => {
          return isNextPage ? [...currentUsers, ...response.data.data] : response.data.data;
        });
        setNextCursor(response.data.pagination.next_cursor);
        setHasMore(response.data.pagination.has_more);
      } catch (error) {
        if (!isActive || requestIdRef.current !== requestId) return;

        if (!isNextPage) {
          setUsers([]);
        }
        setErrorMessage(getApiErrorMessage(error, "Unable to load users."));
      } finally {
        if (!isActive || requestIdRef.current !== requestId) return;

        if (isNextPage) {
          setIsLoadingMore(false);
        } else {
          setIsLoading(false);
        }
      }
    }

    fetchUsers();

    return () => {
      isActive = false;
    };
  }, [backendParams, cursor]);

  const loadMoreUsers = useCallback(() => {
    if (isLoading || isLoadingMore || !hasMore || !nextCursor) return;
    setCursor(nextCursor);
  }, [hasMore, isLoading, isLoadingMore, nextCursor, setCursor]);

  const openEditModal = (user: User) => {
    setFormData({
      username: user.username,
      email: user.email,
      role: user.role,
      is_active: user.is_active ?? false,
    });
    setUserModal({ isOpen: true, user });
  };

  const handleSaveUser = async (event: FormEvent) => {
    event.preventDefault();
    if (!userModal.user) return;

    setIsSaving(true);
    setErrorMessage(null);

    try {
      const response = await Users.update(userModal.user.id, formData);
      setUsers((currentUsers) => {
        return currentUsers.map((user) => (user.id === response.data.id ? response.data : user));
      });
      setUserModal({ isOpen: false, user: null });
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, "Unable to update user."));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteModal.user) return;

    setIsDeleting(true);
    setErrorMessage(null);

    try {
      await Users.delete(deleteModal.user.id);
      setUsers((currentUsers) => currentUsers.filter((user) => user.id !== deleteModal.user?.id));
      setDeleteModal({ isOpen: false, user: null });
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, "Unable to delete user."));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-10 flex items-end justify-between border-b border-white/5 pb-6">
        <div>
          <h1 className="text-3xl font-manrope-extrabold tracking-tight text-white">Identity & Access</h1>
          <p className="mt-2 text-sm font-manrope-medium text-white/50">Manage system users, roles, and platform access.</p>
        </div>
        <button
          type="button"
          disabled
          title="No admin user creation service is exposed yet."
          className="flex items-center gap-2 rounded-xl bg-white/10 px-5 py-2.5 text-xs font-manrope-extrabold uppercase tracking-widest text-white/35"
        >
          + Add User
        </button>
      </div>

      <div className="mb-6 grid gap-4 rounded-2xl border border-white/10 bg-white/[0.02] p-4 backdrop-blur-md md:grid-cols-[minmax(0,1fr)_180px_180px]">
        <SearchInput value={search} onChange={setSearch} placeholder="Search by username or email" />

        <select
          value={filters.role}
          onChange={(event) => setFilter("role", event.target.value as UserFilters["role"])}
          className="h-12 rounded-xl border border-white/10 bg-[#111116] px-4 text-sm font-manrope-medium text-white outline-none focus:border-primary-400/60"
        >
          <option value="">All roles</option>
          {USER_ROLES.map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </select>

        <select
          value={filters.is_active === "" ? "" : String(filters.is_active)}
          onChange={(event) => {
            const value = event.target.value;
            setFilter("is_active", value === "" ? "" : value === "true");
          }}
          className="h-12 rounded-xl border border-white/10 bg-[#111116] px-4 text-sm font-manrope-medium text-white outline-none focus:border-primary-400/60"
        >
          <option value="">All statuses</option>
          <option value="true">Active</option>
          <option value="false">Suspended</option>
        </select>
      </div>

      {errorMessage && (
        <div className="mb-6 rounded-xl border border-error/20 bg-error/10 px-4 py-3 text-sm font-manrope-medium text-error">
          {errorMessage}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-md">
        <table className="w-full text-left text-sm text-white/70">
          <thead className="border-b border-white/10 bg-black/40 text-[10px] font-mono uppercase tracking-widest text-white/50">
            <tr>
              <th className="px-6 py-4">User</th>
              <th className="px-6 py-4">Role</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Joined</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-6 py-16 text-center text-xs font-mono uppercase tracking-widest text-white/40">
                  Loading users...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-16 text-center text-xs font-mono uppercase tracking-widest text-white/40">
                  No users found.
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="transition-colors hover:bg-white/5">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 font-manrope-extrabold text-xs text-white">
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-manrope-extrabold text-white">{user.username}</div>
                        <div className="text-xs text-white/40">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`rounded border px-2 py-1 text-[9px] font-mono uppercase tracking-widest ${user.role === "admin" ? "border-error/30 bg-error/10 text-error" : "border-white/10 bg-white/5 text-white/70"}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className={`h-1.5 w-1.5 rounded-full ${user.is_active ? "bg-secondary-400 shadow-[0_0_5px_rgba(0,204,142,0.8)]" : "bg-white/20"}`} />
                      <span className="text-[10px] font-mono uppercase tracking-widest text-white/60">
                        {user.is_active ? "Active" : "Suspended"}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs font-mono text-white/40">
                    {user.created_at ? new Date(user.created_at).toLocaleDateString() : "N/A"}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => openEditModal(user)} className="mr-3 text-[10px] font-manrope-extrabold uppercase tracking-widest text-primary-400 hover:text-primary-300">
                      Edit
                    </button>
                    <button onClick={() => setDeleteModal({ isOpen: true, user })} className="text-[10px] font-manrope-extrabold uppercase tracking-widest text-error/70 hover:text-error">
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {hasMore && (
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={loadMoreUsers}
            disabled={isLoadingMore}
            className="rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-xs font-manrope-extrabold uppercase tracking-widest text-white/70 transition-colors hover:bg-white/10 disabled:opacity-50"
          >
            {isLoadingMore ? "Loading..." : "Load more"}
          </button>
        </div>
      )}

      {userModal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-md">
          <div className="w-full max-w-md rounded-3xl border border-white/15 bg-[#161620] p-8 shadow-2xl">
            <h3 className="mb-6 text-xl font-manrope-extrabold text-white">Edit User</h3>
            <form onSubmit={handleSaveUser} className="flex flex-col gap-4">
              <div>
                <label className="mb-2 block text-[10px] font-mono font-bold uppercase tracking-widest text-white/60">Username</label>
                <input required type="text" value={formData.username} onChange={(event) => setFormData({ ...formData, username: event.target.value })} className="w-full rounded-xl border border-white/10 bg-[#0a0a0f] px-4 py-2.5 text-sm text-white" />
              </div>
              <div>
                <label className="mb-2 block text-[10px] font-mono font-bold uppercase tracking-widest text-white/60">Email</label>
                <input required type="email" value={formData.email} onChange={(event) => setFormData({ ...formData, email: event.target.value })} className="w-full rounded-xl border border-white/10 bg-[#0a0a0f] px-4 py-2.5 text-sm text-white" />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="mb-2 block text-[10px] font-mono font-bold uppercase tracking-widest text-white/60">Role</label>
                  <select value={formData.role} onChange={(event) => setFormData({ ...formData, role: event.target.value as UserRole })} className="w-full rounded-xl border border-white/10 bg-[#0a0a0f] px-4 py-3 text-sm text-white">
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="mb-2 block text-[10px] font-mono font-bold uppercase tracking-widest text-white/60">Status</label>
                  <select value={formData.is_active ? "true" : "false"} onChange={(event) => setFormData({ ...formData, is_active: event.target.value === "true" })} className="w-full rounded-xl border border-white/10 bg-[#0a0a0f] px-4 py-3 text-sm text-white">
                    <option value="true">Active</option>
                    <option value="false">Suspended</option>
                  </select>
                </div>
              </div>
              <div className="mt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setUserModal({ isOpen: false, user: null })} disabled={isSaving} className="rounded-xl px-5 py-2 text-xs font-manrope-extrabold uppercase tracking-widest text-white/50 disabled:opacity-50">
                  Cancel
                </button>
                <button type="submit" disabled={isSaving} className="rounded-xl bg-white px-5 py-2 text-xs font-manrope-extrabold uppercase tracking-widest text-background disabled:opacity-50">
                  {isSaving ? "Saving..." : "Save User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={deleteModal.isOpen}
        type="delete"
        title="Revoke User Access"
        message={`Are you sure you want to permanently delete user "${deleteModal.user?.username}"?`}
        onClose={() => setDeleteModal({ isOpen: false, user: null })}
        onConfirm={handleDeleteUser}
        isLoading={isDeleting}
      />
    </div>
  );
}
