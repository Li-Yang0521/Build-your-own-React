/*
 * @Author: Yang Li
 * @Date: 2021-12-04 17:37:13
 * @Last Modified by: Yang Li
 * @Last Modified time: 2021-12-06 19:02:58
 */

import './index.css';

let nextUnitOfWork = null;
let currentRoot = null;
let wipRoot = null;
let deletion = null;

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

  // Object.keys(fiber.props)
  //   .filter((key) => key !== 'children')
  //   .forEach((key) => {
  //     dom[key] = fiber.props[key];
  //   });

  updateDom(dom, {}, fiber.props);

  return dom;
};

const updateDom = (dom, prevProps, nextProps) => {
  const isEvent = (key) => key.startsWith('on');
  const isProperty = (key) => key !== 'children';
  const isNew = (prev, next) => (key) => prev[key] !== next[key];
  const isGone = (next) => (key) => !(key in next);

  const getEventType = (name) => name.toLowerCase().substring(2);
  // 删除旧的或者已改变的event;
  Object.keys(prevProps)
    .filter(isEvent)
    .filter((key) => isGone(nextProps)(key) || isNew(prevProps, nextProps)(key))
    .forEach((name) => {
      const eventType = getEventType(name);
      dom.removeEventListener(eventType, prevProps[name]);
    });

  //增加新的event
  Object.keys(nextProps)
    .filter(isEvent)
    .filter(isNew(prevProps, nextProps))
    .forEach((name) => {
      const eventType = getEventType(name);
      dom.addEventListener(eventType, nextProps[name]);
    });

  // 删除不存在的dom
  Object.keys(prevProps)
    .filter(isProperty)
    .filter(isGone(nextProps))
    .forEach((name) => {
      dom[name] = null;
    });

  // 增加新dom
  Object.keys(nextProps)
    .filter(isProperty)
    .filter(isNew(prevProps, nextProps))
    .forEach((name) => {
      dom[name] = nextProps[name];
    });
};

const commitRoot = () => {
  deletion.forEach(commitWork);
  commitWork(wipRoot.child);
  currentRoot = wipRoot;
  wipRoot = null;
};

const commitWork = (fiber) => {
  if (!fiber) {
    return;
  }

  const domParent = fiber.parent.dom;

  if (fiber.dom != null) {
    if (fiber.effectTag === 'PLACEMENT') {
      domParent.appendChild(fiber.dom);
    } else if (fiber.effectTag === 'DELETION') {
      domParent.removeChild(fiber.dom);
    } else if (fiber.effectTage === 'UPDATE') {
      updateDom(fiber.dom, fiber.alternate.props, fiber.props);
    }
  }

  commitWork(fiber.child);
  commitWork(fiber.sibling);
};

const render = (element, container) => {
  wipRoot = {
    dom: container,
    props: {
      children: [element],
    },
    alternate: currentRoot,
  };
  deletion = [];
  nextUnitOfWork = wipRoot;
};

// workLoop依赖requestIdleCallback实现调度
const workLoop = (deadline) => {
  let shouldYield = false;

  while (nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
    shouldYield = deadline.timeRemaining() < 1;
  }

  // 进入commit阶段的判断条件：有一棵树在渲染流程中，并且render阶段已执行完毕
  if (!nextUnitOfWork && wipRoot) {
    commitRoot();
  }

  requestIdleCallback(workLoop);
};

requestIdleCallback(workLoop);

// 处理 unitOfWork
const performUnitOfWork = (fiber) => {
  // 创建DOM
  if (!fiber.dom) {
    fiber.dom = createDom(fiber);
  }

  // 创建 children fibers
  const elements = fiber.props.children;
  reconcileChildren(fiber, elements);

  // 返回 next unitOfWork
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

const reconcileChildren = (wipFiber, elements) => {
  let oldFiber = wipFiber.alternate?.child;
  let index = 0;
  let prevSibling = null;

  while (index < elements.length || oldFiber != null) {
    const element = elements[index];
    let newFiber = null;
    const isSameType = oldFiber && element && oldFiber.type === element.type;

    if (isSameType) {
      newFiber = {
        type: oldFiber.type,
        props: element.props,
        dom: oldFiber.dom,
        parent: wipFiber,
        alternate: oldFiber,
        effectTag: 'UPDATE',
      };
    }

    if (element && !isSameType) {
      newFiber = {
        type: element.type,
        props: element.props,
        dom: null,
        parent: wipFiber,
        effectTag: 'PLACEMENT',
      };
    }

    if (oldFiber && !isSameType) {
      oldFiber.effectTag = 'DELETION';
      DOMImplementation.push(oldFiber);
    }

    if (oldFiber) {
      oldFiber = oldFiber.sibling;
    }

    if (index === 0) {
      wipFiber.child = newFiber;
    } else if (element) {
      prevSibling.sibling = newFiber;
    }
    prevSibling = newFiber;
    index++;
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
