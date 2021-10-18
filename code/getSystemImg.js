const puppeteer = require('puppeteer');
const srcImg = require('./saveHelp/srcToimg');
const download = require('download');
const fs = require('fs');
const findChrome = require('./node_modules/carlo/lib/find_chrome');

//抓取水电表图片数据



const taobaocookie = [
    {
        "domain": "meter.pamiai.com",
        "hostOnly": true,
        "httpOnly": false,
        "name": "sidebarStatus",
        "path": "/",
        "sameSite": "unspecified",
        "secure": false,
        "session": true,
        "storeId": "0",
        "value": "1",
        "id": 1
    },
    {
        "domain": "meter.pamiai.com",
        "hostOnly": true,
        "httpOnly": false,
        "name": "YSHOP-TOEKN",
        "path": "/",
        "sameSite": "unspecified",
        "secure": false,
        "session": true,
        "storeId": "0",
        "value": "Bearer%20eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJhZG1pbiIsImF1dGgiOiJZWFVTRVJfU0VMRUNULEF0dGVuZGFuY2VNaW5lOmVkaXQsWVhTWVNURU1HUk9VUERBVEFfQUxMLFlYVVNFUl9DUkVBVEVfTWluZSxFcnJvck1ldGVyOmxpc3QsQXR0ZW5kYW5jZU1pbmU6YWRkLFByb2plY3RSZWNvcmQ6bGlzdCxGZWVkYmFjazpsaXN0LGRlcHQ6bGlzdCxBdHRlbmRhbmNlTWluZTpsaXN0LFJlcGFpcjpsaXN0LGpvYjpsaXN0LE1ldGVyRGF0YTpsaXN0LGRpY3Q6bGlzdCxyb2xsOmxpc3QsQ291bnR5TGV2ZWw6ZGVsLE5vTWV0ZXI6bGlzdCx0aW1pbmc6bGlzdCxZWFVTRVJfREVMRVRFX01pbmUsWVhVU0VSX0NSRUFURSxBdHRlbmRhbmNlTWluZTpkZWwscGljdHVyZXM6bGlzdCxJbnNwZWN0aW9uVGFza01pbmU6YWRkLGhvbWVCYW5uZXI6bGlzdCxSZXBhaXJNaW5lOmxpc3QsQ291bnR5TGV2ZWw6YWRkLFlYVVNFUl9FRElUX01pbmUsVGhyZXNob2xkQ29uZmlnOmxpc3QsUHJvamVjdDpsaXN0LFByb2plY3RPcmRlcjpsaXN0LHVzZXI6bGlzdCxDb3VudHk6bGlzdCxZWFVTRVJfU0VMRUNUX01pbmUsRGV2aWNlOmxpc3QsSW5zcGVjdGlvblRhc2tNaW5lOmRlbCxhZG1pbixTaXRlOmxpc3QsSW5zcGVjdGlvblRhc2tNaW5lOmVkaXQsc3RvcmFnZTpsaXN0LFByb2plY3Q6ZWRpdCxQcm9qZWN0OmRlbCxhZG1pbixtZW51Omxpc3Qscm9sZXM6bGlzdCxNZXRlckRhdGE6YWRkLENvbXBhbnk6bGlzdCxDb3VudHlMZXZlbDplZGl0LEluc3BlY3Rpb25UYXNrOmxpc3Qscm9sZXM6bGlzdCxZWFVTRVJfRURJVCx3YXRlcnNpdGU6bGlzdCxDb3VudHlMZXZlbDpsaXN0LHNtQWJub3JtYWw6bGlzdCxZWFVTRVJfREVMRVRFLFByb2plY3Q6YWRkLEF0dGVuZGFuY2U6bGlzdCxJbnNwZWN0aW9uVGFza01pbmU6bGlzdCx3dXNodWlDakRhaWx5Omxpc3QsTWV0ZXJEYXRhOmVkaXQiLCJleHAiOjE2MTczMzE1MTJ9.HzjPJOYJYlSWNxAkhiqxD2pTa9CvGU8B1T-uyX_orIEFgfyXIxWIVmXzNFl8jO0kaHy7g74ye33Ka0G3o33Qcg",
        "id": 2
    }
]

let pageUrl = 'http://meter.pamiai.com:8077/waterMeter/electricMeter';
let currenntPage = 1;
let maxPage = 10;
let page = {};
let arr_s = [];
let index=0;
async function start() {
    let findChromePath = await findChrome({});
    let executablePath = findChromePath.executablePath;
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: {
            width: 999,
            height: 600
        },
        executablePath: executablePath,
        slowMo: 100,       //放慢浏览器执行速度，方便测试观察

    })

    page = await browser.newPage();
    //设置setCookie
    for (let set of taobaocookie) {
        await page.setCookie(set);
    }
    //打开
    await page.goto(pageUrl);
    //点击一百条
   await page.click('span.el-pagination__sizes > div > div > input');
    await page.click('body > div.el-select-dropdown.el-popper > div.el-scrollbar > div.el-select-dropdown__wrap.el-scrollbar__wrap > ul > li:nth-child(5) > span');
    await getData();
    console.log('开始下载！！！', arr_s.length);
    // await downloadImg(arr_s);

}


//拿取数据
async function getData() {
    while (true) {
        let flag = true;
        try {
            // await page.waitFor(1 * 1000);
            let arr = await page.evaluate(async () => {
                let arr = [];
                let tr_sectors = 'tr.el-table__row';
                const items = document.querySelectorAll(tr_sectors);
                let img_src = '';
                let table_no = '';
                let eq_num = 0;
                let current_degree = 0;
                //拿取图片文字
                let obj = {};
                for (let item of items) {
                    //当前度数
                    current_degree = item.children[7].children[0].innerText;
                    console.log('该表度数：', current_degree);
                    if (current_degree == 0) {
                        console.log('该表已被过滤');
                        continue
                    }
                    //表号
                    table_no = item.children[4].innerText;
                    //图片地址
                    img_src = item.children[5].children[0].children[0].children[0].src;
                    //设备号
                    eq_num = item.children[3].children[0].innerText;
                    obj = {
                        img_src,
                        table_no,
                        current_degree,
                        eq_num
                    }
                    arr.push(obj)
                }
                return arr
            });
            for (let obj of arr) {
                console.log('下载',obj.img_src);
                await download(
                    obj.img_src).pipe(
                    fs.createWriteStream(
                        `dist/db/${obj.eq_num}#${randomCoding()}_${obj.table_no}→${obj.current_degree}.jpg`));

                // arr_s.push(i);
            }
            //下一页
            await page.click('button.btn-next > i');
            // await page.waitFor(1 * 1000);
            if (currenntPage <= maxPage) {
                ++currenntPage;
                await getData();
            }

        } catch (e) {
            if (e) {
                flag = false;
            }
            console.log('出错了',e);
            console.log(`获取第${currenntPage}页数据当前条数:${arr_s.length}`);
            // if (currenntPage <= maxPage) {
            //     await getData();
            // }
        } finally {
            console.log(`获取第${currenntPage}页数据当前条数:${arr_s.length}`);
            if (flag) break;
        }
    }

}

start();

async function downloadImg(arr_s) {

    try {
        for (let obj of arr_s) {
            await download(obj.img_src).pipe(fs.createWriteStream(`dist/sb/${obj.eq_num}#${randomCoding()}_${obj.table_no}→${obj.current_degree}.jpg`));

        }
    } catch (e) {
        console.log(e);
    }

    console.log('下载完成！');
}

//
function randomCoding() {
    let result = [];
    let n = 4;//这个值可以改变的，对应的生成多少个字母，根据自己需求所改
    for (let i = 0; i < n; i++) {
        //生成一个0到25的数字
        let ranNum = Math.ceil(Math.random() * 25);
        //大写字母'A'的ASCII是65,A~Z的ASCII码就是65 + 0~25;
        //然后调用String.fromCharCode()传入ASCII值返回相应的字符并push进数组里

        result.push(String.fromCharCode(65 + ranNum) + ranNum);

    }
    return result.join('');
}



//await download(i.img_src).pipe(fs.createWriteStream(`dist/sb/${i.eq_num}#${randomCoding()}_${i.table_no}→${i.current_degree}.jpg`));