---
title: 深入理解JavaScript原型链（Prototype Chain）
date: 2024-03-27 06:24:00
tags:
  - 2024
  - JavaScript
  - 原型链
categories:
  - 前端技术
  - JavaScript
---

> JavaScript 是一门基于**原型（Prototype）**的语言，而非传统的基于类（Class）的语言（尽管 ES6 引入了 `class` 语法糖）。理解原型链是深入掌握 JavaScript 面向对象、继承以及对象属性查找机制的关键。它解释了为什么一个对象可以访问到它自身没有定义的方法和属性。

{% note info %}
“JavaScript 的一切皆对象，而原型链是这些对象连接的纽带。”
{% endnote %}

## 一、什么是原型（Prototype）？

在 JavaScript 中，**每个对象**都有一个内部属性，指向它的原型（Prototype）。这个原型又是一个对象，它也有自己的原型，这样一层一层向上，直到最后是 `null`。这个由一系列原型组成的链条就是**原型链**。

### 1. `[[Prototype]]` 和 `__proto__`

*   **`[[Prototype]]`**：这是对象内部隐藏的属性，它指向该对象的原型。在 ES5 之前，开发者无法直接访问这个内部属性。
*   **`__proto__`**：这是大多数现代 JavaScript 引擎提供的一个非标准的 getter/setter，用于访问或设置对象的 `[[Prototype]]`。虽然它现在已经被标准化为 `Object.prototype.__proto__`，但由于其历史遗留问题和潜在的性能影响，不推荐在生产代码中直接使用它来修改原型链。
*   **`Object.getPrototypeOf()` 和 `Object.setPrototypeOf()`**：ES6 引入的标准方法，用于获取和设置对象的原型，推荐使用。

```javascript
const obj = {};
console.log(obj.__proto__ === Object.prototype); // true
console.log(Object.getPrototypeOf(obj) === Object.prototype); // true
```

### 2. `prototype` 属性

除了普通对象有 `__proto__` 之外，**函数（Function）**对象还拥有一个特殊的属性：`prototype`。

*   `函数.prototype`：这个属性指向一个对象，**这个对象会成为所有通过该函数构造出来的实例的 `[[Prototype]]`。**

```javascript
function Person(name) {
  this.name = name;
}

// Person.prototype 是一个对象
console.log(typeof Person.prototype); // "object"

const p1 = new Person('Alice');

// p1 是 Person 构造函数的实例
// p1 的原型指向 Person.prototype
console.log(Object.getPrototypeOf(p1) === Person.prototype); // true
console.log(p1.__proto__ === Person.prototype);             // true
```

**区分 `__proto__` 和 `prototype` 是理解原型链的关键：**
*   `__proto__` 是**所有对象**都拥有的，指向其自身的原型。
*   `prototype` **只有函数对象**才拥有的，用于指定**它所创建出来的实例**的原型。

## 二、原型链是如何工作的？—— 属性查找机制

当访问一个对象的属性时，JavaScript 引擎会遵循以下查找规则：

1.  **首先在对象自身寻找**：检查对象本身是否拥有这个属性（通过 `hasOwnProperty()` 方法可以判断）。
2.  **如果找不到，沿着原型链向上查找**：如果对象自身没有这个属性，引擎会沿着 `__proto__` 指向的原型对象继续查找。
3.  **重复步骤 1 和 2**：如果原型对象也没有，就查找原型的原型，一直向上搜索。
4.  **直到 `null` 为止**：如果最终查找到原型链的顶端（通常是 `Object.prototype` 的原型，即 `null`），仍然没有找到该属性，那么就返回 `undefined`。

**示例：**

```javascript
function Animal(name) {
  this.name = name; // 自身属性
}

Animal.prototype.sayName = function() {
  console.log(`My name is ${this.name}`);
};

const dog = new Animal('Buddy');

dog.sayName(); // "My name is Buddy"

// 查找过程：
// 1. dog 对象自身没有 `sayName` 属性。
// 2. 沿着 dog.__proto__ (即 Animal.prototype) 向上查找。
// 3. 在 Animal.prototype 中找到了 `sayName` 方法。
// 4. 执行该方法。

console.log(dog.hasOwnProperty('name'));      // true (自身属性)
console.log(dog.hasOwnProperty('sayName'));   // false (原型上的属性)
console.log('sayName' in dog);                // true (通过原型链找到)
```

## 三、原型链的构建过程

原型链的构建主要通过以下两种方式：

### 1. 构造函数模式 (`new` 操作符)

当使用 `new` 操作符调用一个函数（作为构造函数）时，会发生以下步骤：

1.  **创建一个新的空对象**：这个新对象是 `new` 调用的结果。
2.  **设置新对象的原型**：将这个新创建的对象的 `__proto__` 属性，指向构造函数 `Function.prototype` 属性所指向的对象。
3.  **将构造函数的作用域赋给新对象**：使得构造函数内部的 `this` 关键字指向这个新对象。
4.  **执行构造函数内部的代码**：为新对象添加属性和方法。
5.  **返回新对象**：如果构造函数没有显式地返回另一个对象，则返回这个新创建的对象。

```javascript
function Car(brand) {
  this.brand = brand;
}
Car.prototype.drive = function() {
  console.log(`${this.brand} is driving.`);
};

const myCar = new Car('Tesla');
// 此时：
// 1. myCar.__proto__ === Car.prototype
// 2. Car.prototype.__proto__ === Object.prototype
// 3. Object.prototype.__proto__ === null

console.log(myCar.brand);    // "Tesla" (自身属性)
myCar.drive();               // "Tesla is driving." (在 Car.prototype 上找到)
console.log(myCar.toString()); // "[object Object]" (在 Object.prototype 上找到)
```

**图示原型链：**

```
myCar  --->  Car.prototype  --->  Object.prototype  --->  null
    (brand)       (drive)          (toString)
```

### 2. 通过 `Object.create()`

`Object.create()` 方法可以创建一个新对象，并将其 `__proto__` 属性设置为指定对象。这是实现原型继承的更纯粹的方式。

```javascript
const protoObj = {
  greeting: 'Hello',
  sayHello: function() {
    console.log(`${this.greeting}, I am ${this.name}`);
  }
};

const personA = Object.create(protoObj);
personA.name = 'Alice';
personA.sayHello(); // "Hello, I am Alice"

const personB = Object.create(protoObj);
personB.name = 'Bob';
personB.greeting = 'Hi'; // 自身添加属性，覆盖原型链上的
personB.sayHello(); // "Hi, I am Bob"

// 此时：
// 1. personA.__proto__ === protoObj
// 2. protoObj.__proto__ === Object.prototype
// 3. Object.prototype.__proto__ === null
```

## 四、理解 `Object.prototype` 和 `Function.prototype`

这两个是 JavaScript 中非常重要的原型对象。

### 1. `Object.prototype`

`Object.prototype` 是所有普通对象的终极原型（除非你特意创建不带原型的对象 `Object.create(null)`）。它包含了所有对象共享的基本方法，如 `toString()`, `hasOwnProperty()`, `valueOf()` 等。

```javascript
const obj = {};
console.log(obj.__proto__ === Object.prototype);        // true
console.log(Object.getPrototypeOf(obj) === Object.prototype); // true

// 任何普通对象最终都会继承 Object.prototype 上的方法
obj.toString(); // "[object Object]"
```

### 2. `Function.prototype`

`Function.prototype` 是所有函数（包括构造函数、普通函数、箭头函数）的原型。它提供了一些函数共有的方法，如 `call()`, `apply()`, `bind()` 等。

```javascript
function myFunc() {}
console.log(myFunc.__proto__ === Function.prototype); // true

// Function.prototype 也是一个对象，所以它也有自己的原型
console.log(Function.prototype.__proto__ === Object.prototype); // true
// 这意味着函数也是对象，它们也继承了 Object.prototype 的方法
myFunc.toString(); // "function myFunc() {}" (被 Function.prototype 上的 toString 覆盖)
```

**一个完整的原型链例子：**

```
创建一个普通对象字面量: `const o = {};`
o ---> Object.prototype ---> null

使用构造函数创建一个实例: `const arr = [1,2];` (等同于 `new Array()`)
arr ---> Array.prototype ---> Object.prototype ---> null

创建一个自定义构造函数: `function Foo() {}`
Foo ---> Function.prototype ---> Object.prototype ---> null

使用自定义构造函数创建一个实例: `const f = new Foo();`
f ---> Foo.prototype ---> Object.prototype ---> null

其中，Foo.prototype 是一个普通对象:
Foo.prototype ---> Object.prototype ---> null
```

## 五、原型链在继承中的应用

在 ES6 `class` 语法糖出现之前，原型链是 JavaScript 实现继承的主要方式。

**示例：经典的原型链继承**

```javascript
// 父类构造函数
function SuperType(name) {
  this.name = name;
  this.colors = ['red', 'blue'];
}
SuperType.prototype.sayName = function() {
  console.log(this.name);
};

// 子类构造函数
function SubType(name, age) {
  SuperType.call(this, name); // 继承父类的实例属性
  this.age = age;
}

// 核心：设置原型链实现方法继承
// 方式一：Object.create() (推荐)
SubType.prototype = Object.create(SuperType.prototype);
// 修复 constructor 指向 (Good Practice)
SubType.prototype.constructor = SubType;

// 方式二：直接赋值（不推荐，会修改 SuperType.prototype）
// SubType.prototype = new SuperType(); // 这种方式也会继承父类的实例属性，可能导致意外共享

SubType.prototype.sayAge = function() {
  console.log(this.age);
};

const instance1 = new SubType('Alice', 25);
instance1.colors.push('green'); // 修改 instance1 的 colors 属性
console.log(instance1.colors);  // ["red", "blue", "green"]
instance1.sayName();            // "Alice" (继承自 SuperType.prototype)
instance1.sayAge();             // 25 (自身方法)

const instance2 = new SubType('Bob', 30);
console.log(instance2.colors);  // ["red", "blue"] (没有被 instance1 的修改影响)
```

## 六、ES6 `class` 语法糖下的原型链

ES6 的 `class` 关键字仅仅是原型链的语法糖，它并没有引入真正的类继承机制，底层仍然是基于原型链实现的。

```javascript
class Parent {
  constructor(name) {
    this.name = name;
  }
  sayHello() {
    console.log(`Hello, I'm ${this.name}`);
  }
}

class Child extends Parent {
  constructor(name, age) {
    super(name); // 调用父类构造函数
    this.age = age;
  }
  sayAge() {
    console.log(`I'm ${this.age} years old.`);
  }
}

const child = new Child('Tom', 10);
child.sayHello(); // "Hello, I'm Tom" (继承自 Parent.prototype)
child.sayAge();   // "I'm 10 years old." (自身方法)

// 实际上，底层原型链如下：
console.log(Object.getPrototypeOf(Child) === Parent);          // true (Child 构造函数继承 Parent 构造函数)
console.log(Object.getPrototypeOf(Child.prototype) === Parent.prototype); // true (Child.prototype 继承 Parent.prototype)
console.log(Object.getPrototypeOf(child) === Child.prototype); // true (child 实例的原型是指向 Child.prototype)
```

## 七、注意事项和最佳实践

1.  **添加原型方法/属性的时机**：通常在构造函数定义之后立即添加原型属性和方法。
2.  **避免直接修改 `__proto__`**：修改 `__proto__` 会对性能产生负面影响，因为它会扰乱 JavaScript 引擎内部的优化。使用 `Object.setPrototypeOf()` 也要谨慎。
3.  **使用 `hasOwnProperty()`**：在遍历对象属性时，使用 `obj.hasOwnProperty(prop)` 可以判断属性是否是对象自身的，而不是从原型链继承的。
4.  **`for...in` 循环**：`for...in` 循环会遍历对象及原型链上所有可枚举的属性。为了避免遍历到原型链上的属性，通常会配合 `hasOwnProperty()` 使用。
5.  **`Object.create()` 优于 `new Parent()` 进行原型继承**：`Object.create()` 更纯粹地创建了一个指定原型的对象，而 `new Parent()` 会创建 `Parent` 的实例属性，这在某些情况下可能不是我们想要的。

## 八、总结

JavaScript 原型链是其面向对象机制的基石。它定义了对象如何继承属性和方法，是属性查找的根本机制。

核心要点：
*   **`__proto__`**: 所有对象都有，指向其原型。
*   **`prototype`**: 只有函数有，指向一个对象，这个对象是其构造出的实例的原型。
*   **属性查找**: 当访问一个对象属性时，会沿着原型链向上查找，直到找到或到达 `null`。
*   **继承**: 原型链是 JavaScript 实现继承的本质。
*   **`Object.prototype` 和 `Function.prototype`**: 两个核心的原型对象，分别对应所有对象的基石和所有函数的基石。

掌握原型链，是理解 JavaScript 高级特性（如继承、闭包、作用域）的关键一步，也是成为一名优秀的 JavaScript 开发者的必备知识。