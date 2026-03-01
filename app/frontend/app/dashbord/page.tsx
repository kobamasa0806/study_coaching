"use client";

import { createSheet } from "@/lib/api";

export default function DashboardPage() {

  const handleCreateSheet = async () => {
    const data = await createSheet("test_user");
    window.open(data.spreadsheet_url, "_blank");
  };

  return (
    <div>
      <button onClick={handleCreateSheet}>
        進捗シートを作成
      </button>
    </div>
  );
}