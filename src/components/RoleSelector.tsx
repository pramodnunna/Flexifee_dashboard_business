'use client'

import { useRouter } from "next/navigation";

export default function RoleSelector({ currentRole }: { currentRole: string }) {
  const router = useRouter();

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRole = e.target.value;
    document.cookie = `role=${newRole}; path=/; max-age=31536000; SameSite=Lax`;
    router.refresh();
  };

  return (
    <select 
      className="btn btn-secondary" 
      style={{ padding: "0.25rem 0.5rem" }} 
      value={currentRole} 
      onChange={handleRoleChange}
    >
      <option value="admin">Admin Role</option>
      <option value="ops">Ops Role</option>
    </select>
  );
}
