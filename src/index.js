/*
 * @Author: Yang Li
 * @Date: 2021-12-04 17:37:13
 * @Last Modified by: Yang Li
 * @Last Modified time: 2021-12-04 20:35:30
 */

import './index.css';

const createElement = (type, props, ...children) => {
  return {
    type,
    props: {
      ...props,
      children: children.map((child) =>
        typeof child === 'object' ? child : createTextElement(child)
      ),
    },
  };
};

const createTextElement = (text) => {
  return {
    type: 'TEXT_ELEMENT',
    props: {
      nodeValue: text,
      children: [],
    },
  };
};

const render = (element, container) => {
  const dom =
    element.type === 'TEXT_ELEMENT'
      ? document.createTextNode('')
      : document.createElement(element.type);

  // Object.keys(element.props)
  //   .filter((key) => key !== 'children')
  //   .forEach((name) => {
  //     dom[name] = element.props[name];
  //   });

  Object.keys(element.props)
    .filter((key) => key !== 'children')
    .forEach((key) => {
      dom[key] = element.props[key];
    });

  element.props.children.forEach((child) => {
    render(child, dom);
  });

  container.appendChild(dom);
};

const Li = {
  createElement,
  render,
};

/** @jsxRuntime classic */
/** @jsx Li.createElement */
const element = (
  <div>
    <span>Hello</span> - <strong>React</strong>
  </div>
);
const container = document.getElementById('root');
Li.render(element, container);
