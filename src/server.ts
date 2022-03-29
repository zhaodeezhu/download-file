import fs from 'fs';
import path from 'path';
import http from 'http';
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