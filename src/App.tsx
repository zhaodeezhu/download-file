import React, { Component } from 'react';

import './index.less';

export default class App extends Component {

  index = 0;
  arr = []

  handleClick = async () => {
    console.log('123456');
    if(this.index === 5) {
      const newBlob = new Blob(this.arr);
      const a = document.createElement('a');
      a.download = 'file.png';
      a.href = URL.createObjectURL(newBlob);
      a.click();
      return;
    }
    const res = await fetch('http://localhost:4000/api/test', {
      method: 'GET'
    })
    const blob = await res.blob()
    // const buf = await blob.arrayBuffer()
    this.arr.push(blob);
    this.index++;
      // const newBlob = new Blob([blob]);
      // const a = document.createElement('a');
      // a.download = 'file.png';
      // a.href = URL.createObjectURL(newBlob);
      // a.click();
    // console.log(buf);
  }

  handleClick1 = async () => {
    const res = await fetch('http://localhost:4000/api/test', {
      method: 'GET'
    })
    const blob = await res.blob()
    const newBlob = new Blob([blob]);
    const a = document.createElement('a');
    a.download = 'file.pptx';
    a.href = URL.createObjectURL(newBlob);
    a.click();

  }

  handleClick2 = async (start: number, end: number) => {
    const res = await fetch('http://localhost:4000/api/fibr/file', {
      method: 'GET',
      headers: {
        "Range": `bytes=${start}-${end}`
      }
    })
    const blob = await res.blob();
    return blob;
  }

  handleClick3 = async () => {
    const res = await fetch('http://localhost:4000/api/fibr/size', {
      method: 'GET'
    })
    const text = await res.text()

    return Number(text);
  }

  work = async () => {
    const size = await this.handleClick3();
    const fibr = Math.ceil(size / 5);
    const arr = []
    for(let i = 0; i < 5; i++) {
      const start = i * fibr;
      const end = (i + 1) * fibr - 1;
      arr.push(this.handleClick2(start, end))
    }

    const values = await Promise.all(arr);
    const file = new Blob(values);
    console.log(file);
    const a = document.createElement('a');
    a.download = 'file.pptx';
    a.href = URL.createObjectURL(file);
    a.click();
  }

  allWork = async () => {
    const res = await fetch('http://localhost:4000/api/all/file', {
      method: 'GET',
    })
    const blob = await res.blob();

    const file = new Blob([blob]);
    console.log(file);
    const a = document.createElement('a');
    a.download = 'file.pptx';
    a.href = URL.createObjectURL(file);
    a.click();
  }

  /** ajax下载 */
  ajax = () => {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', 'http://localhost:4000/');
    // xhr.setRequestHeader('Access-Control-Allow-Origin', '*');
    xhr.responseType = 'blob';
    xhr.onreadystatechange = () => {
      if(xhr.readyState === 4) {
        const res = xhr.response;
        const a = document.createElement('a');
        a.download = 'file.png';
        a.href = URL.createObjectURL(res);
        a.click();
      }
    }
    xhr.onprogress = (e) => {
      if(e.lengthComputable) {
        console.log(e.loaded, e);
      }
    }
    xhr.send();
  }

  request = (url, options) => {
    const { method } = options;
    const xhr = new XMLHttpRequest();
    xhr.open('GET', url);
    // xhr.setRequestHeader('Access-Control-Allow-Origin', '*');
    xhr.responseType = 'blob';
    xhr.onreadystatechange = () => {
      if(xhr.readyState === 4) {
        const res = xhr.response;
        const a = document.createElement('a');
        a.download = 'file.png';
        a.href = URL.createObjectURL(res);
        a.click();
      }
    }
    xhr.onprogress = (e) => {
      if(e.lengthComputable) {
        console.log(e.loaded, e);
      }
    }
    xhr.send();
  }

  handleFileChange = async (e) => {
    e.persist();
    console.log(e)
    console.log(e.files)
    const file = e.target.files[0] as File;
    // const file = new Blob(['12345678900987654321']);
    console.log(file.name);
    const size = file.size;
    console.log(size);
    const fetchBody = [];
    const fiSize = 5;
    const fibr = Math.ceil(size / fiSize);
    for(let i = 0; i < fiSize; i++) {
      const start = i * fibr;
      const end = (i + 1) * fibr;
      const fileFibr = file.slice(start, end);
      const form = new FormData();
      form.append('name', file.name)
      form.append('file', fileFibr); // slice(0, 200)
      form.append('start', `${start}`);
      fetchBody.push(this.formFetch(form));
    }

    const res = await Promise.all(fetchBody);
    console.log(res);
    console.log(res);
  }
  
  fileUpload = async (file: File, fibrNum: number) => {
    const size = file.size;
    const fetchBody = [];
    const fibr = Math.ceil(size / fibrNum);
    for(let i = 0; i < fibrNum; i++) {
      const start = i * fibr;
      const end = (i + 1) * fibr;
      const fileFibr = file.slice(start, end);
      const form = new FormData();
      form.append('name', file.name)
      form.append('file', fileFibr); // slice(0, 200)
      form.append('start', `${start}`);
      fetchBody.push(this.formFetch(form));
    }
    // 接受上传响应
    const res = await Promise.all(fetchBody);
  }

  formFetch = async (form) => {
    return fetch('http://localhost:4000/api/file/upload', {
      method: 'POST',
      body: form,
    })
  }

  render() {
    return (
      <div>
        <button onClick={this.handleClick}>测试</button>
        <button onClick={this.handleClick1}>测试1</button>
        {/* <button onClick={this.handleClick2}>测试2</button> */}
        <button onClick={this.handleClick3}>获取大小</button>
        <button onClick={this.work}>fibr</button>
        <button onClick={this.allWork}>allWork</button>
        <a href="http://localhost:4000/">下载图片</a>
        <button onClick={() => window.open('http://localhost:4000')}>动态下载</button>
        <button onClick={this.ajax}>Ajax</button>
        <div>
          <label htmlFor="file" className="xioo-label">
            <span>上传文件</span>
            <input id="file" type="file" onChange={this.handleFileChange} className="xioo-file" />
          </label>
        </div>
        <form action="/api/upload" encType="multipart/form-data" method="post">
          <input type="text" placeholder="请输入名称" name="username" />
          <input type="file" placeholder="请选择文件" name="file" />
          <input type="submit" value="提交"/>
        </form>
        {/* <div>
          <iframe src="http://localhost:8000" height={800} width={1600}></iframe>
        </div> */}
      </div>
    )
  }
}
