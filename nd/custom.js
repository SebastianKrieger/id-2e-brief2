export const getData = async ({ global: { db }, set }) => {
  const date = Date.now() - 1000 * 60 * 60 * 24 * 60
  await set(await db.get("users"), "users")
  await set(await db.get("moods", ["date", ">=", date]), "moods")
  await set(await db.get("challenges", ["date", ">=", date]), "challenges")
}
