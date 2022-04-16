import { Buffer } from 'buffer';
import fs from 'fs';
import path from 'path';
import { Duplex } from 'stream';

const buf = Buffer.alloc(1);
buf.write('-');

// console.log(buf);

// console.log(buf);


// const buf1 = Buffer.from('123456189');

// 前闭后开
// const buf2 = buf1.slice(0, 2);

// const index = buf1.lastIndexOf(Buffer.from('1'));

// console.log(buf2);

// console.log(Buffer.from('\"'));

// const read = fs.createReadStream(parh.join(__dirname, './tttt.png'));

// const data = []

// read.on('data', (buf) => {
//     data.push(buf);
// })

// read.on('end', () => {
//     const buf = Buffer.concat(data);
//     console.log(buf.length)
// })

const read = new Duplex();


read.push(Buffer.from('12345'));
read.push(null);

// read.pipe(fs.createWriteStream(path.join(__dirname, './text.txt')));

const pys = new Duplex();

pys.push(Buffer.from('6789'));
pys.push(null);
pys.pipe(fs.createWriteStream(path.join(__dirname, './text.txt'), {
    start: 5
}))