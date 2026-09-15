import { Logger } from "effect"

export const captureLogs = (output: Array<string>) =>
    Logger.layer([
        Logger.make<unknown, void>(({ logLevel, message }) => {
            output.push(`${logLevel}: ${String(message)}`)
        }),
    ])
