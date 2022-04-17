import fs from 'fs';
import path from 'path';
import http from 'http';
import { Buffer } from 'buffer';
import multiparty from 'multiparty';
import { Duplex } from 'stream';
const filePath = path.join(__dirname, './test.png');

/** 解析range */
const anyRange = (range: string) => {
  const rArr = range.split('=')[1];
  const lArr = rArr.split('-');
  return {
    start: Number(lArr[0]),
    end: Number(lArr[1])
  }
}

const BoundaryRegExp = /boundary=([-\w\s]+)/;

/** 读取formData数据 */
const readStreamFromData = (req: http.IncomingMessage) => {
  return new Promise((resolve) => {
    const form = new multiparty.Form();
    form.parse(req, (err, fields, files) => {
      console.log(err);
      if (!err) {
        resolve({
          fields,
          files
        })
      }
    })
  })
}

type IFormItem = {
  field: string;
  header: string;
  data: string | Buffer;
}

/** 读取流数据 */
const readStreamData = (req: http.IncomingMessage): Promise<IFormItem[]> => {
  const arr = [];
  // 解析出三个boundary开头的
  // startboundary --boundary
  // bodyboundary \r\n--boundary\r\n
  // endboundary \r\n--boundary--\r\n
  return new Promise(resolve => {
    req.on('data', chunk => {
      arr.push(chunk);
    })
    req.on('end', () => {
      const buffer = Buffer.concat(arr);
      const startBoundary = makeBoundary(req.headers['content-type']);
      const frontBoundary = Buffer.alloc(startBoundary.length + 2);
      frontBoundary.write(startBoundary);
      frontBoundary.write('\r\n', startBoundary.length);
      const bodyBoundary = Buffer.alloc(startBoundary.length + 4);
      bodyBoundary.write('\r\n');
      bodyBoundary.write(startBoundary, 2);
      bodyBoundary.write('\r\n', startBoundary.length + 2);
      // console.log(bodyBoundary.length);
      const endBoundary = Buffer.alloc(startBoundary.length + 4);
      endBoundary.write('\r\n');
      endBoundary.write(startBoundary, 2);
      endBoundary.write('--\r\n', startBoundary.length + 2);
      // 一个分隔符
      const onSign = Buffer.from('\r\n');
      // 分隔符
      const sign = Buffer.from('\r\n\r\n');
      // filename
      const filenameBuf = Buffer.from('filename=');
      // name
      const nameBuf = Buffer.from('name=\"');
      // 标识是第一个buffer
      let bufIndex = 0;
      const body = [];
      let flag = true;
      buffer.indexOf(bodyBoundary)
      // 查找的开始位置
      let byteOffset = 0;

      let offsetIndex = buffer.indexOf(bodyBoundary, byteOffset);
      // console.log(offsetIndex + frontBoundary.length);
      let startIndex = buffer.indexOf(frontBoundary, byteOffset);
      const a = buffer.slice(startIndex + frontBoundary.length, offsetIndex);
      while (flag) {
        let frontOffset = byteOffset;
        let endOffset = byteOffset;
        // 找到body的分隔
        let offsetIndex = buffer.indexOf(bodyBoundary, byteOffset);

        if (offsetIndex > -1) {
          endOffset = offsetIndex;
        } else {
          // 结尾(假设一定有结尾)
          endOffset = buffer.indexOf(endBoundary, byteOffset);
          flag = false;
        }
        // 判断从offset之前是否存在开始
        let startIndex = buffer.indexOf(frontBoundary, byteOffset);
        // 说明有开始
        if (startIndex === 0) {
          frontOffset = frontBoundary.length;
        } else {
          // 前一个的body
          frontOffset = byteOffset;
        }
        byteOffset = endOffset + bodyBoundary.length;
        // console.log(frontOffset, endOffset);
        // frontOffset 和 endOffset中间就是一个的body
        const bodyItem = buffer.slice(frontOffset, endOffset);

        // 数据头和体分离
        const signIndex = bodyItem.indexOf(sign);
        const header = bodyItem.slice(0, signIndex);
        const data = bodyItem.slice(signIndex + 4);
        let finalData: Buffer | string = data;
        // 解析字段名
        const firstIndex = header.indexOf(onSign);
        let firstHeader = header;
        if (firstIndex > -1) {
          firstHeader = header.slice(0, firstIndex);
        }
        // 解析是否存在filename;是否是文件流
        const fileIndex = firstHeader.indexOf(filenameBuf);
        let fieldIndex = header.length;
        if (fileIndex > -1) {
          fieldIndex = fileIndex;
          // console.log(data.length);
        } else {
          finalData = data.toString();
        }
        const fieldHeader = firstHeader.slice(0, fieldIndex);
        const nameIndex = fieldHeader.indexOf(nameBuf);
        const nameLastIndex = fieldHeader.lastIndexOf(Buffer.from('\"'));
        const field = fieldHeader.slice(nameIndex + nameBuf.length, nameLastIndex);

        body.push({
          header: header.toString(),
          data: finalData,
          field: field.toString()
        });
      }
      resolve(body);
    })
  })
}

/** 解析boundary */
const makeBoundary = (contentType: string) => {
  // const reg = /boundary=([-\w]+)/;
  const boundary = contentType.match(BoundaryRegExp)[1];
  return '--' + boundary;
}

/** 执行队列 */
const queueExec = (() => {
  const queue = [];
  let mindSize = 0;
  const exec = (name, file, start) => {
    if (Number(start) !== mindSize) {
      queue.push({
        start,
        name,
        file
      })
      return;
    }

    const writeStream = fs.createWriteStream(path.join(__dirname, `./${name}`), {
      start: Number(start),
      flags: mindSize !== 0 ? 'r+' : 'w'
    })
    const stream = new Duplex();
    stream.push(file);
    stream.push(null);
    stream.pipe(writeStream).on('close', () => {
      mindSize += file.length;
      const item = queue.shift();
      if (!item) {
        mindSize = 0; 
        return;
      }
      exec(item.name, item.file, item.start);
    })
  }
  return exec;
})()


const router: { [key: string]: (req: http.IncomingMessage, res: http.ServerResponse) => void } = {
  '/': (req: http.IncomingMessage, res: http.ServerResponse) => {
    const file = fs.createReadStream(filePath);
    const statObj = fs.statSync(filePath);
    res.setHeader('Content-Disposition', "attachment;filename=test.png");
    res.setHeader('Content-Disposition', "attachment;filename=test.png");
    res.setHeader('Content-length', `${statObj.size}`);
    file.pipe(res);
  },
  '/api/file/size': (req: http.IncomingMessage, res: http.ServerResponse) => {
    const statObj = fs.statSync(filePath);
    // 只能以字符串的形式响应给前端
    res.end(`${statObj.size}`);
  },
  '/api/file/fiber': (req: http.IncomingMessage, res: http.ServerResponse) => {
    const statObj = fs.statSync(filePath);
    const { start, end } = anyRange(req.headers.range as string)
    // 这里就可以获取指定范围的流
    const file = fs.createReadStream(filePath, {
      start: start,
      end: end
    });
    res.statusCode = 206;
    res.setHeader('Content-Range', `bytes ${start}-${end}/${statObj.size}`);
    res.setHeader('Content-length', `${end - start}`);
    file.pipe(res);
  },
  '/api/file/upload': async (req: http.IncomingMessage, res: http.ServerResponse) => {
    const body = await readStreamData(req);
    const data: { [key: string]: string | Buffer } = {};
    body.forEach(item => {
      data[item.field] = item.data;
    })
    const { start, file, name } = data;
    queueExec(name, file, start);
    res.end('ok');
  }
}

const server = http.createServer((req, res) => {
  // 解决跨域
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader("Access-Control-Allow-Headers", "X-Requested-With");
  res.setHeader("Access-Control-Allow-Methods", "PUT,POST,GET,DELETE,OPTIONS");
  // const statObj = fs.statSync(path.join(__dirname, './test.png'));
  // const file = fs.createReadStream(path.join(__dirname, './test.png'));
  // res.setHeader('Content-Disposition', "attachment;filename=test.png");
  // res.setHeader('Content-length', `${statObj.size}`);
  // file.pipe(res);
  const api = req.url as string;
  const controller = router[api];
  if (controller) {
    controller(req, res);
  } else {
    res.statusCode = 404;
    res.end('');
  }
})


server.listen(4000, () => {
  console.log('4000端口启动了')
})