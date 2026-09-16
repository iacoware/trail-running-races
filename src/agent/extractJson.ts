import { Option } from "effect"

const parseObject = (text: string): Option.Option<unknown> => {
    try {
        return Option.some(JSON.parse(text))
    } catch {
        return Option.none()
    }
}

// The index is exclusive, and braces inside JSON strings do not count.
const balancedEnd = (text: string, open: number): number | undefined => {
    let depth = 0
    let inString = false
    for (let index = open; index < text.length; index++) {
        const char = text[index]
        if (inString) {
            if (char === "\\") index++
            else if (char === '"') inString = false
        } else if (char === '"') inString = true
        else if (char === "{") depth++
        else if (char === "}" && --depth === 0) return index + 1
    }
    return undefined
}

// Agents wrap the answer in prose or code fences; the first balanced object that parses wins.
export const extractJson = (output: string): Option.Option<unknown> => {
    for (let open = output.indexOf("{"); open !== -1; open = output.indexOf("{", open + 1)) {
        const end = balancedEnd(output, open)
        if (end === undefined) continue
        const parsed = parseObject(output.slice(open, end))
        if (Option.isSome(parsed)) return parsed
    }
    return Option.none()
}
