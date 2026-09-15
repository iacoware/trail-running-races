import { Option } from "effect"

export type Tab = {
    readonly sheetId: number
    readonly title: string
    readonly hidden?: boolean | undefined
}

// Like the Sheets UI and a sheet-less A1 range, "first tab" means the first visible one; a
// tab named explicitly is taken as it is, hidden or not.
export const chooseTab = (tabs: ReadonlyArray<Tab>, wanted: Option.Option<string>) =>
    Option.fromNullishOr(
        Option.match(wanted, {
            onNone: () => tabs.find((tab) => tab.hidden !== true),
            onSome: (title) => tabs.find((tab) => tab.title === title),
        }),
    )
