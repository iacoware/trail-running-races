import type { Row } from "../SheetReader.ts"

// RFC 4180 as Google Sheets exports it: quoted fields carry commas and newlines, and a
// doubled quote inside them is a literal one.
export const parseCsv = (text: string) => {
    const rows: Array<Row> = []
    let cells: Array<string> = []
    let cell = ""
    let quoted = false
    let index = 0

    const endCell = () => {
        cells.push(cell)
        cell = ""
    }
    const endRow = () => {
        endCell()
        rows.push(cells)
        cells = []
    }

    while (index < text.length) {
        const char = text[index]
        if (quoted) {
            if (char === '"' && text[index + 1] === '"') {
                cell += '"'
                index += 2
            } else if (char === '"') {
                quoted = false
                index += 1
            } else if (char === "\r" && text[index + 1] === "\n") {
                cell += "\n"
                index += 2
            } else {
                cell += char
                index += 1
            }
            continue
        }
        if (char === '"' && cell === "") quoted = true
        else if (char === ",") endCell()
        else if (char === "\n") endRow()
        else if (char !== "\r") cell += char
        index += 1
    }
    if (cell !== "" || cells.length > 0) endRow()
    return rows
}
