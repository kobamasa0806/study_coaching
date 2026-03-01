export async function createSheet(userId: string) {
  const res = await fetch("http://localhost:8000/api/sheets/create", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ user_id: userId }),
  });

  return res.json();
}