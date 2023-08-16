import { chat, initCodeMessage, initShellMessage } from '../utils/gpt';

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
    chat(text, false , [], false).then( result => {
        res.send(result);
    })
});
app.get('/ai-shell',  (req, res) => {
    const text = req.query.q || '';
    chat(text, false , initShellMessage, false).then( result => {
        res.send(result);
    })
})
app.get('/ai-code', (req, res) => {
    const text = req.query.q || '';
    chat(text, false , initCodeMessage, false).then( result => {
        res.send(result);
    });
});



export const startServer = function(port) {
    app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    });
}