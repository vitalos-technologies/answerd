import { expect, test } from "@playwright/test"
import { app, start, watchErrors } from "./helpers"

type Run = { scriptId: string; done: boolean; callId?: string; bookingId?: string; threadId?: string }
type St = { runs: Run[]; bookings: { id: string; startAt: string; customerName: string; createdBy: string; status: string; serviceId: string }[]; services: { id: string; name: string }[]; calls: { id: string; outcome: string; transcript?: { text: string }[] }[] }
const read = (page: import("@playwright/test").Page) => page.evaluate(() => JSON.parse(localStorage.getItem("answerd-demo-v1") ?? "{}").state as St)

// J4: hub runs D-01 on Swift Plumbing; the desk books; the job shows in B-19, B-21, B-23 and W-15.
test("J4 desk answers a missed call and books; the job shows in inbox, call detail, app diary and web diary", async ({ page }) => {
  const errors = watchErrors(page)
  const F = app(page)
  await start(page, "sam")

  await page.goto("/hub")
  await page.locator("#simulate").getByRole("button", { name: /^D-01/ }).first().click()
  await expect.poll(async () => (await read(page)).runs.at(-1)?.done, { timeout: 60_000 }).toBe(true)
  const st = await read(page)
  const run = st.runs.at(-1)!
  expect(run.scriptId).toBe("D-01")
  const booking = st.bookings.find((b) => b.id === run.bookingId)!
  expect(booking).toMatchObject({ createdBy: "desk", status: "confirmed" })
  const service = st.services.find((x) => x.id === booking.serviceId)!.name
  const call = st.calls.find((c) => c.id === run.callId)!
  expect(call.outcome).toBe("desk")

  // B-19: in the inbox under Desk handled
  await page.goto("/app/biz/inbox")
  await F.getByRole("radio", { name: /Desk handled/ }).or(F.getByRole("tab", { name: /Desk handled/ })).or(F.getByRole("button", { name: /Desk handled/ })).first().click()
  await expect(F).toContainText(booking.customerName.split(" ")[0]!)

  // B-21: call detail with the transcript and a link to the booking
  await page.goto(`/app/biz/calls/${call.id}`)
  await expect(F).toContainText(call.transcript![0]!.text.slice(0, 40))
  await expect(F.getByRole("link", { name: /Booked|booking|job/i }).first()).toBeVisible()

  // B-23: in the app diary on the day
  await page.goto(`/app/biz/diary?day=${booking.startAt.slice(0, 10)}`)
  await expect(F).toContainText(service)

  // W-15: in the web dashboard's week view
  await page.goto("/dashboard/diary")
  const week = page.locator("main")
  await expect(week).toContainText(service)
  errors.assertNone()
})
