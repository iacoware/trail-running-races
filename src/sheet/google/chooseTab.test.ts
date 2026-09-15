import { Option } from "effect"
import { expect, test } from "vitest"

import { chooseTab } from "./chooseTab.ts"

const tabs = [
  { sheetId: 0, title: "Bozza", hidden: true },
  { sheetId: 42, title: "Gare" },
  { sheetId: 7, title: "Archivio" },
]

test("takes the first visible tab when none is named", () => {
  expect(chooseTab(tabs, Option.none())).toEqual(Option.some(tabs[1]))
})

test("takes the named tab even when it is hidden", () => {
  expect(chooseTab(tabs, Option.some("Bozza"))).toEqual(Option.some(tabs[0]))
})

test("finds no tab when the named one is absent", () => {
  expect(chooseTab(tabs, Option.some("Gare 2027"))).toEqual(Option.none())
})

test("finds no tab in a spreadsheet whose tabs are all hidden", () => {
  expect(chooseTab([{ sheetId: 0, title: "Bozza", hidden: true }], Option.none())).toEqual(
    Option.none(),
  )
})
