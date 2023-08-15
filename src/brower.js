// 无头浏览器请求 https://site.easygpt.work/
const { exec, execSync } = require('child_process');
const puppeteer = require('puppeteer');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(browser, page) {
    rl.question('请输入内容：', (answer) => {
        console.log(`你输入的内容是：${answer}`);

        if (answer === 'q') return
        try {
            eval(`(async() => { ${answer} })() `)
            
        } catch (error) {
            console.warn(error)
        }
        question(browser, page)
      });
}

(async () => {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 800, height: 900 });
    await page.goto('https://site.easygpt.work/');
    await page.waitFor(2000);
    
    // question(browser, page) 

    // 等待键盘输入
    await page.screenshot({
        path: 'screenshot.png'
    });
    const context = await page.mainFrame().executionContext();
    // 获取body.innerHtml 
    const sites = await context.evaluate(() => sites);
    sites.forEach(item => {
        console.log(execSync(`wget -qO- ${item.url}/api/openai/v1/chat/completions`).toString())
    })
    await browser.close();
})();