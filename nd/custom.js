export const getData = async ({ global: { db }, set }) => {
  await set(await db.get("users"), "users")
  await set(await db.get("moods"), "moods")
  await set(await db.get("challenges"), "challenges")
}
