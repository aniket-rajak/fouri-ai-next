"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { toast } from "sonner";
import { Loader2, Shield, User as UserIcon } from "lucide-react";

interface AdminUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
  createdAt: string;
  _count: { uploads: number; testAttempts: number };
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = () => {
    api
      .get("/admin/users")
      .then((res) => setUsers(res.data.users))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchUsers(); }, []);

  const toggleRole = async (user: AdminUser) => {
    const newRole = user.role === "ADMIN" ? "USER" : "ADMIN";
    try {
      await api.patch(`/admin/users/${user.id}/role`, { role: newRole });
      toast.success(`Role updated to ${newRole}`);
      fetchUsers();
    } catch {
      toast.error("Failed to update role");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-zinc-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-zinc-900">Users</h1>
      <div className="space-y-3">
        {users.map((user) => (
          <Card key={user.id}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-zinc-100">
                  {user.role === "ADMIN" ? (
                    <Shield size={18} className="text-amber-600" />
                  ) : (
                    <UserIcon size={18} className="text-zinc-600" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-zinc-900">
                    {user.name || "Unnamed"}
                  </p>
                  <p className="text-sm text-zinc-500">{user.email}</p>
                  <p className="text-xs text-zinc-400">
                    {user._count.uploads} uploads · {user._count.testAttempts} attempts
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    user.role === "ADMIN"
                      ? "bg-amber-100 text-amber-700"
                      : "bg-zinc-100 text-zinc-600"
                  }`}
                >
                  {user.role}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => toggleRole(user)}
                >
                  {user.role === "ADMIN" ? "Remove Admin" : "Make Admin"}
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
