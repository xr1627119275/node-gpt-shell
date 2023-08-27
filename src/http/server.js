import { chat, initCodeMessage, initShellMessage } from '../utils/gpt';

import { markdown } from 'markdown'
import {isBrowser} from "../utils";
// 引入所需模块
const express = require('express');

// 创建Express应用程序
const app = express();

// 定义路由和处理程序
app.get('/', (req, res) => {
  res.send('GPT Shell Web Server');
})
app.get('/ai',  (req, res) => {
    const text = req.query.q || '';
    // 判断是否是浏览器环境访问
    chat(text, false , [], false).then( result => {
        res.send(isBrowser(req) ? markdown.toHTML(result) : result);
    })
});
app.get('/ai-shell',  (req, res) => {
    const text = req.query.q || '';
    chat(text, false , initShellMessage, false).then( result => {
        res.send(isBrowser(req) ? markdown.toHTML(result) : result);
    })
})
app.get('/ai-code', (req, res) => {
    const text = req.query.q || '';
    chat(text, false , initCodeMessage, false).then( result => {
        res.send(isBrowser(req) ? markdown.toHTML(result) : result);
    });
});


export const startServer = function(port) {
    app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    });
}
