import { prettyObject } from "./index.js"
import { AbortController } from "node-abort-controller";
import request  from 'request'
global.AbortController = AbortController
import {
    EventStreamContentType,
    fetchEventSource,
} from "@ai-zen/node-fetch-event-source";
const readline = require('readline')
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const chatPath = 'https://chat9.fastgpt.me/api/openai/v1/chat/completions'

export const initShellMessage = [
    { "role": "user", "content": "You are a Command Line Interface expert and your task is to provide functioning shell commands. Return a CLI command and nothing else - do not send it in a code block, quotes, or anything else, just the pure text CONTAINING ONLY THE COMMAND. If possible, return a one-line bash command or chain many commands together. Return ONLY the command ready to run in the terminal. The command should do the following:" },
]
export const initCodeMessage = [
    { "role": "user", "content": "您是代码专家，您的任务是提供有效的代码。返回 代码，不返回任何其他内容 - 不要在代码块、引号或其他任何内容中发送它，而只返回仅包含代码的纯文本。如果可能，其他说明可以放在注释中。该代码应执行以下操作：" },
]

export const messages = [
    { "role": "system", "content": "You are ChatGPT, a large language model trained by OpenAI." },
]

function sysWrite(text) {
    if (global.isServer) return
    process.stdout.write(text)
}

export function chat(msg, isChat = false, initMessage = undefined, stream = true) {
    return new Promise(resolve => {
        if (Array.isArray(initMessage)) {
            if (initMessage.length == 0) initMessage = [
                { "role": "system", "content": "You are ChatGPT, a large language model trained by OpenAI." },
            ]
            messages.splice(0, messages.length, ...initMessage)
        }
        messages.push(  { "role": "user", "content": msg}  )
        const requestPayload = {
            "messages": messages,
            // "messages": [{ "role": "system", "content": "\nYou are ChatGPT, a large language model trained by OpenAI.\nKnowledge cutoff: 2021-09\nCurrent model: gpt-3.5-turbo\nCurrent time: 2023/8/14 09:07:13\n" }, { "role": "user", "content": "1" } ],
            "stream": stream,
            "model": "gpt-3.5-turbo", 
            "temperature": 0.5, 
            "presence_penalty": 0, 
            "frequency_penalty": 0, 
            "top_p": 1 
        }
        const controller = new AbortController();
        const chatPayload = {
            method: "POST",
            url: chatPath,
            body: JSON.stringify(requestPayload),
            signal: controller.signal,
            headers: {
                "Content-Type": "application/json",
                "x-requested-with":"XMLHttpRequest",
            }
        };
        if (!stream) {
            request(chatPayload, function (error, response, body) {
                if (error) throw new Error(error);
                try {
                    body = JSON.parse(body)
                    resolve(body.choices[0].message.content + '\n') 
                } catch (error) {
                    resolve(error)
                }
                
            });
            return
        }
        let responseText = ''
        let finished = false
        let index = 0
        async function finish() {
            index = 0
            if (!finished) {
                resolve(responseText)   
            }
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
            if (!global.isServer) process.exit()
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
                        sysWrite("\n")
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
                            sysWrite(delta);
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
    })
    
}