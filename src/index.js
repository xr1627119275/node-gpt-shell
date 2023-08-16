#!/usr/bin/env node

import { checkVersion, version  } from './utils';
import { program }  from 'commander';
import { startServer } from "./http/server";
import { chat, initCodeMessage, initShellMessage  } from './utils/gpt';

checkVersion()

const argv = process.argv

program
    .version(version)
    .argument("<content...>", "please input content")
    .option('-chat,  --chat', 'chat')
    .option('-code,  --code', 'ai code')
    .option('-shell,  --shell', 'ai shell')
    .action(async( content, options ) => {
        if (content[0] === 'server') {
            global.isServer = true
            startServer(3000)
            return
        }
        const isChat = options.chat
        const [_, shellName] = argv
        if (shellName.endsWith('ai-code')) options.code = true
        if (shellName.endsWith('ai-shell')) options.shell = true
        let initMessage = []
        if (options.code) initMessage = initCodeMessage
        if (options.shell) initMessage = initShellMessage
        chat(content.join(" "), isChat, initMessage)
        
    })

program.parse(argv);

