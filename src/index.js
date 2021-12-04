/*
 * @Author: Yang Li
 * @Date: 2021-12-04 17:37:13
 * @Last Modified by: Yang Li
 * @Last Modified time: 2021-12-04 17:46:34
 */

import './index.css';

// 1、jsx语法
// import React from 'react';
// import ReactDOM from 'react-dom';

// const element = <h1>Hello React</h1>;
// const container = document.getElementById('root');
// ReactDOM.render(element, container);

// 2、React.createElement
// import React from 'react';
// import ReactDOM from 'react-dom';

// const element = React.createElement(
//   'h1',
//   { style: { textAlign: 'center' } },
//   'Hello React'
// );
// const container = document.getElementById('root');
// ReactDOM.render(element, container);

// 3、纯js实现
const container = document.getElementById('root');

// element代表React Elemnet
const element = {
  type: 'h1',
  props: {
    style: { textAlgin: 'center' },
    childen: 'Hello React',
  },
};

// node代表DOM Element
const node = document.createElement(element.type);

node.setAttribute('style', `text-align: ${element.props.style.textAlgin}`);
// const text = document.createTextNode('');
// text['nodeValue'] = element.props.childen;
const text = document.createTextNode(element.props.childen);
node.appendChild(text);

container?.appendChild(node);
