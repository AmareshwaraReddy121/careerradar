import { useState } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ROLES, USER_STATUSES, type UserDTO } from '@careerradar/shared';
import { api, errorMessage } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { formatDateTime } from '@/lib/utils';
import { Alert, Badge, Button, Card, CardHeader, Input, Select, Spinner } from '@/components/ui';

interface UserList {
  data: UserDTO[];
  page: number;
  limit: number;
  total: number;
}

export function AdminUsersPage() {
  const { user: me } = useAuth();
  const qc = useQueryClient();
  const [q, setQ] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', search, page],
    queryFn: () =>
      api<UserList>(
        `/admin/users?page=${page}&limit=20${search ? `&q=${encodeURIComponent(search)}` : ''}`,
      ),
    placeholderData: keepPreviousData,
  });

  const update = useMutation({
    mutationFn: ({ id, ...body }: { id: string; role?: string; status?: string }) =>
      api(`/admin/users/${id}`, { method: 'PATCH', body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-users'] }),
    onError: (err) => setError(errorMessage(err)),
  });

  const pages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Admin · Users</h1>
        <p className="text-sm text-slate-500">
          Manage roles and account status. Changes are audit-logged.
        </p>
      </div>
      {error && <Alert tone="error">{error}</Alert>}
      <Card>
        <CardHeader
          title={`Users${data ? ` (${data.total})` : ''}`}
          action={
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                setPage(1);
                setSearch(q.trim());
              }}
            >
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search email"
                className="h-8 w-48"
                aria-label="Search users by email"
              />
              <Button size="sm" type="submit" variant="secondary">
                Search
              </Button>
            </form>
          }
        />
        {isLoading ? (
          <div className="p-8">
            <Spinner className="mx-auto" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-800/50">
                <tr>
                  <th className="px-5 py-3 font-medium">Email</th>
                  <th className="px-5 py-3 font-medium">Verified</th>
                  <th className="px-5 py-3 font-medium">Role</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {data?.data.map((u) => {
                  const self = u.id === me?.id;
                  return (
                    <tr key={u.id}>
                      <td className="px-5 py-3 font-medium">
                        {u.email}
                        {self && <Badge className="ml-2">You</Badge>}
                      </td>
                      <td className="px-5 py-3">
                        {u.emailVerified ? (
                          <Badge tone="green">Yes</Badge>
                        ) : (
                          <Badge tone="yellow">No</Badge>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <Select
                          className="h-8 w-36"
                          value={u.role}
                          disabled={self}
                          aria-label={`Role for ${u.email}`}
                          onChange={(e) => update.mutate({ id: u.id, role: e.target.value })}
                        >
                          {ROLES.map((r) => (
                            <option key={r} value={r}>
                              {r}
                            </option>
                          ))}
                        </Select>
                      </td>
                      <td className="px-5 py-3">
                        <Select
                          className="h-8 w-36"
                          value={u.status}
                          disabled={self}
                          aria-label={`Status for ${u.email}`}
                          onChange={(e) => update.mutate({ id: u.id, status: e.target.value })}
                        >
                          {USER_STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </Select>
                      </td>
                      <td className="px-5 py-3 text-slate-500">{formatDateTime(u.createdAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <div className="flex items-center justify-between border-t border-slate-200 px-5 py-3 text-sm dark:border-slate-800">
          <span className="text-slate-500">
            Page {page} of {pages}
          </span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <Button
              size="sm"
              variant="secondary"
              disabled={page >= pages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
