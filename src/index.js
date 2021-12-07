/*
 * @Author: Yang Li
 * @Date: 2021-12-04 17:37:13
 * @Last Modified by: Yang Li
 * @Last Modified time: 2021-12-07 18:13:34
 */

import './index.css';

let nextUnitOfWork = null;
let currentRoot = null;
let wipRoot = null;
let deletions = null;
let wipFiber = null;
let hookIndex = null;

const createElement = (type, props, ...children) => ({
  type,
  props: {
    ...props,
    children: children.map((child) =>
      typeof child === 'object' ? child : createTextElement(child)
    ),
  },
});

const createTextElement = (text) => ({
  type: 'TEXT_ELEMENT',
  props: {
    nodeValue: text,
    children: [],
  },
});

const createDom = (fiber) => {
  const dom =
    fiber.type === 'TEXT_ELEMENT'
      ? document.createTextNode('')
      : document.createElement(fiber.type);

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

  // 删除旧的dom
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

  //增加新的event
  Object.keys(nextProps)
    .filter(isEvent)
    .filter(isNew(prevProps, nextProps))
    .forEach((name) => {
      const eventType = getEventType(name);
      dom.addEventListener(eventType, nextProps[name]);
    });
};

const commitRoot = () => {
  deletions.forEach(commitWork);
  commitWork(wipRoot.child);
  currentRoot = wipRoot;
  wipRoot = null;
};

const commitDeletion = (fiber, domParent) => {
  if (fiber.dom) {
    domParent.removeChild(fiber.dom);
  } else {
    commitDeletion(fiber.child, domParent);
  }
};

const commitWork = (fiber) => {
  if (!fiber) {
    return;
  }

  let domParentFiber = fiber.parent;

  while (!domParentFiber.dom) {
    domParentFiber = domParentFiber.parent;
  }

  const domParent = domParentFiber.dom;

  if (fiber.dom != null) {
    if (fiber.effectTag === 'PLACEMENT') {
      domParent.appendChild(fiber.dom);
    } else if (fiber.effectTag === 'UPDATE') {
      updateDom(fiber.dom, fiber.alternate.props, fiber.props);
    }
  } else if (fiber.effectTag === 'DELETION') {
    commitDeletion(fiber.child, domParent);
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
  deletions = [];
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

const updateHostComponent = (fiber) => {
  if (!fiber.dom) {
    fiber.dom = createDom(fiber);
  }

  reconcileChildren(fiber, fiber.props.children);
};

const updateFunctionComponent = (fiber) => {
  wipFiber = fiber;
  hookIndex = 0;
  wipFiber.hooks = [];
  const children = [fiber.type(fiber.props)];
  reconcileChildren(fiber, children);
};

// 处理 unitOfWork
const performUnitOfWork = (fiber) => {
  const isFunction = fiber.type instanceof Function;

  isFunction ? updateFunctionComponent(fiber) : updateHostComponent(fiber);

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

const reconcileChildren = (fiber, elements) => {
  let oldFiber = fiber.alternate?.child;
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
        parent: fiber,
        alternate: oldFiber,
        effectTag: 'UPDATE',
      };
    }

    if (element && !isSameType) {
      newFiber = {
        type: element.type,
        props: element.props,
        dom: null,
        parent: fiber,
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
      fiber.child = newFiber;
    } else if (element) {
      prevSibling.sibling = newFiber;
    }

    prevSibling = newFiber;
    index++;
  }
};

const useState = (initial) => {
  const oldHook = wipFiber.alternate?.hooks?.[hookIndex];

  const hook = {
    state: oldHook ? oldHook.state : initial,
    queue: [],
  };

  const actions = oldHook ? oldHook.queue : [];
  actions.forEach((action) => {
    hook.state = action(hook.state);
  });

  const setState = (action) => {
    hook.queue.push(action);

    wipRoot = {
      dom: currentRoot.dom,
      props: currentRoot.props,
      alternate: currentRoot,
    };
    nextUnitOfWork = wipRoot;
    deletions = [];
  };

  wipFiber.hooks.push(hook);
  hookIndex++;
  return [hook.state, setState];
};

const Li = {
  createElement,
  render,
  useState,
};

/** @jsxRuntime classic */
/** @jsx Li.createElement */

const Counter = () => {
  const [state, setState] = Li.useState(0);

  return (
    <h1 onClick={() => setState((c) => c + 1)} style="user-select: none">
      Count: {state}
    </h1>
  );
};
const element = <Counter />;
const container = document.getElementById('root');
Li.render(element, container);
