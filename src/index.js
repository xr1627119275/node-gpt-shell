#!/usr/bin/env node
import {
    EventStreamContentType,
    fetchEventSource,
} from "@ai-zen/node-fetch-event-source";
import { version } from '../package.json'
import { AbortController } from "node-abort-controller";
global.AbortController = AbortController
// import inquirer from 'inquirer'
const readline = require('readline')
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});
import { program }  from 'commander';

const chatPath = 'https://chat9.fastgpt.me/api/openai/v1/chat/completions'

const messages =   [
    { "role": "user", "content": "You are a Command Line Interface expert and your task is to provide functioning shell commands. Return a CLI command and nothing else - do not send it in a code block, quotes, or anything else, just the pure text CONTAINING ONLY THE COMMAND. If possible, return a one-line bash command or chain many commands together. Return ONLY the command ready to run in the terminal. The command should do the following:" },
]


function chat(msg, isChat) {
    messages.push(  { "role": "user", "content": msg}  )
    const requestPayload = {
        "messages": messages,
        // "messages": [{ "role": "system", "content": "\nYou are ChatGPT, a large language model trained by OpenAI.\nKnowledge cutoff: 2021-09\nCurrent model: gpt-3.5-turbo\nCurrent time: 2023/8/14 09:07:13\n" }, { "role": "user", "content": "1" } ],
        "stream": true,
        "model": "gpt-3.5-turbo", 
        "temperature": 0.5, 
        "presence_penalty": 0, 
        "frequency_penalty": 0, 
        "top_p": 1 
    }
    const controller = new AbortController();
    const chatPayload = {
        method: "POST",
        body: JSON.stringify(requestPayload),
        signal: controller.signal,
        headers: {
            "Content-Type": "application/json",
            "x-requested-with":"XMLHttpRequest",
        } 
    };
    let responseText = ''
    let finished = false
    let index = 0
    async function finish() {
        index = 0
        if (!finished && isChat) {
            finished = true
            console.log('')
           messages.push({ role: "system", content: responseText })
           rl.question('>>> ', (answer) => {
               if (['exit', 'exit()', 'q', '.exit'].includes(answer)) return process.exit()
               chat(answer, true)
           })
           return
        }
        process.exit()
    }
    fetchEventSource(chatPath, {
        ...chatPayload,
        // inputFetch: () => {},
        // fetch: fetch,
        async onopen(res) {
            // clearTimeout(requestTimeoutId);
            const contentType = res.headers.get("content-type");
            // console.log(
            //     "[OpenAI] request response content type: ",
            //     contentType,
            // );

            if (contentType?.startsWith("text/plain")) {
                responseText = await res.clone().text();
                return finish();
            }

            if (
                !res.ok ||
                !res.headers
                    .get("content-type")
                    ?.startsWith(EventStreamContentType) ||
                res.status !== 200
            ) {
                const responseTexts = [responseText];
                let extraInfo = await res.clone().text();
                try {
                    const resJson = await res.clone().json();
                    extraInfo = prettyObject(resJson);
                } catch { }

                if (res.status === 401) {
                    responseTexts.push("Locale.Error.Unauthorized");
                }

                if (extraInfo) {
                    responseTexts.push(extraInfo);
                }

                responseText = responseTexts.join("\n\n");

                return finish();
            }
        },
        onmessage(msg) {
            if (msg.data === "[DONE]" || finished) {
                setTimeout( () => {
                    process.stdout.write("\n")
                    finish();
                }, ++index * 36)
                return 
            }
            const text = msg.data;
            try {
                const json = JSON.parse(text);
                const delta = json.choices[0].delta.content;
                if (delta) {
                    setTimeout( () => {
                        process.stdout.write(delta);
                    }, index ++ * 36 )
                    responseText += delta;
                    // options.onUpdate?.(responseText, delta);
                }
            } catch (e) {
                console.error("[Request] parse error", text, msg);
            }
        },
        onclose() {
            // finish();
        },
        onerror(e) {
            // options.onError?.(e);
            throw e;
        },
        openWhenHidden: true,
    });
}
function prettyObject(msg) {
    const obj = msg;
    if (typeof msg !== "string") {
      msg = JSON.stringify(msg, null, "  ");
    }
    if (msg === "{}") {
      return obj.toString();
    }
    if (msg.startsWith("```json")) {
      return msg;
    }
    return ["```json", msg, "```"].join("\n");
}




program
    .version(version)
    .argument("<message...>", "请输入内容")
    .option('-chat,  --chat', '聊天模式')
    .option('-code,  --code', '代码模式')
    .action(async( message, options ) => {
        const isChat = options.chat
        if (options.code) messages[0].content = '您是代码专家，您的任务是提供有效的代码。返回 代码，不返回任何其他内容 - 不要在代码块、引号或其他任何内容中发送它，而只返回仅包含代码的纯文本。如果可能，其他说明可以放在注释中。该代码应执行以下操作：'
        chat(message.join(" "), isChat)
    })

program.parse(process.argv);

