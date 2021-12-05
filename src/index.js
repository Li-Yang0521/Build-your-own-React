/*
 * @Author: Yang Li
 * @Date: 2021-12-04 17:37:13
 * @Last Modified by: Yang Li
 * @Last Modified time: 2021-12-05 21:45:57
 */

import './index.css';

let nextUnitOfWork = null;

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

const createDom = (fiber) => {
  const dom =
    fiber.type === 'TEXT_ELEMENT'
      ? document.createTextNode('')
      : document.createElement(fiber.type);

  Object.keys(fiber.props)
    .filter((key) => key !== 'children')
    .forEach((key) => {
      dom[key] = fiber.props[key];
    });
};

const render = (element, container) => {
  nextUnitOfWork = {
    dom: container,
    props: {
      children: [element],
    },
  };
};

/**
 * 趁着浏览器空闲执行一些工作
 * @param deadline 浏览器剩余空闲时间ms
 */
const workLoop = (deadline) => {
  let shouldYield = false;

  while (nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
    shouldYield = deadline.timeRemaining() < 1;
  }

  // 浏览器空闲时执行workLoop方法;
  requestIdleCallback(workLoop);
};

// 浏览器空闲时执行workLoop方法;
requestIdleCallback(workLoop);

const performUnitOfWork = (fiber) => {
  console.log(fiber);
  if (!fiber.dom) {
    fiber.dom = createDom(fiber);
  }

  if (fiber.parent) {
    fiber.parent.dom.appendChild(fiber.dom);
  }

  const elements = fiber.props.children;
  let index = 0;
  let prevSibling = null;

  while (index < elements.length) {
    const element = elements[index];

    const newFiber = {
      type: element.type,
      props: element.props,
      parnet: fiber,
      dom: null,
    };

    if (index === 0) {
      fiber.child = newFiber;
    } else {
      prevSibling.sibling = newFiber;
    }
    prevSibling = newFiber;
    index++;
  }

  if (fiber.child) {
    return fiber.child;
  }

  let nextFiber = fiber;

  while (nextFiber) {
    if (nextFiber.sibling) {
      return nextFiber.sibling;
    }

    nextFiber = nextFiber.parent;
  }
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
