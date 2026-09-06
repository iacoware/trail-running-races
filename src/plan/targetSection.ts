import type { Region } from "../agent/RaceCard.ts"
import { raceKey } from "../races/raceKey.ts"
import type { Section, Sheet } from "../sheet/parseSheet.ts"

export const REST_OF_ITALY = "Resto di Italia"
export const ABROAD = "Estero"
export const REVIEW_SECTION = "Da verificare"

const SPECIAL_SECTIONS = [REST_OF_ITALY, ABROAD, REVIEW_SECTION] as const

type UseExistingSection = { readonly _tag: "UseExistingSection" }

type CreateSection = {
  readonly _tag: "CreateSection"
  readonly separatorRow: number
  readonly headerRow: number
  readonly trailingSeparator: boolean
}

export type SectionAction = UseExistingSection | CreateSection

export type SectionTarget =
  | {
      readonly _tag: "ExistingSection"
      readonly section: Section
      readonly action: UseExistingSection
    }
  | {
      readonly _tag: "MissingSpecialSection"
      readonly name: string
      readonly action: CreateSection
    }

// Hyphens and spaces are interchangeable in a section name, so `Emilia Romagna` and
// `Emilia-Romagna` name the same section.
const sectionKey = (name: string) => raceKey(name).replaceAll("-", " ").replace(/\s+/g, " ")

const named = (sheet: Sheet, name: string) =>
  sheet.sections.find((section) => sectionKey(section.name) === sectionKey(name))

const specialIndex = (name: string) =>
  SPECIAL_SECTIONS.findIndex((section) => sectionKey(section) === sectionKey(name))

const missingSpecial = (sheet: Sheet, name: (typeof SPECIAL_SECTIONS)[number]): SectionTarget => {
  const following = sheet.sections.find((section) => specialIndex(section.name) > specialIndex(name))
  const followsHeader = following?.headerRow === 2
  const separatorRow =
    following === undefined ? sheet.lastRow + 1 : Math.max(2, following.headerRow - 1)

  return {
    _tag: "MissingSpecialSection",
    name,
    action: {
      _tag: "CreateSection",
      separatorRow,
      headerRow: separatorRow + 1,
      trailingSeparator: followsHeader,
    },
  }
}

const sectionTarget = (
  sheet: Sheet,
  name: (typeof SPECIAL_SECTIONS)[number],
): SectionTarget => {
  const section = named(sheet, name)
  return section === undefined
    ? missingSpecial(sheet, name)
    : { _tag: "ExistingSection", section, action: { _tag: "UseExistingSection" } }
}

export const reviewSection = (sheet: Sheet): SectionTarget => sectionTarget(sheet, REVIEW_SECTION)

// Regional sections remain author-owned. An absent Italian region targets the script-owned
// Resto di Italia section instead, creating only that special section when necessary.
export const targetSection = (sheet: Sheet, region: Region): SectionTarget => {
  const own = named(sheet, region)
  if (own !== undefined) {
    return { _tag: "ExistingSection", section: own, action: { _tag: "UseExistingSection" } }
  }
  return sectionTarget(sheet, region === ABROAD ? ABROAD : REST_OF_ITALY)
}
