const moment = require('moment');
// console.log(moment().format(" YYYY-MM-DD h:mm:ss a"));

const sharp = require("sharp");
const fs = require("fs");
const download = require("download");
// sharp("./input.jpg")
//     .resize(300, 300, {
//         kernel: sharp.kernel.nearest,
//         fit: 'contain',
//         position: 'right top',
//         background: { r: 255, g: 255, b: 255, alpha: 0.5 }
//     })
//     .toFile('output.png')
//     .then(() => {
//         // output.png is a 200 pixels wide and 300 pixels high image
//         // containing a nearest-neighbour scaled version
//         // contained within the north-east corner of a semi-transparent white canvas
//     });


//存在四舍五入
const {FormatMoney} = require('format-money-js');

const fm = new FormatMoney({
    decimals: 2
});

// console.log(fm.from(12345.685, { symbol: '$' })); // return string: $12,345.67
// console.log(fm.un('€12,345;67',{})); // return number: 12345.67


// const ws=fs.createWriteStream;
// (async () => {
//     await download('https://my-test-11.slatic.net/p/e3c6e4fcba539ba530527bd27cba1a64.jpg', 'dist');
//     //
//     fs.writeFileSync('dist/foo.jpg', await download('https://my-test-11.slatic.net/p/e3c6e4fcba539ba530527bd27cba1a64.jpg'));
//     //
//     // download('unicorn.com/foo.jpg').pipe(ws('dist/foo.jpg'));
//
//
// })();

const uuid_time = require('node-uuid');

console.log(uuid_time())


//
// var t0 = performance.now();
//
// console.log("2222222222222222222222222");
// var t1 = performance.now();
// console.log("Call to doSomething took " + (t1 - t0) + " milliseconds.");


console.time();
for (let i = 0; i < 100000; i++) {
    // some code
}
console.timeEnd();


//检测数据类型
function checkedType(target) {
    return Object.prototype.toString.call(target).slice(8, -1);
}

//克隆


// function clone(target) {
// //     let result, targetType = checkedType(target);
// //     if (targetType === 'Object') {
// //         result = {}
// //
// //     } else if (targetType === 'Array') {
// //         result = []
// //     } else {
// //         return target
// //     }
// //
// //     //遍历复制属性
// //     for (let i in target) {
// //         //获取属性值
// //         let value = target[i];
// //         //目标是否存在嵌套对象或数组
// //         if (checkedType(value) === 'Object'
// //             || checkedType(value) === 'Array') {
// //             //递归复制
// //             result[i] = clone(value)
// //         } else {
// //             //获取的values时基本数据类型或者函数
// //             result[i] = value
// //         }
// //     }
// //     return result
// // }
// //
// // let a = {a:1,s:{v:2}};
// // let b = clone(a);
// // b.a='w';
// // b.s={v:3}
// // console.log(a);
// // console.log(b);




/**
 * 基于moment.js 实现的倒计时计算
 * @param endTime {String,Date} - 倒计时结束时间
 * @param maxUnit {String} - [maxUnit = "year"] 最大单位
 * @param startTime {String,Date} - 倒计时开始时间，默认为当前时刻
 * @return {Object}  - 计算完成后返回的年月日时分秒数值
 */
function countDownTime(endTime, maxUnit = "day", startTime) {
    let aUnitArr = ["year", "month", "day", "hour", "minute", "second"]
    let iMaxIndex = aUnitArr.indexOf(maxUnit);
    let end = moment(endTime);
    let start = moment(startTime);
    console.log(start);
    let result = {};

    if (start - end >0) {
        throw new Error("开始时间不能晚于结束时间")
    }
    //过滤掉大于最大单位的单位
    aUnitArr = aUnitArr.filter((item, index) => { return index >= iMaxIndex});
    console.log(aUnitArr);
    result[maxUnit] = end.diff(start, maxUnit);
    if (aUnitArr.length > 1) {
        aUnitArr.reduce((previous, current) => {
            // 结束时间不断减去高位单位时间
            end = end.subtract(result[previous], previous);
            result[current] = end.diff(start, current);
            return current
        });
    }
    return result
};

// countDownTime();


let res = countDownTime('2021-06-11 07:15:19','day','2021-05-11 09:15:18');

console.log(res);








function countDownTime2(endTime, maxUnit = "year", startTime) {
    let end = new Date(endTime);
    let start = startTime ? new Date(startTime) : new Date();
    if (start - end > 0) {
        throw new Error("开始时间不能晚于结束时间")
    }
    let aUnitArr = [
        {
            value: "second",
            interval: 60,
            secNum: 1 //该单位有多少秒，计算该单位最大差值用到
        },
        {
            value: "minute",
            interval: 60,
            secNum: 60
        },
        {
            value: "hour",
            interval: 24,
            secNum: 60 * 60
        },
        {
            value: "day",
            secNum: 60 * 60 * 24
        },
        {
            value: "month",
            interval: 12
        },
        {
            value: "year",
        },
    ]
    let endList = getTimeList(end);
    let startList = getTimeList(start);
    const iMaxIndex = aUnitArr.findIndex(item => maxUnit === item.value);
    // 当最大单位为日时分秒时过滤。月份最大单位需根据年份反算所以不能过滤掉年份
    if (iMaxIndex > -1 && iMaxIndex < 4) {
        aUnitArr = aUnitArr.filter((item, index) => index <= iMaxIndex);
    }
    let result = {};
    aUnitArr.forEach((item, index) => {
        if (index === iMaxIndex && iMaxIndex < 4) {
            result[item.value] = Math.floor((end - start) / item.secNum / 1000);
            return
        }
        if (endList[index] - startList[index] >= 0) {
            result[item.value] = endList[index] - startList[index];
        } else {
            endList[index + 1]--;
            result[item.value] = item.value === "day" ?
                countDiffDays(start, startList[index], endList[index]) : endList[index] + item.interval - startList[index];
        }
    })
    // 最大单位是月份时特殊处理
    if (maxUnit === "month") {
        result.month += result.year * 12
        delete result.year
    }
    return result;
}
function getTimeList(t) {
    return [t.getSeconds(), t.getMinutes(), t.getHours(), t.getDate(), t.getMonth() + 1, t.getFullYear()];
}
// 计算日期差值。开始时间本月剩余天数+结束时间当月日期数
function countDiffDays(time, startDay, endDay) {
    let curDate = new Date(time);
    let curMonth = curDate.getMonth();
    /* 这里将时间设置为下个月之前，需要把日期设置小一点，否则极端情况，如果当天日期大于下一个月的总天数，月份会设置为下下个月 */
    curDate.setDate(1)
    curDate.setMonth(curMonth + 1);
    curDate.setDate(0);//日期设置为前一个月的最后一天
    let restDays = curDate.getDate() - startDay;
    return restDays + endDay;
};



